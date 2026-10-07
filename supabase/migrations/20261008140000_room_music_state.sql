-- Beta Music Room: authoritative room state only; audio is transported by pinned LiveKit.
-- No copyright-infringing seed media, no microphone capture changes.
create table public.room_music_state (
 room_id uuid primary key references public.rooms(id) on delete cascade,
 track_name text,
 track_id uuid,
 controller_id uuid references public.profiles(id),
 status text not null default 'stopped' check(status in('playing','paused','stopped')),
 duration_seconds numeric(10,2) not null default 0 check(duration_seconds between 0 and 3600),
 position_seconds numeric(10,2) not null default 0 check(position_seconds>=0),
 started_at timestamptz,
 version bigint not null default 0,
 updated_at timestamptz not null default now(),
 check((status='stopped' and track_id is null) or
       (status<>'stopped' and track_id is not null and length(track_name)>0))
);
create table public.room_music_commands(
 request_id uuid primary key,
 room_id uuid not null references public.rooms(id) on delete cascade,
 actor_id uuid not null references public.profiles(id),
 action text not null check(action in('play','pause','resume','seek','stop')),
 request_details jsonb not null,
 response jsonb not null,
 created_at timestamptz not null default now()
);
create index room_music_commands_room_idx on public.room_music_commands(room_id,created_at desc);
alter table public.room_music_state enable row level security;
alter table public.room_music_commands enable row level security;
revoke all on public.room_music_state,public.room_music_commands from public,anon,authenticated;
grant select on public.room_music_state to authenticated;
create policy room_music_state_read on public.room_music_state
 for select to authenticated using(private.room_access_allowed(room_id));
create function private.room_music_controller(p_room uuid,p_actor uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select p_room is not null and p_actor is not null and
 private.room_access_allowed(p_room) and
 (exists(select 1 from public.rooms r where r.id=p_room and r.owner_id=p_actor and r.is_active)
  or exists(select 1 from public.room_members m join public.rooms r on r.id=m.room_id
     where m.room_id=p_room and m.user_id=p_actor and m.role='moderator' and r.is_active))
$$;
revoke all on function private.room_music_controller(uuid,uuid) from public,anon,authenticated;

create function public.room_music_control(
 p_room_id uuid,p_action text,p_request_id uuid,
 p_track_id uuid default null,p_track_name text default null,
 p_duration_seconds numeric default null,p_position_seconds numeric default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); state public.room_music_state%rowtype; prior public.room_music_commands%rowtype;
 details jsonb; progress numeric; result jsonb;
begin
 if not private.room_music_controller(p_room_id,actor) then
  raise exception 'music moderator permission required' using errcode='42501';end if;
 if not coalesce((select enabled from public.beta_feature_flags where id='music_enabled'),false) then
  raise exception 'music is disabled for this beta';end if;
 if p_request_id is null or p_action not in('play','pause','resume','seek','stop') then
  raise exception 'invalid music command';end if;
 details:=jsonb_build_object('action',p_action,'track_id',p_track_id,'track_name',p_track_name,
   'duration',p_duration_seconds,'position',p_position_seconds);
 perform pg_advisory_xact_lock(hashtextextended('music:'||p_room_id::text,0));
 select * into prior from public.room_music_commands where request_id=p_request_id;
 if found then
  if prior.room_id<>p_room_id or prior.actor_id<>actor or prior.request_details<>details then
   raise exception 'music request ID already used';end if;
  return prior.response;
 end if;
 insert into public.room_music_state(room_id)values(p_room_id)on conflict do nothing;
 select * into state from public.room_music_state where room_id=p_room_id for update;
 progress:=least(state.duration_seconds,
    state.position_seconds+case when state.status='playing' and state.started_at is not null
    then greatest(0,extract(epoch from(now()-state.started_at))) else 0 end);
 if p_action='play' then
  if p_track_id is null or length(btrim(coalesce(p_track_name,''))) not between 1 and 160
   or p_duration_seconds is null or p_duration_seconds<=0 or p_duration_seconds>3600 then
   raise exception 'invalid audio metadata';end if;
  update public.room_music_state set track_id=p_track_id,track_name=btrim(p_track_name),
    controller_id=actor,status='playing',duration_seconds=p_duration_seconds,position_seconds=0,
    started_at=now(),version=version+1,updated_at=now() where room_id=p_room_id;
 elsif p_action='pause' then
  if state.status<>'playing' then raise exception 'music is not playing';end if;
  update public.room_music_state set status='paused',position_seconds=progress,started_at=null,
    version=version+1,updated_at=now() where room_id=p_room_id;
 elsif p_action='resume' then
  if state.status<>'paused' then raise exception 'music is not paused';end if;
  update public.room_music_state set status='playing',started_at=now(),
    version=version+1,updated_at=now() where room_id=p_room_id;
 elsif p_action='seek' then
  if state.status='stopped' or p_position_seconds is null
     or p_position_seconds<0 or p_position_seconds>state.duration_seconds then
   raise exception 'invalid seek position';end if;
  update public.room_music_state set position_seconds=p_position_seconds,
    started_at=case when state.status='playing' then now() else null end,
    version=version+1,updated_at=now() where room_id=p_room_id;
 else
  update public.room_music_state set track_id=null,track_name=null,controller_id=null,
    status='stopped',started_at=null,position_seconds=0,duration_seconds=0,
    version=version+1,updated_at=now() where room_id=p_room_id;
 end if;
 select to_jsonb(s) into result from public.room_music_state s where s.room_id=p_room_id;
 insert into public.room_music_commands(request_id,room_id,actor_id,action,request_details,response)
 values(p_request_id,p_room_id,actor,p_action,details,result);
 return result;
end $$;
revoke all on function public.room_music_control(uuid,text,uuid,uuid,text,numeric,numeric) from public,anon;
grant execute on function public.room_music_control(uuid,text,uuid,uuid,text,numeric,numeric) to authenticated;

create function public.room_music_current(p_room_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare state jsonb;
begin
 if auth.uid() is null or not private.room_access_allowed(p_room_id) then
  raise exception 'room membership required';end if;
 select to_jsonb(s) into state from public.room_music_state s where s.room_id=p_room_id;
 return coalesce(state,jsonb_build_object('room_id',p_room_id,'status','stopped'));
end $$;
revoke all on function public.room_music_current(uuid) from public,anon;
grant execute on function public.room_music_current(uuid) to authenticated;
do $$ begin
 alter publication supabase_realtime add table public.room_music_state;
exception when duplicate_object then null;
end $$;
notify pgrst,'reload schema';
