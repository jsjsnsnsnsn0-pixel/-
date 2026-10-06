drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_visible
on public.rooms
for select
to authenticated
using (private.can_view_room(id));
