import type { ProjectFile } from "app-types/file";

/**
 * Build XML-formatted context from project files for AI injection
 * Files are included in the system prompt when a project is mentioned in chat
 */
export function buildFileContextPrompt(files: ProjectFile[]): string | null {
  if (!files || files.length === 0) {
    return null;
  }

  const fileElements = files
    .map((file) => {
      const updatedDate = new Date(file.updatedAt).toISOString();
      // Escape XML special characters in content
      const escapedContent = escapeXml(file.content);
      const escapedName = escapeXml(file.name);

      return `  <file name="${escapedName}" updated="${updatedDate}" size="${file.size}">
    <content>${escapedContent}</content>
  </file>`;
    })
    .join("\n");

  return `<project_files>
${fileElements}
</project_files>`;
}

/**
 * Escape XML special characters to prevent injection
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Truncate file context if it exceeds a maximum length
 * This prevents token limit issues for projects with many/large files
 */
export function truncateFileContext(
  context: string,
  maxLength: number = 100000,
): string {
  if (context.length <= maxLength) {
    return context;
  }

  const truncated = context.slice(0, maxLength);
  return `${truncated}\n\n<!-- File context truncated due to length. Showing first ${maxLength} characters. -->`;
}
