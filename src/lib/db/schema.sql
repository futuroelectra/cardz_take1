-- Cardzzz schema: users, cards, creative_summaries, card_assets
-- Run this against your Postgres (Neon / Vercel Postgres) to create tables.

-- Users (senders and receivers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  creation_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card assets (subject images, uploads)
CREATE TABLE IF NOT EXISTS card_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  storage_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creative summaries (Collector output, optional per card)
CREATE TABLE IF NOT EXISTS creative_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cards (full blueprint + runtime state)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blueprint JSONB NOT NULL,
  subject_asset_id UUID REFERENCES card_assets(id) ON DELETE SET NULL,
  activation_timestamp_utc TIMESTAMPTZ,
  is_interactive BOOLEAN NOT NULL DEFAULT FALSE,
  first_opened_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: track who opened (for "received" collection)
CREATE TABLE IF NOT EXISTS card_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(card_id, user_id)
);

-- Lemon Squeezy payments (idempotency + audit)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  lemon_order_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_owner ON cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);
CREATE INDEX IF NOT EXISTS idx_cards_deployed ON cards(deployed_at) WHERE deployed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_lemon_order ON payments(lemon_order_id);
