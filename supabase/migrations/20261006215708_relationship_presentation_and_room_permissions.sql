-- Extend the canonical relationship registry. No new relationship types or invented EXP.
alter table public.cp_types add column is_primary boolean not null default false;
alter table public.cp_types add column presentation jsonb not null default '{}'::jsonb check(jsonb_typeof(presentation)='object');
alter table public.cp_types add column level_thresholds bigint[] not null default '{}'::bigint[];
create unique index cp_single_primary_type on public.cp_types(is_primary) where enabled and is_primary;
update public.cp_types set is_primary=true,presentation='{"icon":"💗","accent":"#fb7185","background":"#581c40","frame":"soft","effect":null}' where id='love';
alter table public.couples add column experience bigint check(experience>=0);

-- Catalog metadata and optional progress augment the existing validated read.
do $$declare def text;begin
 select pg_get_functiondef('private.profile_cp_by_type(bigint,text)'::regprocedure)into def;
 def:=replace(def,'''accepted_at'',c.accepted_at,''ended_at'',c.ended_at,',
 '''accepted_at'',c.accepted_at,''ended_at'',c.ended_at,''server_now'',clock_timestamp(),''type_label'',t.label,''is_primary'',t.is_primary,''presentation'',t.presentation,''experience'',c.experience,''level_thresholds'',to_jsonb(t.level_thresholds),');
 def:=replace(def,'from public.couples c'||chr(10),'from public.couples c join public.cp_types t on t.id=c.type_id and t.enabled'||chr(10));
 execute def;
end$$;
create function private.profile_relationships(p_public_id bigint)returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 select coalesce(jsonb_agg(r.value order by t.is_primary desc,t.id),'[]'::jsonb)into result
 from public.cp_types t cross join lateral(select private.profile_cp_by_type(p_public_id,t.id)as value)r where t.enabled and r.value is not null;
 return result;
end$$;
create function public.profile_relationships(p_public_id bigint)returns jsonb language sql stable security invoker set search_path='' as $$select private.profile_relationships(p_public_id)$$;

-- Public agency summary is target-scoped, never dependent on viewer membership.
create function private.profile_agency(p_public_id bigint)returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target uuid;result jsonb;begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 select id into target from public.profiles where public_id=p_public_id;
 if target is null or exists(select 1 from public.user_blocks where(blocker_id=auth.uid()and blocked_id=target)or(blocker_id=target and blocked_id=auth.uid()))then return null;end if;
 select jsonb_build_object('id',g.id,'name',g.name,'members_count',(select count(*)from public.agency_members m where m.agency_id=g.id))into result from public.agencies g join public.agency_members m on m.agency_id=g.id where m.user_id=target;
 return result;
end$$;
create function public.profile_agency(p_public_id bigint)returns jsonb language sql stable security invoker set search_path='' as $$select private.profile_agency(p_public_id)$$;

-- Same role/protection rules as moderate_room_user. Fail closed outside membership.
create function private.room_user_permissions(p_room_id uuid,p_public_id bigint)returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid();target public.room_members%rowtype;owner_id uuid;own boolean;moderator boolean;allowed boolean;social jsonb;actions text[]:='{}';begin
 if actor is null then raise exception 'authentication required';end if;
 if not exists(select 1 from public.room_members where room_id=p_room_id and user_id=actor)then raise exception 'room membership required';end if;
 select r.owner_id into owner_id from public.rooms r where r.id=p_room_id and r.is_active;
 if owner_id is null then raise exception 'room not available';end if;
 select *into target from public.room_members where room_id=p_room_id and member_public_id=p_public_id;
 if not found then raise exception 'room member not found';end if;
 own:=owner_id=actor;
 moderator:=own or exists(select 1 from public.room_members where room_id=p_room_id and user_id=actor and role='moderator');
 allowed:=moderator and target.user_id<>actor and target.user_id<>owner_id and target.role<>'owner'and(own or target.role<>'moderator');
 social:=jsonb_build_object('follow',target.user_id<>actor and not exists(select 1 from public.user_blocks where(blocker_id=actor and blocked_id=target.user_id)or(blocker_id=target.user_id and blocked_id=actor)),
 'message',target.user_id<>actor and not exists(select 1 from public.user_blocks where(blocker_id=actor and blocked_id=target.user_id)or(blocker_id=target.user_id and blocked_id=actor)),
 'gift',not exists(select 1 from public.user_blocks where(blocker_id=actor and blocked_id=target.user_id)or(blocker_id=target.user_id and blocked_id=actor)),
 'mention',target.user_id<>actor,'is_following',exists(select 1 from public.user_follows where follower_id=actor and followed_id=target.user_id));
 if allowed then
  actions:=array['kick','ban'];
  if target.seat_number is not null then actions:=actions||array[case when target.is_muted then 'unmute'else 'mute'end,'down'];
  elsif exists(select 1 from generate_series(2,(select max_seats from public.rooms where id=p_room_id))s where not exists(select 1 from public.room_members where room_id=p_room_id and seat_number=s)and not exists(select 1 from public.room_seat_locks where room_id=p_room_id and seat_number=s))then actions:=actions||array['raise'];end if;
 end if;
 return jsonb_build_object('room_id',p_room_id,'subject_public_id',p_public_id,'social',social,'moderation',to_jsonb(actions),'manage_moderators',own and target.user_id<>actor and target.user_id<>owner_id,'self',target.user_id=actor);
end$$;
create function public.room_user_permissions(p_room_id uuid,p_public_id bigint)returns jsonb language sql stable security invoker set search_path='' as $$select private.room_user_permissions(p_room_id,p_public_id)$$;
do $$declare f regprocedure;begin
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('private','public')and p.proname in('profile_relationships','profile_agency','room_user_permissions')loop
 execute format('revoke all on function %s from public,anon',f);execute format('grant execute on function %s to authenticated',f);end loop;
end$$;
notify pgrst,'reload schema';
