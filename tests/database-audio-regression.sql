do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); r uuid; pb bigint; n bigint;
begin
 begin
  insert into auth.users(id,aud,role,email) values(a,'authenticated','authenticated',a::text||'@test.invalid'),(b,'authenticated','authenticated',b::text||'@test.invalid'),(c,'authenticated','authenticated',c::text||'@test.invalid');
  select public_id into pb from public.profiles where id=b;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  r:=public.create_room('Audio regression');
  if exists(select 1 from public.room_members where room_id=r and user_id=a and not is_muted) then raise exception 'microphone defaults to unmuted'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  perform public.join_room(r);
  insert into public.room_audio_signals(room_id,recipient_id,kind,payload) values(r,a,'ready','{}');
  begin
   insert into public.room_audio_signals(room_id,sender_id,recipient_id,kind,payload) values(r,a,b,'ready','{}');
   raise exception 'audio sender could be forged';
  exception when insufficient_privilege then null; when raise_exception then if sqlerrm<>'invalid sender' then raise; end if; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);
  select count(*) into n from public.room_audio_signals where room_id=r;
  if n<>0 then raise exception 'outsider can read audio signaling'; end if;
  begin
   insert into public.room_audio_signals(room_id,recipient_id,kind,payload) values(r,a,'ready','{}');
   raise exception 'outsider can write audio signaling';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  select count(*) into n from public.room_audio_signals where room_id=r;
  if n<>1 then raise exception 'recipient cannot read signaling'; end if;
  perform set_config('role','postgres',true);
  raise exception using errcode='P0002',message='rollback successful test fixtures';
 exception when no_data_found then null; end;
end $$;
select 'PASS: audio sender is authenticated, outsiders cannot signal/read, recipient can receive, microphones start muted' as regression;
