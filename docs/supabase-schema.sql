-- Pasnex.ai Supabase schema
-- Run this in Supabase SQL editor after creating the project.

create extension if not exists "pgcrypto";

create type public.business_status as enum ('pending_approval', 'approved', 'rejected', 'suspended');
create type public.user_role as enum ('owner', 'admin', 'agent', 'viewer');
create type public.channel_type as enum ('instagram', 'whatsapp', 'facebook', 'messenger', 'telegram');
create type public.connection_status as enum ('connected', 'ready_to_connect', 'expired', 'disabled');
create type public.automation_status as enum ('active', 'draft', 'paused');
create type public.lead_status as enum ('new', 'qualified', 'follow_up', 'converted', 'lost');
create type public.conversation_status as enum ('open', 'pending', 'closed');
create type public.invoice_status as enum ('paid', 'upcoming', 'failed', 'refunded');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  email text,
  phone text,
  country text default 'India',
  timezone text default 'Asia/Kolkata',
  status public.business_status not null default 'pending_approval',
  plan text not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'owner',
  status public.business_status not null default 'pending_approval',
  onboarding_completed boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type public.channel_type not null,
  display_name text not null,
  handle text,
  status public.connection_status not null default 'ready_to_connect',
  access_token_encrypted text,
  refresh_token_encrypted text,
  webhook_status text default 'pending',
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  name text not null,
  trigger_type text not null,
  status public.automation_status not null default 'draft',
  config_json jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  name text not null,
  phone text,
  email text,
  source public.channel_type,
  status public.lead_status not null default 'new',
  score integer not null default 0 check (score >= 0 and score <= 100),
  interest text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  provider_thread_id text,
  provider_recipient_id text,
  provider_last_event_id text,
  status public.conversation_status not null default 'open',
  assigned_to uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'agent', 'ai', 'system')),
  message_text text not null,
  ai_generated boolean not null default false,
  provider_message_id text,
  delivery_status text not null default 'internal',
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan text not null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status public.invoice_status not null default 'upcoming',
  billing_period text,
  invoice_url text,
  created_at timestamptz not null default now()
);

create table public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  event_type text not null default 'page_view',
  visitor_id text,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  subject text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  status text not null default 'open',
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  provider_account_id text,
  signature_verified boolean not null default false,
  processing_status text not null default 'received',
  processing_note text,
  processed_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  raw_body text,
  created_at timestamptz not null default now()
);

create table public.provider_outbound_messages (
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

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.channels enable row level security;
alter table public.automations enable row level security;
alter table public.leads enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.invoices enable row level security;
alter table public.visitor_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.provider_webhook_events enable row level security;
alter table public.provider_outbound_messages enable row level security;

create or replace function public.current_business_id()
returns uuid
language sql
stable
as $$
  select business_id from public.profiles where id = auth.uid()
$$;

create policy "profiles can view own business profiles"
on public.profiles for select
using (business_id = public.current_business_id() or id = auth.uid());

create policy "business members can view business"
on public.businesses for select
using (id = public.current_business_id());

create policy "business members can view channels"
on public.channels for select
using (business_id = public.current_business_id());

create policy "business members can view automations"
on public.automations for select
using (business_id = public.current_business_id());

create policy "business members can view leads"
on public.leads for select
using (business_id = public.current_business_id());

create policy "business members can view conversations"
on public.conversations for select
using (business_id = public.current_business_id());

create policy "business members can view messages"
on public.messages for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.business_id = public.current_business_id()
  )
);

create policy "business members can view invoices"
on public.invoices for select
using (business_id = public.current_business_id());

-- Visitor analytics are written and read through server API routes.
-- Support tickets are written and read through server API routes.
-- Admin audit logs are written and read through server API routes.
-- Provider webhook events are written and processed through server API routes.
-- Provider outbound messages are prepared/sent through server API routes.

-- Inserts and updates should be performed through server actions/API routes
-- with validation and service role privileges.
