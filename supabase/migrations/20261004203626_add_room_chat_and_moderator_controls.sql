create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_public_id bigint,
  sender_display_name text,
  sender_avatar_url text,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.room_messages enable row level security;
create index if not exists room_messages_room_created_idx on public.room_messages(room_id, created_at desc);
create index if not exists room_messages_sender_idx on public.room_messages(sender_id);

create or replace function private.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_room_member(uuid) from public, anon;
grant execute on function private.is_room_member(uuid) to authenticated;

create or replace function public.prepare_room_message()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not private.is_room_member(new.room_id) then raise exception 'room membership required'; end if;

  new.sender_id := v_user;
  new.content := nullif(btrim(coalesce(new.content,'')), '');
  if new.content is null then raise exception 'message is empty'; end if;
  if char_length(new.content) > 1000 then raise exception 'message is too long'; end if;

  select p.public_id,p.display_name,p.avatar_url
    into new.sender_public_id,new.sender_display_name,new.sender_avatar_url
  from public.profiles p
  where p.id = v_user;

  return new;
end;
$$;

drop trigger if exists room_messages_prepare on public.room_messages;
create trigger room_messages_prepare
before insert on public.room_messages
for each row execute function public.prepare_room_message();

drop policy if exists room_messages_select_members on public.room_messages;
create policy room_messages_select_members
on public.room_messages for select to authenticated
using (private.is_room_member(room_id));

drop policy if exists room_messages_insert_members on public.room_messages;
create policy room_messages_insert_members
on public.room_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and private.is_room_member(room_id));

revoke all on public.room_messages from anon, authenticated;
grant select, insert on public.room_messages to authenticated;

create or replace function public.set_room_moderator(
  p_room_id uuid,
  p_target_public_id bigint,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_target public.room_members%rowtype;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not exists (
    select 1 from public.rooms r where r.id = p_room_id and r.owner_id = v_user
  ) then
    raise exception 'room owner permission required';
  end if;

  select * into v_target
  from public.room_members m
  where m.room_id = p_room_id and m.member_public_id = p_target_public_id;

  if not found then raise exception 'target user is not in this room'; end if;
  if v_target.user_id = v_user or v_target.role = 'owner' then
    raise exception 'owner role cannot be changed';
  end if;

  update public.room_members
  set role = case when coalesce(p_enabled,false) then 'moderator' else 'member' end
  where id = v_target.id;
end;
$$;
revoke all on function public.set_room_moderator(uuid,bigint,boolean) from public, anon;
grant execute on function public.set_room_moderator(uuid,bigint,boolean) to authenticated;

create or replace function public.moderate_room_seat(
  p_room_id uuid,
  p_seat_number integer,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_is_owner boolean;
  v_is_moderator boolean;
  v_target public.room_members%rowtype;
  v_action text := lower(btrim(coalesce(p_action,'')));
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_seat_number is null or p_seat_number < 1 or p_seat_number > 20 then
    raise exception 'invalid seat number';
  end if;

  select exists(select 1 from public.rooms r where r.id=p_room_id and r.owner_id=v_user)
    into v_is_owner;
  select exists(
    select 1 from public.room_members m
    where m.room_id=p_room_id and m.user_id=v_user and m.role='moderator'
  ) into v_is_moderator;

  if not coalesce(v_is_owner,false) and not coalesce(v_is_moderator,false) then
    raise exception 'room moderation permission required';
  end if;

  select * into v_target
  from public.room_members m
  where m.room_id=p_room_id and m.seat_number=p_seat_number;
  if not found then raise exception 'seat is empty'; end if;

  if v_target.role='owner' then raise exception 'owner cannot be moderated'; end if;
  if v_is_moderator and v_target.role='moderator' then
    raise exception 'moderator cannot moderate another moderator';
  end if;

  if v_action='mute' then
    update public.room_members set is_muted=true where id=v_target.id;
  elsif v_action='unmute' then
    update public.room_members set is_muted=false where id=v_target.id;
  elsif v_action='remove' then
    update public.room_members
    set seat_number=null,is_muted=true,is_hand_raised=false
    where id=v_target.id;
  else
    raise exception 'unsupported moderation action';
  end if;
end;
$$;
revoke all on function public.moderate_room_seat(uuid,integer,text) from public, anon;
grant execute on function public.moderate_room_seat(uuid,integer,text) to authenticated;

create or replace function public.invite_room_user(p_room_id uuid, p_target_public_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_target uuid;
  v_allowed boolean;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_target_public_id is null or p_target_public_id <= 0 then
    raise exception 'invalid target public id';
  end if;

  select (
    r.owner_id=v_user or exists(
      select 1 from public.room_members m
      where m.room_id=r.id and m.user_id=v_user and m.role='moderator'
    )
  ) into v_allowed
  from public.rooms r where r.id=p_room_id;

  if not coalesce(v_allowed,false) then
    raise exception 'room moderation permission required';
  end if;

  select p.id into v_target from public.profiles p where p.public_id=p_target_public_id;
  if v_target is null then raise exception 'target user not found'; end if;
  if v_target=v_user then raise exception 'cannot invite yourself'; end if;
  if exists(select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=v_target) then
    raise exception 'target user is banned from this room';
  end if;

  delete from public.room_invites where room_id=p_room_id and target_user_id=v_target;
  insert into public.room_invites(room_id,target_user_id,target_public_id,invited_by,expires_at,used_at)
  values(p_room_id,v_target,p_target_public_id,v_user,now()+interval '24 hours',null);
end;
$$;
revoke all on function public.invite_room_user(uuid,bigint) from public, anon;
grant execute on function public.invite_room_user(uuid,bigint) to authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;
END $$;
