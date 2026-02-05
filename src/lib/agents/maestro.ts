/**
 * Agent 8: Maestro. Outputs genre, mood, and BPM-style tags for Suno. Tone-agnostic; sender defines style.
 */

import { generate } from "@/lib/llm";
import type { Blueprint } from "@/lib/types";

const MAESTRO_FALLBACK_SYSTEM =
  "Output only genre, mood, and BPM tags for Suno. No prose. Do not require the music to match the website background; the sender's instructions define the style.";

/**
 * Run the Maestro agent: produce style tags (or prompt) for Suno.
 */
export async function runMaestro(
  blueprint: Blueprint,
  receiverInput: string
): Promise<string> {
  const systemInstruction =
    blueprint.runtimeInstructions?.music?.trim() || MAESTRO_FALLBACK_SYSTEM;
  const userPrompt = `GENERATE_STYLE_TAGS: Combine with established genre from system instructions.\nHUMAN_DESCRIPTION: "${receiverInput}"\n\nOutput only comma-separated tags (genre, mood, BPM) for Suno.`;
  const out = await generate({
    prompt: userPrompt,
    systemInstruction,
  });
  return out.trim();
}
