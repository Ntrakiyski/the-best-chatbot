import { z } from "zod";

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum file name length
export const MAX_NAME_LENGTH = 255;

/**
 * Schema for creating a new file
 */
export const createFileSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z
    .string()
    .min(1, "File name is required")
    .max(
      MAX_NAME_LENGTH,
      `File name must be less than ${MAX_NAME_LENGTH} characters`,
    )
    .trim(),
  content: z
    .string()
    .max(MAX_FILE_SIZE, `File content must be less than ${MAX_FILE_SIZE} bytes`)
    .optional()
    .default(""),
  contentType: z.enum(["markdown", "text"]).optional().default("markdown"),
});

/**
 * Schema for updating a file
 */
export const updateFileSchema = z.object({
  name: z
    .string()
    .min(1, "File name is required")
    .max(
      MAX_NAME_LENGTH,
      `File name must be less than ${MAX_NAME_LENGTH} characters`,
    )
    .trim()
    .optional(),
  content: z
    .string()
    .max(MAX_FILE_SIZE, `File content must be less than ${MAX_FILE_SIZE} bytes`)
    .optional(),
});

/**
 * Schema for deleting a file
 */
export const deleteFileSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

/**
 * Schema for getting a file
 */
export const getFileSchema = z.object({
  fileId: z.string().uuid("Invalid file ID"),
});

/**
 * Schema for getting project files
 */
export const getProjectFilesSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

// Type exports for TypeScript
export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type GetFileInput = z.infer<typeof getFileSchema>;
export type GetProjectFilesInput = z.infer<typeof getProjectFilesSchema>;
