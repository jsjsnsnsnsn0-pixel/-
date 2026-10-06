drop index if exists public.room_members_room_user_uidx;
create index if not exists room_seat_locks_locked_by_idx on public.room_seat_locks(locked_by);
