"use server";

import {
  OpenRouterModelDisplay,
  OpenRouterModelsResponse,
} from "@/types/openrouter";

/**
 * Fetches all available models from OpenRouter API
 * Implements caching via Next.js fetch cache
 */
export async function fetchOpenRouterModels(): Promise<{
  success: boolean;
  models?: OpenRouterModelDisplay[];
  error?: string;
}> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Accept: "application/json",
        // Optional: Add API key if available (not required for listing)
        ...(apiKey &&
          apiKey !== "****" && { Authorization: `Bearer ${apiKey}` }),
      },
      // Cache for 1 hour to avoid excessive API calls
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data: OpenRouterModelsResponse = await response.json();

    // Transform to display format
    const models: OpenRouterModelDisplay[] = data.data.map((model) => {
      // Extract provider from model ID (e.g., "openai" from "openai/gpt-4")
      const provider = model.id.split("/")[0] || "unknown";

      // Check if model supports image input
      const supportsImages =
        model.architecture.input_modalities?.includes("image") ?? false;

      return {
        id: model.id,
        name: model.name,
        provider,
        description: model.description,
        contextLength: model.context_length,
        pricing: {
          prompt: model.pricing.prompt,
          completion: model.pricing.completion,
        },
        modality: model.architecture.modality,
        supportsImages,
      };
    });

    // Sort by provider, then by name
    models.sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });

    return {
      success: true,
      models,
    };
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch OpenRouter models",
    };
  }
}
