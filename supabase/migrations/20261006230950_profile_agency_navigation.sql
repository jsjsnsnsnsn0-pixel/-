-- Optional real logo; no synthetic agency or membership data.
alter table public.agencies add column logo_url text check(logo_url is null or logo_url ~ '^https://' or logo_url ~ '^/[^/]');
create or replace function private.profile_agency(p_public_id bigint) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target uuid; result jsonb; begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 select id into target from public.profiles where public_id=p_public_id;
 if target is null then raise exception 'user not found'; end if;
 if exists(select 1 from public.user_blocks where (blocker_id=auth.uid() and blocked_id=target)or(blocker_id=target and blocked_id=auth.uid()))then raise exception 'not authorized';end if;
 select jsonb_build_object('id',g.id,'name',g.name,'logo_url',g.logo_url,'role',case when g.owner_id=target then 'owner' else 'member' end,'members_count',(select count(*)from public.agency_members am where am.agency_id=g.id)) into result from public.agencies g join public.agency_members m on m.agency_id=g.id where m.user_id=target;
 return result;
end $$;
-- Target-scoped public page. Private applications and management are returned
-- only for the current owner, matching the existing mutation authority.
create function private.agency_detail(p_agency_id bigint) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.agencies%rowtype; member boolean; begin
 if u is null then raise exception 'authentication required';end if;
 select * into a from public.agencies where id=p_agency_id;
 if a.id is null then raise exception 'agency not found';end if;
 member:=exists(select 1 from public.agency_members where user_id=u and agency_id=a.id);
 return jsonb_build_object('agency',jsonb_build_object('id',a.id,'name',a.name,'logo_url',a.logo_url),
 'is_member',member,'can_manage',a.owner_id=u,'can_leave',member and a.owner_id<>u,
 'can_request',not exists(select 1 from public.agency_members where user_id=u),
 'members',(select coalesce(jsonb_agg(private.public_profile(m.user_id) order by m.joined_at),'[]'::jsonb)from public.agency_members m where m.agency_id=a.id and not exists(select 1 from public.user_blocks b where(b.blocker_id=u and b.blocked_id=m.user_id)or(b.blocker_id=m.user_id and b.blocked_id=u))),
 'applications',case when a.owner_id=u then(select coalesce(jsonb_agg(private.public_profile(r.user_id)),'[]'::jsonb)from public.agency_applications r where r.agency_id=a.id)else '[]'::jsonb end);
end $$;
create function public.agency_detail(p_agency_id bigint) returns jsonb language sql stable security invoker set search_path='' as $$select private.agency_detail(p_agency_id)$$;
revoke all on function private.agency_detail(bigint),public.agency_detail(bigint) from public,anon,authenticated;
grant execute on function private.agency_detail(bigint),public.agency_detail(bigint) to authenticated;
