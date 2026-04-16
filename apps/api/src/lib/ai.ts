import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { env } from "./env";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const OPENAI_MODEL = "gpt-4o";

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

const getAnthropic = (): Anthropic | null => {
  if (!env.anthropicApiKey) return null;
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return anthropic;
};

const getOpenAI = (): OpenAI | null => {
  if (!env.openaiApiKey) return null;
  if (!openai) {
    openai = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return openai;
};

const stripMarkdownFences = (text: string): string =>
  text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

const callAnthropic = async (prompt: string, maxTokens: number): Promise<string> => {
  const client = getAnthropic();
  if (!client) throw new Error("Anthropic not configured");

  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }]
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected Anthropic response");
  }
  return block.text;
};

const callOpenAI = async (prompt: string, maxTokens: number): Promise<string> => {
  const client = getOpenAI();
  if (!client) throw new Error("OpenAI not configured");

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }]
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Unexpected OpenAI response");
  }
  return content;
};

const isRateLimitError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status: number }).status === 429;
  }
  return false;
};

export const getJsonResponse = async <T>(prompt: string, maxTokens = 2048): Promise<T> => {
  const hasAnthropic = !!env.anthropicApiKey;
  const hasOpenAI = !!env.openaiApiKey;

  if (!hasAnthropic && !hasOpenAI) {
    throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.");
  }

  // Try Anthropic first, fall back to OpenAI on rate limit
  if (hasAnthropic) {
    try {
      const text = await callAnthropic(prompt, maxTokens);
      return JSON.parse(stripMarkdownFences(text)) as T;
    } catch (error) {
      if (isRateLimitError(error) && hasOpenAI) {
        console.log("Anthropic rate limited, falling back to OpenAI");
      } else {
        throw error;
      }
    }
  }

  // OpenAI fallback (or primary if no Anthropic key)
  const text = await callOpenAI(prompt, maxTokens);
  return JSON.parse(stripMarkdownFences(text)) as T;
};
