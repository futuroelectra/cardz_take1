-- Users: sign-up (email, name, password). No email verification.
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  created_at bigint not null
);

-- Sessions: anonymous or linked to user; persist conversation and build state
create table if not exists public.sessions (
  id text primary key,
  device_id text not null,
  user_id text references public.users(id) on delete set null,
  created_at bigint not null,
  phase text not null default 'collector',
  collector_user_message_count int default 0,
  collector_messages jsonb,
  creative_summary jsonb,
  approved_at bigint,
  build_id text
);

-- Builds: one per approved draft; Architect → Engineer output
create table if not exists public.builds (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  user_id text references public.users(id) on delete set null,
  status text not null default 'pending',
  creative_summary jsonb not null,
  blueprint jsonb,
  artifact jsonb,
  token_cost_cents int not null default 0,
  created_at bigint not null,
  updated_at bigint not null,
  error text
);

-- Lemon Squeezy: gate export and library (payment / subscription state)
create table if not exists public.user_subscriptions (
  user_id text primary key references public.users(id) on delete cascade,
  lemon_squeezy_customer_id text,
  subscription_status text,
  updated_at bigint not null
);

-- RLS: users (service role or app backend only; anon can insert on sign-up)
alter table public.users enable row level security;
create policy "Allow anon insert for sign-up"
  on public.users for insert to anon with check (true);
create policy "Allow read by user id (for app)"
  on public.users for select to anon using (true);

-- RLS: sessions (anon can create/read/update for session flow)
alter table public.sessions enable row level security;
create policy "Allow anon all on sessions"
  on public.sessions for all to anon using (true) with check (true);

-- RLS: builds (anon can create/read/update for build flow)
alter table public.builds enable row level security;
create policy "Allow anon all on builds"
  on public.builds for all to anon using (true) with check (true);

-- RLS: user_subscriptions (read/update by app when user context known)
alter table public.user_subscriptions enable row level security;
create policy "Allow anon read user_subscriptions"
  on public.user_subscriptions for select to anon using (true);
create policy "Allow anon insert/update user_subscriptions"
  on public.user_subscriptions for all to anon with check (true);
