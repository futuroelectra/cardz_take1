import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";

/**
 * POST /api/cards/[id]/open — record that the receiver opened the card (starts 48h window). Requires auth.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params;
  const cookieHeader = request.headers.get("cookie");
  const user = await getCurrentUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, first_opened_at, expires_at, is_interactive
    FROM cards
    WHERE id = ${cardId}
    LIMIT 1
  `;
  const card = rows[0];
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const firstOpenedAt = card.first_opened_at
    ? new Date(card.first_opened_at as string)
    : null;
  if (firstOpenedAt) {
    return NextResponse.json({
      already_opened: true,
      expires_at: card.expires_at,
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await sql`
    UPDATE cards
    SET first_opened_at = ${now},
        expires_at = ${expiresAt},
        is_interactive = true,
        updated_at = NOW()
    WHERE id = ${cardId}
  `;

  try {
    await sql`
      INSERT INTO card_opens (card_id, user_id)
      VALUES (${cardId}, ${user.id})
      ON CONFLICT (card_id, user_id) DO NOTHING
    `;
  } catch {
    // table might not exist yet
  }

  return NextResponse.json({
    first_opened_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
}
