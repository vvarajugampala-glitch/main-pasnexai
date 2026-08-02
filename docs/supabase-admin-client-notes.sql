create table if not exists public.admin_client_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  admin_email text not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_client_notes enable row level security;

create index if not exists admin_client_notes_business_id_created_at_idx
  on public.admin_client_notes (business_id, created_at desc);
