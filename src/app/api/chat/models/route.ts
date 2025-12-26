import { customModelProvider, openRouterModelIdMapping } from "lib/ai/models";
import { getOllamaModels, doesOllamaModelSupportTools } from "lib/ai/ollama";
import { getSession } from "auth/server";
import { getUserPreferences } from "lib/user/server";
import { fetchOpenRouterModels } from "@/app/actions/openrouter";
import { DEFAULT_FILE_PART_MIME_TYPES } from "lib/ai/file-support";

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

  // Create maps for quick lookup of model metadata
  const openRouterImageSupport = new Map<string, boolean>();
  const openRouterDisplayNames = new Map<string, string>();
  openRouterModels.forEach((model) => {
    openRouterImageSupport.set(model.id, model.supportsImages);
    openRouterDisplayNames.set(model.id, model.name);
  });

  // Get all providers and filter OpenRouter models based on preferences
  const providers = customModelProvider.modelsInfo.map((provider) => {
    // Handle OpenRouter provider specially to use dynamic image support data
    if (provider.provider === "openRouter") {
      // If user has selected specific OpenRouter models, show only those
      if (selectedOpenRouterModels && selectedOpenRouterModels.size > 0) {
        // Create dynamic model entries for ALL selected models from the API
        const dynamicModels = Array.from(selectedOpenRouterModels).map(
          (apiId) => {
            // Check if this model supports images from the API data
            const supportsImages = openRouterImageSupport.get(apiId) ?? false;
            // Get the display name for better UX
            const displayName = openRouterDisplayNames.get(apiId);

            return {
              // Use the API ID as the model name for dynamic models
              name: apiId,
              displayName, // Human-readable name for UI display
              isToolCallUnsupported: false, // Assume OpenRouter models support tools
              isImageInputUnsupported: !supportsImages,
              // Enable file upload for models that support vision
              supportedFileMimeTypes: supportsImages
                ? [...DEFAULT_FILE_PART_MIME_TYPES]
                : [],
            };
          },
        );

        return {
          ...provider,
          models: dynamicModels,
        };
      }

      // If no selections, show the default hardcoded models with updated image support
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
          // Enable file upload for models that support vision
          supportedFileMimeTypes: supportsImages
            ? [...DEFAULT_FILE_PART_MIME_TYPES]
            : model.supportedFileMimeTypes,
        };
      });

      return {
        ...provider,
        models: updatedModels,
      };
    }

    // For non-OpenRouter providers, return all models as-is
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
