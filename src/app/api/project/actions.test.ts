import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProjectAction } from "./actions";

// Mock dependencies
vi.mock("auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("lib/db/repository", () => ({
  projectRepository: {
    createProject: vi.fn(),
    updateProject: vi.fn(),
    archiveProject: vi.fn(),
    unarchiveProject: vi.fn(),
    deleteProject: vi.fn(),
    createVersion: vi.fn(),
    updateVersion: vi.fn(),
    deleteVersion: vi.fn(),
    createDeliverable: vi.fn(),
    updateDeliverable: vi.fn(),
    updateDeliverableStatus: vi.fn(),
    deleteDeliverable: vi.fn(),
  },
}));

// Import mocked dependencies
import { getSession } from "auth/server";
import { projectRepository } from "lib/db/repository";

describe("createProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue(null);

    await expect(
      createProjectAction({
        name: "Test Project",
        description: "Test",
        techStack: [],
      }),
    ).rejects.toThrow("User not found");
  });

  it("should throw error when session has no user", async () => {
    (getSession as any).mockResolvedValue({ user: null });

    await expect(
      createProjectAction({
        name: "Test Project",
      }),
    ).rejects.toThrow("User not found");
  });

  it("should throw validation error when name is missing", async () => {
    (getSession as any).mockResolvedValue({
      user: { id: "user-123" },
    });

    await expect(
      createProjectAction({
        name: "",
      } as any),
    ).rejects.toThrow();
  });

  it("should throw validation error when name exceeds 100 characters", async () => {
    (getSession as any).mockResolvedValue({
      user: { id: "user-123" },
    });

    const longName = "a".repeat(101);

    await expect(
      createProjectAction({
        name: longName,
      }),
    ).rejects.toThrow();
  });

  it("should throw validation error when description exceeds 500 characters", async () => {
    (getSession as any).mockResolvedValue({
      user: { id: "user-123" },
    });

    const longDescription = "a".repeat(501);

    await expect(
      createProjectAction({
        name: "Valid Name",
        description: longDescription,
      }),
    ).rejects.toThrow();
  });

  it("should successfully create project with valid data", async () => {
    const userId = "user-123";
    const mockProject = {
      id: "project-123",
      name: "My Project",
      description: "Test project",
      techStack: ["React", "Node.js"],
      userId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({
      user: { id: userId },
    });

    (projectRepository.createProject as any).mockResolvedValue(mockProject);

    const result = await createProjectAction({
      name: "My Project",
      description: "Test project",
      techStack: ["React", "Node.js"],
    });

    expect(projectRepository.createProject).toHaveBeenCalledWith({
      name: "My Project",
      description: "Test project",
      techStack: ["React", "Node.js"],
      userId,
    });

    expect(result).toEqual(mockProject);
  });

  it("should create project with only name (optional fields)", async () => {
    const userId = "user-456";
    const mockProject = {
      id: "project-456",
      name: "Simple Project",
      description: null,
      techStack: [],
      userId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({
      user: { id: userId },
    });

    (projectRepository.createProject as any).mockResolvedValue(mockProject);

    const result = await createProjectAction({
      name: "Simple Project",
    });

    expect(projectRepository.createProject).toHaveBeenCalledWith({
      name: "Simple Project",
      description: undefined,
      techStack: [],
      userId,
    });

    expect(result).toEqual(mockProject);
  });

  it("should handle repository errors", async () => {
    (getSession as any).mockResolvedValue({
      user: { id: "user-123" },
    });

    const repoError = new Error("Database connection failed");
    (projectRepository.createProject as any).mockRejectedValue(repoError);

    await expect(
      createProjectAction({
        name: "Test Project",
      }),
    ).rejects.toThrow("Database connection failed");
  });

  it("should trim whitespace from name", async () => {
    const userId = "user-789";
    const mockProject = {
      id: "project-789",
      name: "Trimmed Project",
      techStack: [],
      userId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({
      user: { id: userId },
    });

    (projectRepository.createProject as any).mockResolvedValue(mockProject);

    await createProjectAction({
      name: "  Trimmed Project  ",
    });

    expect(projectRepository.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Trimmed Project",
      }),
    );
  });

  it("should handle empty tech stack array", async () => {
    const userId = "user-empty-tech";
    const mockProject = {
      id: "project-empty",
      name: "No Tech Stack",
      techStack: [],
      userId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({
      user: { id: userId },
    });

    (projectRepository.createProject as any).mockResolvedValue(mockProject);

    await createProjectAction({
      name: "No Tech Stack",
      techStack: [],
    });

    expect(projectRepository.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        techStack: [],
      }),
    );
  });
});

