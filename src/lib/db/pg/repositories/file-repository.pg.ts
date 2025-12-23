import { eq, and, desc, sql } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { ProjectFileTable, ProjectTable } from "../schema.pg";
import type {
  ProjectFile,
  CreateFileInput,
  UpdateFileInput,
  FileRepository,
} from "app-types/file";

export const fileRepository: FileRepository = {
  async createFile(input: CreateFileInput): Promise<ProjectFile> {
    // Verify user has access to the project
    const project = await db
      .select()
      .from(ProjectTable)
      .where(
        and(
          eq(ProjectTable.id, input.projectId),
          eq(ProjectTable.userId, input.userId),
        ),
      )
      .limit(1);

    if (project.length === 0) {
      throw new Error("Project not found or access denied");
    }

    const contentSize = new TextEncoder().encode(input.content || "").length;

    const [file] = await db
      .insert(ProjectFileTable)
      .values({
        projectId: input.projectId,
        name: input.name,
        content: input.content || "",
        contentType: input.contentType || "markdown",
        size: contentSize.toString(),
        userId: input.userId,
      })
      .returning();

    return {
      ...file,
      size: Number.parseInt(file.size, 10),
    };
  },

  async findFileById(
    fileId: string,
    userId: string,
  ): Promise<ProjectFile | null> {
    const result = await db
      .select({
        file: ProjectFileTable,
        project: ProjectTable,
      })
      .from(ProjectFileTable)
      .innerJoin(ProjectTable, eq(ProjectFileTable.projectId, ProjectTable.id))
      .where(
        and(
          eq(ProjectFileTable.id, fileId),
          eq(ProjectTable.userId, userId),
          eq(ProjectFileTable.isDeleted, false),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      ...result[0].file,
      size: Number.parseInt(result[0].file.size, 10),
    };
  },

  async findFilesByProject(
    projectId: string,
    userId: string,
  ): Promise<ProjectFile[]> {
    // Verify user has access to the project
    const project = await db
      .select()
      .from(ProjectTable)
      .where(
        and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
      )
      .limit(1);

    if (project.length === 0) {
      return [];
    }

    const files = await db
      .select()
      .from(ProjectFileTable)
      .where(
        and(
          eq(ProjectFileTable.projectId, projectId),
          eq(ProjectFileTable.isDeleted, false),
        ),
      )
      .orderBy(desc(ProjectFileTable.updatedAt));

    return files.map((file) => ({
      ...file,
      size: Number.parseInt(file.size, 10),
    }));
  },

  async updateFile(
    fileId: string,
    userId: string,
    data: UpdateFileInput,
  ): Promise<ProjectFile> {
    // Verify user has access to the file's project
    const existingFile = await this.findFileById(fileId, userId);
    if (!existingFile) {
      throw new Error("File not found or access denied");
    }

    const updateData: {
      name?: string;
      content?: string;
      size?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
      const contentSize = new TextEncoder().encode(data.content).length;
      updateData.size = contentSize.toString();
    }

    const [updatedFile] = await db
      .update(ProjectFileTable)
      .set(updateData)
      .where(eq(ProjectFileTable.id, fileId))
      .returning();

    return {
      ...updatedFile,
      size: Number.parseInt(updatedFile.size, 10),
    };
  },

  async softDeleteFile(fileId: string, userId: string): Promise<void> {
    // Verify user has access to the file's project
    const existingFile = await this.findFileById(fileId, userId);
    if (!existingFile) {
      throw new Error("File not found or access denied");
    }

    await db
      .update(ProjectFileTable)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(ProjectFileTable.id, fileId));
  },

  async getProjectFilesForContext(projectId: string): Promise<ProjectFile[]> {
    const files = await db
      .select()
      .from(ProjectFileTable)
      .where(
        and(
          eq(ProjectFileTable.projectId, projectId),
          eq(ProjectFileTable.isDeleted, false),
        ),
      )
      .orderBy(desc(ProjectFileTable.updatedAt));

    return files.map((file) => ({
      ...file,
      size: Number.parseInt(file.size, 10),
    }));
  },
};
