/**
 * Persist approval; associate draft with session; optionally suggest sign-in.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 2.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { ChatApproveBody, ChatApproveResponse } from "@/lib/types";

export async function POST(
  req: Request
): Promise<NextResponse<ChatApproveResponse | { error: string }>> {
  let body: ChatApproveBody;
  try {
    body = (await req.json()) as ChatApproveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.creativeSummary) {
    return NextResponse.json({ error: "No creative summary; complete collector first" }, { status: 400 });
  }

  const build = await store.createBuild(
    sessionId,
    session.creativeSummary,
    session.userId
  );
  await store.updateSession(sessionId, {
    phase: "approved",
    approvedAt: Date.now(),
    buildId: build.id,
  });

  const response: ChatApproveResponse = {
    ok: true,
    signInSuggested: !session.userId,
    buildId: build.id,
  };
  return NextResponse.json(response);
}
