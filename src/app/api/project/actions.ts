"use server";

import { projectRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { createProjectSchema } from "./validations";
import { Project } from "app-types/project";

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
