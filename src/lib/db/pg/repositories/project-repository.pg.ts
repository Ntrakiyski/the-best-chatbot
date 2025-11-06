import { and, desc, eq } from "drizzle-orm";
import { pgDb } from "../db.pg";
import {
  ProjectTable,
  ProjectVersionTable,
  DeliverableTable,
} from "../schema.pg";
import {
  Project,
  ProjectRepository,
  CreateProjectInput,
  ProjectWithVersions,
  ProjectVersion,
  Deliverable,
  DeliverableStatus,
} from "app-types/project";

export const pgProjectRepository: ProjectRepository = {
  async createProject(input: CreateProjectInput): Promise<Project> {
    return await pgDb.transaction(async (tx) => {
      // Create the project
      const [project] = await tx
        .insert(ProjectTable)
        .values({
          name: input.name,
          description: input.description,
          techStack: input.techStack || [],
          userId: input.userId,
        })
        .returning();

      // Create default "V1" version
      await tx.insert(ProjectVersionTable).values({
        projectId: project.id,
        name: "V1",
        description: null,
      });

      return project as Project;
    });
  },

  async findProjectsByUserId(
    userId: string,
    archived?: boolean,
  ): Promise<Project[]> {
    const conditions = [eq(ProjectTable.userId, userId)];

    if (archived !== undefined) {
      conditions.push(eq(ProjectTable.isArchived, archived));
    }

    const projects = await pgDb
      .select()
      .from(ProjectTable)
      .where(and(...conditions))
      .orderBy(desc(ProjectTable.createdAt));

    return projects as Project[];
  },

  async findProjectById(
    id: string,
    userId: string,
  ): Promise<ProjectWithVersions | null> {
    // Query with left joins to get project, versions, and deliverables
    const rows = await pgDb
      .select()
      .from(ProjectTable)
      .leftJoin(
        ProjectVersionTable,
        eq(ProjectTable.id, ProjectVersionTable.projectId),
      )
      .leftJoin(
        DeliverableTable,
        eq(ProjectVersionTable.id, DeliverableTable.versionId),
      )
      .where(and(eq(ProjectTable.id, id), eq(ProjectTable.userId, userId)));

    if (rows.length === 0) {
      return null;
    }

    // Aggregate the results
    const projectData = rows[0].project;
    const versionsMap = new Map<string, ProjectVersion>();

    for (const row of rows) {
      const versionData = row.project_version;
      const deliverableData = row.deliverable;

      if (versionData && !versionsMap.has(versionData.id)) {
        versionsMap.set(versionData.id, {
          ...versionData,
          deliverables: [],
        } as ProjectVersion);
      }

      if (deliverableData && versionData) {
        const version = versionsMap.get(versionData.id);
        if (version) {
          version.deliverables.push(deliverableData as Deliverable);
        }
      }
    }

    return {
      ...projectData,
      versions: Array.from(versionsMap.values()),
    } as ProjectWithVersions;
  },

  async updateProject(
    userId: string,
    projectId: string,
    data: {
      name?: string;
      description?: string;
      techStack?: string[];
      systemPrompt?: string;
    },
  ): Promise<Project> {
    const [updated] = await pgDb
      .update(ProjectTable)
      .set(data)
      .where(
        and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
      )
      .returning();

    if (!updated) {
      throw new Error("Project not found or access denied");
    }

    return updated as Project;
  },

  async archiveProject(userId: string, projectId: string): Promise<void> {
    const [result] = await pgDb
      .update(ProjectTable)
      .set({ isArchived: true })
      .where(
        and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
      )
      .returning();

    if (!result) {
      throw new Error("Project not found or access denied");
    }
  },

  async unarchiveProject(userId: string, projectId: string): Promise<void> {
    const [result] = await pgDb
      .update(ProjectTable)
      .set({ isArchived: false })
      .where(
        and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
      )
      .returning();

    if (!result) {
      throw new Error("Project not found or access denied");
    }
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    const [result] = await pgDb
      .delete(ProjectTable)
      .where(
        and(eq(ProjectTable.id, projectId), eq(ProjectTable.userId, userId)),
      )
      .returning();

    if (!result) {
      throw new Error("Project not found or access denied");
    }
  },

  async createVersion(
    userId: string,
    input: { projectId: string; name: string; description?: string },
  ): Promise<ProjectVersion> {
    // First check if user owns the project
    const projects = await pgDb
      .select()
      .from(ProjectTable)
      .where(
        and(
          eq(ProjectTable.id, input.projectId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (projects.length === 0) {
      throw new Error("Project not found or access denied");
    }

    const [version] = await pgDb
      .insert(ProjectVersionTable)
      .values({
        projectId: input.projectId,
        name: input.name,
        description: input.description,
      })
      .returning();

    return version as ProjectVersion;
  },

  async updateVersion(
    userId: string,
    versionId: string,
    data: { name?: string; description?: string },
  ): Promise<ProjectVersion> {
    // Check ownership through project
    const check = await pgDb
      .select()
      .from(ProjectVersionTable)
      .leftJoin(
        ProjectTable,
        eq(ProjectVersionTable.projectId, ProjectTable.id),
      )
      .where(
        and(
          eq(ProjectVersionTable.id, versionId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (check.length === 0) {
      throw new Error("Version not found or access denied");
    }

    const [updated] = await pgDb
      .update(ProjectVersionTable)
      .set(data)
      .where(eq(ProjectVersionTable.id, versionId))
      .returning();

    return updated as ProjectVersion;
  },

  async deleteVersion(userId: string, versionId: string): Promise<void> {
    // Check ownership through project
    const check = await pgDb
      .select()
      .from(ProjectVersionTable)
      .leftJoin(
        ProjectTable,
        eq(ProjectVersionTable.projectId, ProjectTable.id),
      )
      .where(
        and(
          eq(ProjectVersionTable.id, versionId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (check.length === 0) {
      throw new Error("Version not found or access denied");
    }

    await pgDb
      .delete(ProjectVersionTable)
      .where(eq(ProjectVersionTable.id, versionId))
      .returning();
  },

  async createDeliverable(
    userId: string,
    input: { versionId: string; name: string; description?: string },
  ): Promise<Deliverable> {
    // Check ownership through project
    const check = await pgDb
      .select()
      .from(ProjectVersionTable)
      .leftJoin(
        ProjectTable,
        eq(ProjectVersionTable.projectId, ProjectTable.id),
      )
      .where(
        and(
          eq(ProjectVersionTable.id, input.versionId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (check.length === 0) {
      throw new Error("Version not found or access denied");
    }

    const [deliverable] = await pgDb
      .insert(DeliverableTable)
      .values({
        versionId: input.versionId,
        name: input.name,
        description: input.description,
      })
      .returning();

    return deliverable as Deliverable;
  },

  async updateDeliverable(
    userId: string,
    deliverableId: string,
    data: { name?: string; description?: string },
  ): Promise<Deliverable> {
    // Check ownership through version -> project
    const check = await pgDb
      .select()
      .from(DeliverableTable)
      .leftJoin(
        ProjectVersionTable,
        eq(DeliverableTable.versionId, ProjectVersionTable.id),
      )
      .leftJoin(
        ProjectTable,
        eq(ProjectVersionTable.projectId, ProjectTable.id),
      )
      .where(
        and(
          eq(DeliverableTable.id, deliverableId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (check.length === 0) {
      throw new Error("Deliverable not found or access denied");
    }

    const [updated] = await pgDb
      .update(DeliverableTable)
      .set(data)
      .where(eq(DeliverableTable.id, deliverableId))
      .returning();

    return updated as Deliverable;
  },

  async updateDeliverableStatus(
    userId: string,
    deliverableId: string,
    status: DeliverableStatus,
  ): Promise<Deliverable> {
    // Check ownership through version -> project
    const check = await pgDb
      .select()
      .from(DeliverableTable)
      .leftJoin(
        ProjectVersionTable,
        eq(DeliverableTable.versionId, ProjectVersionTable.id),
      )
      .leftJoin(
        ProjectTable,
        eq(ProjectVersionTable.projectId, ProjectTable.id),
      )
      .where(
        and(
          eq(DeliverableTable.id, deliverableId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (check.length === 0) {
      throw new Error("Deliverable not found or access denied");
    }

    const [updated] = await pgDb
      .update(DeliverableTable)
      .set({ status })
      .where(eq(DeliverableTable.id, deliverableId))
      .returning();

    return updated as Deliverable;
  },

  async deleteDeliverable(
    userId: string,
    deliverableId: string,
  ): Promise<void> {
    // Check ownership through version -> project
    const check = await pgDb
      .select()
      .from(DeliverableTable)
      .leftJoin(
        ProjectVersionTable,
        eq(DeliverableTable.versionId, ProjectVersionTable.id),
      )
      .leftJoin(
        ProjectTable,
        eq(ProjectVersionTable.projectId, ProjectTable.id),
      )
      .where(
        and(
          eq(DeliverableTable.id, deliverableId),
          eq(ProjectTable.userId, userId),
        ),
      );

    if (check.length === 0) {
      throw new Error("Deliverable not found or access denied");
    }

    await pgDb
      .delete(DeliverableTable)
      .where(eq(DeliverableTable.id, deliverableId))
      .returning();
  },
};
