/**
 * Build flow: Architect (Agent 2) → Engineer (Agent 3). Runs after approve.
 * First build always uses a placeholder in the central frame; sender can add/replace image via the Iterator in the editor.
 */

import { store } from "@/lib/store";
import { creativeSummaryToBlueprint } from "@/lib/agents/architect";
import { blueprintToCode } from "@/lib/agents/engineer";
import type { BuildId, SessionId, UserId, CreativeSummary } from "@/lib/types";

export const PLACEHOLDER_AVATAR_URL = "/placeholder-avatar.svg";

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
 * Central image is always placeholder so the frame is obviously replaceable; sender can upload via Iterator in the editor.
 */
export async function runBuildPipeline(buildId: BuildId): Promise<void> {
  const build = await store.getBuild(buildId);
  if (!build || build.status !== "pending") return;

  const centralImageUrl = PLACEHOLDER_AVATAR_URL;
  // Avatar generation from Collector attach is disabled; sender can upload/manipulate image in the editor (Iterator) if desired.
  // if (session?.collectorAttachedImageUrl) {
  //   centralImageUrl = await generateAndStoreAvatar(session.collectorAttachedImageUrl, session.collectorMessages ?? []);
  // }

  const blueprint = await creativeSummaryToBlueprint(build.creativeSummary);
  const artifact = await blueprintToCode(blueprint, undefined, centralImageUrl);
  await store.updateBuild(buildId, {
    blueprint,
    artifact,
    status: "ready",
  });
}
