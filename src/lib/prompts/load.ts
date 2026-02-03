/**
 * Prompt loader: returns agent prompts for use in API routes.
 * All prompts live in sibling files; change those files to iterate without touching agent code.
 */

import { COLLECTOR_SYSTEM_PROMPT } from "./collector";
import {
  ARCHITECT_SYSTEM_PROMPT,
  getArchitectUserPrompt as getArchitectUserPromptImpl,
} from "./architect";
import { ADJUSTER_SYSTEM_PROMPT } from "./adjuster";

export function getCollectorPrompt(): { system: string } {
  return { system: COLLECTOR_SYSTEM_PROMPT };
}

export function getArchitectPrompt(): { system: string } {
  return { system: ARCHITECT_SYSTEM_PROMPT };
}

export function getArchitectUserPrompt(creativeSummary: unknown): string {
  return getArchitectUserPromptImpl(creativeSummary);
}

export function getAdjusterPrompt(): { system: string } {
  return { system: ADJUSTER_SYSTEM_PROMPT };
}
