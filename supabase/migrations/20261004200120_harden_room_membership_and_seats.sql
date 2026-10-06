create unique index if not exists room_members_room_user_uidx
  on public.room_members(room_id, user_id);

create unique index if not exists room_members_room_seat_uidx
  on public.room_members(room_id, seat_number)
  where seat_number is not null;

drop policy if exists room_members_update_self_or_owner on public.room_members;
create policy room_members_update_self_or_owner
on public.room_members
for update
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.rooms r
    where r.id = room_members.room_id
      and r.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.rooms r
    where r.id = room_members.room_id
      and (
        r.owner_id = (select auth.uid())
        or ((select auth.uid()) = room_members.user_id and room_members.role = 'member')
      )
      and (
        room_members.seat_number is null
        or (
          room_members.seat_number between 1 and r.max_seats
          and not exists (
            select 1 from public.room_seat_locks l
            where l.room_id = room_members.room_id
              and l.seat_number = room_members.seat_number
          )
        )
      )
  )
);

