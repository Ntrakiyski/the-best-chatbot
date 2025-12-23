/**
 * OpenRouter API Types
 * https://openrouter.ai/api/v1/models
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  architecture: {
    modality: string;
    tokenizer?: string;
    instruct_type?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Transformed model display format for UI
 */
export interface OpenRouterModelDisplay {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextLength: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  modality: string;
  supportsImages: boolean;
}
