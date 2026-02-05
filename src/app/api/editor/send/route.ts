/**
 * Iterator (Agent 4): editor chat; apply iteration with watcher. Token cap enforced.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 4, §5.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { applyIteration, getIteratorReply } from "@/lib/agents";
import { TOKEN_CAP_CENTS_NEW_USER, TOKEN_CAP_CENTS_SUPER_USER } from "@/lib/constants";
import type {
  EditorSendBody,
  EditorSendResponse,
  ChatMessage,
  BuildArtifact,
} from "@/lib/types";

function toChatMessage(
  id: string,
  text: string,
  sender: "user" | "ai",
  type?: "confirmation" | "export"
): ChatMessage {
  return {
    id,
    text,
    sender,
    type,
    timestamp: new Date().toISOString(),
  };
}

/** Approximate cents per editor message (placeholder). */
const CENTS_PER_MESSAGE = 2;

export async function POST(
  req: Request
): Promise<NextResponse<EditorSendResponse | { error: string }>> {
  let body: EditorSendBody;
  try {
    body = (await req.json()) as EditorSendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { buildId, sessionId, text, recentMessages } = body;
  if (!buildId || !sessionId || typeof text !== "string") {
    return NextResponse.json({ error: "buildId, sessionId, text required" }, { status: 400 });
  }

  const build = await store.getBuild(buildId);
  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }
  if (!build.artifact) {
    return NextResponse.json({ error: "Build not ready" }, { status: 400 });
  }

  const session = await store.getSession(sessionId);
  const capCents = session?.userId ? TOKEN_CAP_CENTS_SUPER_USER : TOKEN_CAP_CENTS_NEW_USER;
  const limitReached = build.tokenCostCents >= capCents;

  if (limitReached) {
    return NextResponse.json({
      messages: [],
      limitReached: true,
      build: { artifact: build.artifact, status: build.status },
    });
  }

  if (text.trim().toLowerCase() === "pop") {
    return NextResponse.json({
      messages: [],
      popTrigger: true,
      build: { artifact: build.artifact, status: build.status },
    });
  }

  const userMessage: ChatMessage = toChatMessage(`user-${Date.now()}`, text.trim(), "user");
  let newArtifact: BuildArtifact;
  try {
    newArtifact = await applyIteration(text.trim(), build.artifact);
  } catch (err) {
    console.error("Iterator/Engineer error:", err);
    return NextResponse.json(
      { error: "Failed to apply changes. Please try again." },
      { status: 500 }
    );
  }
  const addedCost = CENTS_PER_MESSAGE;
  await store.updateBuild(buildId, {
    artifact: newArtifact,
    tokenCostCents: build.tokenCostCents + addedCost,
  });

  const cardContext = build.artifact?.blueprint
    ? { heading: build.artifact.blueprint.heading, themeName: build.artifact.blueprint.themeName }
    : undefined;
  const aiMessage = await getIteratorReply(
    text.trim(),
    recentMessages ?? [],
    undefined,
    cardContext
  );
  const aiMsg: ChatMessage = {
    ...aiMessage,
    id: aiMessage.id || `ai-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const updated = await store.getBuild(buildId);
  const response: EditorSendResponse = {
    messages: [userMessage, aiMsg],
    build: updated
      ? { artifact: updated.artifact, status: updated.status }
      : { artifact: newArtifact, status: build.status },
    limitReached: (build.tokenCostCents + addedCost) >= capCents,
  };
  return NextResponse.json(response);
}
