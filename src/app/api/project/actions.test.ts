import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProjectAction } from "./actions";

// Mock dependencies
vi.mock("auth/server", () => ({
  getSession: vi.fn(),
}));

vi.mock("lib/db/repository", () => ({
  projectRepository: {
    createProject: vi.fn(),
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
