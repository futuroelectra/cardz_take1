/**
 * Adjuster intent types (from LLM response). Used to apply changes via PATCH.
 */
export type AdjusterIntent =
  | { action: "update_prompts"; payload: { buttonIndex: number; systemInstruction?: string; userPromptTemplate?: string } }
  | { action: "update_copy"; payload: Record<string, unknown> }
  | { action: "set_activation"; payload: { activationTimestamp: string } }
  | { action: "deploy"; payload?: Record<string, unknown> };

function isAdjusterIntent(obj: unknown): obj is AdjusterIntent {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  const action = o.action;
  if (
    action !== "update_prompts" &&
    action !== "update_copy" &&
    action !== "set_activation" &&
    action !== "deploy"
  )
    return false;
  if (o.action === "set_activation") {
    return (
      typeof (o.payload as Record<string, unknown>)?.activationTimestamp === "string"
    );
  }
  return true;
}

/**
 * Parse Adjuster intent from assistant text. Expects a single JSON object.
 */
export function parseAdjusterIntent(text: string): AdjusterIntent | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    return isAdjusterIntent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
