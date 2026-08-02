create table if not exists public.admin_api_setups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null check (provider in ('instagram', 'whatsapp', 'facebook', 'messenger', 'telegram')),
  status text not null default 'pending' check (status in ('pending', 'docs_received', 'submitted', 'approved', 'live', 'blocked')),
  next_step text,
  updated_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, provider)
);

alter table public.admin_api_setups enable row level security;

create index if not exists admin_api_setups_business_id_idx
  on public.admin_api_setups (business_id);
