-- Fresh QA cleanup for Pasnex.ai
-- Purpose: remove dummy client/test data while keeping the platform admin account.
-- Run this in Supabase SQL Editor before a full fresh registration/login/onboarding test.

begin;

do $$
declare
  admin_email constant text := 'pasnexai@gmail.com';
  admin_business_ids uuid[];
begin
  select coalesce(array_agg(distinct business_id) filter (where business_id is not null), '{}')
    into admin_business_ids
  from public.profiles
  where lower(email) = lower(admin_email);

  -- Admin-side operational/test history.
  delete from public.admin_audit_logs;

  -- Child records for non-admin businesses.
  delete from public.admin_client_notes
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.admin_api_setups
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.support_tickets
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.messages
  where conversation_id in (
    select id from public.conversations
    where business_id is null or not (business_id = any(admin_business_ids))
  );

  delete from public.conversations
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.leads
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.automations
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.channels
  where business_id is null or not (business_id = any(admin_business_ids));

  delete from public.invoices
  where business_id is null or not (business_id = any(admin_business_ids));

  -- Remove non-admin public profiles first, then their auth users.
  delete from public.profiles
  where lower(coalesce(email, '')) <> lower(admin_email);

  delete from auth.users
  where lower(coalesce(email, '')) <> lower(admin_email);

  -- Remove client businesses not attached to the admin account.
  delete from public.businesses
  where id is null or not (id = any(admin_business_ids));

  -- Optional: clear public visitor analytics for a clean launch QA count.
  delete from public.visitor_events;
end $$;

commit;

-- Quick check after running:
-- select email, role, onboarding_completed from public.profiles;
-- select count(*) as businesses from public.businesses;
-- select count(*) as auth_users from auth.users;
