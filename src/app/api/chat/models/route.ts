import { customModelProvider, openRouterModelIdMapping } from "lib/ai/models";
import { getOllamaModels, doesOllamaModelSupportTools } from "lib/ai/ollama";
import { getSession } from "auth/server";
import { getUserPreferences } from "lib/user/server";
import { fetchOpenRouterModels } from "@/app/actions/openrouter";

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

  // Fetch OpenRouter models to get dynamic image support information
  const openRouterResult = await fetchOpenRouterModels();
  const openRouterModels = openRouterResult.success
    ? openRouterResult.models || []
    : [];

  // Create a map of OpenRouter API ID to supportsImages for quick lookup
  const openRouterImageSupport = new Map<string, boolean>();
  openRouterModels.forEach((model) => {
    openRouterImageSupport.set(model.id, model.supportsImages);
  });

  // Get all providers and handle OpenRouter models based on preferences
  const providers = customModelProvider.modelsInfo.map((provider) => {
    // Handle OpenRouter provider specially
    if (provider.provider === "openRouter") {
      if (selectedOpenRouterModels && selectedOpenRouterModels.size > 0) {
        // User has made selections - show only selected models
        // Create model entries for each selected OpenRouter API ID with dynamic vision support
        const selectedModels = Array.from(selectedOpenRouterModels).map(
          (apiId) => {
            // Check if this model supports images from the API data
            const supportsImages = openRouterImageSupport.get(apiId) ?? false;

            return {
              name: apiId, // Use the API ID as the model name
              isToolCallUnsupported: false, // Assume tools are supported by default
              isImageInputUnsupported: !supportsImages, // Use dynamic vision support data
              supportedFileMimeTypes: [], // No file support by default
            };
          },
        );

        return {
          ...provider,
          models: selectedModels,
        };
      } else {
        // No user selections - show all predefined models with updated vision support
        const updatedModels = provider.models.map((model) => {
          // Get the OpenRouter API ID for this internal model name
          const openRouterApiId = openRouterModelIdMapping[model.name];

          // Check if this model supports images from the API data
          const supportsImages = openRouterApiId
            ? (openRouterImageSupport.get(openRouterApiId) ?? false)
            : false;

          return {
            ...model,
            isImageInputUnsupported: !supportsImages,
          };
        });

        return {
          ...provider,
          models: updatedModels,
        };
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
