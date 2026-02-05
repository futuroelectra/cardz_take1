/**
 * Dev-only: run Architect (Agent 2) then Engineer (Agent 3), store result for preview link.
 * POST body: { creativeSummary: CreativeSummary | string }. If string, treated as prose-only summary.
 */

import { NextResponse } from "next/server";
import { creativeSummaryToBlueprint } from "@/lib/agents/architect";
import { blueprintToCode } from "@/lib/agents/engineer";
import { PLACEHOLDER_AVATAR_URL } from "@/lib/build-flow";
import { setCurrent } from "@/lib/dev-pipeline-store";
import type { CreativeSummary } from "@/lib/types";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function normalizeCreativeSummary(payload: unknown): CreativeSummary {
  if (typeof payload === "string" && payload.trim()) {
    return {
      prose: payload.trim(),
      recipientName: "Recipient",
      senderName: "Sender",
      senderVibe: "personal and warm",
      centralSubject: "avatar",
      tone: "warm",
      productConfirmed: true,
    };
  }
  if (payload && typeof payload === "object" && "recipientName" in payload) {
    const o = payload as Record<string, unknown>;
    return {
      prose: typeof o.prose === "string" ? o.prose : undefined,
      recipientName: typeof o.recipientName === "string" ? o.recipientName : "Recipient",
      senderName: typeof o.senderName === "string" ? o.senderName : "Sender",
      senderVibe: typeof o.senderVibe === "string" ? o.senderVibe : "personal and warm",
      centralSubject: typeof o.centralSubject === "string" ? o.centralSubject : "avatar",
      centralSubjectStyle: typeof o.centralSubjectStyle === "string" ? o.centralSubjectStyle : undefined,
      tone: typeof o.tone === "string" ? o.tone : "warm",
      productConfirmed: o.productConfirmed === false ? false : true,
      notes: typeof o.notes === "string" ? o.notes : undefined,
    };
  }
  throw new Error("creativeSummary must be a non-empty string or an object with recipientName");
}

export async function POST(req: Request): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  let body: { creativeSummary?: unknown };
  try {
    body = (await req.json()) as { creativeSummary?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.creativeSummary === undefined || body.creativeSummary === null) {
    return NextResponse.json({ error: "creativeSummary required" }, { status: 400 });
  }
  let creativeSummary: CreativeSummary;
  try {
    creativeSummary = normalizeCreativeSummary(body.creativeSummary);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid creativeSummary" },
      { status: 400 }
    );
  }
  try {
    const blueprint = await creativeSummaryToBlueprint(creativeSummary);
    const artifact = await blueprintToCode(blueprint, undefined, PLACEHOLDER_AVATAR_URL);
    setCurrent(blueprint, artifact);
    return NextResponse.json({ blueprint });
  } catch (err) {
    console.error("Dev pipeline error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
