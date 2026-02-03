/**
 * Creative Summary shape (Collector output). Used to detect and parse from LLM response.
 */
export type CreativeSummary = {
  occasion: string;
  receiverPersonality: string;
  emotionalVibe: string;
  subjectIdea: string;
  subjectType: "avatar" | "inanimate";
  subjectSource: "upload" | "text" | null;
  interactionIdeas: string[];
  welcomeMessage: string;
};

const REQUIRED_KEYS: (keyof CreativeSummary)[] = [
  "occasion",
  "receiverPersonality",
  "emotionalVibe",
  "subjectIdea",
  "subjectType",
  "subjectSource",
  "interactionIdeas",
  "welcomeMessage",
];

function isCreativeSummary(obj: unknown): obj is CreativeSummary {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  for (const k of REQUIRED_KEYS) {
    if (!(k in o)) return false;
  }
  if (
    o.subjectType !== "avatar" && o.subjectType !== "inanimate"
  )
    return false;
  if (
    o.subjectSource !== null &&
    o.subjectSource !== "upload" &&
    o.subjectSource !== "text"
  )
    return false;
  if (!Array.isArray(o.interactionIdeas)) return false;
  return true;
}

/**
 * Extract a Creative Summary JSON from assistant text (e.g. trailing JSON block).
 * Returns null if none found or invalid.
 */
export function parseCreativeSummaryFromText(text: string): CreativeSummary | null {
  const trimmed = text.trim();
  // Try to find a JSON object (possibly inside markdown code block)
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = codeBlock ? codeBlock[1].trim() : trimmed;
  const jsonMatch = toParse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    return isCreativeSummary(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
