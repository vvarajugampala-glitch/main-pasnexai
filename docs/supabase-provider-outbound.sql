-- Pasnex.ai provider outbound readiness
-- Run this before enabling real Instagram/WhatsApp/Facebook outbound API dispatch.

alter table public.conversations
  add column if not exists provider_thread_id text,
  add column if not exists provider_recipient_id text,
  add column if not exists provider_last_event_id text;

alter table public.messages
  add column if not exists provider_message_id text,
  add column if not exists delivery_status text not null default 'internal';

create table if not exists public.provider_outbound_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  channel_id uuid references public.channels(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  provider text not null,
  channel_type text not null,
  recipient_id text,
  endpoint text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'prepared',
  provider_response jsonb not null default '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.provider_outbound_messages enable row level security;

-- Provider outbound records should be written and processed through server API routes
-- with service-role privileges. Client users read conversation/message state through
-- the existing dashboard APIs.
