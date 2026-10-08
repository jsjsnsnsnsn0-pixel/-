-- TotiChat Beta 0.9.0-beta.3 backend-only hotfix (2026-10-08)
-- Reproduced on Android: set_my_room_seat returned HTTP 400 with
-- 'owner must keep seat one' when the private room owner tapped another mic.
-- The room join itself succeeded (HTTP 204).
-- Owner may sit on any available mic; ownership/moderation is unchanged.
-- The existing membership, room active, seat range, locks, and occupancy
-- checks remain enforced. No user/room/wallet/seat data is rewritten.
-- Live fix was deployed to Supabase; this migration records it for future environments.
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
