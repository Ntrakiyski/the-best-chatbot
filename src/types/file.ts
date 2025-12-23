// Project File Feature Types
// Data model for files attached to projects

export type FileContentType = "markdown" | "text";

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  content: string;
  contentType: FileContentType;
  size: number;
  userId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Repository Input/Output Types
export interface CreateFileInput {
  projectId: string;
  name: string;
  content?: string;
  contentType?: FileContentType;
  userId: string;
}

export interface UpdateFileInput {
  name?: string;
  content?: string;
}

// Repository Interface
export interface FileRepository {
  createFile(input: CreateFileInput): Promise<ProjectFile>;
  findFileById(fileId: string, userId: string): Promise<ProjectFile | null>;
  findFilesByProject(projectId: string, userId: string): Promise<ProjectFile[]>;
  updateFile(
    fileId: string,
    userId: string,
    data: UpdateFileInput,
  ): Promise<ProjectFile>;
  softDeleteFile(fileId: string, userId: string): Promise<void>;
  getProjectFilesForContext(projectId: string): Promise<ProjectFile[]>;
}
