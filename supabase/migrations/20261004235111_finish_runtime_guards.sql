-- Explicit grants avoid inheriting broad default table privileges.
revoke all on public.gift_catalog,public.gift_events,public.room_audio_signals from anon,authenticated;
grant select on public.gift_catalog,public.gift_events to authenticated;
grant select,delete on public.room_audio_signals to authenticated;
grant insert(room_id,recipient_id,kind,payload) on public.room_audio_signals to authenticated;
drop policy audio_signals_read_recipient on public.room_audio_signals;
create policy audio_signals_read_participant on public.room_audio_signals for select to authenticated using (
 (sender_id=(select auth.uid()) or recipient_id=(select auth.uid())) and private.is_room_member(room_id)
 and created_at>now()-interval '2 minutes'
);
-- Internal account allocation is callable only by the signup trigger owner.
revoke execute on function private.claim_account_id(uuid) from public,anon,authenticated;
