-- Runs entirely inside a rolled-back PL/pgSQL subtransaction; no user data persists.
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); r uuid; pa bigint; pb bigint; request uuid:=gen_random_uuid(); g bigint;
begin
 begin
  insert into auth.users(id,aud,role,email) values(a,'authenticated','authenticated',a::text||'@test.invalid'),(b,'authenticated','authenticated',b::text||'@test.invalid');
  update public.profiles set gold=100,diamonds=100,country_code='IQ',country_name='العراق' where id=a;
  select public_id into pa from public.profiles where id=a;
  select public_id into pb from public.profiles where id=b;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform set_config('role','authenticated',true);
  r:=public.create_room('Regression room',p_is_private=>true,p_max_seats=>4);
  begin
   update public.profiles set gold=100000 where id=a;
   raise exception 'wallet write was permitted';
  exception when insufficient_privilege then null; end;
  begin
   perform public.approve_recharge_request(gen_random_uuid());
   raise exception 'non-admin approval permitted';
  exception when raise_exception then
   if sqlerrm<>'not authorized' then raise; end if;
  end;
  begin
   insert into public.room_members(room_id,user_id,role) values(r,a,'moderator');
   raise exception 'direct membership insertion was permitted';
  exception when insufficient_privilege then null; end;
  perform public.convert_diamonds_to_gold(10);
  begin
   perform public.convert_diamonds_to_gold(1000);
   raise exception 'insufficient diamonds were accepted';
  exception when raise_exception then
   if sqlerrm<>'insufficient diamonds' then raise; end if;
  end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  begin
   perform public.join_room(r);
   raise exception 'private room was joined without invitation';
  exception when raise_exception then
   if sqlerrm not in ('room not available','private room requires an invitation') then raise; end if;
  end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform public.invite_room_user(r,pb);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  perform public.join_room(r);
  perform public.set_my_room_seat(r,2);
  begin
   perform public.moderate_room_seat(r,2,'unmute');
   raise exception 'member moderation was permitted';
  exception when raise_exception then
   if sqlerrm<>'room moderation permission required' then raise; end if;
  end;
  perform public.set_my_room_muted(r,false);
  insert into public.direct_messages(recipient_public_id,content,message_type) values(pa,'Regression message','text');
  begin
   update public.direct_messages set content='changed' where sender_id=b;
   raise exception 'message content update was permitted';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform public.send_room_gift(r,pb,'g1',request);
  perform public.send_room_gift(r,pb,'g1',request);
  select gold into g from public.profiles where id=a;
  if g<>93 then raise exception 'gift duplication or wrong conversion: %',g; end if;
  perform public.set_room_seat_locked(r,2,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  begin
   perform public.set_my_room_seat(r,2);
   raise exception 'locked seat was accepted';
  exception when raise_exception then
   if sqlerrm<>'seat is locked' then raise; end if;
  end;
  perform set_config('role','postgres',true);
  if (select count(*) from public.gift_events where request_id=request)<>1 then raise exception 'gift request is not idempotent'; end if;
  if (select diamonds from public.profiles where id=b)<>10 then raise exception 'recipient reward incorrect'; end if;
  if (select count(*) from public.wallet_transactions where user_id in (a,b))<>3 then raise exception 'ledger mismatch'; end if;
  raise exception using errcode='P0002',message='rollback successful test fixtures';
 exception when no_data_found then null;
 end;
end $$;
select 'PASS: wallet protection, conversion, role checks, private rooms, seat locks, immutable messages, idempotent gifting, ledger' as regression;
