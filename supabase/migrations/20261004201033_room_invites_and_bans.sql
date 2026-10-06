create table if not exists public.room_invites (
  room_id uuid not null references public.rooms(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  target_public_id bigint not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  primary key (room_id, target_user_id)
);

create table if not exists public.room_bans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  public_id bigint,
  display_name text,
  avatar_url text,
  banned_by uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists room_invites_target_idx on public.room_invites(target_user_id, expires_at);
create index if not exists room_bans_user_idx on public.room_bans(user_id);
create index if not exists room_bans_banned_by_idx on public.room_bans(banned_by);

alter table public.room_invites enable row level security;
alter table public.room_bans enable row level security;

create or replace function public.prepare_room_invite()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  select p.id into new.target_user_id
  from public.profiles p
  where p.public_id = new.target_public_id;
  if new.target_user_id is null then
    raise exception 'target user not found';
  end if;
  new.invited_by := (select auth.uid());
  new.expires_at := coalesce(new.expires_at, now() + interval '24 hours');
  new.used_at := null;
  return new;
end;
$$;
revoke execute on function public.prepare_room_invite() from public, anon, authenticated;

drop trigger if exists room_invites_prepare on public.room_invites;
create trigger room_invites_prepare
before insert or update of target_public_id on public.room_invites
for each row execute function public.prepare_room_invite();

-- Invite policies.
drop policy if exists room_invites_select_participants on public.room_invites;
drop policy if exists room_invites_insert_owner on public.room_invites;
drop policy if exists room_invites_update_target_or_owner on public.room_invites;
drop policy if exists room_invites_delete_target_or_owner on public.room_invites;

create policy room_invites_select_participants on public.room_invites
for select to authenticated using (
  target_user_id = (select auth.uid())
  or exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);
create policy room_invites_insert_owner on public.room_invites
for insert to authenticated with check (
  invited_by=(select auth.uid())
  and exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);
create policy room_invites_update_target_or_owner on public.room_invites
for update to authenticated
using (
  target_user_id=(select auth.uid())
  or exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
)
with check (
  target_user_id=(select auth.uid())
  or exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);
create policy room_invites_delete_target_or_owner on public.room_invites
for delete to authenticated using (
  target_user_id=(select auth.uid())
  or exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);

-- Ban policies: room owner manages bans; banned user can only test own ban via join RPC/RLS.
drop policy if exists room_bans_select_owner_or_self on public.room_bans;
drop policy if exists room_bans_insert_owner on public.room_bans;
drop policy if exists room_bans_delete_owner on public.room_bans;
create policy room_bans_select_owner_or_self on public.room_bans
for select to authenticated using (
  user_id=(select auth.uid())
  or exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);
create policy room_bans_insert_owner on public.room_bans
for insert to authenticated with check (
  banned_by=(select auth.uid())
  and exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);
create policy room_bans_delete_owner on public.room_bans
for delete to authenticated using (
  exists (select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
);

revoke all on public.room_invites from anon, authenticated;
grant select on public.room_invites to authenticated;
grant insert (room_id,target_public_id,expires_at) on public.room_invites to authenticated;
grant update (used_at) on public.room_invites to authenticated;
grant delete on public.room_invites to authenticated;

revoke all on public.room_bans from anon, authenticated;
grant select, insert, delete on public.room_bans to authenticated;

-- Let invited users discover the private room without exposing it to everyone.
drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated
on public.rooms for select to authenticated
using (
  owner_id=(select auth.uid())
  or (is_active=true and is_private=false)
  or exists (
    select 1 from public.room_members rm
    where rm.room_id=rooms.id and rm.user_id=(select auth.uid())
  )
  or exists (
    select 1 from public.room_invites ri
    where ri.room_id=rooms.id
      and ri.target_user_id=(select auth.uid())
      and ri.used_at is null
      and ri.expires_at>now()
  )
);

create or replace function public.join_room(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_user uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_vip_level integer;
begin
  if v_user is null then raise exception 'authentication required'; end if;

  select * into v_room from public.rooms r where r.id=p_room_id and r.is_active=true;
  if not found then raise exception 'room not available'; end if;

  if exists (select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=v_user) then
    raise exception 'you are banned from this room';
  end if;

  if v_room.is_private and v_room.owner_id<>v_user and not exists (
    select 1 from public.room_invites i
    where i.room_id=p_room_id and i.target_user_id=v_user
      and i.used_at is null and i.expires_at>now()
  ) then
    raise exception 'private room requires an invitation';
  end if;

  if v_room.is_vip and v_room.owner_id<>v_user then
    select coalesce(p.vip_level,0) into v_vip_level from public.profiles p where p.id=v_user;
    if coalesce(v_vip_level,0)<1 then raise exception 'VIP membership required'; end if;
  end if;

  insert into public.room_members(room_id,user_id,seat_number,role,is_muted)
  values (p_room_id,v_user,null,'member',true)
  on conflict (room_id,user_id) do nothing;

  update public.room_invites set used_at=coalesce(used_at,now())
  where room_id=p_room_id and target_user_id=v_user and used_at is null;
end;
$$;

create or replace function public.ban_room_seat(p_room_id uuid, p_seat_number integer, p_reason text default null)
returns void
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_user uuid := (select auth.uid());
  v_target public.room_members%rowtype;
begin
  if not exists (select 1 from public.rooms r where r.id=p_room_id and r.owner_id=v_user) then
    raise exception 'room owner permission required';
  end if;

  select * into v_target from public.room_members m
  where m.room_id=p_room_id and m.seat_number=p_seat_number;
  if not found then raise exception 'seat is empty'; end if;
  if v_target.user_id=v_user then raise exception 'owner cannot ban self'; end if;

  insert into public.room_bans(room_id,user_id,public_id,display_name,avatar_url,banned_by,reason)
  values (p_room_id,v_target.user_id,v_target.member_public_id,v_target.member_display_name,v_target.member_avatar_url,v_user,nullif(btrim(coalesce(p_reason,'')),''))
  on conflict (room_id,user_id) do update set
    public_id=excluded.public_id, display_name=excluded.display_name,
    avatar_url=excluded.avatar_url, banned_by=excluded.banned_by,
    reason=excluded.reason, created_at=now();

  delete from public.room_members where room_id=p_room_id and user_id=v_target.user_id;
end;
$$;

revoke all on function public.ban_room_seat(uuid,integer,text) from public, anon;
grant execute on function public.ban_room_seat(uuid,integer,text) to authenticated;

-- Realtime for invite/ban state (owner and target only through RLS).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='room_invites') then
    alter publication supabase_realtime add table public.room_invites;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='room_bans') then
    alter publication supabase_realtime add table public.room_bans;
  end if;
end $$;
