/**
 * Agent 2: Architect (Translator). Maps creative summary → variable schema (blueprint) for Engineer.
 * Per docs/MASTER_PROMPT_BACKEND.md §5. Uses LLM to produce Blueprint-shaped JSON.
 */

import { generateJson } from "@/lib/llm";
import type { CreativeSummary, Blueprint, ButtonSlot, BlueprintEffects } from "@/lib/types";

const ARCHITECT_PROMPT_JSON = `Turn the creative summary into a fixed card blueprint.

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
- "runtimeInstructions": object with optional keys "text", "image", "music". For each button type (text, image, music) provide a "Will": a system instruction that the runtime agent must follow so the receiver cannot override the sender's character or theme. These are Task Envelopes: immutable rules for the 48-hour runtime. If a button type is not used, omit that key.
- "effects": object with optional keys (use "none" to skip an effect): "buttonStyle" (none|solid|gradient|outline|glass|softGlow|bordered|minimal|pill|neon), "frameBackdrop" (none|glow|pulse|softGlow|particles|gradientRing|shimmer|halo|subtleShadow), "entranceEffect" (none|confetti|particles|fade|scaleIn|subtleDrift|blurIn|stagger|floatUp), "cardContainer" (none|glass|softBorder|elevated|minimal|gradientBorder), "typographyTreatment" (none|subtleShadow|gradientText|letterSpacing|allCaps|serif|rounded). Outputs must feel high-end and polished; you have full creative freedom to pick any option or "none" per dimension.

Creative summary:
`;

const ARCHITECT_PROMPT_PROSE = `Turn this short creative summary (plain prose) into a fixed card blueprint. Interpret the vibe and intent; outputs must feel high-end and polished.

Output ONLY valid JSON with exactly these keys:
- "heading": string (short title, e.g. "For Danielle")
- "description": string (1-2 sentences)
- "statusBar": string (e.g. "From Alex · warm")
- "centralImage": string (description of central visual: avatar, card, orb, etc.)
- "buttons": array of { "id": string, "type": "text"|"music"|"image", "label": string } (1-4 buttons; at most one music, one image)
- "primaryBackground": hex color
- "secondaryBackground": hex color
- "textColor": hex color
- "themeName": string
- "runtimeInstructions": object with optional keys "text", "image", "music". For each button type used, provide a "Will" (system instruction for the runtime agent). If a button type is not used, omit that key.
- "effects": object with optional keys (use "none" to skip): "buttonStyle" (none|solid|gradient|outline|glass|softGlow|bordered|minimal|pill|neon), "frameBackdrop" (none|glow|pulse|softGlow|particles|gradientRing|shimmer|halo|subtleShadow), "entranceEffect" (none|confetti|particles|fade|scaleIn|subtleDrift|blurIn|stagger|floatUp), "cardContainer" (none|glass|softBorder|elevated|minimal|gradientBorder), "typographyTreatment" (none|subtleShadow|gradientText|letterSpacing|allCaps|serif|rounded). Choose effects that match the summary; "none" is valid for any dimension.

Creative summary (prose):
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
  runtimeInstructions?: { text?: string; image?: string; music?: string };
  effects?: BlueprintEffects;
};

function normalizeButtons(buttons: ArchitectJson["buttons"]): ButtonSlot[] {
  return buttons.slice(0, 4).map((b, i) => ({
    id: b.id || `btn${i + 1}`,
    type: b.type === "music" || b.type === "image" ? b.type : "text",
    label: b.label || "Button",
  }));
}

const DEFAULT_EFFECTS: BlueprintEffects = {
  buttonStyle: "none",
  frameBackdrop: "none",
  entranceEffect: "none",
  cardContainer: "none",
  typographyTreatment: "none",
};

function normalizeEffects(e?: BlueprintEffects | null): BlueprintEffects {
  if (!e || typeof e !== "object") return DEFAULT_EFFECTS;
  return {
    buttonStyle: e.buttonStyle ?? "none",
    frameBackdrop: e.frameBackdrop ?? "none",
    entranceEffect: e.entranceEffect ?? "none",
    cardContainer: e.cardContainer ?? "none",
    typographyTreatment: e.typographyTreatment ?? "none",
  };
}

/**
 * Produce blueprint from creative summary via LLM. When summary.prose is present, uses prose only; otherwise uses JSON summary (backward compatibility).
 */
export async function creativeSummaryToBlueprint(summary: CreativeSummary): Promise<Blueprint> {
  const useProse = Boolean(summary.prose?.trim());
  const prompt = useProse
    ? ARCHITECT_PROMPT_PROSE + summary.prose!.trim() + "\n\nReturn ONLY the JSON object."
    : ARCHITECT_PROMPT_JSON + JSON.stringify(summary, null, 2) + "\n\nReturn ONLY the JSON object.";

  const out = await generateJson<ArchitectJson>({
    prompt,
    systemInstruction: "You are a master design architect. You turn vibes into hex codes and interaction logic. Outputs must feel high-end and polished. Assign themeName, primaryBackground, secondaryBackground, textColor. Define runtimeInstructions for the text, image, and music agents so they never break character. Include effects object with allowed values only; use 'none' when you want no effect. Output only valid JSON.",
    responseFormat: "json",
  });

  const runtimeInstructions = out.runtimeInstructions && typeof out.runtimeInstructions === "object"
    ? { text: out.runtimeInstructions.text, image: out.runtimeInstructions.image, music: out.runtimeInstructions.music }
    : {};

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
    runtimeInstructions: Object.keys(runtimeInstructions).length ? runtimeInstructions : undefined,
    effects: normalizeEffects(out.effects),
  };
}
