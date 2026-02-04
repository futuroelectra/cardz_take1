/**
 * Agent 4: Iterator (Dream Catcher). Editor chat; minor changes only; watcher required.
 * Per docs/MASTER_PROMPT_BACKEND.md §5.
 */

import type { BuildArtifact, Blueprint, ChatMessage } from "@/lib/types";
import { runWatcher } from "./watcher";
import { blueprintToCode } from "./engineer";

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
 * Generate Iterator AI reply. Suggest options; offer export when ready.
 */
export function getIteratorReply(userText: string): ChatMessage {
  const trimmed = userText.toLowerCase().trim();
  if (trimmed === "pop") {
    return {
      id: `ai-${Date.now()}`,
      text: "",
      sender: "ai",
      timestamp: new Date().toISOString(),
    };
  }
  if (trimmed.includes("export")) {
    return {
      id: `export-${Date.now()}`,
      text: "Your card is ready. Hit export when you want to share it.",
      sender: "ai",
      type: "export",
      timestamp: new Date().toISOString(),
    };
  }
  return {
    id: `ai-${Date.now()}`,
    text: "Got it. Want to tweak the heading, description, or colors? Or say 'export' when you're ready to share.",
    sender: "ai",
    timestamp: new Date().toISOString(),
  };
}
