/**
 * Dev-only: clear the in-memory pipeline state (current blueprint/artifact).
 * Call before or with a client-side localStorage flush for a full clean slate.
 */

import { NextResponse } from "next/server";
import { clearCurrent } from "@/lib/dev-pipeline-store";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function POST(): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  clearCurrent();
  return NextResponse.json({ ok: true });
}
