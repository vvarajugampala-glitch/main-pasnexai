-- Run once in Supabase SQL editor to store provider webhook payloads.

create table if not exists public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  provider_account_id text,
  signature_verified boolean not null default false,
  processed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  raw_body text,
  created_at timestamptz not null default now()
);

alter table public.provider_webhook_events enable row level security;

create index if not exists provider_webhook_events_provider_created_idx
on public.provider_webhook_events(provider, created_at desc);

create index if not exists provider_webhook_events_type_created_idx
on public.provider_webhook_events(event_type, created_at desc);
