import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

/**
 * GET /api/cards/by-slug/[slug] — get card by slug. Public (for receiver page).
 * Returns card config: blueprint, is_interactive, activation_timestamp_utc, first_opened_at, expires_at.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, blueprint, subject_asset_id,
           activation_timestamp_utc, is_interactive, first_opened_at, expires_at, deployed_at
    FROM cards
    WHERE slug = ${slug}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = row.expires_at ? new Date(row.expires_at as string) : null;
  const expired = expiresAt !== null && now >= expiresAt;
  const is_interactive = expired ? false : !!row.is_interactive;

  let subject_asset_url: string | null = null;
  if (row.subject_asset_id) {
    const assetRows = await sql`
      SELECT url FROM card_assets WHERE id = ${row.subject_asset_id} LIMIT 1
    `;
    subject_asset_url = assetRows[0]?.url ?? null;
  }

  return NextResponse.json({
    id: row.id,
    slug: row.slug,
    blueprint: row.blueprint,
    subject_asset_id: row.subject_asset_id,
    subject_asset_url,
    activation_timestamp_utc: row.activation_timestamp_utc,
    is_interactive,
    first_opened_at: row.first_opened_at,
    expires_at: row.expires_at,
    deployed_at: row.deployed_at,
  });
}
