/**
 * Create account; link session to user. Per docs/MASTER_PROMPT_BACKEND.md §3 step 3.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { hashPassword } from "@/lib/auth";
import type { SignUpBody, SignUpResponse } from "@/lib/types";

export async function POST(
  req: Request
): Promise<NextResponse<SignUpResponse | { error: string }>> {
  let body: SignUpBody;
  try {
    body = (await req.json()) as SignUpBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sessionId, name, email, password } = body;
  if (!sessionId || !name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "sessionId, name, email, password required" }, { status: 400 });
  }

  const session = await store.getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (await store.getUserByEmail(email)) {
    return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await store.createUser(email.trim(), name.trim(), passwordHash);
  await store.updateSession(sessionId, { userId: user.id });
  if (session.buildId) {
    await store.updateBuild(session.buildId, { userId: user.id });
  }

  return NextResponse.json({ ok: true, userId: user.id });
}
