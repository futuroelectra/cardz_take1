/**
 * Agent 7: Alchemist. Converts receiver input into an image prompt for German Eye and Nano Banana.
 * Tone-agnostic; theme and sender's runtimeInstructions define style.
 */

import { generate } from "@/lib/llm";
import type { Blueprint } from "@/lib/types";

const ALCHEMIST_FALLBACK_SYSTEM =
  "Convert receiver input into an image prompt. Follow the card's themeName and aesthetic. Output only the prompt. Do not require the result to match or correlate with the website background colour.";

/**
 * Run the Alchemist agent: produce an image prompt for German Eye / Nano Banana.
 */
export async function runAlchemist(
  blueprint: Blueprint,
  receiverInput: string
): Promise<string> {
  const systemInstruction =
    blueprint.runtimeInstructions?.image?.trim() || ALCHEMIST_FALLBACK_SYSTEM;
  const parts = [
    `SCENE: ${receiverInput}`,
    `Style: ${blueprint.themeName ?? "cohesive with the card"}.`,
  ];
  if (blueprint.runtimeInstructions?.image) {
    parts.push(blueprint.runtimeInstructions.image);
  }
  const userPrompt = parts.join("\n") + "\n\nOutput only the image prompt.";
  const out = await generate({
    prompt: userPrompt,
    systemInstruction,
  });
  return out.trim();
}
