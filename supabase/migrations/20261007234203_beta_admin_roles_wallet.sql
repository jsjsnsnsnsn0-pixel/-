-- TotiChat Beta: additive, staged admin RBAC and wallet accounting.
-- Intentionally does NOT rewrite profiles, wallet balances, legacy roles or settlements.
create table public.dashboard_roles(
 id text primary key check(id ~ '^[a-z][a-z0-9_]{2,39}$'),
 label text not null check(length(btrim(label)) between 2 and 80),
 built_in boolean not null default false,
 created_at timestamptz not null default now()
);
insert into public.dashboard_roles(id,label,built_in) values
 ('owner','Owner',true),('super_admin','Super Admin',true),('admin','Admin',true),
 ('support','Support',true),('moderator','Moderator',true),
 ('agency_manager','Agency Manager',true),('agent','Agent',true),
 ('host','Host',true),('user','User',true);

create table public.dashboard_permissions(
 id text primary key check(id ~ '^[a-z_]+[.][a-z_]+$'),
 label text not null
);
insert into public.dashboard_permissions(id,label)
select key,initcap(replace(key,'.',' / ')) from unnest(array[
'dashboard.view','users.view','users.edit','users.ban','users.unban','users.verify',
'wallet.view','wallet.credit','wallet.debit','wallet.history',
'roles.view','roles.assign','roles.manage',
'agencies.view','agencies.approve','agencies.reject','agencies.manage',
'hosts.manage','rooms.view','rooms.manage','rooms.close','rooms.moderate',
'store.manage','gifts.manage','vip.manage','levels.manage','cp.manage',
'settlements.view','settlements.run','settlements.approve',
'reports.view','system.settings','audit.view'
]) key;
create table public.dashboard_role_permissions(
 role_id text not null references public.dashboard_roles(id),
 permission_id text not null references public.dashboard_permissions(id),
 primary key(role_id,permission_id)
);
create table public.dashboard_user_roles(
 user_id uuid primary key references public.profiles(id),
 role_id text not null references public.dashboard_roles(id) check(role_id not in('owner','user')),
 assigned_by uuid not null references public.profiles(id),
 assigned_at timestamptz not null default now()
);
create table public.dashboard_audit(
 id uuid primary key default gen_random_uuid(),
 actor_id uuid not null references public.profiles(id),
 action text not null,
 target_id uuid references public.profiles(id),
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index dashboard_audit_created_idx on public.dashboard_audit(created_at desc);
create table public.dashboard_wallet_adjustments(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 operator_id uuid not null references public.profiles(id),
 user_id uuid not null references public.profiles(id),
 currency text not null default 'coins' check(currency='coins'),
 delta bigint not null check(delta<>0),
 previous_balance bigint not null check(previous_balance>=0),
 new_balance bigint not null check(new_balance>=0),
 reason text not null check(length(btrim(reason)) between 10 and 500),
 wallet_transaction_id uuid not null unique references public.wallet_transactions(id),
 created_at timestamptz not null default now(),
 check(new_balance::numeric=previous_balance::numeric+delta::numeric)
);
create index dashboard_wallet_adjustments_user_idx on public.dashboard_wallet_adjustments(user_id,created_at desc);
create table public.beta_feature_flags(
 id text primary key check(id ~ '^[a-z_]{3,48}$'),
 enabled boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid references public.profiles(id)
);
insert into public.beta_feature_flags(id,enabled) values
 ('music_enabled',false),('lucky_gifts_enabled',true),('cp_store_enabled',true),
 ('agency_registration_enabled',true);

do $$declare tbl text;begin
 foreach tbl in array array['dashboard_roles','dashboard_permissions','dashboard_role_permissions',
 'dashboard_user_roles','dashboard_audit','dashboard_wallet_adjustments','beta_feature_flags'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from public,anon,authenticated',tbl);
 end loop;
end $$;
-- Server-side auth ONLY: roles aren't inferred from the UI or public user ID.
create function private.dashboard_has_permission(p_actor uuid,p_permission text)
returns boolean language sql stable security definer set search_path='' as $$
 select p_actor is not null and (
 exists(select 1 from public.admin_roles ar where ar.user_id=p_actor and ar.role='owner')
 or exists(select 1 from public.dashboard_user_roles ur
  join public.dashboard_role_permissions rp on rp.role_id=ur.role_id
  where ur.user_id=p_actor and rp.permission_id=p_permission)
 ) $$;
revoke all on function private.dashboard_has_permission(uuid,text) from public,anon,authenticated;

create function private.dashboard_require(p_permission text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.dashboard_has_permission(auth.uid(),p_permission)
 then raise exception 'dashboard permission denied' using errcode='42501';end if;
end $$;
revoke all on function private.dashboard_require(text) from public,anon,authenticated;

create function private.dashboard_require_owner() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(
  select 1 from public.admin_roles where user_id=auth.uid() and role='owner'
 ) then raise exception 'owner required' using errcode='42501';end if;
end $$;
revoke all on function private.dashboard_require_owner() from public,anon,authenticated;

create function public.dashboard_session() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); role_name text; grants text[];
begin
 if actor is null then return jsonb_build_object('allowed',false);end if;
 if exists(select 1 from public.admin_roles where user_id=actor and role='owner') then
  role_name:='owner';
  select coalesce(array_agg(id order by id),array[]::text[]) into grants from public.dashboard_permissions;
 else
  select ur.role_id into role_name from public.dashboard_user_roles ur where ur.user_id=actor;
  select coalesce(array_agg(rp.permission_id order by rp.permission_id),array[]::text[]) into grants
   from public.dashboard_role_permissions rp where rp.role_id=role_name;
 end if;
 return jsonb_build_object('allowed',role_name is not null and 'dashboard.view'=any(grants),
   'owner',role_name='owner','role',coalesce(role_name,'user'),'permissions',grants);
end $$;

create function public.dashboard_overview() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require('dashboard.view');
 return jsonb_build_object(
  'users',(select count(*) from public.profiles),
  'active_users',(select count(*) from public.profiles where last_seen_at>now()-interval '15 minutes'),
  'active_rooms',(select count(*) from public.rooms where is_active),
  'gifts_today',(select count(*) from public.gift_events where created_at>=date_trunc('day',now())),
  'coins_in_circulation',(select coalesce(sum(gold),0) from public.profiles),
  'agencies',(select count(*) from public.agencies),
  'hosts',(select count(*) from public.agency_members),
  'pending_agency_registrations',(select count(*) from public.agency_registrations where status='pending')
 );
end $$;
create function public.dashboard_users(p_search text default '',p_limit integer default 30)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare response jsonb; needle text:=left(btrim(coalesce(p_search,'')),100);
begin
 perform private.dashboard_require('users.view');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into response from (
  select p.id,p.public_id,p.username,p.display_name,p.avatar_url,p.country_code,
   p.gold,p.diamonds,p.vip_level,p.level,p.created_at,p.last_seen_at,
   a.email,ur.role_id dashboard_role
  from public.profiles p
  left join auth.users a on a.id=p.id
  left join public.dashboard_user_roles ur on ur.user_id=p.id
  where needle='' or p.public_id::text=needle
   or p.username ilike '%'||needle||'%' or p.display_name ilike '%'||needle||'%'
   or a.email ilike '%'||needle||'%'
  order by p.created_at desc limit least(greatest(coalesce(p_limit,30),1),50)
 ) t;
 return response;
end $$;
create function public.dashboard_roles_state() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require('roles.view');
 return jsonb_build_object(
  'roles',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'label',r.label,'built_in',r.built_in,
    'permissions',(select coalesce(jsonb_agg(rp.permission_id order by rp.permission_id),'[]'::jsonb)
      from public.dashboard_role_permissions rp where rp.role_id=r.id)) order by r.id),'[]'::jsonb)
    from public.dashboard_roles r),
  'permissions',(select coalesce(jsonb_agg(id order by id),'[]'::jsonb) from public.dashboard_permissions)
 );
