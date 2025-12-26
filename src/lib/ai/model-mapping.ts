/**
 * Mapping of internal model names to OpenRouter API IDs
 * This file can be imported in both client and server components
 * This allows us to match user selections from the API with our internal model structure
 */
export const openRouterModelIdMapping: Record<string, string> = {
  // openRouter models
  "gpt-120b-0.44": "openai/gpt-oss-120b",
  "gemini-quick-0.50": "google/gemini-2.5-flash-lite-preview-09-2025",
  "grok-4.1-fast": "x-ai/grok-4.1-fast",
  "minimax-m2-0.60": "minimax/minimax-m2",
  "qwen3-coder-1": "qwen/qwen3-coder",
  "aion-1-mini": "aion-labs/aion-1.0-mini",
  // openRouterVisual models
  "qwen3-vl-1": "qwen/qwen3-vl-235b-a22b-instruct",
  "glm-4.5v-2.40": "z-ai/glm-4.5v",
  "gemini-2.5-pro-11.25": "google/gemini-2.5-pro",
  // openRouterFREE models
  "html-model:free": "nex-agi/deepseek-v3.1-nex-n1:free",
  "tng-r1t-chimera:free": "tngtech/tng-r1t-chimera:free",
  "kat-coder-pro:free": "kwaipilot/kat-coder-pro:free",
  "devstral-2512:free": "mistralai/devstral-2512:free",
  "trinity-mini:free": "arcee-ai/trinity-mini:free",
  "tongyi-deepresearch-30b:free": "alibaba/tongyi-deepresearch-30b-a3b:free",
  "olmo-3-32b-think:free": "allenai/olmo-3-32b-think:free",
  "dolphin-mistral-24b:free":
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  "gpt-oss-120b:free": "openai/gpt-oss-20b:free",
  "qwen3-coder:free": "qwen/qwen3-coder:free",
  "deepseek-v3:free": "deepseek/deepseek-r1-0528:free",
  "gemini-2.0-flash-exp:free": "google/gemini-2.0-flash-exp:free",
};
