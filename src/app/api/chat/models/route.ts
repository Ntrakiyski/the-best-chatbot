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

  // Get all providers and filter OpenRouter models based on preferences
  const providers = customModelProvider.modelsInfo.map((provider) => {
    // Only filter OpenRouter provider if user has made selections
    if (provider.provider === "openRouter" && selectedOpenRouterModels) {
      // Filter models: only show models whose OpenRouter API ID is in the user's selections
      const filteredModels = provider.models.filter((model) => {
        // Get the OpenRouter API ID for this internal model name
        const openRouterApiId = openRouterModelIdMapping[model.name];

        // Include model if its API ID is in the selected models
        return openRouterApiId && selectedOpenRouterModels.has(openRouterApiId);
      });

      return {
        ...provider,
        models: filteredModels,
      };
    }

    // For non-OpenRouter providers or when no selections made, return all models
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
