import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  techStack: z.array(z.string()).default([]),
});

// Placeholder schemas for Phase 2+ mutations
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  techStack: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

export const createProjectVersionSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});

export const updateProjectVersionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
});

export const createDeliverableSchema = z.object({
  versionId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateDeliverableSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const updateDeliverableStatusSchema = z.object({
  status: z.enum(["not-started", "in-progress", "done"]),
});

export const shareProjectSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  permissionLevel: z.enum(["view", "edit"]),
});

export const deleteSchema = z.object({
  id: z.string().uuid(),
});

// TypeScript types derived from schemas
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateProjectVersionInput = z.infer<
  typeof createProjectVersionSchema
>;
export type UpdateProjectVersionInput = z.infer<
  typeof updateProjectVersionSchema
>;
export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>;
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>;
export type UpdateDeliverableStatusInput = z.infer<
  typeof updateDeliverableStatusSchema
>;
export type ShareProjectInput = z.infer<typeof shareProjectSchema>;
export type DeleteInput = z.infer<typeof deleteSchema>;
