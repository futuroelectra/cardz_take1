/**
 * Export: sign-up if needed, payment (Lemon Squeezy), then share link + passphrase.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 steps 5–6.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import type { ExportBody, ExportResponse } from "@/lib/types";

export async function POST(
  req: Request
): Promise<NextResponse<ExportResponse | { error: string }>> {
  let body: ExportBody;
  try {
    body = (await req.json()) as ExportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { buildId, sessionId, userId } = body;
  if (!buildId || !sessionId) {
    return NextResponse.json({ error: "buildId and sessionId required" }, { status: 400 });
  }

  const build = await store.getBuild(buildId);
  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }
  if (build.status !== "ready" || !build.artifact) {
    return NextResponse.json({ error: "Build not ready to export" }, { status: 400 });
  }

  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const effectiveUserId = userId ?? session.userId;
  if (!effectiveUserId) {
    return NextResponse.json({
      ok: false,
      requiresSignUp: true,
      error: "Sign up required before export",
    });
  }

  // Payment required before successful export via Lemon Squeezy only.
  // Placeholder: assume payment done client-side; we generate link.
  const shareToken = store.generateShareToken();
  const passphrase = `pass_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const code = build.artifact.code ?? "";
  const card = await store.createCard(buildId, effectiveUserId, shareToken, passphrase, code);
  await store.updateSession(sessionId, { phase: "exported" });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/c/${shareToken}`;

  return NextResponse.json({
    ok: true,
    cardId: card.id,
    shareUrl,
    passphrase,
  });
}
