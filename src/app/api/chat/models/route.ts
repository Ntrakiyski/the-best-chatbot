import { customModelProvider, openRouterModelIdMapping } from "lib/ai/models";
import { getOllamaModels, doesOllamaModelSupportTools } from "lib/ai/ollama";
import { getSession } from "auth/server";
import { getUserPreferences } from "lib/user/server";

export const GET = async () => {
  // Get user preferences to filter OpenRouter models
  const session = await getSession();
  let selectedOpenRouterModels: Set<string> | null = null;

  if (session?.user?.id) {
    const preferences = await getUserPreferences(session.user.id);
    if (
      preferences?.selectedOpenRouterModels &&
      preferences.selectedOpenRouterModels.length > 0
    ) {
      selectedOpenRouterModels = new Set(preferences.selectedOpenRouterModels);
    }
  }

  // Get all providers and handle OpenRouter models based on preferences
  const providers = customModelProvider.modelsInfo.map((provider) => {
    // Handle OpenRouter provider specially
    if (provider.provider === "openRouter") {
      if (selectedOpenRouterModels && selectedOpenRouterModels.size > 0) {
        // User has made selections - show only selected models
        // Create model entries for each selected OpenRouter API ID
        const selectedModels = Array.from(selectedOpenRouterModels).map((apiId) => ({
          name: apiId, // Use the API ID as the model name
          isToolCallUnsupported: false, // Assume tools are supported by default
          isImageInputUnsupported: true, // Conservative default - no vision support
          supportedFileMimeTypes: [], // No file support by default
        }));

        return {
          ...provider,
          models: selectedModels,
        };
      } else {
        // No user selections - show all predefined models
        return provider;
      }
    }

    // For non-OpenRouter providers, return all models
    return provider;
  });

  // Add Ollama models dynamically if OLLAMA_BASE_URL is configured
  if (process.env.OLLAMA_BASE_URL) {
    const ollamaModelNames = await getOllamaModels(process.env.OLLAMA_BASE_URL);

    if (ollamaModelNames.length > 0) {
      providers.push({
        provider: "ollama",
        hasAPIKey: true,
        models: ollamaModelNames.map((name) => ({
          name,
          isToolCallUnsupported: !doesOllamaModelSupportTools(name), // Smart detection based on model name
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
