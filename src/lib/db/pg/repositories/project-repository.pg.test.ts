import { describe, it, expect, vi, beforeEach } from "vitest";
import { pgProjectRepository } from "./project-repository.pg";
import { CreateProjectInput } from "app-types/project";

// Mock the database
vi.mock("../db.pg", () => ({
  pgDb: {
    insert: vi.fn(),
    select: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Import the mocked pgDb
import { pgDb } from "../db.pg";

describe("ProjectRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create a project and default V1 version in a transaction", async () => {
      const input: CreateProjectInput = {
        name: "My Project",
        description: "Test project",
        techStack: ["React", "Node.js"],
        userId: "user-123",
      };

      const mockProject = {
        id: "project-123",
        ...input,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockVersion = {
        id: "version-123",
        projectId: "project-123",
        name: "V1",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock transaction behavior
      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };

      mockTx.returning.mockResolvedValueOnce([mockProject]); // For project insert
      mockTx.returning.mockResolvedValueOnce([mockVersion]); // For version insert

      (pgDb.transaction as any).mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      const result = await pgProjectRepository.createProject(input);

      expect(pgDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.insert).toHaveBeenCalledTimes(2); // Once for project, once for version
      expect(result).toEqual(mockProject);
    });

    it("should handle transaction rollback on error", async () => {
      const input: CreateProjectInput = {
        name: "My Project",
        description: "Test project",
        techStack: [],
        userId: "user-123",
      };

      const error = new Error("Database error");
      (pgDb.transaction as any).mockRejectedValue(error);

      await expect(pgProjectRepository.createProject(input)).rejects.toThrow(
        "Database error",
      );
    });

    it("should create project with empty tech stack by default", async () => {
      const input: CreateProjectInput = {
        name: "Simple Project",
        userId: "user-456",
      };

      const mockProject = {
        id: "project-456",
        name: input.name,
        description: null,
        techStack: [],
        userId: input.userId,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };

      mockTx.returning.mockResolvedValueOnce([mockProject]);
      mockTx.returning.mockResolvedValueOnce([
        { id: "version-456", projectId: "project-456", name: "V1" },
      ]);

      (pgDb.transaction as any).mockImplementation(async (callback: any) => {
        return await callback(mockTx);
      });

      const result = await pgProjectRepository.createProject(input);

      expect(result.techStack).toEqual([]);
    });
  });

  describe("findProjectsByUserId", () => {
    it("should return all projects for a given user", async () => {
      const userId = "user-123";
      const mockProjects = [
        {
          id: "project-1",
          name: "Project 1",
          description: "Description 1",
          techStack: ["React"],
          userId,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "project-2",
          name: "Project 2",
          description: null,
          techStack: [],
          userId,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockProjects),
      };

      (pgDb.select as any).mockReturnValue(mockQuery);

      const result = await pgProjectRepository.findProjectsByUserId(userId);

      expect(pgDb.select).toHaveBeenCalled();
      expect(mockQuery.from).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when user has no projects", async () => {
      const userId = "user-no-projects";

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      (pgDb.select as any).mockReturnValue(mockQuery);

      const result = await pgProjectRepository.findProjectsByUserId(userId);

      expect(result).toEqual([]);
    });
  });

  describe("findProjectById", () => {
    it("should return project with versions and deliverables when user owns it", async () => {
      const projectId = "project-123";
      const userId = "user-123";

      const mockProjectWithVersions = {
        project: {
          id: projectId,
          name: "My Project",
          description: "Test project",
          techStack: ["React", "Node.js"],
          userId,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        project_version: {
          id: "version-1",
          projectId,
          name: "V1",
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        deliverable: {
          id: "deliverable-1",
          versionId: "version-1",
          name: "Setup Database",
          description: "Initialize database schema",
          status: "done",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockProjectWithVersions]),
      };

      (pgDb.select as any).mockReturnValue(mockQuery);

      const result = await pgProjectRepository.findProjectById(
        projectId,
        userId,
      );

      expect(pgDb.select).toHaveBeenCalled();
      expect(mockQuery.from).toHaveBeenCalled();
      expect(mockQuery.leftJoin).toHaveBeenCalledTimes(2); // Join versions and deliverables
      expect(mockQuery.where).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.id).toBe(projectId);
      expect(result?.versions).toBeDefined();
    });

    it("should return null when project does not exist", async () => {
      const projectId = "non-existent";
      const userId = "user-123";

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      (pgDb.select as any).mockReturnValue(mockQuery);

      const result = await pgProjectRepository.findProjectById(
        projectId,
        userId,
      );

      expect(result).toBeNull();
    });

    it("should return null when user does not own the project (ownership check)", async () => {
      const projectId = "project-123";
      const userId = "different-user";

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]), // Empty because of userId filter
      };

      (pgDb.select as any).mockReturnValue(mockQuery);

      const result = await pgProjectRepository.findProjectById(
        projectId,
        userId,
      );

      expect(result).toBeNull();
    });

    it("should properly aggregate multiple versions and deliverables", async () => {
      const projectId = "project-multi";
      const userId = "user-123";

      const mockRows = [
        {
          project: {
            id: projectId,
            name: "Multi Version Project",
            userId,
            techStack: [],
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          project_version: {
            id: "v1",
            projectId,
            name: "V1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          deliverable: {
            id: "d1",
            versionId: "v1",
            name: "Task 1",
            status: "done",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          project: {
            id: projectId,
            name: "Multi Version Project",
            userId,
            techStack: [],
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          project_version: {
            id: "v1",
            projectId,
            name: "V1",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          deliverable: {
            id: "d2",
            versionId: "v1",
            name: "Task 2",
            status: "in-progress",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          project: {
            id: projectId,
            name: "Multi Version Project",
            userId,
            techStack: [],
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          project_version: {
            id: "v2",
            projectId,
            name: "V2",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          deliverable: null,
        },
      ];

      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockRows),
      };

      (pgDb.select as any).mockReturnValue(mockQuery);

      const result = await pgProjectRepository.findProjectById(
        projectId,
        userId,
      );

      expect(result).not.toBeNull();
      expect(result?.versions).toHaveLength(2); // V1 and V2
      expect(result?.versions?.[0].deliverables).toHaveLength(2); // Task 1 and Task 2 in V1
      expect(result?.versions?.[1].deliverables).toHaveLength(0); // V2 has no deliverables
    });
  });
});
