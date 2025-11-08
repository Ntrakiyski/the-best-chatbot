import { customModelProvider } from "lib/ai/models";
import { getOllamaModels } from "lib/ai/ollama";

export const GET = async () => {
  const providers = [...customModelProvider.modelsInfo];

  // Add Ollama models dynamically if OLLAMA_BASE_URL is configured
  if (process.env.OLLAMA_BASE_URL) {
    const ollamaModelNames = await getOllamaModels(process.env.OLLAMA_BASE_URL);

    if (ollamaModelNames.length > 0) {
      providers.push({
        provider: "ollama",
        hasAPIKey: true,
        models: ollamaModelNames.map((name) => ({
          name,
          isToolCallUnsupported: false, // Ollama supports tool calling
          isImageInputUnsupported: true, // Conservative: assume no vision by default
          supportedFileMimeTypes: [],
        })),
      });
    }
  }

  return Response.json(
    providers.sort((a, b) => {
      if (a.hasAPIKey && !b.hasAPIKey) return -1;
      if (!a.hasAPIKey && b.hasAPIKey) return 1;
      return 0;
    }),
  );
};
