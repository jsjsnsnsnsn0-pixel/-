drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated
on public.rooms for select to authenticated
using (
  owner_id=(select auth.uid())
  or (
    is_active=true
    and is_private=false
    and not exists (
      select 1 from public.room_bans b
      where b.room_id=rooms.id and b.user_id=(select auth.uid())
    )
  )
  or exists (
    select 1 from public.room_members rm
    where rm.room_id=rooms.id and rm.user_id=(select auth.uid())
  )
  or exists (
    select 1 from public.room_invites ri
    where ri.room_id=rooms.id
      and ri.target_user_id=(select auth.uid())
      and ri.used_at is null
      and ri.expires_at>now()
      and not exists (
        select 1 from public.room_bans b
        where b.room_id=rooms.id and b.user_id=(select auth.uid())
      )
  )
);
