create or replace function public.create_room(
  p_name text,
  p_description text default null,
  p_image_url text default null,
  p_max_seats integer default 8,
  p_category text default 'عامة',
  p_is_private boolean default false,
  p_is_vip boolean default false,
  p_tags text[] default '{}'::text[]
)
returns uuid
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_user uuid := (select auth.uid());
  v_room_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'room name is required';
  end if;
  if p_max_seats < 1 or p_max_seats > 20 then
    raise exception 'invalid seat count';
  end if;

  insert into public.rooms(
    owner_id, name, description, image_url, max_seats,
    category, is_private, is_vip, tags
  ) values (
    v_user, btrim(p_name), nullif(btrim(coalesce(p_description,'')), ''),
    nullif(btrim(coalesce(p_image_url,'')), ''), p_max_seats,
    coalesce(nullif(btrim(p_category), ''), 'عامة'),
    coalesce(p_is_private, false), coalesce(p_is_vip, false),
    coalesce(p_tags, '{}'::text[])
  ) returning id into v_room_id;

  insert into public.room_members(room_id, user_id, seat_number, role, is_muted)
  values (v_room_id, v_user, 1, 'owner', false);

  return v_room_id;
end;
$$;

create or replace function public.join_room(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.rooms r where r.id = p_room_id and r.is_active = true
  ) then
    raise exception 'room not available';
  end if;

  insert into public.room_members(room_id, user_id, seat_number, role, is_muted)
  values (p_room_id, v_user, null, 'member', true)
  on conflict (room_id, user_id) do nothing;
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  delete from public.room_members where room_id = p_room_id and user_id = v_user;
end;
$$;

revoke all on function public.create_room(text,text,text,integer,text,boolean,boolean,text[]) from public, anon;
revoke all on function public.join_room(uuid) from public, anon;
revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.create_room(text,text,text,integer,text,boolean,boolean,text[]) to authenticated;
grant execute on function public.join_room(uuid) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
