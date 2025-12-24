import "server-only";
import logger from "logger";

export type OllamaModel = {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
};

export type OllamaTagsResponse = {
  models: OllamaModel[];
};

/**
 * Detect if an Ollama model supports tool/function calling based on its name
 * @param modelName - The name of the model (e.g., "hhao/qwen2.5-coder-tools:3b")
 * @returns true if the model likely supports tools, false otherwise
 */
export function doesOllamaModelSupportTools(modelName: string): boolean {
  const nameLower = modelName.toLowerCase();

  // Models known to support tool calling based on name patterns
  const toolSupportPatterns = [
    "tools", // e.g., qwen2.5-coder-tools, hhao/qwen2.5-coder-tools
    "qwen2.5-coder", // Qwen2.5 coder variants typically support tools
    "qwen2.5:coder", // Alternative naming
    "command-r", // Cohere Command-R models support tools
    "mistral-large", // Mistral Large supports tools
    "mixtral", // Mixtral models often support tools
  ];

  return toolSupportPatterns.some((pattern) => nameLower.includes(pattern));
}

/**
 * Fetch available models from an Ollama server
 * @param baseUrl - The base URL of the Ollama server (e.g., https://ollama.example.org/api or http://localhost:11434/api)
 * @returns Array of model names, or empty array on failure
 */
export async function getOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    // Normalize the URL: remove trailing slash and ensure /api is not duplicated
    const normalizedUrl = baseUrl.replace(/\/$/, "");
    const tagsUrl = normalizedUrl.endsWith("/api")
      ? `${normalizedUrl}/tags`
      : `${normalizedUrl}/api/tags`;

    logger.info(`Fetching Ollama models from: ${tagsUrl}`);

    const response = await fetch(tagsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Set a reasonable timeout to avoid hanging
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      logger.error(
        `Failed to fetch Ollama models: ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const data = (await response.json()) as OllamaTagsResponse;

    if (!data.models || !Array.isArray(data.models)) {
      logger.error("Invalid response format from Ollama server");
      return [];
    }

    const modelNames = data.models.map((model) => model.name);
    logger.info(
      `Found ${modelNames.length} Ollama models: ${modelNames.join(", ")}`,
    );

    return modelNames;
  } catch (error) {
    logger.error(`Error fetching Ollama models: ${error}`);
    return [];
  }
}
