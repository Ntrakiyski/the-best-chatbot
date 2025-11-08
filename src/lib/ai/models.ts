import "server-only";

// import { createOllama } from "ollama-ai-provider-v2"; // Commented out - unused (see line 24-26)
import { openai } from "@ai-sdk/openai";
// import { google } from "@ai-sdk/google"; // Commented out - unused (see line 56-60)
// import { anthropic } from "@ai-sdk/anthropic"; // Commented out - unused (see line 61-65)
// import { xai } from "@ai-sdk/xai"; // Commented out - unused (see line 66-71)
import { LanguageModelV2, openrouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
  // ANTHROPIC_FILE_MIME_TYPES, // Commented out - unused
  // XAI_FILE_MIME_TYPES, // Commented out - unused
} from "./file-support";

// const ollama = createOllama({ // Commented out - unused (see line 72-76)
//   baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
// });
const groq = createGroq({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const staticModels = {
  openRouter: {
    "gpt-120b-0.44": openrouter("openai/gpt-oss-120b"),
    "gemini-quick-0.50": openrouter(
      "google/gemini-2.5-flash-lite-preview-09-2025",
    ),
    "grok-4-fast-0.70": openrouter("x-ai/grok-4-fast"),
    "minimax-m2-0.60": openrouter("minimax/minimax-m2"),
    "qwen3-coder-1": openrouter("qwen/qwen3-coder"),
  },
  openRouterVisual: {
    "qwen3-vl-1": openrouter("qwen/qwen3-vl-235b-a22b-instruct"),
    "glm-4.5v-2.40": openrouter("z-ai/glm-4.5v"),
    "gemini-2.5-pro-11.25": openrouter("google/gemini-2.5-pro"),
  },
  openRouterFREE: {
    "gpt-oss-120b:free": openrouter("openai/gpt-oss-20b:free"),
    "qwen3-coder:free": openrouter("qwen/qwen3-coder:free"),
    "deepseek-v3:free": openrouter("deepseek/deepseek-r1-0528:free"),
    "gemini-2.0-flash-exp:free": openrouter("google/gemini-2.0-flash-exp:free"),
  },
  openai: {
    "gpt-5": openai("gpt-5"),
    "gpt-5-mini": openai("gpt-5-mini"),
    "gpt-5-codex": openai("gpt-5-codex"),
  },
  // google: {
  //   "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
  //   "gemini-2.5-flash": google("gemini-2.5-flash"),
  //   "gemini-2.5-pro": google("gemini-2.5-pro"),
  // },
  // anthropic: {
  //   "sonnet-4.5": anthropic("claude-sonnet-4-5"),
  //   "haiku-4.5": anthropic("claude-haiku-4-5"),
  //   "opus-4.1": anthropic("claude-opus-4-1"),
  // },
  // xai: {
  //   "grok-4-fast": xai("grok-4-fast-non-reasoning"),
  //   "grok-4": xai("grok-4"),
  //   "grok-3": xai("grok-3"),
  //   "grok-3-mini": xai("grok-3-mini"),
  // },
  // ollama: {
  //   "gemma3:1b": ollama("gemma3:1b"),
  //   "gemma3:4b": ollama("gemma3:4b"),
  //   "gemma3:12b": ollama("gemma3:12b"),
  // },
  groq: {
    "kimi-k2-instruct": groq("moonshotai/kimi-k2-instruct"),
    "llama-4-scout-17b": groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "gpt-oss-20b": groq("openai/gpt-oss-20b"),
    "gpt-oss-120b": groq("openai/gpt-oss-120b"),
    "qwen3-32b": groq("qwen/qwen3-32b"),
  },
};

const staticUnsupportedModels = new Set([
  // Note: No unsupported models currently defined
  // Add any models that don't support tool calling here
]);

const staticSupportImageInputModels = {
  ...staticModels.openai,
  ...staticModels.openRouterVisual, // OpenRouter Vision models support image input
  ...{
    // Individual OpenRouter models with vision capabilities
    "gemini-quick-0.50": staticModels.openRouter["gemini-quick-0.50"],
  },
  ...{
    // OpenRouter FREE models with vision capabilities
    "gemini-2.0-flash-exp:free":
      staticModels.openRouterFREE["gemini-2.0-flash-exp:free"],
  },
  // Add other providers that support image input here when uncommented
};

const staticFilePartSupportByModel = new Map<
  LanguageModel,
  readonly string[]
>();

const registerFileSupport = (
  model: LanguageModel | undefined,
  mimeTypes: readonly string[] = DEFAULT_FILE_PART_MIME_TYPES,
) => {
  if (!model) return;
  staticFilePartSupportByModel.set(model, Array.from(mimeTypes));
};

// File support for OpenAI models
registerFileSupport(staticModels.openai["gpt-5"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5-mini"], OPENAI_FILE_MIME_TYPES);

// File support for OpenRouter Visual models (vision/multimodal models)
registerFileSupport(
  staticModels.openRouterVisual["qwen3-vl-1"],
  DEFAULT_FILE_PART_MIME_TYPES,
);
registerFileSupport(
  staticModels.openRouterVisual["glm-4.5v-2.40"],
  DEFAULT_FILE_PART_MIME_TYPES,
);
registerFileSupport(
  staticModels.openRouterVisual["gemini-2.5-pro-11.25"],
  GEMINI_FILE_MIME_TYPES,
);

// File support for OpenRouter regular models with vision capabilities
// Gemini models support vision/multimodal inputs
registerFileSupport(
  staticModels.openRouter["gemini-quick-0.50"],
  GEMINI_FILE_MIME_TYPES,
);

// File support for OpenRouter free models
registerFileSupport(
  staticModels.openRouterFREE["gemini-2.0-flash-exp:free"],
  GEMINI_FILE_MIME_TYPES,
);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const isImageInputUnsupportedModel = (model: LanguageModelV2) => {
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

const fallbackModel = staticModels.openai["gpt-5"];

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
      isImageInputUnsupported: isImageInputUnsupportedModel(model),
      supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
    })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (model?: ChatModel): LanguageModel => {
    if (!model) return fallbackModel;
    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};

function checkProviderAPIKey(provider: keyof typeof staticModels) {
  let key: string | undefined;
  switch (provider) {
    case "openai":
      key = process.env.OPENAI_API_KEY;
      break;
    // case "google": // Commented out - provider not active
    //   key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    //   break;
    // case "anthropic": // Commented out - provider not active
    //   key = process.env.ANTHROPIC_API_KEY;
    //   break;
    // case "xai": // Commented out - provider not active
    //   key = process.env.XAI_API_KEY;
    //   break;
    case "groq":
      key = process.env.GROQ_API_KEY;
      break;
    case "openRouter":
    case "openRouterVisual":
    case "openRouterFREE":
      key = process.env.OPENROUTER_API_KEY;
      break;
    default:
      return true; // assume the provider has an API key
  }
  return !!key && key != "****";
}
