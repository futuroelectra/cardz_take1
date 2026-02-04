/**
 * Collector (Agent 1): send message, get AI reply, optionally confirmation.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 1, §5 Agent 1.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getCollectorReply, extractCreativeSummary } from "@/lib/agents";
import type { ChatSendBody, ChatSendResponse, ChatMessage } from "@/lib/types";

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

export async function POST(
  req: Request
): Promise<NextResponse<ChatSendResponse | { error: string }>> {
  let body: ChatSendBody;
  try {
    body = (await req.json()) as ChatSendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sessionId, text } = body;
  if (!sessionId || typeof text !== "string") {
    return NextResponse.json({ error: "sessionId and text required" }, { status: 400 });
  }

  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.phase !== "collector") {
    return NextResponse.json({ error: "Chat not in collector phase" }, { status: 400 });
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // Pop trigger: paywall
  if (trimmed.toLowerCase() === "pop") {
    return NextResponse.json({
      messages: [],
      popTrigger: true,
    });
  }

  const userMessage: ChatMessage = toChatMessage(`user-${Date.now()}`, trimmed, "user");
  const previousMessages: ChatMessage[] = session.collectorMessages ?? [];
  const count = (session.collectorUserMessageCount ?? 0) + 1;
  await store.updateSession(sessionId, { collectorUserMessageCount: count });

  let aiMsg: ChatMessage;
  let showConfirmation: boolean;
  try {
    const result = await getCollectorReply(previousMessages, trimmed);
    aiMsg = {
      ...result.aiMessage,
      id: result.aiMessage.id || `ai-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    showConfirmation = result.showConfirmation;
  } catch (err) {
    console.error("Collector LLM error:", err);
    return NextResponse.json(
      { error: "Failed to get reply. Please try again." },
      { status: 500 }
    );
  }

  const updatedCollectorMessages: ChatMessage[] = [...previousMessages, userMessage, aiMsg];
  await store.updateSession(sessionId, { collectorMessages: updatedCollectorMessages });

  if (showConfirmation) {
    try {
      const summary = await extractCreativeSummary(updatedCollectorMessages);
      await store.updateSession(sessionId, {
        creativeSummary: summary,
        phase: "collector",
      });
    } catch (err) {
      console.error("Translate to creative summary error:", err);
      const fallback: ChatMessage[] = [...updatedCollectorMessages];
      const userText = fallback.filter((m) => m.sender === "user").map((m) => m.text).join(" ");
      await store.updateSession(sessionId, {
        creativeSummary: {
          recipientName: "your loved one",
          senderName: "you",
          senderVibe: userText.slice(0, 200) || "personal and warm",
          centralSubject: "avatar",
          tone: "warm",
          productConfirmed: true,
          notes: userText.slice(0, 300),
        },
        phase: "collector",
      });
    }
  }

  const messages: ChatMessage[] = [userMessage, aiMsg];
  return NextResponse.json({ messages });
}
