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
