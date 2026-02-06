/**
 * Dev-only: run Architect → Engineer for a build, then set the result as current for the preview.
 * POST body: { buildId: string, errorContext?: string[] }. errorContext is passed to Engineer so it avoids repeating past errors.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { runBuildPipeline } from "@/lib/build-flow";
import { setCurrent } from "@/lib/dev-pipeline-store";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function POST(req: Request): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  let body: { buildId?: string; errorContext?: string[] };
  try {
    body = (await req.json()) as { buildId?: string; errorContext?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const buildId = body.buildId;
  if (!buildId || typeof buildId !== "string") {
    return NextResponse.json({ error: "buildId required" }, { status: 400 });
  }

  const errorContext =
    Array.isArray(body.errorContext) && body.errorContext.length > 0
      ? body.errorContext.filter((e) => typeof e === "string")
      : undefined;

  const build = await store.getBuild(buildId);
  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }
  if (build.status !== "pending") {
    return NextResponse.json(
      { error: `Build not pending (status: ${build.status})` },
      { status: 400 }
    );
  }

  try {
    await runBuildPipeline(buildId, errorContext);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    console.error("Dev run-build pipeline error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updated = await store.getBuild(buildId);
  if (!updated?.blueprint || !updated?.artifact) {
    return NextResponse.json(
      { error: "Build missing blueprint or artifact after pipeline" },
      { status: 500 }
    );
  }

  setCurrent(updated.blueprint, updated.artifact);
  return NextResponse.json({
    ok: true,
    status: updated.status,
    buildId,
    blueprint: updated.blueprint,
  });
}
