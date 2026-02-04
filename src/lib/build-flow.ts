/**
 * Build flow: Architect (Agent 2) → Engineer (Agent 3). Runs after approve.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 3, §5.
 */

import { store } from "@/lib/store";
import { creativeSummaryToBlueprint } from "@/lib/agents/architect";
import { blueprintToCode } from "@/lib/agents/engineer";
import type { BuildId, SessionId, UserId, CreativeSummary } from "@/lib/types";

/**
 * Create build record (pending). Call from chat/approve.
 */
export async function createBuild(
  sessionId: SessionId,
  creativeSummary: CreativeSummary,
  userId?: UserId
): Promise<Awaited<ReturnType<typeof store.createBuild>>> {
  return store.createBuild(sessionId, creativeSummary, userId);
}

/**
 * Run Architect → Engineer and set build status ready. Call from build/start.
 */
export async function runBuildPipeline(buildId: BuildId): Promise<void> {
  const build = await store.getBuild(buildId);
  if (!build || build.status !== "pending") return;
  const blueprint = await creativeSummaryToBlueprint(build.creativeSummary);
  const artifact = await blueprintToCode(blueprint);
  await store.updateBuild(buildId, {
    blueprint,
    artifact,
    status: "ready",
  });
}