describe("updateProjectAction", () => {
  it("should throw error when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue(null);

    const { updateProjectAction } = await import("./actions");
    await expect(
      updateProjectAction("project-123", { name: "Updated" }),
    ).rejects.toThrow("User not found");
  });

  it("should successfully update project", async () => {
    const userId = "user-123";
    const projectId = "project-123";
    const updateData = {
      name: "Updated Project",
      description: "Updated desc",
      techStack: ["Vue"],
    };

    const mockUpdatedProject = {
      id: projectId,
      ...updateData,
      userId,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.updateProject as any).mockResolvedValue(
      mockUpdatedProject,
    );

    const { updateProjectAction } = await import("./actions");
    const result = await updateProjectAction(projectId, updateData);

    expect(projectRepository.updateProject).toHaveBeenCalledWith(
      userId,
      projectId,
      updateData,
    );
    expect(result).toEqual(mockUpdatedProject);
  });

  it("should handle repository errors", async () => {
    (getSession as any).mockResolvedValue({ user: { id: "user-123" } });

    const repoError = new Error("Project not found or access denied");
    (projectRepository.updateProject as any).mockRejectedValue(repoError);

    const { updateProjectAction } = await import("./actions");
    await expect(
      updateProjectAction("project-123", { name: "Test" }),
    ).rejects.toThrow("Project not found or access denied");
  });
});

describe("archiveProjectAction", () => {
  it("should throw error when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue(null);

    const { archiveProjectAction } = await import("./actions");
    await expect(archiveProjectAction("project-123")).rejects.toThrow(
      "User not found",
    );
  });

  it("should successfully archive project", async () => {
    const userId = "user-123";
    const projectId = "project-123";

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.archiveProject as any).mockResolvedValue(undefined);

    const { archiveProjectAction } = await import("./actions");
    await archiveProjectAction(projectId);

    expect(projectRepository.archiveProject).toHaveBeenCalledWith(
      userId,
      projectId,
    );
  });
});

describe("unarchiveProjectAction", () => {
  it("should successfully unarchive project", async () => {
    const userId = "user-123";
    const projectId = "project-123";

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.unarchiveProject as any).mockResolvedValue(undefined);

    const { unarchiveProjectAction } = await import("./actions");
    await unarchiveProjectAction(projectId);

    expect(projectRepository.unarchiveProject).toHaveBeenCalledWith(
      userId,
      projectId,
    );
  });
});

describe("deleteProjectAction", () => {
  it("should throw error when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue(null);

    const { deleteProjectAction } = await import("./actions");
    await expect(deleteProjectAction("project-123")).rejects.toThrow(
      "User not found",
    );
  });

  it("should successfully delete project", async () => {
    const userId = "user-123";
    const projectId = "project-123";

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.deleteProject as any).mockResolvedValue(undefined);

    const { deleteProjectAction } = await import("./actions");
    await deleteProjectAction(projectId);

    expect(projectRepository.deleteProject).toHaveBeenCalledWith(
      userId,
      projectId,
    );
  });
});

describe("createVersionAction", () => {
  it("should throw error when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue(null);

    const { createVersionAction } = await import("./actions");
    await expect(
      createVersionAction({ projectId: "project-123", name: "V2" }),
    ).rejects.toThrow("User not found");
  });

  it("should successfully create version", async () => {
    const userId = "user-123";
    const input = {
      projectId: "550e8400-e29b-41d4-a716-446655440000",
      name: "V2",
      description: "Second version",
    };

    const mockVersion = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.createVersion as any).mockResolvedValue(mockVersion);

    const { createVersionAction } = await import("./actions");
    const result = await createVersionAction(input);

    expect(projectRepository.createVersion).toHaveBeenCalledWith(userId, input);
    expect(result).toEqual(mockVersion);
  });

  it("should handle validation errors", async () => {
    (getSession as any).mockResolvedValue({ user: { id: "user-123" } });

    const { createVersionAction } = await import("./actions");
    await expect(
      createVersionAction({ projectId: "", name: "" } as any),
    ).rejects.toThrow();
  });
});

