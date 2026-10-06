create or replace function private.can_view_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and (
        r.owner_id = (select auth.uid())
        or (
          r.is_active = true
          and r.is_private = false
          and not exists (
            select 1 from public.room_bans b
            where b.room_id = r.id and b.user_id = (select auth.uid())
          )
        )
        or exists (
          select 1 from public.room_members m
          where m.room_id = r.id and m.user_id = (select auth.uid())
        )
        or exists (
          select 1 from public.room_invites i
          where i.room_id = r.id
            and i.target_user_id = (select auth.uid())
            and i.used_at is null
            and i.expires_at > now()
            and not exists (
              select 1 from public.room_bans b
              where b.room_id = r.id and b.user_id = (select auth.uid())
            )
        )
      )
  );
$$;

revoke all on function private.can_view_room(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.can_view_room(uuid) to authenticated;
revoke all on function private.claim_account_id(uuid) from public, anon, authenticated;

drop policy if exists room_members_select_authenticated on public.room_members;
create policy room_members_select_visible_room
on public.room_members
for select
to authenticated
using (private.can_view_room(room_id));

drop policy if exists room_seat_locks_select_authenticated on public.room_seat_locks;
create policy room_seat_locks_select_visible_room
on public.room_seat_locks
for select
to authenticated
using (private.can_view_room(room_id));