end $$;
create function public.dashboard_save_role(p_role text,p_label text,p_permissions text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare chosen text[]:=coalesce(p_permissions,array[]::text[]);
begin
 perform private.dashboard_require_owner();
 if p_role is null or p_role !~ '^[a-z][a-z0-9_]{2,39}$' or p_role in('owner','user') then
  raise exception 'invalid or protected role';end if;
 if length(btrim(coalesce(p_label,''))) not between 2 and 80 then raise exception 'invalid role label';end if;
 if exists(select 1 from unnest(chosen) id left join public.dashboard_permissions p on p.id=id
           where p.id is null) then raise exception 'unrecognized permission';end if;
 insert into public.dashboard_roles(id,label,built_in) values(p_role,btrim(p_label),false)
 on conflict(id) do update set label=excluded.label;
 delete from public.dashboard_role_permissions where role_id=p_role;
 insert into public.dashboard_role_permissions(role_id,permission_id)
 select p_role,v.id from (select distinct unnest(chosen) id) v;
 insert into public.dashboard_audit(actor_id,action,metadata) values(auth.uid(),'roles.save',
  jsonb_build_object('role',p_role,'permissions',chosen));
 return jsonb_build_object('saved',true,'role',p_role);
end $$;
create function public.dashboard_assign_role(p_public_id bigint,p_role text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 perform private.dashboard_require_owner();
 select id into target from public.profiles where public_id=p_public_id for update;
 if target is null then raise exception 'target user not found';end if;
 if exists(select 1 from public.admin_roles where user_id=target and role='owner') then
  raise exception 'owner account is protected';end if;
 if p_role='owner' then raise exception 'owner cannot be assigned';end if;
 if p_role='user' then
  delete from public.dashboard_user_roles where user_id=target;
 elsif exists(select 1 from public.dashboard_roles where id=p_role) then
  insert into public.dashboard_user_roles(user_id,role_id,assigned_by)
  values(target,p_role,auth.uid())
  on conflict(user_id) do update set role_id=excluded.role_id,assigned_by=excluded.assigned_by,assigned_at=now();
 else raise exception 'unknown role';end if;
 insert into public.dashboard_audit(actor_id,action,target_id,metadata)
 values(auth.uid(),'roles.assign',target,jsonb_build_object('role',p_role));
 return jsonb_build_object('updated',true,'public_id',p_public_id,'role',p_role);
end $$;

create function public.dashboard_wallet_adjust(
 p_public_id bigint,p_delta bigint,p_reason text,p_request_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();target uuid;before_amount bigint;after_amount numeric;
 current_adjust public.dashboard_wallet_adjustments%rowtype;txid uuid;
begin
 if p_delta is null or p_delta=0 or abs(p_delta::numeric)>1000000000 then
  raise exception 'invalid wallet adjustment';end if;
 perform private.dashboard_require(case when p_delta>0 then 'wallet.credit' else 'wallet.debit' end);
 if p_request_id is null or length(btrim(coalesce(p_reason,''))) not between 10 and 500
 then raise exception 'request ID and 10-500 character reason required';end if;
 select id,gold into target,before_amount from public.profiles
 where public_id=p_public_id for update;
 if target is null then raise exception 'target user not found';end if;
 select * into current_adjust from public.dashboard_wallet_adjustments where request_id=p_request_id;
 if found then
  if current_adjust.user_id<>target or current_adjust.delta<>p_delta or current_adjust.operator_id<>actor
     or current_adjust.reason<>btrim(p_reason) then raise exception 'conflicting adjustment request';end if;
  return jsonb_build_object('id',current_adjust.id,'previous_balance',current_adjust.previous_balance,
    'new_balance',current_adjust.new_balance,'already_processed',true);
 end if;
 after_amount:=before_amount::numeric+p_delta::numeric;
 if after_amount<0 or after_amount>9223372036854775807 then raise exception 'insufficient or overflowing coins';end if;
 update public.profiles set gold=after_amount::bigint,updated_at=now() where id=target;
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta)
 values(target,'admin_adjustment',p_delta) returning id into txid;
 insert into public.dashboard_wallet_adjustments(
 request_id,operator_id,user_id,delta,previous_balance,new_balance,reason,wallet_transaction_id)
 values(p_request_id,actor,target,p_delta,before_amount,after_amount::bigint,btrim(p_reason),txid)
 returning * into current_adjust;
 insert into public.dashboard_audit(actor_id,action,target_id,metadata) values(
 actor,case when p_delta>0 then 'wallet.credit' else 'wallet.debit' end,target,
 jsonb_build_object('adjustment_id',current_adjust.id,'public_id',p_public_id,
  'delta',p_delta,'previous_balance',before_amount,'new_balance',after_amount,'reason',btrim(p_reason)));
 return jsonb_build_object('id',current_adjust.id,'previous_balance',before_amount,
 'new_balance',after_amount::bigint,'already_processed',false);
end $$;

create function public.dashboard_wallet_history(p_public_id bigint default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.dashboard_require('wallet.history');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from(
  select a.id,a.request_id,a.created_at,a.currency,a.delta,a.previous_balance,a.new_balance,
    a.reason,p.public_id,p.display_name operator_name,p2.public_id target_public_id
  from public.dashboard_wallet_adjustments a
  join public.profiles p on p.id=a.operator_id
  join public.profiles p2 on p2.id=a.user_id
  where p_public_id is null or p2.public_id=p_public_id
  order by a.created_at desc limit 100
 ) t;
 return result;
end $$;

create function public.dashboard_agency_registrations()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.dashboard_require('agencies.view');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from(
  select id,applicant_public_id,agency_name,country_code,agent_number,
    full_name,status,submitted_at,review_note,logo_path,identity_path,portrait_path
  from public.agency_registrations order by submitted_at desc limit 100
 ) t;
 return result;
end $$;
create function public.dashboard_audit_history() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.dashboard_require('audit.view');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from(
  select a.id,a.action,a.target_id,a.metadata,a.created_at,p.public_id operator_public_id,
    p.display_name operator_name from public.dashboard_audit a
  join public.profiles p on p.id=a.actor_id
  order by a.created_at desc limit 150
 ) t;
 return result;
end $$;

create function public.beta_flags_state() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_object_agg(id,enabled),'{}'::jsonb) from public.beta_feature_flags
$$;
create function public.dashboard_set_beta_flag(p_id text,p_enabled boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform private.dashboard_require_owner();
 update public.beta_feature_flags set enabled=p_enabled,updated_at=now(),updated_by=auth.uid()
 where id=p_id;
 if not found then raise exception 'unknown feature flag';end if;
 insert into public.dashboard_audit(actor_id,action,metadata)
 values(auth.uid(),'system.feature_flag',jsonb_build_object('flag',p_id,'enabled',p_enabled));
 return jsonb_build_object('id',p_id,'enabled',p_enabled);
end $$;
-- No direct client writes; every mutation goes through verified RPCs.
do $$declare routine text;begin
 foreach routine in array array[
 'dashboard_session()','dashboard_overview()','dashboard_users(text,integer)',
 'dashboard_roles_state()','dashboard_save_role(text,text,text[])',
 'dashboard_assign_role(bigint,text)','dashboard_wallet_adjust(bigint,bigint,text,uuid)',
 'dashboard_wallet_history(bigint)','dashboard_agency_registrations()',
 'dashboard_audit_history()','beta_flags_state()','dashboard_set_beta_flag(text,boolean)'
 ] loop
  execute format('revoke all on function public.%s from public,anon',routine);
  execute format('grant execute on function public.%s to authenticated',routine);
 end loop;
end $$;
notify pgrst,'reload schema';
