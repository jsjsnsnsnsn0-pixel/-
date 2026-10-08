-- TotiChat: owner-managed staff invitations by verified Google email.
-- Additive; no wallet changes, no changes to owner account.
create table public.dashboard_staff_email_invites(
 email text primary key check(email=lower(btrim(email)) and length(email) between 6 and 254
   and email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
 role_id text not null references public.dashboard_roles(id) check(role_id not in('owner','user')),
 assigned_by uuid not null references public.profiles(id),
 assigned_at timestamptz not null default now(),
 user_id uuid references public.profiles(id),
 claimed_at timestamptz
);
alter table public.dashboard_staff_email_invites enable row level security;
revoke all on public.dashboard_staff_email_invites from public,anon,authenticated;
-- Conservative defaults, without currency adjustments or rank editing.
insert into public.dashboard_role_permissions(role_id,permission_id)
select v.role_id,v.permission_id from (values
 ('super_admin','dashboard.view'),('super_admin','users.view'),('super_admin','roles.view'),
 ('super_admin','rooms.view'),('super_admin','agencies.view'),('super_admin','settlements.view'),
 ('super_admin','wallet.history'),('super_admin','reports.view'),('super_admin','audit.view'),
 ('admin','dashboard.view'),('admin','users.view'),('admin','rooms.view'),
 ('admin','agencies.view'),('admin','reports.view'),
 ('support','dashboard.view'),('support','users.view'),('support','reports.view'),
 ('support','reports.manage'),
 ('moderator','dashboard.view'),('moderator','rooms.view'),('moderator','rooms.close'),
 ('moderator','users.view'),
 ('agency_manager','dashboard.view'),('agency_manager','agencies.view'),
 ('agency_manager','agencies.approve'),('agency_manager','agencies.reject'),
 ('agency_manager','settlements.view')
) as v(role_id,permission_id)
on conflict do nothing;

create function public.dashboard_assign_role_by_email(p_email text,p_role text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e text:=lower(btrim(coalesce(p_email,'')));target uuid;ready boolean:=false;state_text text;
begin
 perform private.dashboard_require_owner();
 if length(e) not between 6 and 254 or e !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
 then raise exception 'Invalid staff email';end if;
 if exists(select 1 from auth.users u join public.admin_roles a on a.user_id=u.id
    where lower(u.email)=e and a.role='owner')
 then raise exception 'Owner account is protected';end if;
 if p_role is null or (p_role<>'user' and
   (p_role='owner' or not exists(select 1 from public.dashboard_roles where id=p_role)))
 then raise exception 'Invalid staff role';end if;
 if p_role<>'user' and not exists(select 1 from public.dashboard_role_permissions
   where role_id=p_role and permission_id='dashboard.view')
 then raise exception 'Role needs dashboard.view before assignment';end if;
 select id into target from auth.users where lower(email)=e order by created_at limit 1;
 select target is not null
   and exists(select 1 from public.profiles where id=target)
   and exists(select 1 from auth.users u where u.id=target and u.email_confirmed_at is not null)
   and exists(select 1 from auth.identities i where i.user_id=target and i.provider='google')
   into ready;
 if p_role='user' then
   delete from public.dashboard_staff_email_invites where email=e;
   if target is not null then delete from public.dashboard_user_roles where user_id=target;end if;
   state_text:='revoked';
 else
   insert into public.dashboard_staff_email_invites(email,role_id,assigned_by,user_id,claimed_at)
   values(e,p_role,auth.uid(),case when ready then target else null end,
    case when ready then now() else null end)
   on conflict(email) do update set role_id=excluded.role_id,assigned_by=excluded.assigned_by,
    assigned_at=now(),user_id=excluded.user_id,claimed_at=excluded.claimed_at;
   if ready then
     insert into public.dashboard_user_roles(user_id,role_id,assigned_by)
     values(target,p_role,auth.uid())
     on conflict(user_id) do update set role_id=excluded.role_id,
      assigned_by=excluded.assigned_by,assigned_at=now();
     state_text:='active';
   else state_text:='pending_google_login';
   end if;
 end if;
 insert into public.dashboard_audit(actor_id,action,target_id,metadata)
 values(auth.uid(),'roles.assign_email',case when ready then target else null end,
   jsonb_build_object('email',e,'role',p_role,'status',state_text));
 return jsonb_build_object('email',e,'role',p_role,'status',state_text);
end $$;

create function public.dashboard_claim_email_role()
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e text;invite public.dashboard_staff_email_invites%rowtype;
begin
 if actor is null then return jsonb_build_object('claimed',false);end if;
 select lower(btrim(email)) into e from auth.users
 where id=actor and email_confirmed_at is not null;
 if e is null or not exists(select 1 from auth.identities
   where user_id=actor and provider='google')
 then return jsonb_build_object('claimed',false);end if;
 if exists(select 1 from public.admin_roles where user_id=actor and role='owner')
 then return jsonb_build_object('claimed',false,'owner',true);end if;
 select * into invite from public.dashboard_staff_email_invites
 where email=e for update;
 if not found then return jsonb_build_object('claimed',false);end if;
 if not exists(select 1 from public.profiles where id=actor)
 then return jsonb_build_object('claimed',false,'reason','profile_pending');end if;
 insert into public.dashboard_user_roles(user_id,role_id,assigned_by)
 values(actor,invite.role_id,invite.assigned_by)
 on conflict(user_id) do update set role_id=excluded.role_id,
 assigned_by=excluded.assigned_by,assigned_at=now();
 update public.dashboard_staff_email_invites set user_id=actor,
  claimed_at=coalesce(claimed_at,now()) where email=e;
 return jsonb_build_object('claimed',true,'role',invite.role_id);
end $$;

create function public.dashboard_staff_email_invites_list()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require_owner();
 return coalesce((select jsonb_agg(jsonb_build_object(
  'email',email,'role',role_id,'active',user_id is not null,
  'assigned_at',assigned_at,'claimed_at',claimed_at) order by assigned_at desc)
  from (select * from public.dashboard_staff_email_invites
   order by assigned_at desc limit 100) i),'[]'::jsonb);
end $$;

revoke all on function public.dashboard_assign_role_by_email(text,text) from public,anon;
grant execute on function public.dashboard_assign_role_by_email(text,text) to authenticated;
revoke all on function public.dashboard_claim_email_role() from public,anon;
grant execute on function public.dashboard_claim_email_role() to authenticated;
revoke all on function public.dashboard_staff_email_invites_list() from public,anon;
grant execute on function public.dashboard_staff_email_invites_list() to authenticated;
notify pgrst,'reload schema';