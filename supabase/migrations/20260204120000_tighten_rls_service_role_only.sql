-- Tighten RLS: API routes use service role only for users, sessions, builds, cards, user_subscriptions.
-- Client never accesses these tables with anon key; all access goes through Next.js API routes.

-- users: remove anon read (was "Allow read by user id (for app)" with using (true))
drop policy if exists "Allow read by user id (for app)" on public.users;
-- Keep "Allow anon insert for sign-up" only if sign-up is ever done from client with anon; plan uses API with service role.
drop policy if exists "Allow anon insert for sign-up" on public.users;

-- sessions: remove anon full access
drop policy if exists "Allow anon all on sessions" on public.sessions;

-- builds: remove anon full access
drop policy if exists "Allow anon all on builds" on public.builds;

-- user_subscriptions: remove anon access
drop policy if exists "Allow anon read user_subscriptions" on public.user_subscriptions;
drop policy if exists "Allow anon insert/update user_subscriptions" on public.user_subscriptions;

-- cards: remove anon read/insert/update (claim and export go through API with service role)
drop policy if exists "Allow public read access on cards" on public.cards;
drop policy if exists "Allow public insert access on cards" on public.cards;
drop policy if exists "Allow public update access on cards" on public.cards;
