/**
 * Agent 4: Iterator (Dream Catcher). Editor chat; full LLM with identity engine tone.
 * Per docs/MASTER_PROMPT_BACKEND.md §5 and Master Prompt Architecture v3.
 */

import { generate, type LLMMessage } from "@/lib/llm";
import { getIdentityEngineSummary } from "@/lib/brand/identity";
import { getIteratorIntentionSummary, getProductInformationSummary } from "@/lib/brand/intentions";
import type { BuildArtifact, ChatMessage } from "@/lib/types";
import { runWatcher } from "./watcher";
import { blueprintToCode } from "./engineer";

/** Iterator-specific instruction (identity summary prepended at runtime via getIdentityEngineSummary). */
const ITERATOR_SYSTEM_BASE = `You are the Digital Confidant in the editor. Use effortless authority: don't just do the change, elevate it. Offer a vision; never ask for permission. When the user is satisfied, prompt them to materialize (say "export" when you're ready to materialize). Suggest concrete tweaks (heading, description, palette) in the brand voice. Use the product knowledge above as a Creative Palette: suggest specific improvements (e.g. Avatar to Object, Greeting to Poem) based on the sender's vibe; keep suggestions brief and litter them naturally.`;

/**
 * Build LLM messages from editor history and latest user text.
 */
function buildIteratorMessages(recentMessages: ChatMessage[], userText: string): LLMMessage[] {
  const llm: LLMMessage[] = recentMessages.slice(-10).map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  llm.push({ role: "user", parts: [{ text: userText }] });
  return llm;
}

/**
 * Apply user's iteration request to existing blueprint/code. Change only what they asked;
 * keep structure. Uses keyword-based blueprint tweaks then Engineer; Watcher may realign.
 */
export async function applyIteration(
  userText: string,
  currentArtifact: BuildArtifact
): Promise<BuildArtifact> {
  const bp = { ...currentArtifact.blueprint };
  const lower = userText.toLowerCase();
  if (lower.includes("heading") || lower.includes("title")) {
    bp.heading = userText.slice(0, 60) || bp.heading;
  } else if (lower.includes("description")) {
    bp.description = userText.slice(0, 120) || bp.description;
  } else if (lower.includes("color") || lower.includes("background")) {
    bp.primaryBackground = "#2D1B2E";
  } else {
    bp.description = (bp.description + " " + userText).slice(0, 120);
  }
  const newArtifact = await blueprintToCode(bp, currentArtifact.code);
  return runWatcher(currentArtifact, newArtifact);
}

/**
 * Generate Iterator AI reply via LLM (Gemini). Uses identity engine tone; suggests tweaks and materialize (export).
 */
export async function getIteratorReply(
  userText: string,
  recentMessages: ChatMessage[] = [],
  systemInstructionOverride?: string,
  cardContext?: { heading?: string; themeName?: string }
): Promise<ChatMessage> {
  const trimmed = userText.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "pop") {
    return {
      id: `ai-${Date.now()}`,
      text: "",
      sender: "ai",
      timestamp: new Date().toISOString(),
    };
  }

  if (lower.includes("export")) {
    return {
      id: `export-${Date.now()}`,
      text: "The dream is ready. Hit export when you want to materialize it.",
      sender: "ai",
      type: "export",
      timestamp: new Date().toISOString(),
    };
  }

  let baseSystem = ITERATOR_SYSTEM_BASE;
  if (cardContext?.heading || cardContext?.themeName) {
    baseSystem += `\n\nCurrent card: heading "${cardContext.heading ?? ""}", theme ${cardContext.themeName ?? ""}.`;
  }
  const [identitySummary, iteratorIntention, productInfo] = await Promise.all([
    getIdentityEngineSummary(),
    getIteratorIntentionSummary(),
    getProductInformationSummary(),
  ]);
  const systemInstruction =
    systemInstructionOverride ??
    `${identitySummary}\n\n${iteratorIntention}\n\n${productInfo}\n\n${baseSystem}`;

  const messages = buildIteratorMessages(recentMessages, trimmed);
  let responseText: string;
  try {
    responseText = await generate({
      messages,
      systemInstruction,
    });
  } catch (err) {
    console.error("Iterator LLM error:", err);
    return {
      id: `ai-${Date.now()}`,
      text: "I'm seeing that. Want to sharpen the heading, description, or palette? Or say 'export' when you're ready to materialize.",
      sender: "ai",
      timestamp: new Date().toISOString(),
    };
  }

  const suggestsExport =
    /export|materialize/i.test(responseText) || lower.includes("ready") || lower.includes("done");
  return {
    id: `ai-${Date.now()}`,
    text: responseText.trim() || "Say 'export' when you're ready to materialize.",
    sender: "ai",
    type: suggestsExport ? "export" : undefined,
    timestamp: new Date().toISOString(),
  };
}
