// Browser-safe model constants — no server SDK imports here.

export const FREE_MODELS = [
  { id: "deepseek/deepseek-v4-flash:free",                    label: "DeepSeek V4 Flash (Free)", category: "DeepSeek" },
  { id: "openai/gpt-oss-20b:free",                            label: "GPT OSS 20B (Free)", category: "OpenAI" },
  { id: "openai/gpt-oss-120b:free",                           label: "GPT OSS 120B (Free)", category: "OpenAI" },
  { id: "google/gemma-4-31b-it:free",                         label: "Gemma 4 31B (Free)", category: "Google" },
  { id: "google/gemma-4-26b-a4b-it:free",                     label: "Gemma 4 26B (Free)", category: "Google" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free",             label: "Nemotron 3 Super 120B (Free)", category: "NVIDIA" },
  { id: "nvidia/nemotron-nano-9b-v2:free",                    label: "Nemotron Nano 9B v2 (Free)", category: "NVIDIA" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free",              label: "Qwen3 Next 80B (Free)", category: "Qwen" },
  { id: "meta-llama/llama-3.3-70b-instruct:free",             label: "Llama 3.3 70B (Free)", category: "Meta" },
  { id: "meta-llama/llama-3.2-3b-instruct:free",              label: "Llama 3.2 3B (Free)", category: "Meta" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free",          label: "Hermes 3 Llama 405B (Free)", category: "Nous" },
] as const;

export const DEFAULT_MODEL = "deepseek/deepseek-v4-flash:free";

export type FreeModel = (typeof FREE_MODELS)[number];
