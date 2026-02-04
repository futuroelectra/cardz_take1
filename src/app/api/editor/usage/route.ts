/**
 * Token usage and limit for editor. Per docs/MASTER_PROMPT_BACKEND.md §3 step 4.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { TOKEN_CAP_CENTS_NEW_USER, TOKEN_CAP_CENTS_SUPER_USER } from "@/lib/constants";
import type { EditorUsageResponse } from "@/lib/types";

type Query = { buildId?: string; sessionId?: string };

export async function GET(req: Request): Promise<NextResponse<EditorUsageResponse | { error: string }>> {
  const { searchParams } = new URL(req.url);
  const buildId = searchParams.get("buildId") ?? undefined;
  const sessionId = searchParams.get("sessionId") ?? undefined;
  if (!buildId) {
    return NextResponse.json({ error: "buildId required" }, { status: 400 });
  }

  const build = await store.getBuild(buildId);
  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  const session = sessionId ? await store.getSession(sessionId) : undefined;
  const capCents = session?.userId ? TOKEN_CAP_CENTS_SUPER_USER : TOKEN_CAP_CENTS_NEW_USER;
  const limitReached = build.tokenCostCents >= capCents;

  const body: EditorUsageResponse = {
    tokenCostCents: build.tokenCostCents,
    limitReached,
    capCents,
  };
  return NextResponse.json(body);
}
