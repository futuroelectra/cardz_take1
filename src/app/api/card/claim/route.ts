/**
 * Receiver claim: passphrase or sign-up. Activate card for 48h. Private route.
 * Per docs/MASTER_PROMPT_BACKEND.md §4.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { hashPassword } from "@/lib/auth";
import { CARD_ACTIVE_MS } from "@/lib/constants";
import type { CardClaimBody, CardClaimResponse } from "@/lib/types";

export async function POST(
  req: Request
): Promise<NextResponse<CardClaimResponse | { error: string }>> {
  let body: CardClaimBody;
  try {
    body = (await req.json()) as CardClaimBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { token, passphrase, userId, email, password } = body;
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const card = await store.getCardByToken(token);
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  let claimantId: string | undefined = userId;

  if (!claimantId && (email || password)) {
    if (!email?.trim() || !password) {
      return NextResponse.json({
        ok: false,
        requiresSignUp: true,
        error: "Sign up to claim: email and password required",
      });
    }
    let user = await store.getUserByEmail(email);
    if (!user) {
      const passwordHash = await hashPassword(password);
      user = await store.createUser(email, email.split("@")[0], passwordHash);
    }
    claimantId = user.id;
  }

  if (card.passphrase && !passphrase) {
    return NextResponse.json({
      ok: false,
      error: "Passphrase required to unlock this experience",
    });
  }
  if (card.passphrase && passphrase !== card.passphrase) {
    return NextResponse.json({ ok: false, error: "Invalid passphrase" }, { status: 401 });
  }

  const activatedAt = Date.now();
  await store.updateCard(card.id, {
    status: "active",
    activatedAt,
    claimedByUserId: claimantId,
  });

  return NextResponse.json({
    ok: true,
    cardId: card.id,
    activatedAt,
    code: card.code || undefined,
  });
}
