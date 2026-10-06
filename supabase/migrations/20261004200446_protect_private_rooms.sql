drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated
on public.rooms for select to authenticated
using (
  owner_id = (select auth.uid())
  or (
    is_active = true
    and is_private = false
  )
  or exists (
    select 1 from public.room_members rm
    where rm.room_id = rooms.id
      and rm.user_id = (select auth.uid())
  )
);
