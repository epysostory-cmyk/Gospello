-- Notification subscribers — users who opt in to event alerts
create table if not exists public.notification_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  state         text,               -- Nigerian state preference, nullable
  subscribed_at timestamptz not null default now(),
  is_active     boolean not null default true
);

-- Index for quick state-based queries when sending notifications
create index if not exists notification_subscribers_state_idx
  on public.notification_subscribers (state)
  where is_active = true;

-- RLS: only service role can read (admin use)
alter table public.notification_subscribers enable row level security;

-- No public read — admin client bypasses RLS anyway
create policy "service role only"
  on public.notification_subscribers
  for all
  using (false);