describe("updateVersionAction", () => {
  it("should successfully update version", async () => {
    const userId = "user-123";
    const versionId = "version-456";
    const updateData = { name: "V2-Updated" };

    const mockVersion = {
      id: versionId,
      projectId: "project-123",
      ...updateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.updateVersion as any).mockResolvedValue(mockVersion);

    const { updateVersionAction } = await import("./actions");
    const result = await updateVersionAction(versionId, updateData);

    expect(projectRepository.updateVersion).toHaveBeenCalledWith(
      userId,
      versionId,
      updateData,
    );
    expect(result).toEqual(mockVersion);
  });
});

describe("deleteVersionAction", () => {
  it("should successfully delete version", async () => {
    const userId = "user-123";
    const versionId = "version-456";

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.deleteVersion as any).mockResolvedValue(undefined);

    const { deleteVersionAction } = await import("./actions");
    await deleteVersionAction(versionId);

    expect(projectRepository.deleteVersion).toHaveBeenCalledWith(
      userId,
      versionId,
    );
  });
});

describe("createDeliverableAction", () => {
  it("should successfully create deliverable", async () => {
    const userId = "user-123";
    const input = {
      versionId: "550e8400-e29b-41d4-a716-446655440001",
      name: "New Task",
      description: "Task desc",
    };

    const mockDeliverable = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      ...input,
      status: "not-started" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.createDeliverable as any).mockResolvedValue(
      mockDeliverable,
    );

    const { createDeliverableAction } = await import("./actions");
    const result = await createDeliverableAction(input);

    expect(projectRepository.createDeliverable).toHaveBeenCalledWith(
      userId,
      input,
    );
    expect(result).toEqual(mockDeliverable);
  });
});

describe("updateDeliverableAction", () => {
  it("should successfully update deliverable", async () => {
    const userId = "user-123";
    const deliverableId = "deliverable-789";
    const updateData = { name: "Updated Task" };

    const mockDeliverable = {
      id: deliverableId,
      versionId: "version-456",
      ...updateData,
      status: "not-started" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.updateDeliverable as any).mockResolvedValue(
      mockDeliverable,
    );

    const { updateDeliverableAction } = await import("./actions");
    const result = await updateDeliverableAction(deliverableId, updateData);

    expect(projectRepository.updateDeliverable).toHaveBeenCalledWith(
      userId,
      deliverableId,
      updateData,
    );
    expect(result).toEqual(mockDeliverable);
  });
});

describe("updateDeliverableStatusAction", () => {
  it("should successfully update deliverable status", async () => {
    const userId = "user-123";
    const deliverableId = "deliverable-789";
    const status = "done" as const;

    const mockDeliverable = {
      id: deliverableId,
      versionId: "version-456",
      name: "Task",
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.updateDeliverableStatus as any).mockResolvedValue(
      mockDeliverable,
    );

    const { updateDeliverableStatusAction } = await import("./actions");
    const result = await updateDeliverableStatusAction(deliverableId, status);

    expect(projectRepository.updateDeliverableStatus).toHaveBeenCalledWith(
      userId,
      deliverableId,
      status,
    );
    expect(result).toEqual(mockDeliverable);
  });
});

describe("deleteDeliverableAction", () => {
  it("should successfully delete deliverable", async () => {
    const userId = "user-123";
    const deliverableId = "deliverable-789";

    (getSession as any).mockResolvedValue({ user: { id: userId } });
    (projectRepository.deleteDeliverable as any).mockResolvedValue(undefined);

    const { deleteDeliverableAction } = await import("./actions");
    await deleteDeliverableAction(deliverableId);

    expect(projectRepository.deleteDeliverable).toHaveBeenCalledWith(
      userId,
      deliverableId,
    );
  });
});
