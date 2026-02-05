/**
 * Dev-only: apply a change request via Agent 4 (Iterator) → Agent 3; store new artifact for same preview link.
 * POST body: { userText: string }.
 */

import { NextResponse } from "next/server";
import { applyIteration } from "@/lib/agents/iterator";
import { getCurrent, setCurrent } from "@/lib/dev-pipeline-store";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function POST(req: Request): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const current = getCurrent();
  if (!current) {
    return NextResponse.json(
      { error: "No current build. Run the pipeline first." },
      { status: 400 }
    );
  }
  let body: { userText?: string };
  try {
    body = (await req.json()) as { userText?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userText = typeof body.userText === "string" ? body.userText.trim() : "";
  if (!userText) {
    return NextResponse.json({ error: "userText required" }, { status: 400 });
  }
  try {
    const newArtifact = await applyIteration(userText, current.artifact);
    setCurrent(newArtifact.blueprint, newArtifact);
    return NextResponse.json({ ok: true, blueprint: newArtifact.blueprint });
  } catch (err) {
    console.error("Dev pipeline iterate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Iteration failed" },
      { status: 500 }
    );
  }
}
