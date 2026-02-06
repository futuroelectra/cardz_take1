/**
 * Build flow: Architect (Agent 2) → Engineer (Agent 3). Runs after approve.
 * First build always uses a placeholder in the central frame; sender can add/replace image via the Iterator in the editor.
 */

import { store } from "@/lib/store";
import { creativeSummaryToBlueprint, transcriptToBlueprint } from "@/lib/agents/architect";
import { blueprintToCode } from "@/lib/agents/engineer";
import type { BuildId, SessionId, UserId, BuildAgent2Input, CreativeSummary } from "@/lib/types";

export const PLACEHOLDER_AVATAR_URL = "/placeholder-avatar.svg";

/**
 * Create build record (pending). Call from chat/approve.
 * Pass { transcript: string } for production (Agent 2 gets raw transcript); pass CreativeSummary for dev pipeline.
 */
export async function createBuild(
  sessionId: SessionId,
  agent2Input: BuildAgent2Input,
  userId?: UserId
): Promise<Awaited<ReturnType<typeof store.createBuild>>> {
  return store.createBuild(sessionId, agent2Input, userId);
}

/**
 * Run Architect → Engineer and set build status ready. Call from build/start.
 * Central image is always placeholder so the frame is obviously replaceable; sender can upload via Iterator in the editor.
 * errorContext: errors from this session so Engineer can avoid repeating them (dev pipeline).
 */
export async function runBuildPipeline(
  buildId: BuildId,
  errorContext?: string[]
): Promise<void> {
  const build = await store.getBuild(buildId);
  if (!build || build.status !== "pending") return;

  const centralImageUrl = PLACEHOLDER_AVATAR_URL;

  const isTranscript =
    build.creativeSummary &&
    typeof build.creativeSummary === "object" &&
    "transcript" in build.creativeSummary &&
    typeof (build.creativeSummary as { transcript: string }).transcript === "string";

  const blueprint = isTranscript
    ? await transcriptToBlueprint((build.creativeSummary as { transcript: string }).transcript)
    : await creativeSummaryToBlueprint(build.creativeSummary as CreativeSummary);
  const artifact = await blueprintToCode(
    blueprint,
    undefined,
    centralImageUrl,
    errorContext
  );
  await store.updateBuild(buildId, {
    blueprint,
    artifact,
    status: "ready",
  });
}
