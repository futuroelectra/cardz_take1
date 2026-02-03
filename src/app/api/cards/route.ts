import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { validateBlueprint } from "@/lib/architect/validateBlueprint";
import { generateSlugFromHeader, generateSlugFallback } from "@/lib/cards/slug";
import type { Blueprint } from "@/lib/architect/types";

/**
 * GET /api/cards — list cards for current user. Requires auth.
 */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const user = await getCurrentUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, owner_id, blueprint, subject_asset_id,
           activation_timestamp_utc, is_interactive, first_opened_at, expires_at, deployed_at, created_at, updated_at
    FROM cards
    WHERE owner_id = ${user.id}
    ORDER BY created_at DESC
  `;

  const cards = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    preview_url: `/c/${r.slug}`,
    blueprint: r.blueprint,
    is_interactive: r.is_interactive,
    deployed_at: r.deployed_at,
    created_at: r.created_at,
  }));

  return NextResponse.json({ cards });
}

/**
 * POST /api/cards — create a card. Requires auth. Body: { blueprint: Blueprint }.
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const user = await getCurrentUser(cookieHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const blueprint = (body as Record<string, unknown>).blueprint;
  const errors = validateBlueprint(blueprint);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Invalid blueprint", details: errors },
      { status: 400 }
    );
  }

  const b = blueprint as Blueprint;
  const slug =
    b.mainHeader?.trim().length > 0
      ? generateSlugFromHeader(b.mainHeader)
      : generateSlugFallback();

  const sql = getSql();
  const rows = await sql`
    INSERT INTO cards (slug, owner_id, blueprint)
    VALUES (${slug}, ${user.id}, ${JSON.stringify(blueprint)}::jsonb)
    RETURNING id, slug, owner_id, blueprint, created_at
  `;
  const row = rows[0];
  if (!row) {
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: row.id,
    slug: row.slug,
    preview_url: `/c/${row.slug}`,
  });
}
