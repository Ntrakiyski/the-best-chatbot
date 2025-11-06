// Project Feature Types
// Phase 1: Core data model for Projects, Versions, and Deliverables

export type DeliverableStatus = "not-started" | "in-progress" | "done";
export type ProjectPermissionLevel = "view" | "edit";

export interface ProjectShare {
  userId: string;
  permissionLevel: ProjectPermissionLevel;
}

export interface Deliverable {
  id: string;
  name: string;
  status: DeliverableStatus;
  description?: string;
  versionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  deliverables: Deliverable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  techStack: string[];
  userId: string;
  isArchived: boolean;
  versions?: ProjectVersion[];
  shares?: ProjectShare[];
  createdAt: Date;
  updatedAt: Date;
}

// Repository Input/Output Types
export interface CreateProjectInput {
  name: string;
  description?: string;
  techStack?: string[];
  userId: string;
}

export interface ProjectWithVersions extends Project {
  versions: ProjectVersion[];
}

// Repository Interface
export interface ProjectRepository {
  createProject(input: CreateProjectInput): Promise<Project>;
  findProjectsByUserId(userId: string, archived?: boolean): Promise<Project[]>;
  findProjectById(
    id: string,
    userId: string,
  ): Promise<ProjectWithVersions | null>;

  // Project mutations
  updateProject(
    userId: string,
    projectId: string,
    data: {
      name?: string;
      description?: string;
      techStack?: string[];
    },
  ): Promise<Project>;
  archiveProject(userId: string, projectId: string): Promise<void>;
  unarchiveProject(userId: string, projectId: string): Promise<void>;
  deleteProject(userId: string, projectId: string): Promise<void>;

  // Version CRUD
  createVersion(
    userId: string,
    input: { projectId: string; name: string; description?: string },
  ): Promise<ProjectVersion>;
  updateVersion(
    userId: string,
    versionId: string,
    data: { name?: string; description?: string },
  ): Promise<ProjectVersion>;
  deleteVersion(userId: string, versionId: string): Promise<void>;

  // Deliverable CRUD
  createDeliverable(
    userId: string,
    input: { versionId: string; name: string; description?: string },
  ): Promise<Deliverable>;
  updateDeliverable(
    userId: string,
    deliverableId: string,
    data: { name?: string; description?: string },
  ): Promise<Deliverable>;
  updateDeliverableStatus(
    userId: string,
    deliverableId: string,
    status: DeliverableStatus,
  ): Promise<Deliverable>;
  deleteDeliverable(userId: string, deliverableId: string): Promise<void>;
}
