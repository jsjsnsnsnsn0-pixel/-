begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); m uuid:=gen_random_uuid();
 r1 uuid:=gen_random_uuid(); r2 uuid:=gen_random_uuid(); l1 uuid:=gen_random_uuid(); l2 uuid:=gen_random_uuid();
 song uuid:=gen_random_uuid(); command uuid:=gen_random_uuid(); track uuid:=gen_random_uuid(); first jsonb; again jsonb;
begin
 insert into auth.users(id,aud,role,email)values
 (a,'authenticated','authenticated',a::text||'@test.invalid'),
 (b,'authenticated','authenticated',b::text||'@test.invalid'),
 (m,'authenticated','authenticated',m::text||'@test.invalid');
 insert into public.rooms(id,owner_id,name)values(r1,a,'Audit room A'),(r2,b,'Audit room B');
 insert into public.room_members(room_id,user_id,role)values(r1,a,'owner'),(r1,m,'moderator');
 insert into public.room_moderation_log(id,room_id,actor_id,action)values(l1,r1,a,'audit_test'),(l2,r2,b,'audit_test');
 update public.beta_feature_flags set enabled=true where id='music_enabled';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',m,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 if not exists(select 1 from public.room_moderation_log where id=l1)then raise exception 'Own room log denied';end if;
 if exists(select 1 from public.room_moderation_log where id=l2)then raise exception 'Cross-room log leaked';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 insert into public.user_music_library(id,user_id,name,storage_path,content_type,file_size_bytes,duration_seconds)
 values(song,a,'Rollback music',a::text||'/'||song::text||'.mp3','audio/mpeg',100,60);
 if not exists(select 1 from public.user_music_library where id=song)then raise exception 'Own music not persisted';end if;
 first:=public.room_music_control(r1,'play',command,track,'Rollback music',60,null);
 again:=public.room_music_control(r1,'play',command,track,'Rollback music',60,null);
 if first<>again or first->>'status'<>'playing' then raise exception 'Music retry changed state';end if;
 perform public.room_music_control(r1,'pause',gen_random_uuid());
 perform public.room_music_control(r1,'resume',gen_random_uuid());
 perform public.room_music_control(r1,'stop',gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 if exists(select 1 from public.user_music_library where id=song)then raise exception 'Other account music leaked';end if;
 delete from public.user_music_library where id=song;
 begin
  perform public.room_music_control(r1,'stop',gen_random_uuid());
  raise exception 'Outsider controlled music';
 exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 if not exists(select 1 from public.user_music_library where id=song)then raise exception 'Other account deleted music';end if;
 perform set_config('role','postgres',true);
end$$;
rollback;
select 'PASS: music persistence, account isolation, authorized playback/retry/pause/resume/stop, outsider rejection and room-scoped logs; fixtures rolled back' as result;
