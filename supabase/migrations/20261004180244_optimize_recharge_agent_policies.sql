drop policy if exists recharge_agents_manage_admin on public.recharge_agents;
drop policy if exists recharge_agents_select_authenticated on public.recharge_agents;

create policy recharge_agents_select_authenticated
on public.recharge_agents for select to authenticated
using (
  public.is_admin_role('agent_manager')
  or is_active = true
  or (select auth.uid()) = user_id
);

create policy recharge_agents_insert_admin
on public.recharge_agents for insert to authenticated
with check (public.is_admin_role('agent_manager'));

create policy recharge_agents_update_admin
on public.recharge_agents for update to authenticated
using (public.is_admin_role('agent_manager'))
with check (public.is_admin_role('agent_manager'));

create policy recharge_agents_delete_admin
on public.recharge_agents for delete to authenticated
using (public.is_admin_role('agent_manager'));
