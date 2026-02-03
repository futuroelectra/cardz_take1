import { notFound } from "next/navigation";
import { getSql } from "@/lib/db";
import ReceiverCardView from "./ReceiverCardView";

type PageProps = { params: Promise<{ slug: string }> };

async function getCardBySlug(slug: string) {
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT c.id, c.slug, c.blueprint, c.subject_asset_id,
             c.activation_timestamp_utc, c.is_interactive, c.first_opened_at, c.expires_at, c.deployed_at,
             a.url AS subject_asset_url
      FROM cards c
      LEFT JOIN card_assets a ON a.id = c.subject_asset_id
      WHERE c.slug = ${slug}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    const now = new Date();
    const expiresAt = row.expires_at ? new Date(row.expires_at as string) : null;
    const expired = expiresAt !== null && now >= expiresAt;
    const is_interactive = expired ? false : !!row.is_interactive;
    return {
      id: row.id,
      slug: row.slug,
      blueprint: row.blueprint,
      subject_asset_id: row.subject_asset_id,
      subject_asset_url: row.subject_asset_url ?? null,
      activation_timestamp_utc: row.activation_timestamp_utc,
      is_interactive,
      first_opened_at: row.first_opened_at,
      expires_at: row.expires_at,
      deployed_at: row.deployed_at,
    };
  } catch {
    return null;
  }
}

export default async function ReceiverCardPage({ params }: PageProps) {
  const { slug } = await params;
  const config = await getCardBySlug(slug);
  if (!config) notFound();
  return <ReceiverCardView config={config} />;
}
