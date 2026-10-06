grant insert, select, update on public.direct_messages to authenticated;
grant insert, select, update, delete on public.room_invites to authenticated;
revoke truncate, references, trigger on public.direct_messages from authenticated;
revoke truncate, references, trigger on public.room_invites from authenticated;
