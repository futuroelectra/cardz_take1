import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { validateBlueprint } from "@/lib/architect/validateBlueprint";
import type { Blueprint } from "@/lib/architect/types";

async function getCardAndCheckOwner(
  id: string,
  cookieHeader: string | null
): Promise<{ card: Record<string, unknown> | null; error?: NextResponse }> {
  const user = await getCurrentUser(cookieHeader);
  if (!user) {
    return { card: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, slug, owner_id, blueprint, subject_asset_id,
           activation_timestamp_utc, is_interactive, first_opened_at, expires_at, deployed_at, created_at, updated_at
    FROM cards
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return { card: null, error: NextResponse.json({ error: "Card not found" }, { status: 404 }) };
  }
  if (row.owner_id !== user.id) {
    return { card: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { card: row as Record<string, unknown> };
}

/**
 * GET /api/cards/[id] — get single card. Requires auth, owner only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { card, error } = await getCardAndCheckOwner(
    id,
    request.headers.get("cookie")
  );
  if (error) return error;
  return NextResponse.json({
    id: card!.id,
    slug: card!.slug,
    blueprint: card!.blueprint,
    subject_asset_id: card!.subject_asset_id,
    activation_timestamp_utc: card!.activation_timestamp_utc,
    is_interactive: card!.is_interactive,
    first_opened_at: card!.first_opened_at,
    expires_at: card!.expires_at,
    deployed_at: card!.deployed_at,
    created_at: card!.created_at,
    updated_at: card!.updated_at,
  });
}

/**
 * PATCH /api/cards/[id] — update card. Requires auth, owner only.
 * Body: partial { blueprint, activation_timestamp_utc, is_interactive, deployed_at }.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { card, error } = await getCardAndCheckOwner(
    id,
    request.headers.get("cookie")
  );
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.blueprint !== undefined) {
    const errors = validateBlueprint(body.blueprint);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid blueprint", details: errors },
        { status: 400 }
      );
    }
  }

  const sql = getSql();
  const blueprint =
    body.blueprint !== undefined
      ? (body.blueprint as Blueprint)
      : (card!.blueprint as Blueprint);
  const activation_timestamp_utc =
    body.activation_timestamp_utc !== undefined
      ? (body.activation_timestamp_utc === null
          ? null
          : new Date(body.activation_timestamp_utc as string))
      : (card!.activation_timestamp_utc as Date | null);
  const is_interactive =
    typeof body.is_interactive === "boolean"
      ? body.is_interactive
      : (card!.is_interactive as boolean);
  const deployed_at =
    body.deployed_at !== undefined
      ? body.deployed_at === null
        ? null
        : new Date(body.deployed_at as string)
      : (card!.deployed_at as Date | null);

  const rows = await sql`
    UPDATE cards
    SET blueprint = ${JSON.stringify(blueprint)}::jsonb,
        activation_timestamp_utc = ${activation_timestamp_utc},
        is_interactive = ${is_interactive},
        deployed_at = ${deployed_at},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, slug, blueprint, updated_at
  `;
  const updated = rows[0];
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(updated);
}
