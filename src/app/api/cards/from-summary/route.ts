import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { runArchitect } from "@/lib/architect/runArchitect";
import { runEngineer } from "@/lib/engineer/runEngineer";

/**
 * POST /api/cards/from-summary — run Architect then Engineer. Requires auth.
 * Paywall: if user has not paid for creation (creation_paid_at), returns 402.
 * Body: { creativeSummary: CreativeSummary }
 * Returns: { id, slug, preview_url } or { error }
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const user = await getCurrentUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  const userRows = await sql`
    SELECT creation_paid_at FROM users WHERE id = ${user.id} LIMIT 1
  `;
  const creationPaidAt = userRows[0]?.creation_paid_at;
  if (!creationPaidAt) {
    return NextResponse.json(
      { error: "Payment required", requiresPayment: true, checkoutType: "creation" },
      { status: 402 }
    );
  }

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
    const { cardId, slug } = await runEngineer(blueprint, user.id);
    return NextResponse.json({
      id: cardId,
      slug,
      preview_url: `/c/${slug}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create card";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
