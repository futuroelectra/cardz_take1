import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import {
  runTextButton,
  runMusicButton,
  runImageButton,
} from "@/lib/actions";
import type { Blueprint, BlueprintButton } from "@/lib/architect/types";

/**
 * POST /api/cards/[id]/action — run a button (text, music, or image). Requires card to be interactive and not expired.
 * Body: { button_index: number (0-based), user_input: string }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;
  let body: { button_index?: number; user_input?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const buttonIndex =
    typeof body.button_index === "number" ? body.button_index : -1;
  const userInput =
    typeof body.user_input === "string" ? body.user_input : "";

  const sql = getSql();
  const rows = await sql`
    SELECT id, owner_id, blueprint, subject_asset_id, is_interactive, first_opened_at, expires_at
    FROM cards
    WHERE id = ${cardId}
    LIMIT 1
  `;
  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const blueprint = card.blueprint as Blueprint;
  const buttons = blueprint?.buttons;
  if (!Array.isArray(buttons) || buttonIndex < 0 || buttonIndex >= buttons.length) {
    return NextResponse.json(
      { error: "Invalid button_index" },
      { status: 400 }
    );
  }

  const isInteractive = !!card.is_interactive;
  const expiresAt = card.expires_at ? new Date(card.expires_at as string) : null;
  const now = new Date();
  if (!isInteractive) {
    return NextResponse.json(
      { error: "Card is not interactive" },
      { status: 403 }
    );
  }
  if (expiresAt && now >= expiresAt) {
    return NextResponse.json(
      { error: "Card has expired" },
      { status: 403 }
    );
  }

  const button = buttons[buttonIndex] as BlueprintButton;
  const { systemInstruction, userPromptTemplate, outputType } = button;

  let result: { type: string; content?: string; url?: string };
  try {
    if (outputType === "text") {
      const out = await runTextButton(
        systemInstruction,
        userPromptTemplate,
        userInput
      );
      result = out;
    } else if (outputType === "music") {
      const out = await runMusicButton(
        systemInstruction,
        userPromptTemplate,
        userInput
      );
      result = out;
    } else if (outputType === "image") {
      let subjectUrl: string | null = null;
      if (card.subject_asset_id) {
        const assetRows = await sql`
          SELECT url FROM card_assets WHERE id = ${card.subject_asset_id} LIMIT 1
        `;
        subjectUrl = assetRows[0]?.url ?? null;
      }
      const out = await runImageButton(
        systemInstruction,
        userPromptTemplate,
        userInput,
        subjectUrl
      );
      result = out;
    } else {
      return NextResponse.json(
        { error: "Unknown output type" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error("Button action error:", e);
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }

  return NextResponse.json(result);
}
