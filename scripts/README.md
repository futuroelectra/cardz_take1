# Scripts

## Database migration

1. Copy `env.example` to `.env.local` and set `DATABASE_URL` (Neon or Vercel Postgres).
2. Run the schema against your database:
   - **Neon:** Dashboard → SQL Editor → paste contents of `src/lib/db/schema.sql` → Run.
   - **Vercel Postgres:** Dashboard → Query → paste and run `src/lib/db/schema.sql`.
   - Or use `psql $DATABASE_URL -f src/lib/db/schema.sql` if you have `psql` installed.

The schema includes: `users` (with `creation_paid_at` for paywall), `cards`, `card_assets`, `creative_summaries`, `card_opens`, and `payments` (Lemon Squeezy idempotency).

After migration, `GET /api/health` will return `{ prompts: true, db: "ok" }` when DATABASE_URL is set.
