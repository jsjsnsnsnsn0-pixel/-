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
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select * into v_room
  from public.rooms r
  where r.id = p_room_id and r.is_active = true;

  if not found then
    raise exception 'room not available';
  end if;

  if v_room.is_private and v_room.owner_id <> v_user then
    raise exception 'private room requires an invitation';
  end if;

  if v_room.is_vip and v_room.owner_id <> v_user then
    select coalesce(p.vip_level, 0)
      into v_vip_level
    from public.profiles p
    where p.id = v_user;

    if coalesce(v_vip_level, 0) < 1 then
      raise exception 'VIP membership required';
    end if;
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
  v_owner uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select r.owner_id into v_owner
  from public.rooms r
  where r.id = p_room_id;

  if v_owner = v_user then
    update public.room_members
    set is_muted = true,
        is_hand_raised = false,
        seat_number = 1
    where room_id = p_room_id and user_id = v_user;
    return;
  end if;

  delete from public.room_members
  where room_id = p_room_id and user_id = v_user;
end;
$$;
