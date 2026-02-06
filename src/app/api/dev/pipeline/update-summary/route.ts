/**
 * Dev-only: merge a natural-language request into a creative summary via LLM.
 * POST body: { creativeSummary: CreativeSummary, request: string }.
 * Returns { creativeSummary: CreativeSummary }.
 */

import { NextResponse } from "next/server";
import { generateJson } from "@/lib/llm";
import type { CreativeSummary } from "@/lib/types";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

const SYSTEM = `You are editing a creative summary for a card builder. You will receive the current summary (JSON) and a short user request. Output the updated creative summary as a single JSON object that incorporates the request. Preserve all fields; only change what the request asks for. Use the same keys: prose, recipientName, senderName, senderVibe, centralSubject, centralSubjectStyle, tone, productConfirmed, notes. Return ONLY the JSON object, no markdown or explanation.`;

export async function POST(req: Request): Promise<NextResponse<unknown>> {
  if (!isDev()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  let body: { creativeSummary?: unknown; request?: string };
  try {
    body = (await req.json()) as { creativeSummary?: unknown; request?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const request = typeof body.request === "string" ? body.request.trim() : "";
  if (!request) {
    return NextResponse.json({ error: "request required" }, { status: 400 });
  }
  if (!body.creativeSummary || typeof body.creativeSummary !== "object") {
    return NextResponse.json({ error: "creativeSummary required (object)" }, { status: 400 });
  }
  const current = body.creativeSummary as Record<string, unknown>;
  const prompt = `Current creative summary:\n${JSON.stringify(current, null, 2)}\n\nUser request: ${request}\n\nOutput the updated creative summary as JSON only.`;
  try {
    const updated = await generateJson<CreativeSummary>({
      systemInstruction: SYSTEM,
      prompt,
    });
    return NextResponse.json({ creativeSummary: updated });
  } catch (err) {
    console.error("Dev update-summary error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
