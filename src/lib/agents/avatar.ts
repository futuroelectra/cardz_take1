/**
 * Agent 5: Avatar. Generates a prompt for high-aesthetic avatar from blueprint vibe and optional image ref.
 * Output for German Eye and Nano Banana. Tone-agnostic; no identity engine.
 */

import { generate } from "@/lib/llm";
import type { Blueprint } from "@/lib/types";

const AVATAR_SYSTEM = `Take the uploaded photo and the blueprint vibe. Generate a prompt for a high-aesthetic avatar that retains the subject's likeness but matches the card's mini-verse (e.g., Cyberpunk, Oil Painting, Lo-Fi). Output only the prompt, no commentary. Do not require the result to match the website background colour; the sender defines the aesthetic.`;

/**
 * Generate an avatar prompt for German Eye / Nano Banana from blueprint and optional image reference.
 */
export async function generateAvatarPrompt(
  blueprint: Blueprint,
  imageRef?: string
): Promise<string> {
  const vibe = [
    blueprint.themeName,
    blueprint.centralImage,
    blueprint.description?.slice(0, 100),
  ]
    .filter(Boolean)
    .join(". ");
  const prompt = `Blueprint vibe: ${vibe}${imageRef ? `\nImage reference: ${imageRef}` : ""}\n\nGenerate the avatar prompt. Output only the prompt.`;
  const out = await generate({ prompt, systemInstruction: AVATAR_SYSTEM });
  return out.trim();
}
