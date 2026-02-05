/**
 * Agent 9: Herald. One-sentence teaser for WhatsApp/Email delivery. Tone-agnostic; no identity engine.
 */

import { generate } from "@/lib/llm";

const HERALD_SYSTEM =
  "Write a 1-sentence teaser for the receiver. No clickbait. Only intrigue. Tone can reflect the card's theme or stay neutral; do not use a fixed brand persona.";

export type HeraldContext = {
  heading?: string;
  themeName?: string;
  buttonLabel?: string;
};

/**
 * Run the Herald agent: produce a one-sentence notification teaser.
 */
export async function runHerald(context: HeraldContext): Promise<string> {
  const parts: string[] = [];
  if (context.heading) parts.push(`Card heading: ${context.heading}`);
  if (context.themeName) parts.push(`Theme: ${context.themeName}`);
  if (context.buttonLabel) parts.push(`Action: ${context.buttonLabel}`);
  const prompt =
    parts.length > 0
      ? `Context:\n${parts.join("\n")}\n\nWrite the one-sentence teaser.`
      : "Write a short one-sentence teaser that creates intrigue. No clickbait.";
  const out = await generate({ prompt, systemInstruction: HERALD_SYSTEM });
  return out.trim();
}
