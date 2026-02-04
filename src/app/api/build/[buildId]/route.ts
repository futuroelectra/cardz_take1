/**
 * Get build status and artifact. Poll from client until ready.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { BuildId } from "@/lib/types";

type RouteParams = { params: Promise<{ buildId: string }> };

export async function GET(
  _req: Request,
  { params }: RouteParams
): Promise<NextResponse<{ buildId: BuildId; status: string; artifact?: unknown } | { error: string }>> {
  const { buildId } = await params;
  const build = await store.getBuild(buildId as BuildId);
  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }
  return NextResponse.json({
    buildId: build.id,
    status: build.status,
    artifact: build.artifact,
  });
}
