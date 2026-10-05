create table public.room_audio_signals (
 id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
 sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('ready','offer','answer','ice')),
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=65536),
 created_at timestamptz not null default now(), check(sender_id<>recipient_id)
);
alter table public.room_audio_signals enable row level security;
create index room_audio_signals_room_idx on public.room_audio_signals(room_id);
create index room_audio_signals_sender_idx on public.room_audio_signals(sender_id,created_at);
create index room_audio_signals_recipient_idx on public.room_audio_signals(recipient_id,created_at);
create policy audio_signals_insert_member on public.room_audio_signals for insert to authenticated with check (
 sender_id=(select auth.uid()) and private.is_room_member(room_id) and exists (
 select 1 from public.room_members m where m.room_id=room_audio_signals.room_id and m.user_id=room_audio_signals.recipient_id
 ));
create policy audio_signals_read_recipient on public.room_audio_signals for select to authenticated using (
 recipient_id=(select auth.uid()) and private.is_room_member(room_id) and created_at>now()-interval '2 minutes'
);
create policy audio_signals_delete_participant on public.room_audio_signals for delete to authenticated using (
 sender_id=(select auth.uid()) or recipient_id=(select auth.uid())
);
grant select,delete on public.room_audio_signals to authenticated;
grant insert(room_id,recipient_id,kind,payload) on public.room_audio_signals to authenticated;
alter publication supabase_realtime add table public.room_audio_signals;
