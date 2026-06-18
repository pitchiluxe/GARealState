// GA Real Estate Playground — AI Client
// Uses OpenRouter's OpenAI-compatible /v1/chat/completions

import type { CopilotInput, CopilotResponse } from "@/types";
import {
  COPILOT_SYSTEM_PROMPT,
  TRAINING_SYSTEM_PROMPT,
  buildCopilotPrompt,
  buildTrainingScorePrompt,
} from "./prompts";
import { v4 as uuidv4 } from "uuid";
import { FREE_MODELS, DEFAULT_MODEL } from "./models";
export { FREE_MODELS, DEFAULT_MODEL } from "./models";

function apiKey(): string {
  return process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || "";
}

function baseUrl(): string {
  const raw = process.env.ANTHROPIC_BASE_URL || "https://openrouter.ai/api";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function primaryModel(override?: string): string {
  return override || process.env.ANTHROPIC_MODEL || process.env.AI_MODEL || DEFAULT_MODEL;
}

const FALLBACK_MODELS = [
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

function toAscii(s: string) {
  return s.replace(/[^\x00-\x7F]/g, "");
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${toAscii(apiKey())}`,
    "HTTP-Referer": toAscii(process.env.NEXTAUTH_URL || "http://localhost:4000"),
    "X-Title": "GA Real Estate Playground",
  };
}

interface OAMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callModel(messages: OAMessage[], maxTokens: number, modelOverride?: string): Promise<string> {
  const models = [primaryModel(modelOverride), ...FALLBACK_MODELS];
  const url = `${baseUrl()}/chat/completions`;
  let lastError: Error = new Error("No models tried");

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, include_reasoning: false }),
        });

        if (res.status === 429) {
          if (attempt === 0) { await sleep(1500); continue; }
          throw new Error(`429 rate-limited on ${model}`);
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => `HTTP ${res.status}`);
          throw new Error(`${model} → ${res.status}: ${txt.slice(0, 200)}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(`${model} error: ${data.error.message}`);

        const content: string = data.choices?.[0]?.message?.content ?? "";
        if (!content) throw new Error(`${model} returned empty content`);

        return content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (!lastError.message.includes("429")) break;
      }
    }
    console.warn(`[AI] Model ${model} failed: ${lastError.message} — trying next`);
  }

  throw new Error(`All models failed. Last error: ${lastError.message}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function chat(system: string, userMessage: string, maxTokens = 2048, modelOverride?: string): Promise<string> {
  return callModel(
    [{ role: "system", content: system }, { role: "user", content: userMessage }],
    maxTokens,
    modelOverride,
  );
}

export async function chatWithHistory(
  system: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens = 1024,
  modelOverride?: string
): Promise<string> {
  const trimmed = messages.reduce<Array<{ role: "user" | "assistant"; content: string }>>(
    (acc, msg) => {
      if (acc.length === 0 && msg.role === "assistant") return acc;
      return [...acc, msg];
    },
    []
  );
  if (trimmed.length === 0) return "";
  return callModel(
    [{ role: "system", content: system }, ...trimmed],
    maxTokens,
    modelOverride,
  );
}

export function extractJson(raw: string): string {
  let s = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/im, "").trim();
  const start = s.indexOf("{");
  if (start > 0) s = s.slice(start);
  s = s.replace(/,(\s*[}\]])/g, "$1");

  let braces = 0, brackets = 0, inStr = false, esc = false;
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") braces++;
    else if (ch === "}" && braces > 0) braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]" && brackets > 0) brackets--;
  }
  if (inStr) s += '"';
  while (brackets > 0) { s += "]"; brackets--; }
  while (braces > 0) { s += "}"; braces--; }
  return s;
}

function copilotDefaults(partial: Record<string, unknown>): Omit<CopilotResponse, "sessionId"> {
  const esc = (partial.escalation as Record<string, unknown> | undefined) ?? {};
  return {
    category: (partial.category as CopilotResponse["category"]) || "OTHER",
    severity: (partial.severity as CopilotResponse["severity"]) || "MEDIUM",
    confidence: Number(partial.confidence) || 75,
    studyTip: (partial.studyTip as string) || "Review this topic in the Knowledge Base for more detail.",
    conceptExplanation: (partial.conceptExplanation as string) || "This is a core concept on the Georgia Real Estate exam.",
    keyFacts: (partial.keyFacts as string[]) || [],
    examPoints: (partial.examPoints as string[]) || [],
    practiceQuestion: (partial.practiceQuestion as string) || "",
    practiceAnswer: (partial.practiceAnswer as string) || "",
    commonMistakes: (partial.commonMistakes as string[]) || [],
    relatedTopics: (partial.relatedTopics as string[]) || [],
    memoryTrick: (partial.memoryTrick as string) || "",
    georgiaSpecific: (partial.georgiaSpecific as string) || "",
    lawReference: (partial.lawReference as string) || "",
    difficultyRating: (partial.difficultyRating as CopilotResponse["difficultyRating"]) || "MEDIUM",
    studyPriority: (partial.studyPriority as CopilotResponse["studyPriority"]) || "MEDIUM",
    escalation: {
      needsMoreStudy: Boolean(esc.needsMoreStudy) || false,
      urgency: (esc.urgency as CopilotResponse["escalation"]["urgency"]) || "LOW",
      reason: (esc.reason as string) || "",
      suggestedResources: (esc.suggestedResources as string[]) || [],
    },
    caseNoteSuggestion: (partial.caseNoteSuggestion as string) || "",
    estimatedStudyTime: (partial.estimatedStudyTime as string) || "15-20 minutes",
  };
}

export function parseCopilotResponse(raw: string): CopilotResponse {
  const repaired = extractJson(raw);
  let partial: Record<string, unknown>;
  try {
    partial = JSON.parse(repaired);
  } catch {
    const m = repaired.match(/\{[\s\S]+\}/);
    try { partial = m ? JSON.parse(m[0]) : {}; } catch { partial = {}; }
  }
  return { ...copilotDefaults(partial), sessionId: uuidv4() };
}

export async function getCopilotResponse(input: CopilotInput, modelOverride?: string): Promise<CopilotResponse> {
  const prompt = buildCopilotPrompt(input);
  const raw = await chat(COPILOT_SYSTEM_PROMPT, prompt, 2000, modelOverride);
  return parseCopilotResponse(raw);
}

export async function getTrainingCustomerResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  examinerPersona: string,
  initialMessage?: string,
  modelOverride?: string
): Promise<string> {
  const systemParts = [TRAINING_SYSTEM_PROMPT, `\n\nEXAMINER PERSONA: ${examinerPersona}`];
  if (initialMessage) systemParts.push(`\nOPENING QUESTION (you already asked this): "${initialMessage}"`);
  const result = await chatWithHistory(systemParts.join(""), messages, 300, modelOverride);
  return result || "Could you elaborate on that answer?";
}

export async function scoreTrainingSession(
  conversation: Array<{ role: string; content: string }>,
  scenario: { name: string; objectives: string[] },
  modelOverride?: string
): Promise<{
  scores: { knowledge: number; application: number; accuracy: number; efficiency: number; completion: number; total: number };
  grade: string;
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  missedConcepts: string[];
  bestAnswer: string;
  weakestAnswer: string;
}> {
  const prompt = buildTrainingScorePrompt(conversation, scenario);
  const system = "You are a Georgia Real Estate exam evaluator. Score study sessions objectively. Return only valid JSON — no extra text, no markdown.";
  const raw = await chat(system, prompt, 900, modelOverride);
  try {
    return JSON.parse(extractJson(raw));
  } catch {
    const m = raw.match(/\{[\s\S]+\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Failed to parse scoring response");
  }
}

export async function generateResponses(
  topic: string,
  style: string,
  responseType: string,
  modelOverride?: string
): Promise<Array<{ label: string; text: string; bestFor: string }>> {
  const system = "You are a Georgia Real Estate exam prep specialist. Generate clear, accurate study responses. Return only valid JSON — no markdown.";
  const userPrompt = `Generate 3 Georgia Real Estate exam prep responses.

TOPIC: ${topic}
STYLE: ${style}
TYPE: ${responseType}

Return JSON exactly:
{
  "responses": [
    {"label": "...", "text": "...", "bestFor": "..."},
    {"label": "...", "text": "...", "bestFor": "..."},
    {"label": "...", "text": "...", "bestFor": "..."}
  ]
}`;

  const raw = await chat(system, userPrompt, 900, modelOverride);
  try {
    const result = JSON.parse(extractJson(raw));
    return result.responses;
  } catch {
    const m = raw.match(/\{[\s\S]+\}/);
    if (m) return JSON.parse(m[0]).responses;
    throw new Error("Failed to parse responses");
  }
}

export function getProviderInfo() {
  return {
    provider: "openrouter",
    model: primaryModel(),
    baseURL: baseUrl(),
    totalFreeModels: FREE_MODELS.length,
  };
}
