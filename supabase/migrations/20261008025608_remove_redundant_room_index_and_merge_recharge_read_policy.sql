-- Preserve the exact OR semantics of the two SELECT policies while evaluating one policy.
alter policy recharge_requests_select_own_or_agent on public.recharge_requests
using (
 (select auth.uid()) = user_id
 or exists(select 1 from public.recharge_agents a where a.id=recharge_requests.agent_id and a.user_id=(select auth.uid()))
 or public.is_admin_role('admin'::text)
 or public.is_admin_role('agent_manager'::text)
);
drop policy recharge_requests_select_admin on public.recharge_requests;
-- Identical non-unique btree owner indexes; rooms_owner_id_idx remains.
drop index public.rooms_owner_lookup_idx;
