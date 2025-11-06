/**
 * Phase 3: AI Context Injection
 * 
 * This module provides utilities for building XML-formatted project context
 * that can be injected into chat system prompts, enabling AI to understand
 * project structure, tech stack, deliverables, and custom instructions.
 */

import type { ProjectWithVersions, Deliverable } from "app-types/project";

/**
 * Escapes special XML characters to prevent injection attacks
 * 
 * @param str - String to escape (can be undefined)
 * @returns Escaped string safe for XML
 */
export function escapeXml(str: string | undefined): string {
  if (!str) return "";
  
  return str
    .replace(/&/g, "&amp;")   // Must be first to avoid double-escaping
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats deliverable status into emoji for better LLM readability
 * 
 * @param status - Deliverable status
 * @returns Emoji representing the status
 */
export function formatDeliverableStatus(status: string): string {
  switch (status) {
    case "done":
      return "✅";
    case "in-progress":
      return "🔄";
    case "not-started":
      return "⭕";
    default:
      return "⭕";
  }
}

/**
 * Builds XML representation of a single deliverable
 * 
 * @param deliverable - Deliverable to format
 * @returns XML string for deliverable
 */
export function buildDeliverableXml(deliverable: Deliverable): string {
  const emoji = formatDeliverableStatus(deliverable.status);
  
  let xml = `      <deliverable status="${deliverable.status}" emoji="${emoji}">\n`;
  xml += `        <name>${escapeXml(deliverable.name)}</name>\n`;
  
  if (deliverable.description) {
    xml += `        <description>${escapeXml(deliverable.description)}</description>\n`;
  }
  
  xml += `      </deliverable>`;
  
  return xml;
}

/**
 * Builds complete XML structure for project context
 * 
 * @param project - Project with versions and deliverables
 * @returns Complete XML structure
 */
export function buildProjectContextXml(project: ProjectWithVersions): string {
  let xml = "<project_context>\n";
  xml += "  <project>\n";
  xml += `    <name>${escapeXml(project.name)}</name>\n`;
  
  if (project.description) {
    xml += `    <description>${escapeXml(project.description)}</description>\n`;
  }
  
  // Tech stack
  if (project.techStack && project.techStack.length > 0) {
    xml += "    <tech_stack>\n";
    project.techStack.forEach((tech) => {
      xml += `      <technology>${escapeXml(tech)}</technology>\n`;
    });
    xml += "    </tech_stack>\n";
  } else {
    xml += "    <tech_stack />\n";
  }
  
  // Custom system prompt
  if (project.systemPrompt) {
    xml += "    <system_prompt>\n";
    xml += `      ${escapeXml(project.systemPrompt)}\n`;
    xml += "    </system_prompt>\n";
  }
  
  // Active version (first version only)
  if (project.versions && project.versions.length > 0) {
    const activeVersion = project.versions[0];
    xml += "    <active_version>\n";
    xml += `      <name>${escapeXml(activeVersion.name)}</name>\n`;
    
    if (activeVersion.description) {
      xml += `      <description>${escapeXml(activeVersion.description)}</description>\n`;
    }
    
    // Deliverables
    if (activeVersion.deliverables && activeVersion.deliverables.length > 0) {
      xml += "      <deliverables>\n";
      activeVersion.deliverables.forEach((deliverable) => {
        xml += buildDeliverableXml(deliverable) + "\n";
      });
      xml += "      </deliverables>\n";
    }
    
    xml += "    </active_version>\n";
  }
  
  xml += "  </project>\n";
  xml += "</project_context>";
  
  return xml;
}

/**
 * Main entry point: Builds complete project context prompt for AI
 * 
 * @param project - Project to build context from (can be null)
 * @returns Formatted prompt with XML context, or null if no project
 */
export function buildProjectContextPrompt(
  project: ProjectWithVersions | null,
): string | null {
  if (!project) return null;
  
  const xml = buildProjectContextXml(project);
  
  const prompt = `
# Project Context

You are working on a project that the user has mentioned. Here is the structured project information:

${xml}

Use this context to provide relevant, project-aware responses. Reference the tech stack, deliverables, and any custom instructions provided in the system_prompt section.
`.trim();
  
  return prompt;
}

