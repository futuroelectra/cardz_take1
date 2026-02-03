import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getAdjusterPrompt } from "@/lib/prompts/load";
import { parseAdjusterIntent } from "@/lib/chat/adjusterIntent";
import { applyAdjusterIntent } from "@/lib/chat/applyAdjusterIntent";
import type { Blueprint } from "@/lib/architect/types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type Message = { role: "user" | "assistant"; content: string };

/**
 * POST /api/chat/adjuster
 * Body: { cardId: string, messages: Message[] }
 * Returns: { message: string, applied?: string }
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request.headers.get("cookie"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { cardId?: string; messages?: Message[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cardId = body.cardId;
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!cardId || typeof cardId !== "string") {
    return NextResponse.json(
      { error: "cardId is required" },
      { status: 400 }
    );
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, owner_id, blueprint, activation_timestamp_utc, is_interactive, deployed_at
    FROM cards
    WHERE id = ${cardId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.owner_id !== user.id) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const cardSnapshot = {
    id: row.id as string,
    blueprint: row.blueprint as Blueprint,
    activation_timestamp_utc: row.activation_timestamp_utc
      ? new Date(row.activation_timestamp_utc as Date).toISOString()
      : null,
    is_interactive: !!row.is_interactive,
    deployed_at: row.deployed_at
      ? new Date(row.deployed_at as Date).toISOString()
      : null,
  };

  const digest = JSON.stringify({
    mainHeader: cardSnapshot.blueprint?.mainHeader,
    welcomeHeader: cardSnapshot.blueprint?.welcomeHeader,
    welcomeMessage: cardSnapshot.blueprint?.welcomeMessage,
    activation_timestamp_utc: cardSnapshot.activation_timestamp_utc,
    buttons: (cardSnapshot.blueprint?.buttons ?? []).map((b: { label?: string; systemInstruction?: string; userPromptTemplate?: string }) => ({
      label: b.label,
      systemInstruction: (b.systemInstruction ?? "").slice(0, 100),
      userPromptTemplate: (b.userPromptTemplate ?? "").slice(0, 100),
    })),
  });

  if (!openai) {
    return NextResponse.json({
      message:
        "The Adjuster isn't configured right now. Set OPENAI_API_KEY to enable refinements.",
    });
  }

  const { system } = getAdjusterPrompt();
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    {
      role: "user",
      content: `Current card (digest):\n${digest}\n\nSender says: ${messages.length ? messages[messages.length - 1].content : "(no message)"}`,
    },
  ];

  if (messages.length > 1) {
    for (let i = 0; i < messages.length - 1; i++) {
      openaiMessages.push({
        role: messages[i].role as "user" | "assistant",
        content: messages[i].content,
      });
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: openaiMessages,
    max_tokens: 1024,
  });

  const assistantContent =
    completion.choices[0]?.message?.content?.trim() ?? "";

  const intent = parseAdjusterIntent(assistantContent);
  let applied: string | undefined;

  if (intent) {
    const patch = applyAdjusterIntent(cardSnapshot, intent);
    if (Object.keys(patch).length > 0) {
      const blueprint = patch.blueprint ?? cardSnapshot.blueprint;
      const activation_timestamp_utc =
        patch.activation_timestamp_utc !== undefined
          ? patch.activation_timestamp_utc
          : cardSnapshot.activation_timestamp_utc;
      const is_interactive =
        patch.is_interactive !== undefined
          ? patch.is_interactive
          : cardSnapshot.is_interactive;
      const deployed_at =
        patch.deployed_at !== undefined
          ? patch.deployed_at
          : cardSnapshot.deployed_at;

      await sql`
        UPDATE cards
        SET
          blueprint = ${JSON.stringify(blueprint)}::jsonb,
          activation_timestamp_utc = ${activation_timestamp_utc},
          is_interactive = ${is_interactive},
          deployed_at = ${deployed_at},
          updated_at = NOW()
        WHERE id = ${cardId}
      `;
      applied = intent.action;
    }
  }

  return NextResponse.json({
    message: assistantContent,
    applied,
  });
}
