/**
 * Dev-only: return the current blueprint and artifact for the preview page.
 */

import { NextResponse } from "next/server";
import { getCurrent } from "@/lib/dev-pipeline-store";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function GET(): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const current = getCurrent();
  if (!current) {
    return NextResponse.json({ blueprint: null, artifact: null });
  }
  return NextResponse.json({
    blueprint: current.blueprint,
    artifact: current.artifact,
  });
}
