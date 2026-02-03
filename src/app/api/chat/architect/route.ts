import { NextRequest, NextResponse } from "next/server";
import { runArchitect } from "@/lib/architect/runArchitect";

/**
 * POST /api/chat/architect
 * Body: { creativeSummary: CreativeSummary }
 * Returns: { blueprint: Blueprint } or { error: string }
 */
export async function POST(request: NextRequest) {
  let body: { creativeSummary?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const creativeSummary = body.creativeSummary;
  if (creativeSummary === undefined) {
    return NextResponse.json(
      { error: "creativeSummary is required" },
      { status: 400 }
    );
  }

  try {
    const blueprint = await runArchitect(creativeSummary);
    return NextResponse.json({ blueprint });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Architect failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
