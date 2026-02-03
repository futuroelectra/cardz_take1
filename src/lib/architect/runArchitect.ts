import OpenAI from "openai";
import { getArchitectPrompt, getArchitectUserPrompt } from "@/lib/prompts/load";
import { validateBlueprint } from "./validateBlueprint";
import type { Blueprint } from "./types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Run the Architect: Creative Summary -> LLM -> parse JSON -> validate -> Blueprint.
 * Throws on missing API key, parse failure, or validation errors.
 */
export async function runArchitect(creativeSummary: unknown): Promise<Blueprint> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const { system } = getArchitectPrompt();
  const userPrompt = getArchitectUserPrompt(creativeSummary);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Architect response did not contain JSON");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("Architect response JSON parse failed: " + String(e));
  }

  const errors = validateBlueprint(parsed);
  if (errors.length > 0) {
    const msg = errors.map((e) => `${e.path}: ${e.message}`).join("; ");
    throw new Error("Blueprint validation failed: " + msg);
  }

  return parsed as Blueprint;
}
