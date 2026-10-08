-- Beta private room fix, backend-only: avoid restricting owner to seat 1,
-- while preserving owner role, room access permissions and anti-collision checks.
CREATE OR REPLACE FUNCTION private.set_my_room_seat(p_room_id uuid, p_seat_number integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=(select auth.uid()); v_room public.rooms%rowtype; v_member public.room_members%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_room from public.rooms where id=p_room_id and is_active for update;
 if not found then raise exception 'room not available'; end if;
 select * into v_member from public.room_members where room_id=p_room_id and user_id=v_user for update;
 if not found then raise exception 'room membership required'; end if;
 -- The owner may change seats while retaining the owner role. All existing range, lock, occupancy and membership checks stay enforced.
 if p_seat_number is not null then
  if p_seat_number<1 or p_seat_number>v_room.max_seats then raise exception 'invalid seat number'; end if;
  if exists(select 1 from public.room_seat_locks where room_id=p_room_id and seat_number=p_seat_number) then raise exception 'seat is locked'; end if;
  if exists(select 1 from public.room_members where room_id=p_room_id and seat_number=p_seat_number and user_id<>v_user) then raise exception 'seat is occupied'; end if;
 end if;
 update public.room_members set seat_number=p_seat_number,is_muted=true,is_hand_raised=false where id=v_member.id;
end; $function$
