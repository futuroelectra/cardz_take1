-- Sessions: store URL/key of image attached in Collector for avatar pipeline at build
alter table public.sessions
  add column if not exists collector_attached_image_url text;
