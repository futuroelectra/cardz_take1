/**
 * Create or get session. Anonymous by deviceId; optional userId when signed in.
 * Per docs/MASTER_PROMPT_BACKEND.md §3 step 1.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { store } from "@/lib/store";
import type { CreateSessionResponse } from "@/lib/types";

export async function POST(): Promise<NextResponse<CreateSessionResponse | { error: string }>> {
  const h = await headers();
  const deviceId =
    h.get("x-device-id") ||
    `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const session = await store.createSession(deviceId);
  const body: CreateSessionResponse = {
    sessionId: session.id,
    deviceId: session.deviceId,
  };
  return NextResponse.json(body);
}
