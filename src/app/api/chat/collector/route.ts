import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCollectorPrompt } from "@/lib/prompts/load";
import { parseCreativeSummaryFromText } from "@/lib/chat/creativeSummary";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type Message = { role: "user" | "assistant"; content: string };

/**
 * POST /api/chat/collector
 * Body: { messages: { role: "user" | "assistant", content: string }[] }
 * Returns: { message: string, creativeSummary?: CreativeSummary }
 * Conversation state is client-held (messages array); when the model outputs
 * a Creative Summary JSON, we parse it and return it in the response.
 */
export async function POST(request: NextRequest) {
  let body: { messages?: Message[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (!openai) {
    return NextResponse.json(
      {
        message:
          "I'd love to help you design your dream-card, but the creative assistant isn't configured right now. Please set OPENAI_API_KEY to enable the Collector.",
        creativeSummary: undefined,
      },
      { status: 200 }
    );
  }

  const { system } = getCollectorPrompt();
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: openaiMessages,
    max_tokens: 1024,
  });

  const assistantContent =
    completion.choices[0]?.message?.content?.trim() ?? "";

  const creativeSummary = parseCreativeSummaryFromText(assistantContent);

  return NextResponse.json({
    message: assistantContent,
    creativeSummary: creativeSummary ?? undefined,
  });
}
