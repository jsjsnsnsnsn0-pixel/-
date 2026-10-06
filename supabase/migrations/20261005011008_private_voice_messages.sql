alter table public.direct_messages add column if not exists voice_seconds integer check(voice_seconds between 1 and 120);
alter table public.direct_messages add column if not exists bubble_style text check(bubble_style in('b1','b2'));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values
 ('voice-messages','voice-messages',false,5242880,array['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg'])
 on conflict(id)do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy voice_upload_own on storage.objects for insert to authenticated with check(bucket_id='voice-messages'and(storage.foldername(name))[1]=(select auth.uid())::text);
create policy voice_read_participants on storage.objects for select to authenticated using(bucket_id='voice-messages'and(
 (storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.direct_messages m where m.media_url=name and m.message_type='voice'and(m.sender_id=(select auth.uid())or m.recipient_id=(select auth.uid())))));
create policy voice_remove_unsent on storage.objects for delete to authenticated using(bucket_id='voice-messages'and(storage.foldername(name))[1]=(select auth.uid())::text and not exists(select 1 from public.direct_messages m where m.media_url=name));
create function private.guard_direct_communication()returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t uuid;begin
 -- Service-side maintenance without a JWT remains possible; no arbitrary media URLs.
 if u is not null and new.sender_id<>u then raise exception 'invalid message sender';end if;
 t:=new.recipient_id;
 if exists(select 1 from public.user_blocks where(blocker_id=new.sender_id and blocked_id=t)or(blocker_id=t and blocked_id=new.sender_id))then raise exception 'user is blocked';end if;
 if new.message_type='voice'then
  if new.voice_seconds is null or new.media_url is null or split_part(new.media_url,'/',1)<>new.sender_id::text or not exists(select 1 from storage.objects where bucket_id='voice-messages'and name=new.media_url)then raise exception 'valid uploaded voice message required';end if;
 end if;
 select e.item_id into new.bubble_style from public.user_equipment e where e.user_id=new.sender_id and e.category='bubbles'and exists(select 1 from public.store_purchases p where p.user_id=e.user_id and p.item_id=e.item_id and(p.expires_at is null or p.expires_at>now()));
 return new;
end$$;
revoke all on function private.guard_direct_communication()from public,anon,authenticated;
create trigger zzzz_guard_direct_communication before insert on public.direct_messages for each row execute function private.guard_direct_communication();
notify pgrst,'reload schema';

