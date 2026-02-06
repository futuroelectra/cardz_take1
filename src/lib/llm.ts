/**
 * Shared LLM layer: Gemini or OpenAI. Used by Collector, Architect, Engineer.
 * Env: MODEL_PROVIDER (GOOGLE | OPEN_AI), GOOGLE_GENAI_API_KEY, OPENAI_GENAI_API_KEY.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const provider = process.env.MODEL_PROVIDER || "GOOGLE";
const genAI =
  provider === "GOOGLE" && process.env.GOOGLE_GENAI_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY)
    : null;
const openai =
  provider === "OPEN_AI" && process.env.OPENAI_GENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_GENAI_API_KEY })
    : null;

export type LLMMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export type GenerateParams = {
  /** Chat history (Gemini: user/model; OpenAI: user/assistant) */
  messages?: LLMMessage[];
  /** Single prompt when no history */
  prompt?: string;
  systemInstruction?: string;
  /** When true, strip code fences and parse as JSON */
  responseFormat?: "json";
};

/**
 * Generate text (or JSON object) from the configured provider.
 */
export async function generate(params: GenerateParams): Promise<string> {
  const { messages, prompt, systemInstruction, responseFormat } = params;

  if (provider === "OPEN_AI" && openai) {
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemInstruction) {
      openaiMessages.push({ role: "system", content: systemInstruction });
    }
    if (messages?.length) {
      for (const m of messages) {
        openaiMessages.push({
          role: m.role === "model" ? "assistant" : "user",
          content: m.parts[0].text,
        });
      }
    } else if (prompt) {
      openaiMessages.push({ role: "user", content: prompt });
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      ...(responseFormat === "json" && {
        response_format: { type: "json_object" as const },
      }),
    });
    return completion.choices[0].message.content ?? "";
  }

  if (genAI) {
    // Fast model for chat, agents, and E2E user simulation (quicker test runs).
    const modelName = "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction ?? undefined,
    });

    if (messages?.length) {
      const last = messages[messages.length - 1];
      const history = messages.slice(0, -1);
      const filteredHistory = history.filter((m) => m.role !== "model" || m.parts[0].text);
      if (filteredHistory.length > 0) {
        const chat = model.startChat({
          history: filteredHistory.map((m) => ({
            role: m.role,
            parts: m.parts,
          })),
        });
        const result = await chat.sendMessage(last.parts[0].text);
        return result.response.text();
      }
      const result = await model.generateContent(last.parts[0].text);
      return result.response.text();
    }
    if (prompt) {
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  }

  throw new Error("LLM not configured: set GOOGLE_GENAI_API_KEY or OPENAI_GENAI_API_KEY and MODEL_PROVIDER");
}

/**
 * Stream text from the configured provider. No responseFormat (JSON) support; use for chat only.
 */
export async function* generateStream(params: Omit<GenerateParams, "responseFormat">): AsyncGenerator<string> {
  const { messages, prompt, systemInstruction } = params;

  if (provider === "OPEN_AI" && openai) {
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (systemInstruction) {
      openaiMessages.push({ role: "system", content: systemInstruction });
    }
    if (messages?.length) {
      for (const m of messages) {
        openaiMessages.push({
          role: m.role === "model" ? "assistant" : "user",
          content: m.parts[0].text,
        });
      }
    } else if (prompt) {
      openaiMessages.push({ role: "user", content: prompt });
    }
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openaiMessages,
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (typeof content === "string" && content) yield content;
    }
    return;
  }

  if (genAI) {
    // Fast model for chat, agents, and E2E user simulation (quicker test runs).
    const modelName = "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction ?? undefined,
    });

    if (messages?.length) {
      const last = messages[messages.length - 1];
      const history = messages.slice(0, -1);
      const filteredHistory = history.filter((m) => m.role !== "model" || m.parts[0].text);
      if (filteredHistory.length > 0) {
        const chat = model.startChat({
          history: filteredHistory.map((m) => ({
            role: m.role,
            parts: m.parts,
          })),
        });
        const result = await chat.sendMessageStream(last.parts[0].text);
        for await (const chunk of result.stream) {
          try {
            const text = chunk.text?.();
            if (typeof text === "string" && text) yield text;
          } catch {
            // Skip blocked or empty chunks
          }
        }
        return;
      }
      const result = await model.generateContentStream(last.parts[0].text);
      for await (const chunk of result.stream) {
        try {
          const text = chunk.text?.();
          if (typeof text === "string" && text) yield text;
        } catch {
          // Skip blocked or empty chunks
        }
      }
      return;
    }
    if (prompt) {
      const result = await model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        try {
          const text = chunk.text?.();
          if (typeof text === "string" && text) yield text;
        } catch {
          // Skip blocked or empty chunks
        }
      }
      return;
    }
  }

  throw new Error("LLM not configured: set GOOGLE_GENAI_API_KEY or OPENAI_GENAI_API_KEY and MODEL_PROVIDER");
}

/**
 * Generate and parse JSON. Strips markdown code fences before parsing.
 */
export async function generateJson<T = unknown>(params: GenerateParams): Promise<T> {
  let text = await generate({ ...params, responseFormat: "json" });
  text = text.trim();
  const jsonBlockRegex = /^```(?:json)?\n?([\s\S]*?)\n?```$/i;
  const match = text.match(jsonBlockRegex);
  if (match) {
    text = match[1];
  } else {
    text = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
  }
  text = text.trim();
  return JSON.parse(text) as T;
}
