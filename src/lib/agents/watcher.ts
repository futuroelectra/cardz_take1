/**
 * Watcher / Mediator. Compares previous vs new code after Iterator change; triggers realignment if diff too big.
 * Per docs/MASTER_PROMPT_BACKEND.md §5 — REQUIRED.
 */

import { WATCHER_DIFF_THRESHOLD } from "@/lib/constants";
import type { BuildArtifact } from "@/lib/types";
import { realignCode } from "./engineer";

/**
 * Compute similarity ratio (0–1). 1 = identical, 0 = completely different.
 * Simple line-based diff ratio.
 */
export function codeDiffRatio(previousCode: string, newCode: string): number {
  if (!previousCode) return 1;
  const a = previousCode.split("\n").filter(Boolean);
  const b = newCode.split("\n").filter(Boolean);
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  const setB = new Set(b);
  let same = 0;
  for (const line of a) {
    if (setB.has(line)) same++;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 1 : same / union;
}

/**
 * Returns true if diff exceeds threshold (e.g. ~60% different when one param changed).
 */
export function shouldRealign(previousCode: string, newCode: string): boolean {
  const ratio = codeDiffRatio(previousCode, newCode);
  return ratio < 1 - WATCHER_DIFF_THRESHOLD;
}

/**
 * If realignment needed, produce aligned artifact (old + new + blueprint → Engineer).
 */
export async function runWatcher(
  previousArtifact: BuildArtifact | undefined,
  newArtifact: BuildArtifact
): Promise<BuildArtifact> {
  const prevCode = previousArtifact?.code;
  const newCode = newArtifact.code;
  if (!prevCode || !shouldRealign(prevCode, newCode)) return newArtifact;
  return realignCode(prevCode, newCode, newArtifact.blueprint);
}
