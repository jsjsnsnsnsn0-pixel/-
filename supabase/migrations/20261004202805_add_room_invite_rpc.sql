create or replace function public.invite_room_user(p_room_id uuid, p_target_public_id bigint)
returns void
language plpgsql
security invoker
set search_path = 'public'
as $$
declare
  v_user uuid := (select auth.uid());
  v_target uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  if p_target_public_id is null or p_target_public_id <= 0 then
    raise exception 'invalid target public id';
  end if;

  if not exists (
    select 1 from public.rooms r
    where r.id = p_room_id and r.owner_id = v_user
  ) then
    raise exception 'room owner permission required';
  end if;

  select p.id into v_target
  from public.profiles p
  where p.public_id = p_target_public_id;

  if v_target is null then
    raise exception 'target user not found';
  end if;

  if v_target = v_user then
    raise exception 'cannot invite yourself';
  end if;

  if exists (
    select 1 from public.room_bans b
    where b.room_id = p_room_id and b.user_id = v_target
  ) then
    raise exception 'target user is banned from this room';
  end if;

  delete from public.room_invites
  where room_id = p_room_id and target_user_id = v_target;

  insert into public.room_invites(room_id, target_public_id)
  values (p_room_id, p_target_public_id);
end;
$$;

revoke all on function public.invite_room_user(uuid,bigint) from public, anon;
grant execute on function public.invite_room_user(uuid,bigint) to authenticated;
