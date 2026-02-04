# Supabase CLI setup (step-by-step)

Use the command line only. No manual editing of Supabase dashboard for schema when using this flow.

## 1. Install Supabase CLI (if not already)

```bash
npm install supabase --save-dev
```

Or use npx (no install): `npx supabase <command>`.

## 2. Log in to Supabase

```bash
npx supabase login
```

This opens the browser; complete auth. Your access token is stored in your system credentials.

## 3. Create a project (if you don’t have one)

Create a project in the Supabase dashboard: https://supabase.com/dashboard  
Note the **Project ID** (in the URL: `https://supabase.com/dashboard/project/<project-id>`).

Or with CLI (if available in your plan):

```bash
npx supabase projects create "cardz_take1" --org-id <your-org-id>
```

Use the returned project ref as `$PROJECT_REF` below.

## 4. Link this repo to your Supabase project

From the repo root:

```bash
npx supabase link --project-ref $PROJECT_REF
```

When prompted, enter the database password you set for the project (or create one in project Settings → Database).

This writes `supabase/.temp/project-ref` and stores the link so later commands use the right project.

## 5. Run migrations (create tables in the cloud)

Push the migrations in `supabase/migrations/` to the linked project:

```bash
npx supabase db push
```

This applies all pending migrations: `experiences`, `cards`, then `users`, `sessions`, `builds`, `user_subscriptions` and their RLS policies.

## 6. Generate TypeScript types from the database

After the schema is applied, generate types so the app stays in sync with the DB:

**From linked remote project:**

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts
```

**From local Supabase (if you run DB locally):**

```bash
npx supabase start
npx supabase gen types typescript --local > src/lib/database.types.ts
```

Use the same `$PROJECT_REF` as in step 4. This overwrites `src/lib/database.types.ts` with `Database`, table `Row`/`Insert`/`Update` types. Import them in `src/lib/supabase.ts` and use `createClient<Database>(...)`.

## 7. Env vars for the app

In `.env.local` (or your env source):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Get the anon key from: Dashboard → Project Settings → API → Project API keys → `anon` public.

## Workflow: changing the schema (migrations from types / design)

Supabase does **not** generate migrations from TypeScript types. The flow is:

1. **Design** the schema (in code: update `src/lib/types.ts` or a schema doc; or decide in a ticket).
2. **Add a migration:**  
   `npx supabase migration new <descriptive_name>`  
   Edit the new file under `supabase/migrations/` with the SQL (create table, alter, RLS, etc.).
3. **Apply:**  
   `npx supabase db push`
4. **Regenerate types:**  
   `npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts`  
   Then fix any app code that used the old shape.

So: **types file is generated from the DB**, not the other way around. Keep migrations the source of truth for schema; regenerate types after each schema change.

## Optional: local Supabase (full local DB)

```bash
npx supabase start
```

Use the printed `DB URL` and `API URL` / `anon key` in `.env.local` for local development. Then:

```bash
npx supabase db reset   # applies migrations and seeds
npx supabase gen types typescript --local > src/lib/database.types.ts
```

## Checklist

- [ ] `npx supabase login`
- [ ] `npx supabase link --project-ref $PROJECT_REF`
- [ ] `npx supabase db push`
- [ ] `npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
