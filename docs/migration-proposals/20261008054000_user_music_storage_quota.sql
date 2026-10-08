-- Enforce upload limits at the Storage layer as well as in playlist metadata.
-- A caller must not bypass per-user quotas by uploading files without metadata rows.
create or replace function private.user_music_storage_quota(p_user uuid,p_new_size bigint)
returns boolean language plpgsql volatile security definer set search_path=''
as $$
declare files_count integer;used_bytes bigint;
begin
 if p_user is null then return false;end if;
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended('totichat:music-storage:'||p_user::text,3873));
 select count(*),coalesce(sum(coalesce((o.metadata->>'size')::bigint,0)),0)
 into files_count,used_bytes
 from storage.objects o
 where o.bucket_id='user-music' and split_part(o.name,'/',1)=p_user::text;
 return files_count<30 and used_bytes+greatest(coalesce(p_new_size,15728640),0)<=157286400;
end $$;
revoke all on function private.user_music_storage_quota(uuid,bigint) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.user_music_storage_quota(uuid,bigint) to authenticated;

drop policy if exists user_music_storage_insert_own on storage.objects;
create policy user_music_storage_insert_own on storage.objects
for insert to authenticated with check(
 bucket_id='user-music'
 and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp3|m4a|mp4|ogg|webm|wav)$'
 and private.user_music_storage_quota(
  (select auth.uid()), nullif(metadata->>'size','')::bigint
 )
);
