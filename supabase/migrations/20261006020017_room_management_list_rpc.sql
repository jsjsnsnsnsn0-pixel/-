create or replace function public.get_room_management_members(p_room_id uuid)
returns table(public_id bigint, display_name text, avatar_url text, role text, is_muted boolean, seat_number integer)
language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from rooms r where r.id=p_room_id and (r.owner_id=auth.uid() or exists(select 1 from room_members me where me.room_id=p_room_id and me.user_id=auth.uid() and me.role='moderator'))) then raise exception 'moderator permission required'; end if;
 return query select m.member_public_id, coalesce(m.member_display_name,m.member_username,'مستخدم'), m.member_avatar_url, m.role, m.is_muted, m.seat_number from room_members m where m.room_id=p_room_id order by case when m.role='owner' then 0 when m.role='moderator' then 1 else 2 end, m.joined_at;
end $$;
revoke all on function public.get_room_management_members(uuid) from public,anon;
grant execute on function public.get_room_management_members(uuid) to authenticated;

create or replace function public.get_room_bans(p_room_id uuid)
returns table(public_id bigint, display_name text, avatar_url text, reason text, created_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from rooms r where r.id=p_room_id and (r.owner_id=auth.uid() or exists(select 1 from room_members me where me.room_id=p_room_id and me.user_id=auth.uid() and me.role='moderator'))) then raise exception 'moderator permission required'; end if;
 return query select b.public_id, coalesce(b.display_name,'مستخدم'), b.avatar_url, b.reason, b.created_at from room_bans b where b.room_id=p_room_id order by b.created_at desc;
end $$;
revoke all on function public.get_room_bans(uuid) from public,anon;
grant execute on function public.get_room_bans(uuid) to authenticated;
