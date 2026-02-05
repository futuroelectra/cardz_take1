/**
 * Card runtime action: run Voice, Alchemist, or Maestro for a button. For testing agent outputs.
 * Body: { token, buttonType: "text" | "music" | "image", receiverInput }.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { runVoice, runAlchemist, runMaestro } from "@/lib/agents";
import type { Blueprint } from "@/lib/types";

export type CardActionBody = {
  token: string;
  buttonType: "text" | "music" | "image";
  receiverInput: string;
};

export type CardActionResponse = {
  success: boolean;
  output?: string;
  error?: string;
};

export async function POST(
  req: Request
): Promise<NextResponse<CardActionResponse | { error: string }>> {
  let body: CardActionBody;
  try {
    body = (await req.json()) as CardActionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { token, buttonType, receiverInput } = body;
  if (!token || !buttonType || typeof receiverInput !== "string") {
    return NextResponse.json(
      { error: "token, buttonType, and receiverInput required" },
      { status: 400 }
    );
  }
  if (!["text", "music", "image"].includes(buttonType)) {
    return NextResponse.json(
      { error: "buttonType must be text, music, or image" },
      { status: 400 }
    );
  }

  const card = await store.getCardByToken(token);
  if (!card) {
    return NextResponse.json({ success: false, error: "Card not found" }, { status: 404 });
  }

  const build = await store.getBuild(card.buildId);
  const blueprint: Blueprint | undefined = build?.blueprint ?? build?.artifact?.blueprint;
  if (!blueprint) {
    return NextResponse.json(
      { success: false, error: "Blueprint not found for this card" },
      { status: 400 }
    );
  }

  try {
    let output: string;
    if (buttonType === "text") {
      output = await runVoice(blueprint, receiverInput);
    } else if (buttonType === "image") {
      output = await runAlchemist(blueprint, receiverInput);
    } else {
      output = await runMaestro(blueprint, receiverInput);
    }
    return NextResponse.json({ success: true, output });
  } catch (err) {
    console.error("Card action error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Agent failed",
      },
      { status: 500 }
    );
  }
}
