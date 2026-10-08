-- Role updates propagate to authorized users; backend RPC remains the authority.
grant select on public.dashboard_user_roles,public.dashboard_role_permissions to authenticated;
create policy dashboard_role_owner_read on public.dashboard_user_roles
 for select to authenticated using(user_id=(select auth.uid()));
create policy dashboard_permissions_for_assigned_role on public.dashboard_role_permissions
 for select to authenticated using(
  exists(select 1 from public.dashboard_user_roles ur
         where ur.user_id=(select auth.uid()) and ur.role_id=role_id)
  or exists(select 1 from public.admin_roles ar where ar.user_id=(select auth.uid()) and ar.role='owner')
 );
grant select on public.beta_feature_flags to authenticated;
create policy beta_flags_read on public.beta_feature_flags for select to authenticated using(true);
do $$ begin
 alter publication supabase_realtime add table public.dashboard_user_roles;
exception when duplicate_object then null;
end $$;
do $$ begin
 alter publication supabase_realtime add table public.dashboard_role_permissions;
exception when duplicate_object then null;
end $$;
do $$ begin
 alter publication supabase_realtime add table public.beta_feature_flags;
exception when duplicate_object then null;
end $$;
notify pgrst,'reload schema';
