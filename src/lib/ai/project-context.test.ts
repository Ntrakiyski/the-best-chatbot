import { describe, it, expect } from "vitest";
import {
  escapeXml,
  formatDeliverableStatus,
  buildDeliverableXml,
  buildProjectContextXml,
  buildProjectContextPrompt,
} from "./project-context";
import type { ProjectWithVersions, Deliverable } from "app-types/project";

describe("project-context", () => {
  describe("escapeXml", () => {
    it("should escape ampersand", () => {
      expect(escapeXml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("should escape less than", () => {
      expect(escapeXml("a < b")).toBe("a &lt; b");
    });

    it("should escape greater than", () => {
      expect(escapeXml("a > b")).toBe("a &gt; b");
    });

    it("should escape double quotes", () => {
      expect(escapeXml('He said "hello"')).toBe("He said &quot;hello&quot;");
    });

    it("should escape single quotes", () => {
      expect(escapeXml("It's working")).toBe("It&apos;s working");
    });

    it("should escape multiple special characters", () => {
      expect(escapeXml("<tag attr=\"value\"> & 'text'")).toBe(
        "&lt;tag attr=&quot;value&quot;&gt; &amp; &apos;text&apos;",
      );
    });

    it("should handle undefined", () => {
      expect(escapeXml(undefined)).toBe("");
    });

    it("should handle empty string", () => {
      expect(escapeXml("")).toBe("");
    });

    it("should not double-escape already escaped characters", () => {
      const input = "A & B";
      const escaped = escapeXml(input);
      const doubleEscaped = escapeXml(escaped);
      // Should not become &amp;amp;
      expect(doubleEscaped).toBe("A &amp;amp; B");
    });
  });

  describe("formatDeliverableStatus", () => {
    it("should return checkmark for done", () => {
      expect(formatDeliverableStatus("done")).toBe("✅");
    });

    it("should return arrows for in-progress", () => {
      expect(formatDeliverableStatus("in-progress")).toBe("🔄");
    });

    it("should return circle for not-started", () => {
      expect(formatDeliverableStatus("not-started")).toBe("⭕");
    });

    it("should return empty circle for unknown status", () => {
      expect(formatDeliverableStatus("unknown")).toBe("⭕");
    });
  });

  describe("buildDeliverableXml", () => {
    it("should build XML for deliverable with description", () => {
      const deliverable: Deliverable = {
        id: "deliv-1",
        versionId: "ver-1",
        name: "User Authentication",
        description: "Implement JWT-based auth",
        status: "done",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const xml = buildDeliverableXml(deliverable);
      expect(xml).toContain('<deliverable status="done" emoji="✅">');
      expect(xml).toContain("<name>User Authentication</name>");
      expect(xml).toContain(
        "<description>Implement JWT-based auth</description>",
      );
      expect(xml).toContain("</deliverable>");
    });

    it("should build XML for deliverable without description", () => {
      const deliverable: Deliverable = {
        id: "deliv-2",
        versionId: "ver-1",
        name: "Product Catalog",
        description: undefined,
        status: "in-progress",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const xml = buildDeliverableXml(deliverable);
      expect(xml).toContain('<deliverable status="in-progress" emoji="🔄">');
      expect(xml).toContain("<name>Product Catalog</name>");
      expect(xml).not.toContain("<description>");
      expect(xml).toContain("</deliverable>");
    });

    it("should escape special characters in deliverable name", () => {
      const deliverable: Deliverable = {
        id: "deliv-3",
        versionId: "ver-1",
        name: "API for <users> & <products>",
        description: undefined,
        status: "not-started",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const xml = buildDeliverableXml(deliverable);
      expect(xml).toContain(
        "<name>API for &lt;users&gt; &amp; &lt;products&gt;</name>",
      );
    });
  });

  describe("buildProjectContextXml", () => {
    it("should build complete XML structure with all fields", () => {
      const project: ProjectWithVersions = {
        id: "proj-1",
        name: "E-commerce Platform",
        description: "A modern online store",
        techStack: ["React", "Next.js", "PostgreSQL"],
        systemPrompt: "You are an expert in e-commerce development",
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "ver-1",
            projectId: "proj-1",
            name: "V1.0",
            description: "Initial version",
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [
              {
                id: "deliv-1",
                versionId: "ver-1",
                name: "User Authentication",
                description: "JWT-based auth",
                status: "done",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      };

      const xml = buildProjectContextXml(project);

      // Check structure
      expect(xml).toContain("<project_context>");
      expect(xml).toContain("<project>");
      expect(xml).toContain("<name>E-commerce Platform</name>");
      expect(xml).toContain("<description>A modern online store</description>");
      expect(xml).toContain("<tech_stack>");
      expect(xml).toContain("<technology>React</technology>");
      expect(xml).toContain("<technology>Next.js</technology>");
      expect(xml).toContain("<technology>PostgreSQL</technology>");
      expect(xml).toContain("</tech_stack>");
      expect(xml).toContain("<system_prompt>");
      expect(xml).toContain("You are an expert in e-commerce development");
      expect(xml).toContain("</system_prompt>");
      expect(xml).toContain("<active_version>");
      expect(xml).toContain("<name>V1.0</name>");
      expect(xml).toContain("<deliverables>");
      expect(xml).toContain("<name>User Authentication</name>");
      expect(xml).toContain("</deliverables>");
      expect(xml).toContain("</active_version>");
      expect(xml).toContain("</project>");
      expect(xml).toContain("</project_context>");
    });

    it("should handle project without description", () => {
      const project: ProjectWithVersions = {
        id: "proj-2",
        name: "Simple App",
        description: undefined,
        techStack: ["Vue"],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);
      expect(xml).toContain("<name>Simple App</name>");
      expect(xml).not.toContain("<description>");
    });

    it("should handle project without tech stack", () => {
      const project: ProjectWithVersions = {
        id: "proj-3",
        name: "Minimal Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);
      expect(xml).toContain("<tech_stack />");
    });

    it("should handle project without system prompt", () => {
      const project: ProjectWithVersions = {
        id: "proj-4",
        name: "Default Prompt Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);
      expect(xml).not.toContain("<system_prompt>");
    });

    it("should handle project without versions", () => {
      const project: ProjectWithVersions = {
        id: "proj-5",
        name: "No Versions",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);
      expect(xml).not.toContain("<active_version>");
    });

    it("should include only first version (active version)", () => {
      const project: ProjectWithVersions = {
        id: "proj-6",
        name: "Multi-Version Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "ver-1",
            projectId: "proj-6",
            name: "V1.0",
            description: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [],
          },
          {
            id: "ver-2",
            projectId: "proj-6",
            name: "V2.0",
            description: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [],
          },
        ],
      };

      const xml = buildProjectContextXml(project);
      expect(xml).toContain("<name>V1.0</name>");
      expect(xml).not.toContain("<name>V2.0</name>");
    });

    it("should escape special characters throughout", () => {
      const project: ProjectWithVersions = {
        id: "proj-7",
        name: "<Project> & 'Name'",
        description: 'Description with "quotes"',
        techStack: ["React & Redux"],
        systemPrompt: "Use <component> for UI",
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const xml = buildProjectContextXml(project);
      expect(xml).toContain("&lt;Project&gt; &amp; &apos;Name&apos;");
      expect(xml).toContain("Description with &quot;quotes&quot;");
      expect(xml).toContain("React &amp; Redux");
      expect(xml).toContain("Use &lt;component&gt; for UI");
    });
  });

  describe("buildProjectContextPrompt", () => {
    it("should return null for null project", () => {
      const prompt = buildProjectContextPrompt(null);
      expect(prompt).toBeNull();
    });

    it("should wrap XML in instructional text", () => {
      const project: ProjectWithVersions = {
        id: "proj-1",
        name: "Test Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const prompt = buildProjectContextPrompt(project);
      expect(prompt).toContain("Project Context");
      expect(prompt).toContain("working on a project");
      expect(prompt).toContain("<project_context>");
      expect(prompt).toContain("<name>Test Project</name>");
      expect(prompt).toContain("</project_context>");
    });

    it("should include custom system prompt when present", () => {
      const project: ProjectWithVersions = {
        id: "proj-2",
        name: "Custom Prompt Project",
        description: undefined,
        techStack: [],
        systemPrompt: "Follow strict coding guidelines",
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [],
      };

      const prompt = buildProjectContextPrompt(project);
      expect(prompt).toContain("Follow strict coding guidelines");
    });

    it("should include deliverables in formatted prompt", () => {
      const project: ProjectWithVersions = {
        id: "proj-3",
        name: "Deliverable Project",
        description: undefined,
        techStack: [],
        systemPrompt: undefined,
        userId: "user-1",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: [
          {
            id: "ver-1",
            projectId: "proj-3",
            name: "V1.0",
            description: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            deliverables: [
              {
                id: "deliv-1",
                versionId: "ver-1",
                name: "Feature X",
                description: "Implement feature X",
                status: "done",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      };

      const prompt = buildProjectContextPrompt(project);
      expect(prompt).toContain("Feature X");
      expect(prompt).toContain("Implement feature X");
      expect(prompt).toContain('status="done"');
    });
  });
});
