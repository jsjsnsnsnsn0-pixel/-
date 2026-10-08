-- Per-account private music library for TotiChat Beta. Non-destructive to existing app data.
-- Files reside under {auth.uid()}/{music_id}.{ext}; they are never public.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('user-music','user-music',false,15728640,
 array['audio/mpeg','audio/mp4','audio/ogg','audio/webm','audio/wav','audio/x-wav'])
on conflict(id) do update set
  public=false,file_size_limit=15728640,
  allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.user_music_library (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 160),
 storage_path text not null unique,
 content_type text not null check(content_type in ('audio/mpeg','audio/mp4','audio/ogg','audio/webm','audio/wav','audio/x-wav')),
 file_size_bytes integer not null check(file_size_bytes between 1 and 15728640),
 duration_seconds numeric(9,2) not null check(duration_seconds>0 and duration_seconds<=3600),
 created_at timestamptz not null default now(),
 constraint user_music_path_matches_owner check (
  storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp3|m4a|mp4|ogg|webm|wav)$'
  and split_part(storage_path,'/',1)=user_id::text
  and split_part(split_part(storage_path,'/',2),'.',1)=id::text
 )
);
create index if not exists user_music_owner_time on public.user_music_library(user_id,created_at desc);

create or replace function private.user_music_enforce_quota()
returns trigger language plpgsql security definer set search_path='' as $$
declare count_tracks integer;bytes_total bigint;
begin
 perform pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended('totichat:music:'||new.user_id::text,3873));
 select count(*),coalesce(sum(file_size_bytes),0) into count_tracks,bytes_total
 from public.user_music_library
 where user_id=new.user_id and id<>new.id;
 if count_tracks>=30 or bytes_total+new.file_size_bytes>157286400 then
   raise exception 'music library quota exceeded (30 songs / 150 MB)' using errcode='23514';
 end if;
 return new;
end $$;
drop trigger if exists user_music_check_quota on public.user_music_library;
create trigger user_music_check_quota before insert or update on public.user_music_library
for each row execute function private.user_music_enforce_quota();

alter table public.user_music_library enable row level security;
revoke all on public.user_music_library from public,anon;
grant select,insert,delete on public.user_music_library to authenticated;
drop policy if exists user_music_select_own on public.user_music_library;
create policy user_music_select_own on public.user_music_library
 for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists user_music_insert_own on public.user_music_library;
create policy user_music_insert_own on public.user_music_library
 for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists user_music_delete_own on public.user_music_library;
create policy user_music_delete_own on public.user_music_library
 for delete to authenticated using(user_id=(select auth.uid()));

-- Storage API selects are required for private .download() and removal.
drop policy if exists user_music_storage_select_own on storage.objects;
create policy user_music_storage_select_own on storage.objects
for select to authenticated using(
 bucket_id='user-music' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists user_music_storage_insert_own on storage.objects;
create policy user_music_storage_insert_own on storage.objects
for insert to authenticated with check(
 bucket_id='user-music'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp3|m4a|mp4|ogg|webm|wav)$');
drop policy if exists user_music_storage_delete_own on storage.objects;
create policy user_music_storage_delete_own on storage.objects
for delete to authenticated using(
 bucket_id='user-music' and (storage.foldername(name))[1]=(select auth.uid())::text);

notify pgrst,'reload schema';
