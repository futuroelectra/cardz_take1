/**
 * Persist approval; associate draft with session; optionally suggest sign-in.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 2.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { ChatApproveBody, ChatApproveResponse, BuildAgent2Input } from "@/lib/types";

/** Format collector messages as the raw transcript (input to extractCreativeSummary → JSON). */
function collectorTranscript(messages: { sender: string; text: string }[]): string {
  return messages
    .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n\n");
}

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

  const messages = session.collectorMessages ?? [];
  const transcript = messages.length > 0
    ? collectorTranscript(messages)
    : (session.creativeSummary as { prose?: string }).prose ?? "";
  const agent2Input: BuildAgent2Input =
    transcript.length > 0 ? { transcript } : session.creativeSummary as BuildAgent2Input;

  const build = await store.createBuild(sessionId, agent2Input, session.userId);
  await store.updateSession(sessionId, {
    phase: "approved",
    approvedAt: Date.now(),
    buildId: build.id,
  });

  const response: ChatApproveResponse & {
    creativeSummary?: typeof session.creativeSummary;
    collectorTranscript?: string;
  } = {
    ok: true,
    signInSuggested: !session.userId,
    buildId: build.id,
  };
  if (process.env.NODE_ENV === "development") {
    response.creativeSummary = session.creativeSummary;
    const messages = session.collectorMessages ?? [];
    if (messages.length > 0) {
      response.collectorTranscript = collectorTranscript(messages);
    }
  }
  return NextResponse.json(response);
}
