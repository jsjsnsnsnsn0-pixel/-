alter table public.rooms
  add column if not exists category text not null default 'عامة',
  add column if not exists is_private boolean not null default false,
  add column if not exists is_vip boolean not null default false,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists owner_public_id bigint,
  add column if not exists owner_display_name text,
  add column if not exists owner_avatar_url text;

alter table public.room_members
  add column if not exists is_hand_raised boolean not null default false,
  add column if not exists member_public_id bigint,
  add column if not exists member_display_name text,
  add column if not exists member_avatar_url text;

create unique index if not exists room_members_room_user_uidx
  on public.room_members(room_id, user_id);
create unique index if not exists room_members_room_seat_uidx
  on public.room_members(room_id, seat_number)
  where seat_number is not null;
create index if not exists room_members_room_id_idx on public.room_members(room_id);

create table if not exists public.room_seat_locks (
  room_id uuid not null references public.rooms(id) on delete cascade,
  seat_number integer not null check (seat_number between 1 and 20),
  locked_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, seat_number)
);
alter table public.room_seat_locks enable row level security;

create or replace function public.populate_room_snapshot()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  select p.public_id, p.display_name, p.avatar_url
    into new.owner_public_id, new.owner_display_name, new.owner_avatar_url
  from public.profiles p
  where p.id = new.owner_id;
  return new;
end;
$$;

create or replace function public.populate_room_member_snapshot()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  select p.public_id, p.display_name, p.avatar_url
    into new.member_public_id, new.member_display_name, new.member_avatar_url
  from public.profiles p
  where p.id = new.user_id;
  return new;
end;
$$;

create or replace function public.touch_room_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.populate_room_snapshot() from public, anon, authenticated;
revoke execute on function public.populate_room_member_snapshot() from public, anon, authenticated;
revoke execute on function public.touch_room_updated_at() from public, anon, authenticated;

drop trigger if exists rooms_populate_snapshot on public.rooms;
create trigger rooms_populate_snapshot
before insert on public.rooms
for each row execute function public.populate_room_snapshot();

drop trigger if exists room_members_populate_snapshot on public.room_members;
create trigger room_members_populate_snapshot
before insert on public.room_members
for each row execute function public.populate_room_member_snapshot();

drop trigger if exists rooms_touch_updated_at on public.rooms;
create trigger rooms_touch_updated_at
before update on public.rooms
for each row execute function public.touch_room_updated_at();

-- Replace room-member policies with a non-recursive ownership model.
drop policy if exists room_members_delete_self on public.room_members;
drop policy if exists room_members_insert_self on public.room_members;
drop policy if exists room_members_no_self_promotion on public.room_members;
drop policy if exists room_members_select_authenticated on public.room_members;
drop policy if exists room_members_update_self_or_owner on public.room_members;
drop policy if exists room_members_delete_self_or_owner on public.room_members;

create policy room_members_select_authenticated
on public.room_members for select to authenticated
using (true);

create policy room_members_insert_self
on public.room_members for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.rooms r
    where r.id = room_id
      and r.is_active = true
      and (
        role = 'member'
        or (role = 'owner' and r.owner_id = (select auth.uid()))
      )
      and (seat_number is null or seat_number between 1 and r.max_seats)
      and (
        seat_number is null
        or not exists (
          select 1 from public.room_seat_locks l
          where l.room_id = room_members.room_id
            and l.seat_number = room_members.seat_number
        )
      )
  )
);

create policy room_members_update_self_or_owner
on public.room_members for update to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.rooms r
    where r.id = room_id and r.owner_id = (select auth.uid())
  )
)
with check (
  (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.owner_id = (select auth.uid())
    )
  )
  and exists (
    select 1 from public.rooms r
    where r.id = room_id
      and (seat_number is null or seat_number between 1 and r.max_seats)
      and (
        seat_number is null
        or not exists (
          select 1 from public.room_seat_locks l
          where l.room_id = room_members.room_id
            and l.seat_number = room_members.seat_number
        )
      )
  )
);

create policy room_members_delete_self_or_owner
on public.room_members for delete to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.rooms r
    where r.id = room_id and r.owner_id = (select auth.uid())
  )
);

-- Seat locks are visible to signed-in users, but only the room owner can change them.
drop policy if exists room_seat_locks_select_authenticated on public.room_seat_locks;
drop policy if exists room_seat_locks_insert_owner on public.room_seat_locks;
drop policy if exists room_seat_locks_delete_owner on public.room_seat_locks;

create policy room_seat_locks_select_authenticated
on public.room_seat_locks for select to authenticated
using (true);

create policy room_seat_locks_insert_owner
on public.room_seat_locks for insert to authenticated
with check (
  locked_by = (select auth.uid())
  and exists (
    select 1 from public.rooms r
    where r.id = room_id
      and r.owner_id = (select auth.uid())
      and seat_number between 1 and r.max_seats
  )
);

create policy room_seat_locks_delete_owner
on public.room_seat_locks for delete to authenticated
using (
  exists (
    select 1 from public.rooms r
    where r.id = room_id and r.owner_id = (select auth.uid())
  )
);

-- Restrict direct updates to safe room/member columns.
revoke update on public.rooms from authenticated;
grant update (name, description, image_url, is_active, max_seats, category, is_private, is_vip, tags) on public.rooms to authenticated;

revoke update on public.room_members from authenticated;
grant update (seat_number, is_muted, is_hand_raised) on public.room_members to authenticated;

grant select, insert, delete on public.room_seat_locks to authenticated;
revoke all on public.room_seat_locks from anon;

-- Enable Realtime database change feeds for shared room state when not already present.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='room_members') then
    alter publication supabase_realtime add table public.room_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='room_seat_locks') then
    alter publication supabase_realtime add table public.room_seat_locks;
  end if;
end $$;
