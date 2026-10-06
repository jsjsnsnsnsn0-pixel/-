-- Additive update. Existing duplicate rooms and balances are preserved.
alter table public.rooms add column if not exists internal_background_url text;
alter table public.room_bans add column if not exists expires_at timestamptz;
create index if not exists rooms_owner_lookup_idx on public.rooms(owner_id);
create table public.user_room_links(
 user_id uuid not null references auth.users(id) on delete cascade,
 room_id uuid not null references public.rooms(id) on delete cascade,
 followed boolean not null default false,last_visited_at timestamptz,
 primary key(user_id,room_id)
);
alter table public.user_room_links enable row level security;
create policy own_room_links on public.user_room_links for select to authenticated using(user_id=(select auth.uid()));
grant select on public.user_room_links to authenticated;
revoke insert,update,delete on public.user_room_links from anon,authenticated;

create function private.one_room_per_owner() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.owner_id is not distinct from old.owner_id then return new;end if;
 -- Serialize concurrent creates across RPC and direct inserts without removing historical duplicates.
 perform 1 from public.profiles where id=new.owner_id for update;
 if exists(select 1 from public.rooms where owner_id=new.owner_id and id<>new.id) then raise exception 'account already owns a room';end if;
 return new;
end$$;
create trigger enforce_one_owned_room before insert or update of owner_id on public.rooms for each row execute function private.one_room_per_owner();
revoke all on function private.one_room_per_owner() from public,anon,authenticated;

create function private.record_room_visit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.user_room_links(user_id,room_id,last_visited_at)values(new.user_id,new.room_id,now())on conflict(user_id,room_id)do update set last_visited_at=excluded.last_visited_at;
 return new;
end$$;
create trigger record_room_visit after insert on public.room_members for each row execute function private.record_room_visit();
revoke all on function private.record_room_visit() from public,anon,authenticated;
insert into public.user_room_links(user_id,room_id,last_visited_at)select user_id,room_id,joined_at from public.room_members on conflict do nothing;

create function private.follow_room(p_room_id uuid,p_followed boolean)returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 if not private.can_view_room(p_room_id)then raise exception 'room not available';end if;
 insert into public.user_room_links(user_id,room_id,followed)values(auth.uid(),p_room_id,p_followed)on conflict(user_id,room_id)do update set followed=excluded.followed;
end$$;
create function public.follow_room(p_room_id uuid,p_followed boolean)returns void language sql security invoker set search_path='' as $$select private.follow_room(p_room_id,p_followed)$$;

create function private.update_room_appearance(p_room_id uuid,p_internal text default null,p_external text default null,p_seats integer default null)returns void language plpgsql security definer set search_path='' as $$
declare r public.rooms%rowtype; image text;begin
 select *into r from public.rooms where id=p_room_id for update;
 if auth.uid()is null or r.owner_id is distinct from auth.uid()then raise exception 'room owner permission required';end if;
 foreach image in array array[p_internal,p_external]loop
  if image is not null and(length(image)>7000000 or (image<>'' and image!~'^(https://|/assets/|data:image/(png|jpeg|webp);base64,)'))then raise exception 'invalid room image';end if;
 end loop;
 if p_seats is not null then
  if p_seats<1 or p_seats>20 then raise exception 'invalid seat count';end if;
  if exists(select 1 from public.room_members where room_id=p_room_id and seat_number>p_seats)then raise exception 'occupied seats cannot be removed';end if;
 end if;
 update public.rooms set internal_background_url=coalesce(p_internal,internal_background_url),external_image_url=coalesce(p_external,external_image_url),max_seats=coalesce(p_seats,max_seats)where id=p_room_id;
 insert into public.room_moderation_log(room_id,actor_id,action)values(p_room_id,auth.uid(),'update_appearance');
end$$;
create function public.update_room_appearance(p_room_id uuid,p_internal text default null,p_external text default null,p_seats integer default null)returns void language sql security invoker set search_path='' as $$select private.update_room_appearance(p_room_id,p_internal,p_external,p_seats)$$;

