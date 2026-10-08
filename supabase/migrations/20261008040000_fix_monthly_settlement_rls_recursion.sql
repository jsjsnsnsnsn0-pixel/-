-- Applied on production Supabase (TotiChat) 2026-10-08.
-- Fix 42P17: mutual RLS recursion between monthly_settlements and
-- monthly_settlement_agencies. Authorization remains based on settlement
-- beneficiary, assigned agency owner, or application Owner.
create or replace function private.dashboard_settlement_visible(p_settlement_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.monthly_settlements s where s.id=p_settlement_id
       and s.user_id=auth.uid()
    )
    or exists (
      select 1 from public.monthly_settlement_agencies a
      where a.settlement_id=p_settlement_id and a.agency_owner_id=auth.uid()
    )
    or exists (
      select 1 from public.admin_roles ar
      where ar.user_id=auth.uid() and ar.role='owner'
    )
  )
$$;
revoke all on function private.dashboard_settlement_visible(uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.dashboard_settlement_visible(uuid) to authenticated;
drop policy if exists monthly_settlements_read_authorized on public.monthly_settlements;
create policy monthly_settlements_read_authorized on public.monthly_settlements
for select to authenticated using (private.dashboard_settlement_visible(id));
drop policy if exists monthly_settlement_agencies_read_authorized on public.monthly_settlement_agencies;
create policy monthly_settlement_agencies_read_authorized on public.monthly_settlement_agencies
for select to authenticated using (private.dashboard_settlement_visible(settlement_id));
notify pgrst, 'reload schema';
