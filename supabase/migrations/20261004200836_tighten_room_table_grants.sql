revoke all privileges on table public.room_seat_locks from anon, authenticated;
grant select, insert, delete on table public.room_seat_locks to authenticated;

grant update on table public.room_members to authenticated;