create function private.moderate_room_user(p_room_id uuid,p_public_id bigint,p_action text,p_duration_minutes integer default null)returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); own boolean; target public.room_members%rowtype; seat integer;begin
 if actor is null then raise exception 'authentication required';end if;
 select owner_id=actor into own from public.rooms where id=p_room_id for update;
 if not coalesce(own,false)and not exists(select 1 from public.room_members where room_id=p_room_id and user_id=actor and role='moderator')then raise exception 'moderator permission required';end if;
 select *into target from public.room_members where room_id=p_room_id and member_public_id=p_public_id for update;
 if not found then raise exception 'room member not found';end if;
 if target.role='owner'or target.user_id=actor or(not own and target.role='moderator')then raise exception 'protected room member';end if;
 if p_action in('mute','unmute')then
  if p_action='unmute'and target.seat_number is null then raise exception 'member has no microphone seat';end if;
  update public.room_members set is_muted=(p_action='mute')where id=target.id;
 elsif p_action='down'then update public.room_members set seat_number=null,is_muted=true,is_hand_raised=false where id=target.id;
 elsif p_action='raise'then
  select s into seat from generate_series(2,(select max_seats from public.rooms where id=p_room_id))s where not exists(select 1 from public.room_members where room_id=p_room_id and seat_number=s)and not exists(select 1 from public.room_seat_locks where room_id=p_room_id and seat_number=s)order by s limit 1;
  if seat is null then raise exception 'no microphone seat available';end if;
  update public.room_members set seat_number=seat,is_muted=true,is_hand_raised=false where id=target.id;
 elsif p_action='kick'then delete from public.room_members where id=target.id;
 elsif p_action='ban'then
  if p_duration_minutes is not null and(p_duration_minutes<1 or p_duration_minutes>525600)then raise exception 'invalid ban duration';end if;
  insert into public.room_bans(room_id,user_id,public_id,display_name,avatar_url,banned_by,expires_at)values(p_room_id,target.user_id,target.member_public_id,target.member_display_name,target.member_avatar_url,actor,case when p_duration_minutes is null then null else now()+make_interval(mins=>p_duration_minutes)end)
  on conflict(room_id,user_id)do update set banned_by=excluded.banned_by,expires_at=excluded.expires_at,created_at=now();
  delete from public.room_members where id=target.id;
 else raise exception 'unsupported moderation action';end if;
 insert into public.room_moderation_log(room_id,actor_id,target_id,action,details)values(p_room_id,actor,target.user_id,p_action,jsonb_build_object('duration_minutes',p_duration_minutes));
end$$;
create function public.moderate_room_user(p_room_id uuid,p_public_id bigint,p_action text,p_duration_minutes integer default null)returns void language sql security invoker set search_path='' as $$select private.moderate_room_user(p_room_id,p_public_id,p_action,p_duration_minutes)$$;

create function private.clear_room_chat(p_room_id uuid,p_message_id uuid default null)returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid()is null or not exists(select 1 from public.rooms r where r.id=p_room_id and(r.owner_id=auth.uid()or exists(select 1 from public.room_members where room_id=p_room_id and user_id=auth.uid()and role='moderator')))then raise exception 'moderator permission required';end if;
 delete from public.room_messages where room_id=p_room_id and(p_message_id is null or id=p_message_id);
 insert into public.room_moderation_log(room_id,actor_id,action,details)values(p_room_id,auth.uid(),'clear_chat',jsonb_build_object('message_id',p_message_id));
end$$;
create function public.clear_room_chat(p_room_id uuid,p_message_id uuid default null)returns void language sql security invoker set search_path='' as $$select private.clear_room_chat(p_room_id,p_message_id)$$;

create function private.profile_cp(p_public_id bigint)returns jsonb language plpgsql security definer set search_path='' as $$
declare target uuid; c public.couples%rowtype;begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 select id into target from public.profiles where public_id=p_public_id;
 if target is null or exists(select 1 from public.user_blocks where(blocker_id=auth.uid()and blocked_id=target)or(blocker_id=target and blocked_id=auth.uid()))then return null;end if;
 select *into c from public.couples where target in(user_a,user_b)and accepted_at is not null and ended_at is null order by accepted_at desc limit 1;
 if not found then return null;end if;
 return jsonb_build_object('partner',private.public_profile(case when c.user_a=target then c.user_b else c.user_a end),'days',greatest(0,extract(day from now()-c.accepted_at)::integer));
end$$;
create function public.profile_cp(p_public_id bigint)returns jsonb language sql security invoker set search_path='' as $$select private.profile_cp(p_public_id)$$;

-- Expired temporary bans are visible as expired, and removed only when that user rejoins.
do $$declare def text;begin
 select pg_get_functiondef('private.join_room(uuid)'::regprocedure)into def;
 def:=replace(def,'if exists (select 1 from public.room_bans','delete from public.room_bans where room_id=p_room_id and user_id=v_user and expires_at is not null and expires_at<=now();'||chr(10)||'  if exists (select 1 from public.room_bans');
 execute def;
 select pg_get_functiondef('private.can_view_room(uuid)'::regprocedure)into def;
 def:=replace(def,'b.user_id = (select auth.uid())','b.user_id = (select auth.uid()) and (b.expires_at is null or b.expires_at>now())');
 execute def;
end$$;
drop policy room_bans_select_owner_moderator_or_self on public.room_bans;
create policy room_bans_select_owner_moderator_or_self on public.room_bans for select to authenticated using(user_id=(select auth.uid())or exists(select 1 from public.rooms r where r.id=room_bans.room_id and r.owner_id=(select auth.uid()))or exists(select 1 from public.room_members m where m.room_id=room_bans.room_id and m.user_id=(select auth.uid())and m.role='moderator'));

do $$declare f regprocedure;begin
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('private','public')and p.proname in('follow_room','update_room_appearance','moderate_room_user','clear_room_chat','profile_cp')loop
  execute format('revoke all on function %s from public,anon',f);execute format('grant execute on function %s to authenticated',f);
 end loop;
end$$;
alter publication supabase_realtime add table public.user_room_links;
notify pgrst,'reload schema';
