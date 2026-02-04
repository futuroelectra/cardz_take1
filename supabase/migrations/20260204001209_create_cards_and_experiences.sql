-- Toyboy-style: shareable experiences by id (code + optional json_schema)
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  code text not null,
  json_schema jsonb
);

-- App cards: exported shareable cards with claim/passphrase (matches Card type)
create table if not exists public.cards (
  id text primary key,
  build_id text not null,
  owner_id text not null,
  status text not null default 'exported',
  share_token text not null unique,
  passphrase text,
  activated_at bigint,
  claimed_by_user_id text,
  created_at bigint not null,
  exported_at bigint,
  code text not null default ''
);

-- RLS: experiences (anon read/insert for share flow)
alter table public.experiences enable row level security;
create policy "Allow public read access on experiences"
  on public.experiences for select to anon using (true);
create policy "Allow public insert access on experiences"
  on public.experiences for insert to anon with check (true);

-- RLS: cards (anon read by share_token for claim/view; insert/update via service or auth)
alter table public.cards enable row level security;
create policy "Allow public read access on cards"
  on public.cards for select to anon using (true);
create policy "Allow public insert access on cards"
  on public.cards for insert to anon with check (true);
create policy "Allow public update access on cards"
  on public.cards for update to anon using (true);
