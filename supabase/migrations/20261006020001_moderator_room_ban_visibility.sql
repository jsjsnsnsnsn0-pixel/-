drop policy if exists room_bans_select_owner_or_self on public.room_bans;
create policy room_bans_select_owner_moderator_or_self on public.room_bans for select to authenticated using (
 user_id = (select auth.uid())
 or exists(select 1 from public.rooms r where r.id=room_id and r.owner_id=(select auth.uid()))
 or exists(select 1 from public.room_members m where m.room_id=room_id and m.user_id=(select auth.uid()) and m.role='moderator')
);
