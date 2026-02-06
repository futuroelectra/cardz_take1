/**
 * Dev-only: run Architect (transcript → blueprint) then Engineer, set result for preview.
 * POST body: { transcript: string, errorContext?: string[] }.
 */

import { NextResponse } from "next/server";
import { transcriptToBlueprint } from "@/lib/agents/architect";
import { blueprintToCode } from "@/lib/agents/engineer";
import { PLACEHOLDER_AVATAR_URL } from "@/lib/build-flow";
import { setCurrent } from "@/lib/dev-pipeline-store";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export async function POST(req: Request): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  let body: { transcript?: string; errorContext?: string[] };
  try {
    body = (await req.json()) as { transcript?: string; errorContext?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }
  const errorContext =
    Array.isArray(body.errorContext) && body.errorContext.length > 0
      ? body.errorContext.filter((e) => typeof e === "string")
      : undefined;
  try {
    const blueprint = await transcriptToBlueprint(transcript);
    const artifact = await blueprintToCode(blueprint, undefined, PLACEHOLDER_AVATAR_URL, errorContext);
    setCurrent(blueprint, artifact);
    return NextResponse.json({ blueprint });
  } catch (err) {
    console.error("Dev from-transcript error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
