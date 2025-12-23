"use server";

import { headers } from "next/headers";
import { auth } from "auth/server";
import { fileRepository } from "lib/db/repository";
import {
  createFileSchema,
  updateFileSchema,
  deleteFileSchema,
} from "./validations";
import type { ProjectFile } from "app-types/file";

/**
 * Create a new file in a project
 */
export async function createFileAction(data: {
  projectId: string;
  name: string;
  content?: string;
  contentType?: "markdown" | "text";
}): Promise<ProjectFile> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedData = createFileSchema.parse(data);

  return await fileRepository.createFile({
    projectId: validatedData.projectId,
    name: validatedData.name,
    content: validatedData.content,
    contentType: validatedData.contentType,
    userId: session.user.id,
  });
}

/**
 * Update an existing file
 */
export async function updateFileAction(
  fileId: string,
  data: {
    name?: string;
    content?: string;
  },
): Promise<ProjectFile> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validatedData = updateFileSchema.parse(data);

  return await fileRepository.updateFile(
    fileId,
    session.user.id,
    validatedData,
  );
}

/**
 * Soft delete a file
 */
export async function deleteFileAction(fileId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await fileRepository.softDeleteFile(fileId, session.user.id);
}
