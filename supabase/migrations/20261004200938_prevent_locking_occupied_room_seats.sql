drop policy if exists room_seat_locks_insert_owner on public.room_seat_locks;
create policy room_seat_locks_insert_owner
on public.room_seat_locks
for insert
to authenticated
with check (
  locked_by = (select auth.uid())
  and exists (
    select 1 from public.rooms r
    where r.id = room_seat_locks.room_id
      and r.owner_id = (select auth.uid())
      and room_seat_locks.seat_number between 1 and r.max_seats
  )
  and not exists (
    select 1 from public.room_members m
    where m.room_id = room_seat_locks.room_id
      and m.seat_number = room_seat_locks.seat_number
  )
);

