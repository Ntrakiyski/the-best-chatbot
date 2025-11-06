/**
 * Phase 3: AI Context Injection
 * Utilities for building XML-formatted project context to inject into AI system prompts
 */

import { ProjectWithVersions, Deliverable } from "@/types/project";

/**
 * Escapes XML special characters to prevent XML injection
 */
function escapeXml(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats a deliverable status as an emoji indicator
 */
function formatDeliverableStatus(status: string): string {
  switch (status) {
    case "done":
      return "✅";
    case "in-progress":
      return "🔄";
    case "not-started":
      return "⭕";
    default:
      return "❓";
  }
}

/**
 * Builds XML for a single deliverable
 */
function buildDeliverableXml(deliverable: Deliverable): string {
  const statusEmoji = formatDeliverableStatus(deliverable.status);
  let xml = `    <deliverable status="${deliverable.status}" emoji="${statusEmoji}">
      <name>${escapeXml(deliverable.name)}</name>`;

  if (deliverable.description) {
    xml += `\n      <description>${escapeXml(deliverable.description)}</description>`;
  }

  xml += `\n    </deliverable>`;
  return xml;
}

/**
 * Builds the complete XML project context for AI injection
 *
 * Structure:
 * <project_context>
 *   <project>
 *     <name>...</name>
 *     <description>...</description>
 *     <tech_stack>...</tech_stack>
 *     <system_prompt><!-- User's custom prompt --></system_prompt>
 *     <active_version>
 *       <name>...</name>
 *       <deliverables>...</deliverables>
 *     </active_version>
 *   </project>
 * </project_context>
 */
export function buildProjectContextXml(project: ProjectWithVersions): string {
  let xml = `<project_context>\n  <project>\n    <name>${escapeXml(project.name)}</name>`;

  // Add project description if present
  if (project.description) {
    xml += `\n    <description>${escapeXml(project.description)}</description>`;
  }

  // Add tech stack
  if (project.techStack && project.techStack.length > 0) {
    xml += `\n    <tech_stack>`;
    project.techStack.forEach((tech) => {
      xml += `\n      <technology>${escapeXml(tech)}</technology>`;
    });
    xml += `\n    </tech_stack>`;
  }

  // Add custom system prompt if present
  if (project.systemPrompt && project.systemPrompt.trim()) {
    xml += `\n    <system_prompt>\n${escapeXml(project.systemPrompt).trim()}\n    </system_prompt>`;
  }

  // Find active version (first version, or most recent)
  const activeVersion =
    project.versions && project.versions.length > 0
      ? project.versions[0]
      : null;

  if (activeVersion) {
    xml += `\n    <active_version>\n      <name>${escapeXml(activeVersion.name)}</name>`;

    if (activeVersion.description) {
      xml += `\n      <description>${escapeXml(activeVersion.description)}</description>`;
    }

    // Add deliverables
    if (activeVersion.deliverables && activeVersion.deliverables.length > 0) {
      xml += `\n      <deliverables>`;
      activeVersion.deliverables.forEach((deliverable) => {
        xml += `\n${buildDeliverableXml(deliverable)}`;
      });
      xml += `\n      </deliverables>`;
    }

    xml += `\n    </active_version>`;
  }

  xml += `\n  </project>\n</project_context>`;

  return xml;
}

/**
 * Builds a system prompt section that wraps the project context
 * This is the main entry point for chat API integration
 */
export function buildProjectContextPrompt(
  project: ProjectWithVersions | null,
): string | null {
  if (!project) return null;

  const projectXml = buildProjectContextXml(project);

  return `
# Project Context

You are working on a specific project. The project details are provided below in XML format.
Use this information to provide context-aware assistance.

${projectXml}

Important:
- Refer to the project by name when relevant
- Use the tech stack information to provide framework-specific guidance
- Reference deliverables and their status when discussing project progress
- Follow any custom instructions provided in the system_prompt section
`;
}
