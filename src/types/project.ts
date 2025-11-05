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
  findProjectsByUserId(userId: string): Promise<Project[]>;
  findProjectById(
    id: string,
    userId: string,
  ): Promise<ProjectWithVersions | null>;
}
