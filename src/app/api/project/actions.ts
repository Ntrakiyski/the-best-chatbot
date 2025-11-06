"use server";

import { projectRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import {
  createProjectSchema,
  updateProjectSchema,
  createProjectVersionSchema,
  updateProjectVersionSchema,
  createDeliverableSchema,
  updateDeliverableSchema,
  updateDeliverableStatusSchema,
} from "./validations";
import {
  Project,
  ProjectVersion,
  Deliverable,
  DeliverableStatus,
} from "app-types/project";

async function getUserId() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not found");
  }
  return userId;
}

export async function createProjectAction(data: {
  name: string;
  description?: string;
  techStack?: string[];
}): Promise<Project> {
  const userId = await getUserId();

  // Validate input with Zod
  const validatedData = createProjectSchema.parse({
    ...data,
    name: data.name?.trim(), // Trim whitespace
  });

  // Create project via repository
  return await projectRepository.createProject({
    name: validatedData.name,
    description: validatedData.description,
    techStack: validatedData.techStack || [],
    userId,
  });
}

export async function updateProjectAction(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    techStack?: string[];
  },
): Promise<Project> {
  const userId = await getUserId();

  // Validate input with Zod
  const validatedData = updateProjectSchema.parse(data);

  // Update project via repository
  return await projectRepository.updateProject(
    userId,
    projectId,
    validatedData,
  );
}

export async function archiveProjectAction(projectId: string): Promise<void> {
  const userId = await getUserId();
  await projectRepository.archiveProject(userId, projectId);
}

export async function unarchiveProjectAction(projectId: string): Promise<void> {
  const userId = await getUserId();
  await projectRepository.unarchiveProject(userId, projectId);
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  const userId = await getUserId();
  await projectRepository.deleteProject(userId, projectId);
}

// Version actions
export async function createVersionAction(data: {
  projectId: string;
  name: string;
  description?: string;
}): Promise<ProjectVersion> {
  const userId = await getUserId();

  // Validate input
  const validatedData = createProjectVersionSchema.parse(data);

  return await projectRepository.createVersion(userId, validatedData);
}

export async function updateVersionAction(
  versionId: string,
  data: {
    name?: string;
    description?: string;
  },
): Promise<ProjectVersion> {
  const userId = await getUserId();

  // Validate input
  const validatedData = updateProjectVersionSchema.parse(data);

  return await projectRepository.updateVersion(
    userId,
    versionId,
    validatedData,
  );
}

export async function deleteVersionAction(versionId: string): Promise<void> {
  const userId = await getUserId();
  await projectRepository.deleteVersion(userId, versionId);
}

// Deliverable actions
export async function createDeliverableAction(data: {
  versionId: string;
  name: string;
  description?: string;
}): Promise<Deliverable> {
  const userId = await getUserId();

  // Validate input
  const validatedData = createDeliverableSchema.parse(data);

  return await projectRepository.createDeliverable(userId, validatedData);
}

export async function updateDeliverableAction(
  deliverableId: string,
  data: {
    name?: string;
    description?: string;
  },
): Promise<Deliverable> {
  const userId = await getUserId();

  // Validate input
  const validatedData = updateDeliverableSchema.parse(data);

  return await projectRepository.updateDeliverable(
    userId,
    deliverableId,
    validatedData,
  );
}

export async function updateDeliverableStatusAction(
  deliverableId: string,
  status: DeliverableStatus,
): Promise<Deliverable> {
  const userId = await getUserId();

  // Validate input
  const validatedData = updateDeliverableStatusSchema.parse({ status });

  return await projectRepository.updateDeliverableStatus(
    userId,
    deliverableId,
    validatedData.status,
  );
}

export async function deleteDeliverableAction(
  deliverableId: string,
): Promise<void> {
  const userId = await getUserId();
  await projectRepository.deleteDeliverable(userId, deliverableId);
}
