/**
 * After approve (and optional signup): run Architect → Engineer, return buildId.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 3.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { runBuildPipeline } from "@/lib/build-flow";
import type { BuildStartBody, BuildStartResponse } from "@/lib/types";

export async function POST(
  req: Request
): Promise<NextResponse<BuildStartResponse | { error: string }>> {
  let body: BuildStartBody;
  try {
    body = (await req.json()) as BuildStartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sessionId, userId } = body;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const buildId = session.buildId;
  if (!buildId) {
    return NextResponse.json({ error: "No build; approve first" }, { status: 400 });
  }

  const build = await store.getBuild(buildId);
  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  if (userId) {
    await store.updateBuild(buildId, { userId });
  }

  await store.updateSession(sessionId, { phase: "building" });

  runBuildPipeline(buildId).catch(async (err) => {
    console.error("Build pipeline error:", err);
    await store.updateBuild(buildId, { status: "failed", error: String(err) });
  });

  const updated = await store.getBuild(buildId);
  return NextResponse.json({
    buildId,
    status: updated?.status ?? "pending",
  });
}
