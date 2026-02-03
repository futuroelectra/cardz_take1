import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSql } from "@/lib/db";

const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/lemonsqueezy — Lemon Squeezy webhook.
 * On order_created: if custom_data.type is "creation", set user creation_paid_at;
 * if "reactivate", set card first_opened_at, expires_at, is_interactive.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-signature");
  const rawBody = await request.text();
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, string> };
    data?: { id?: string; attributes?: { identifier?: string } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    return NextResponse.json({ ok: true });
  }

  const customData = payload.meta?.custom_data ?? {};
  const orderId = payload.data?.attributes?.identifier ?? payload.data?.id;
  if (!orderId) {
    return NextResponse.json({ error: "No order id" }, { status: 400 });
  }

  const sql = getSql();

  const existing = await sql`
    SELECT id FROM payments WHERE lemon_order_id = ${String(orderId)} LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const type = customData.type;

  if (type === "creation") {
    const userId = customData.user_id;
    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }
    await sql`
      INSERT INTO payments (user_id, lemon_order_id, type)
      VALUES (${userId}, ${String(orderId)}, 'creation')
      ON CONFLICT (lemon_order_id) DO NOTHING
    `;
    await sql`
      UPDATE users SET creation_paid_at = NOW() WHERE id = ${userId}
    `;
  } else if (type === "reactivate") {
    const cardId = customData.card_id;
    if (!cardId) {
      return NextResponse.json({ error: "Missing card_id" }, { status: 400 });
    }
    const cardRows = await sql`
      SELECT id, owner_id FROM cards WHERE id = ${cardId} LIMIT 1
    `;
    if (cardRows.length === 0) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    const ownerId = cardRows[0].owner_id;
    await sql`
      INSERT INTO payments (user_id, card_id, lemon_order_id, type)
      VALUES (${ownerId}, ${cardId}, ${String(orderId)}, 'reactivate')
      ON CONFLICT (lemon_order_id) DO NOTHING
    `;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await sql`
      UPDATE cards
      SET first_opened_at = ${now}, expires_at = ${expiresAt}, is_interactive = true, updated_at = NOW()
      WHERE id = ${cardId}
    `;
  }

  return NextResponse.json({ ok: true });
}
