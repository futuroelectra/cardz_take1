import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Get the SQL client. Throws only when first called if DATABASE_URL is missing,
 * so next build succeeds without .env.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    _sql = neon(connectionString);
  }
  return _sql;
}

/** Type for a row from users table */
export type UserRow = {
  id: string;
  email: string;
  password_hash: string | null;
  creation_paid_at: Date | null;
  created_at: Date;
};

/** Type for a row from cards table */
export type CardRow = {
  id: string;
  slug: string;
  owner_id: string;
  blueprint: Record<string, unknown>;
  subject_asset_id: string | null;
  activation_timestamp_utc: Date | null;
  is_interactive: boolean;
  first_opened_at: Date | null;
  expires_at: Date | null;
  deployed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

/** Type for a row from card_assets table */
export type CardAssetRow = {
  id: string;
  url: string;
  storage_key: string | null;
  created_at: Date;
};

/** Type for a row from creative_summaries table */
export type CreativeSummaryRow = {
  id: string;
  user_id: string;
  content: Record<string, unknown>;
  created_at: Date;
};
