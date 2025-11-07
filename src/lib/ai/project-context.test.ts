import { describe, it, expect } from "vitest";
import {
  escapeXml,
  formatDeliverableStatus,
  buildDeliverableXml,
  buildProjectContextXml,
  buildProjectContextPrompt,
} from "./project-context";
import type { ProjectWithVersions, Deliverable } from "app-types/project";

describe("Project Context Builder", () => {
  describe("escapeXml", () => {
    it("should escape XML special characters", () => {
      const input = '<script>alert("xss")</script> & more';
      const expected =
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; more";
      expect(escapeXml(input)).toBe(expected);
    });

    it("should handle undefined input", () => {
      expect(escapeXml(undefined)).toBe("");
    });

    it("should handle empty string", () => {
      expect(escapeXml("")).toBe("");
    });

    it("should handle single quotes", () => {
      expect(escapeXml("don't")).toBe("don&apos;t");
    });
  });

  describe("formatDeliverableStatus", () => {
    it("should return ✅ for done status", () => {
      expect(formatDeliverableStatus("done")).toBe("✅");
    });

    it("should return 🔄 for in-progress status", () => {
      expect(formatDeliverableStatus("in-progress")).toBe("🔄");
    });

    it("should return ⭕ for not-started status", () => {
      expect(formatDeliverableStatus("not-started")).toBe("⭕");
    });

    it("should return ⭕ for unknown status", () => {
      expect(formatDeliverableStatus("unknown")).toBe("⭕");
    });
  });

  describe("buildDeliverableXml", () => {
    it("should build XML for deliverable with description", () => {
      const deliverable: Deliverable = {
        id: "d1",
        versionId: "v1",
        name: "Setup Database",
        description: "Initialize PostgreSQL schema",
        status: "done",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const xml = buildDeliverableXml(deliverable);

      expect(xml).toContain('status="done"');
      expect(xml).toContain('emoji="✅"');
      expect(xml).toContain("<name>Setup Database</name>");
      expect(xml).toContain(
        "<description>Initialize PostgreSQL schema</description>",
      );
    });

    it("should build XML for deliverable without description", () => {
      const deliverable: Deliverable = {
        id: "d2",
        versionId: "v1",
        name: "Create API",
        description: undefined,
        status: "in-progress",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const xml = buildDeliverableXml(deliverable);

      expect(xml).toContain('status="in-progress"');
      expect(xml).toContain('emoji="🔄"');
      expect(xml).toContain("<name>Create API</name>");
      expect(xml).not.toContain("<description>");
    });

    it("should escape special characters in deliverable name and description", () => {
      const deliverable: Deliverable = {
        id: "d3",
        versionId: "v1",
        name: "Task <urgent>",
        description: 'Use "quotes" & escape',
        status: "not-started",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const xml = buildDeliverableXml(deliverable);

      expect(xml).toContain("<name>Task &lt;urgent&gt;</name>");
      expect(xml).toContain(
        "<description>Use &quot;quotes&quot; &amp; escape</description>",
      );
    });
  });

  describe("buildProjectContextXml", () => {
    it("should build complete XML for project with all fields", () => {
      const project: ProjectWithVersions = {
        id: "p1",
        name: "Real Time AI App",
        description: "OpenAI real-time API for sales agents",
        techStack: ["React", "Node.js", "PostgreSQL"],
        systemPrompt: "Focus on real-time voice capabilities",
        userId: "user1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "v1",
            projectId: "p1",
            name: "V1",
            description: "Initial version",
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [
              {
                id: "d1",
                versionId: "v1",
                name: "Setup Project",
                description: "Initialize repo",
                status: "done",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: "d2",
                versionId: "v1",
                name: "Build UI",
                description: undefined,
                status: "in-progress",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      };

      const xml = buildProjectContextXml(project);

      // Check project info
      expect(xml).toContain("<project_context>");
      expect(xml).toContain("<name>Real Time AI App</name>");
      expect(xml).toContain(
        "<description>OpenAI real-time API for sales agents</description>",
      );

      // Check tech stack
      expect(xml).toContain("<tech_stack>");
      expect(xml).toContain("<technology>React</technology>");
      expect(xml).toContain("<technology>Node.js</technology>");
      expect(xml).toContain("<technology>PostgreSQL</technology>");

      // Check system prompt
      expect(xml).toContain("<system_prompt>");
      expect(xml).toContain("Focus on real-time voice capabilities");

      // Check active version
      expect(xml).toContain("<active_version>");
      expect(xml).toContain("<name>V1</name>");
      expect(xml).toContain("<description>Initial version</description>");

      // Check deliverables
      expect(xml).toContain("<deliverables>");
      expect(xml).toContain("<name>Setup Project</name>");
      expect(xml).toContain('status="done"');
      expect(xml).toContain("<name>Build UI</name>");
      expect(xml).toContain('status="in-progress"');

      expect(xml).toContain("</project_context>");
    });

    it("should handle project with minimal fields", () => {
      const project: ProjectWithVersions = {
        id: "p2",
        name: "Minimal Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user2",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);

      expect(xml).toContain("<name>Minimal Project</name>");
      expect(xml).not.toContain("<description>");
      expect(xml).toContain("<tech_stack />");
      expect(xml).not.toContain("<system_prompt>");
      expect(xml).not.toContain("<active_version>");
    });

    it("should only use first version as active version", () => {
      const project: ProjectWithVersions = {
        id: "p3",
        name: "Multi-Version Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user3",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "v1",
            projectId: "p3",
            name: "V1",
            description: "First version",
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [],
          },
          {
            id: "v2",
            projectId: "p3",
            name: "V2",
            description: "Second version",
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [],
          },
        ],
      };

      const xml = buildProjectContextXml(project);

      expect(xml).toContain("<name>V1</name>");
      expect(xml).toContain("<description>First version</description>");
      expect(xml).not.toContain("<name>V2</name>");
      expect(xml).not.toContain("<description>Second version</description>");
    });

    it("should escape special characters in all text fields", () => {
      const project: ProjectWithVersions = {
        id: "p4",
        name: "Project <Test>",
        description: 'Uses "quotes" & symbols',
        techStack: ["Node.js <v18>"],
        systemPrompt: 'Be "helpful" & accurate',
        userId: "user4",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);

      expect(xml).toContain("<name>Project &lt;Test&gt;</name>");
      expect(xml).toContain(
        "<description>Uses &quot;quotes&quot; &amp; symbols</description>",
      );
      expect(xml).toContain("<technology>Node.js &lt;v18&gt;</technology>");
      expect(xml).toContain("Be &quot;helpful&quot; &amp; accurate");
    });
  });

  describe("buildProjectContextPrompt", () => {
    it("should return null for null project", () => {
      expect(buildProjectContextPrompt(null)).toBeNull();
    });

    it("should build complete prompt with project context", () => {
      const project: ProjectWithVersions = {
        id: "p1",
        name: "Test Project",
        description: "A test project",
        techStack: ["TypeScript"],
        systemPrompt: undefined,
        userId: "user1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "v1",
            projectId: "p1",
            name: "V1",
            description: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [
              {
                id: "d1",
                versionId: "v1",
                name: "Task 1",
                description: undefined,
                status: "done",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      };

      const prompt = buildProjectContextPrompt(project);

      expect(prompt).not.toBeNull();
      expect(prompt).toContain("# Project Context");
      expect(prompt).toContain("You are working on a project");
      expect(prompt).toContain("<project_context>");
      expect(prompt).toContain("<name>Test Project</name>");
      expect(prompt).toContain("<technology>TypeScript</technology>");
      expect(prompt).toContain("<name>Task 1</name>");
      expect(prompt).toContain(
        "Use this context to provide relevant, project-aware responses",
      );
    });

    it("should include system prompt instructions in final output", () => {
      const project: ProjectWithVersions = {
        id: "p2",
        name: "Project with System Prompt",
        description: undefined,
        techStack: [],
        systemPrompt: "Always be concise",
        userId: "user2",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const prompt = buildProjectContextPrompt(project);

      expect(prompt).toContain("<system_prompt>");
      expect(prompt).toContain("Always be concise");
      expect(prompt).toContain("any custom instructions provided");
    });

    it("should handle empty versions array", () => {
      const project: ProjectWithVersions = {
        id: "p3",
        name: "No Versions Project",
        description: "Project without versions",
        techStack: [],
        systemPrompt: undefined,
        userId: "user3",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const prompt = buildProjectContextPrompt(project);

      expect(prompt).not.toBeNull();
      expect(prompt).toContain("<name>No Versions Project</name>");
      expect(prompt).not.toContain("<active_version>");
    });
  });

  describe("Integration: Full Context Flow", () => {
    it("should produce valid XML that can be safely embedded in prompts", () => {
      const project: ProjectWithVersions = {
        id: "real-project",
        name: "Real Time AI App",
        description: "OpenAI real-time API web app for sales agents",
        techStack: ["React", "TypeScript", "OpenAI API", "PostgreSQL"],
        systemPrompt:
          "Focus on voice features. Be concise and practical. Suggest improvements for sales workflows.",
        userId: "nik-123",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "v1",
            projectId: "real-project",
            name: "V1 - MVP",
            description: "Initial release with core features",
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [
              {
                id: "d1",
                versionId: "v1",
                name: "Setup Project Structure",
                description: "Initialize repository with TypeScript and React",
                status: "done",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: "d2",
                versionId: "v1",
                name: "Integrate OpenAI Real-Time API",
                description:
                  "Implement WebSocket connection and audio streaming",
                status: "in-progress",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: "d3",
                versionId: "v1",
                name: "Build Sales Agent Dashboard",
                description: undefined,
                status: "not-started",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      };

      const prompt = buildProjectContextPrompt(project);

      // Verify it's a valid, complete prompt
      expect(prompt).not.toBeNull();
      expect(prompt).toContain("# Project Context");

      // Verify all critical information is present
      expect(prompt).toContain("Real Time AI App");
      expect(prompt).toContain("OpenAI real-time API web app for sales agents");
      expect(prompt).toContain("React");
      expect(prompt).toContain("TypeScript");
      expect(prompt).toContain("OpenAI API");
      expect(prompt).toContain("PostgreSQL");
      expect(prompt).toContain(
        "Focus on voice features. Be concise and practical. Suggest improvements for sales workflows.",
      );
      expect(prompt).toContain("V1 - MVP");
      expect(prompt).toContain("Setup Project Structure");
      expect(prompt).toContain('status="done"');
      expect(prompt).toContain('emoji="✅"');
      expect(prompt).toContain("Integrate OpenAI Real-Time API");
      expect(prompt).toContain('status="in-progress"');
      expect(prompt).toContain('emoji="🔄"');
      expect(prompt).toContain("Build Sales Agent Dashboard");
      expect(prompt).toContain('status="not-started"');
      expect(prompt).toContain('emoji="⭕"');

      // Verify XML is well-formed
      expect(prompt).toContain("<project_context>");
      expect(prompt).toContain("</project_context>");
      expect(prompt).toContain("<project>");
      expect(prompt).toContain("</project>");

      // Verify instructions for LLM
      expect(prompt).toContain(
        "Use this context to provide relevant, project-aware responses",
      );
    });
  });
});
