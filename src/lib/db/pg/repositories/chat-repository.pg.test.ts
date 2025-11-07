import { describe, it, expect, vi, beforeEach } from "vitest";
import { pgChatRepository } from "./chat-repository.pg";
import type { ChatMessage } from "app-types/chat";

// Mock the database
vi.mock("../db.pg", () => ({
  pgDb: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Import the mocked pgDb
import { pgDb } from "../db.pg";

describe("ChatRepository - Project Context Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("insertThread", () => {
    it("should create a thread with projectId when provided", async () => {
      const input = {
        id: "thread-123",
        title: "New Chat",
        userId: "user-123",
        projectId: "project-456",
      };

      const mockThread = {
        ...input,
        createdAt: new Date(),
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockThread]),
      };

      (pgDb.insert as any).mockReturnValue(mockInsertQuery);

      const result = await pgChatRepository.insertThread(input);

      expect(pgDb.insert).toHaveBeenCalled();
      expect(mockInsertQuery.values).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockThread);
      expect(result.projectId).toBe("project-456");
    });

    it("should create a thread without projectId when not provided", async () => {
      const input = {
        id: "thread-789",
        title: "Chat without project",
        userId: "user-123",
      };

      const mockThread = {
        ...input,
        projectId: null,
        createdAt: new Date(),
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockThread]),
      };

      (pgDb.insert as any).mockReturnValue(mockInsertQuery);

      const result = await pgChatRepository.insertThread(input);

      expect(result.projectId).toBeNull();
    });
  });

  describe("selectThreadDetails", () => {
    it("should return thread with projectId when thread has a project associated", async () => {
      const threadId = "thread-with-project";
      const projectId = "project-123";

      const mockThreadWithUser = {
        chat_thread: {
          id: threadId,
          title: "Test Thread",
          userId: "user-123",
          projectId: projectId, // ⬅️ This is the critical field
          createdAt: new Date(),
        },
        user: {
          id: "user-123",
          preferences: { theme: "dark" },
        },
      };

      const mockMessages: ChatMessage[] = [
        {
          id: "msg-1",
          threadId,
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          createdAt: new Date(),
        },
      ];

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockThreadWithUser]),
      };

      (pgDb.select as any).mockReturnValue(mockSelectQuery);

      // Mock selectMessagesByThreadId
      const mockMessagesQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockMessages),
      };
      (pgDb.select as any).mockReturnValueOnce(mockSelectQuery);
      (pgDb.select as any).mockReturnValueOnce(mockMessagesQuery);

      const result = await pgChatRepository.selectThreadDetails(threadId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(threadId);
      expect(result?.projectId).toBe(projectId); // ⬅️ Critical assertion
      expect(result?.messages).toEqual(mockMessages);
    });

    it("should return thread with null projectId when no project is associated", async () => {
      const threadId = "thread-without-project";

      const mockThreadWithUser = {
        chat_thread: {
          id: threadId,
          title: "Test Thread",
          userId: "user-123",
          projectId: null, // ⬅️ No project
          createdAt: new Date(),
        },
        user: {
          id: "user-123",
          preferences: null,
        },
      };

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockThreadWithUser]),
      };

      const mockMessagesQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      (pgDb.select as any).mockReturnValueOnce(mockSelectQuery);
      (pgDb.select as any).mockReturnValueOnce(mockMessagesQuery);

      const result = await pgChatRepository.selectThreadDetails(threadId);

      expect(result).not.toBeNull();
      expect(result?.projectId).toBeNull();
    });

    it("should return null when thread does not exist", async () => {
      const threadId = "non-existent";

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      (pgDb.select as any).mockReturnValue(mockSelectQuery);

      const result = await pgChatRepository.selectThreadDetails(threadId);

      expect(result).toBeNull();
    });

    it("should return null when threadId is empty", async () => {
      const result = await pgChatRepository.selectThreadDetails("");

      expect(result).toBeNull();
      expect(pgDb.select).not.toHaveBeenCalled();
    });
  });

  describe("updateThread", () => {
    it("should update thread with projectId when provided", async () => {
      const threadId = "thread-123";
      const updateData = {
        projectId: "project-new-456",
      };

      const mockUpdatedThread = {
        id: threadId,
        title: "Existing Title",
        userId: "user-123",
        projectId: "project-new-456",
        createdAt: new Date(),
      };

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedThread]),
      };

      (pgDb.update as any).mockReturnValue(mockUpdateQuery);

      const result = await pgChatRepository.updateThread(threadId, updateData);

      expect(pgDb.update).toHaveBeenCalled();
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        projectId: "project-new-456",
      });
      expect(result.projectId).toBe("project-new-456");
    });

    it("should update thread with title only when projectId not provided", async () => {
      const threadId = "thread-456";
      const updateData = {
        title: "Updated Title",
      };

      const mockUpdatedThread = {
        id: threadId,
        title: "Updated Title",
        userId: "user-123",
        projectId: null,
        createdAt: new Date(),
      };

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedThread]),
      };

      (pgDb.update as any).mockReturnValue(mockUpdateQuery);

      const result = await pgChatRepository.updateThread(threadId, updateData);

      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        title: "Updated Title",
      });
      expect(result.title).toBe("Updated Title");
    });

    it("should update both title and projectId when both provided", async () => {
      const threadId = "thread-789";
      const updateData = {
        title: "New Title",
        projectId: "project-999",
      };

      const mockUpdatedThread = {
        id: threadId,
        title: "New Title",
        userId: "user-123",
        projectId: "project-999",
        createdAt: new Date(),
      };

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedThread]),
      };

      (pgDb.update as any).mockReturnValue(mockUpdateQuery);

      const result = await pgChatRepository.updateThread(threadId, updateData);

      expect(mockUpdateQuery.set).toHaveBeenCalledWith({
        title: "New Title",
        projectId: "project-999",
      });
      expect(result.title).toBe("New Title");
      expect(result.projectId).toBe("project-999");
    });

    it("should handle empty update object gracefully", async () => {
      const threadId = "thread-empty";
      const updateData = {};

      const mockUpdatedThread = {
        id: threadId,
        title: "Existing Title",
        userId: "user-123",
        projectId: null,
        createdAt: new Date(),
      };

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedThread]),
      };

      (pgDb.update as any).mockReturnValue(mockUpdateQuery);

      const result = await pgChatRepository.updateThread(threadId, updateData);

      expect(mockUpdateQuery.set).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUpdatedThread);
    });
  });

  describe("Project Context Integration Flow", () => {
    it("should support full lifecycle: create → read → update thread with project", async () => {
      // Step 1: Create thread with project
      const createInput = {
        id: "thread-lifecycle",
        title: "Lifecycle Test",
        userId: "user-123",
        projectId: "project-initial",
      };

      const mockCreatedThread = {
        ...createInput,
        createdAt: new Date(),
      };

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockCreatedThread]),
      };

      (pgDb.insert as any).mockReturnValue(mockInsertQuery);

      const created = await pgChatRepository.insertThread(createInput);
      expect(created.projectId).toBe("project-initial");

      // Step 2: Read thread and verify projectId persists
      const mockThreadWithUser = {
        chat_thread: mockCreatedThread,
        user: { id: "user-123", preferences: null },
      };

      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockThreadWithUser]),
      };

      const mockMessagesQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([]),
      };

      (pgDb.select as any).mockReturnValueOnce(mockSelectQuery);
      (pgDb.select as any).mockReturnValueOnce(mockMessagesQuery);

      const read =
        await pgChatRepository.selectThreadDetails("thread-lifecycle");
      expect(read?.projectId).toBe("project-initial");

      // Step 3: Update to a different project
      const mockUpdatedThread = {
        ...mockCreatedThread,
        projectId: "project-updated",
      };

      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedThread]),
      };

      (pgDb.update as any).mockReturnValue(mockUpdateQuery);

      const updated = await pgChatRepository.updateThread("thread-lifecycle", {
        projectId: "project-updated",
      });
      expect(updated.projectId).toBe("project-updated");
    });
  });
});
