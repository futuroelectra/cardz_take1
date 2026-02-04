/**
 * Agent 2: Architect (Translator). Maps creative summary → variable schema (blueprint) for Engineer.
 * Per docs/MASTER_PROMPT_BACKEND.md §5. Uses LLM to produce Blueprint-shaped JSON.
 */

import { generateJson } from "@/lib/llm";
import type { CreativeSummary, Blueprint, ButtonSlot } from "@/lib/types";

const ARCHITECT_PROMPT = `You are a design architect. Turn the creative summary into a fixed card blueprint.

Output ONLY valid JSON with exactly these keys:
- "heading": string (short title, e.g. "For Danielle")
- "description": string (1-2 sentences, from senderVibe/tone)
- "statusBar": string (e.g. "From Alex · warm")
- "centralImage": string (description of central visual: avatar, card, orb, etc.)
- "buttons": array of { "id": string, "type": "text"|"music"|"image", "label": string } (1-4 buttons; at most one music, one image)
- "primaryBackground": hex color
- "secondaryBackground": hex color
- "textColor": hex color
- "themeName": string

Creative summary:
`;

type ArchitectJson = {
  heading: string;
  description: string;
  statusBar: string;
  centralImage: string;
  buttons: Array<{ id: string; type: "text" | "music" | "image"; label: string }>;
  primaryBackground: string;
  secondaryBackground: string;
  textColor: string;
  themeName: string;
};

function normalizeButtons(buttons: ArchitectJson["buttons"]): ButtonSlot[] {
  return buttons.slice(0, 4).map((b, i) => ({
    id: b.id || `btn${i + 1}`,
    type: b.type === "music" || b.type === "image" ? b.type : "text",
    label: b.label || "Button",
  }));
}

/**
 * Produce blueprint from creative summary via LLM. Fixed variable slots per master prompt.
 */
export async function creativeSummaryToBlueprint(summary: CreativeSummary): Promise<Blueprint> {
  const summaryStr = JSON.stringify(summary, null, 2);
  const out = await generateJson<ArchitectJson>({
    prompt: ARCHITECT_PROMPT + summaryStr + "\n\nReturn ONLY the JSON object.",
    systemInstruction: "You are a design architect. Respond with valid JSON only.",
    responseFormat: "json",
  });
  return {
    heading: out.heading ?? `For ${summary.recipientName}`,
    description: out.description?.slice(0, 200) ?? summary.senderVibe?.slice(0, 120) ?? "A little something for you.",
    statusBar: out.statusBar ?? `${summary.senderName} · ${summary.tone}`,
    centralImage: out.centralImage ?? summary.centralSubject,
    buttons: normalizeButtons(out.buttons ?? [{ id: "btn1", type: "text", label: "send love" }, { id: "btn2", type: "text", label: "surprise me" }]),
    primaryBackground: out.primaryBackground ?? "#2D1B2E",
    secondaryBackground: out.secondaryBackground ?? "#1a0f1b",
    textColor: out.textColor ?? "#FFFADC",
    themeName: out.themeName ?? summary.tone ?? "warm",
  };
}
