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

  async findProjectsByUserId(userId: string): Promise<Project[]> {
    const projects = await pgDb
      .select()
      .from(ProjectTable)
      .where(eq(ProjectTable.userId, userId))
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
};
