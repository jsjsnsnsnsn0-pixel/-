-- All fixtures and failure-injection triggers roll back, including successful runs.
begin;
create function private.currency_test_failure() returns trigger language plpgsql as $$begin raise exception 'injected ledger failure';end$$;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); r uuid; pb bigint; request uuid; result jsonb; original_gold bigint; original_diamonds bigint; count_before bigint; tests integer:=0; amount bigint;
begin
 insert into auth.users(id,aud,role,email) values(a,'authenticated','authenticated',a||'@test.invalid'),(b,'authenticated','authenticated',b||'@test.invalid'),(c,'authenticated','authenticated',c||'@test.invalid');
 update public.profiles set gold=2000000,country_code='IQ',country_name='العراق' where id=a;
 update public.profiles set diamonds=777 where id=b; -- Unknown legacy cannot be auto-converted.
 select public_id into pb from public.profiles where id=b;
 insert into public.gift_catalog(id,name,price,is_active,diamond_source_type) values('test-fixed-'||a,'Test fixed',10000,true,'FIXED_GIFT'),('test-lucky-'||a,'Test lucky',10000,true,'LUCKY_GIFT');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 r:=public.create_room('Currency regression');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);perform public.join_room(r);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 request:=gen_random_uuid();perform public.send_room_gift(r,pb,'test-fixed-'||a,request);perform public.send_room_gift(r,pb,'test-fixed-'||a,request);
 perform set_config('role','postgres',true);
 if (select gold from public.profiles where id=a)<>1990000 or (select diamonds from public.profiles where id=b)<>10777 or (select sum(diamonds_amount) from public.diamond_lots where user_id=b and source_type='FIXED_GIFT')<>10000 then raise exception 'Fixed gift or idempotency failed';end if;tests:=tests+2;
 perform set_config('role','authenticated',true);perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 request:=gen_random_uuid();result:=public.redeem_diamonds(10000,request);
 if (result->>'coins_amount')::bigint<>3000 then raise exception 'Fixed 10k failed';end if;tests:=tests+1;
 perform public.redeem_diamonds(10000,request);
 if (public.wallet_diamond_state()->>'diamonds_balance')::bigint<>777 then raise exception 'redemption replay changed wallet';end if;tests:=tests+1;
 begin perform public.redeem_diamonds(10000,gen_random_uuid());raise exception 'double redemption allowed';exception when raise_exception then if sqlerrm<>'insufficient diamonds' then raise;end if;end;tests:=tests+1;
 begin perform public.redeem_diamonds(777,gen_random_uuid());raise exception 'legacy redeemed';exception when raise_exception then if sqlerrm<>'insufficient redeemable diamonds' then raise;end if;end;tests:=tests+1;
 begin perform public.redeem_diamonds(999,request);raise exception 'mismatched replay allowed';exception when raise_exception then if sqlerrm<>'request id already used' then raise;end if;end;tests:=tests+1;
 -- Generate larger source lots through the actual gift RPC, not direct issuance.
 perform set_config('role','postgres',true);update public.gift_catalog set price=100000 where id='test-fixed-'||a;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result:=public.redeem_diamonds(100000,gen_random_uuid());if (result->>'coins_amount')::bigint<>30000 then raise exception 'Fixed 100k failed';end if;tests:=tests+1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.send_room_gift(r,pb,'test-lucky-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result:=public.redeem_diamonds(10000,gen_random_uuid());if (result->>'coins_amount')::bigint<>1000 or (result->>'lucky_diamonds')::bigint<>10000 then raise exception 'Lucky 10k failed';end if;tests:=tests+1;
 perform set_config('role','postgres',true);update public.gift_catalog set price=100000 where id='test-lucky-'||a;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 perform public.send_room_gift(r,pb,'test-lucky-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result:=public.redeem_diamonds(100000,gen_random_uuid());if (result->>'coins_amount')::bigint<>10000 then raise exception 'Lucky 100k failed';end if;tests:=tests+1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());perform public.send_room_gift(r,pb,'test-lucky-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result:=public.preview_diamond_redemption(200000);if (result->>'coins_amount')::bigint<>40000 then raise exception 'mixed preview failed';end if;tests:=tests+1;
 result:=public.redeem_diamonds(200000,gen_random_uuid());if (result->>'coins_amount')::bigint<>40000 or (result->>'fixed_diamonds')::bigint<>100000 or (result->>'lucky_diamonds')::bigint<>100000 then raise exception 'mixed redemption failed';end if;tests:=tests+1;
 begin update public.profiles set gold=gold+1 where id=b;raise exception 'Coins direct edit allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 begin update public.profiles set diamonds=diamonds+1 where id=b;raise exception 'Diamonds direct edit allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 begin insert into public.diamond_lots(user_id,source_type,diamonds_amount) values(b,'LEGACY_UNKNOWN',100);raise exception 'self issuance allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 begin update public.diamond_lots set source_type='FIXED_GIFT' where user_id=b;raise exception 'source edit allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 begin update public.gift_catalog set diamond_source_type='FIXED_GIFT' where id='test-lucky-'||a;raise exception 'gift type edit allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 foreach amount in array array[0::bigint,-1,9223372036854775807] loop
  begin perform public.redeem_diamonds(amount,gen_random_uuid());raise exception 'invalid amount allowed';exception when raise_exception then if sqlerrm<>'invalid diamond amount' then raise;end if;end;tests:=tests+1;
 end loop;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'role','authenticated')::text,true);perform public.join_room(r);
 begin perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());raise exception 'insufficient Coins allowed';exception when raise_exception then if sqlerrm<>'insufficient gold' then raise;end if;end;tests:=tests+1;
 begin perform public.redeem_diamonds(1,gen_random_uuid());raise exception 'other wallet redeemed';exception when raise_exception then if sqlerrm<>'insufficient diamonds' then raise;end if;end;tests:=tests+1;
 if exists(select 1 from public.diamond_lots where user_id=b) then raise exception 'foreign lots visible';end if;tests:=tests+1;
 -- Inject a failure after wallets and gift event have been written.
 perform set_config('role','postgres',true);
 select gold into original_gold from public.profiles where id=a;select diamonds into original_diamonds from public.profiles where id=b;
 select count(*) into count_before from public.gift_events;
 execute 'create trigger currency_failure before insert on public.diamond_lots for each row execute function private.currency_test_failure()';
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 begin perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());raise exception 'failure injection missed';exception when raise_exception then if sqlerrm<>'injected ledger failure' then raise;end if;end;
 perform set_config('role','postgres',true);execute 'drop trigger currency_failure on public.diamond_lots';
 if (select gold from public.profiles where id=a)<>original_gold or (select diamonds from public.profiles where id=b)<>original_diamonds or (select count(*) from public.gift_events)<>count_before then raise exception 'gift rollback failed';end if;tests:=tests+1;
 -- Redemption failure after allocation and wallet update also rolls back.
 perform set_config('role','authenticated',true);perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 perform set_config('role','postgres',true);select gold,diamonds into original_gold,original_diamonds from public.profiles where id=b;
 select count(*) into count_before from public.diamond_redemptions;
 execute 'create trigger currency_failure before insert on public.wallet_transactions for each row execute function private.currency_test_failure()';
 perform set_config('role','authenticated',true);
 begin perform public.redeem_diamonds(100000,gen_random_uuid());raise exception 'failure injection missed';exception when raise_exception then if sqlerrm<>'injected ledger failure' then raise;end if;end;
 perform set_config('role','postgres',true);execute 'drop trigger currency_failure on public.wallet_transactions';
 if (select gold from public.profiles where id=b)<>original_gold or (select diamonds from public.profiles where id=b)<>original_diamonds or (select count(*) from public.diamond_redemptions)<>count_before then raise exception 'redemption rollback failed';end if;tests:=tests+1;
 if (select sum(diamonds_amount) from public.diamond_lots where user_id=b and source_type='FIXED_GIFT')-(select coalesce(sum(x.diamonds_amount),0) from public.diamond_redemption_allocations x join public.diamond_lots l on l.id=x.lot_id where l.user_id=b and l.source_type='FIXED_GIFT')<>100000 then raise exception 'allocations did not rollback';end if;tests:=tests+1;
 -- Legacy RPC uses ledger too, never a blanket rate.
 perform set_config('role','authenticated',true);perform public.convert_diamonds_to_gold(100000);
 perform set_config('role','postgres',true);if (select diamonds from public.profiles where id=b)<>777 then raise exception 'legacy RPC changed unknown diamonds';end if;tests:=tests+1;

 -- Fractional source totals floor independently, including a partial FIFO consume.
 update public.gift_catalog set price=11 where id='test-fixed-'||a;
 update public.gift_catalog set price=19 where id='test-lucky-'||a;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());perform public.send_room_gift(r,pb,'test-lucky-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 result:=public.preview_diamond_redemption(21);if (result->>'coins_amount')::bigint<>4 or (result->>'fixed_diamonds')::bigint<>11 or (result->>'lucky_diamonds')::bigint<>10 then raise exception 'partial FIFO/floor quote failed';end if;tests:=tests+1;
 perform public.redeem_diamonds(21,gen_random_uuid());
 begin perform public.redeem_diamonds(9,gen_random_uuid());raise exception 'zero Coin payout accepted';exception when raise_exception then if sqlerrm<>'diamond amount is too small' then raise;end if;end;tests:=tests+1;
 -- Allocations cannot be injected or edited by authenticated clients.
 begin insert into public.diamond_redemption_allocations values(gen_random_uuid(),gen_random_uuid(),1);raise exception 'allocation forgery allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 perform set_config('role','postgres',true);
 begin update public.diamond_lots set source_type='FIXED_GIFT' where user_id=b and source_type='LUCKY_GIFT';raise exception 'immutable ledger modified';exception when insufficient_privilege then null;end;tests:=tests+1;
 foreach amount in array array[0::bigint,-1] loop
  begin update public.gift_catalog set price=amount where id='test-fixed-'||a;raise exception 'invalid gift price accepted';exception when check_violation then null;end;tests:=tests+1;
 end loop;
 -- Receiver overflow happens after the sender debit, and must undo that debit.
 update public.profiles set diamonds=9223372036854775807 where id=b;
 select gold into original_gold from public.profiles where id=a;select count(*) into count_before from public.gift_events;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 begin perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());raise exception 'diamond overflow accepted';exception when numeric_value_out_of_range then null;end;
 perform set_config('role','postgres',true);
 if (select gold from public.profiles where id=a)<>original_gold or (select count(*) from public.gift_events)<>count_before then raise exception 'overflow debit did not rollback';end if;tests:=tests+1;
 -- Coins overflow after redemption allocations must roll back consumption too.
 update public.profiles set diamonds=797,gold=9223372036854775807 where id=b;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 perform public.send_room_gift(r,pb,'test-fixed-'||a,gen_random_uuid());
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 begin perform public.redeem_diamonds(11,gen_random_uuid());raise exception 'Coin overflow accepted';exception when numeric_value_out_of_range then null;end;
 result:=public.wallet_diamond_state();if (result->>'fixed_diamonds')::bigint<>11 then raise exception 'overflow consumed Diamonds';end if;tests:=tests+1;
 perform set_config('request.jwt.claims','{"role":"authenticated"}',true);
 begin perform public.preview_diamond_redemption(10);raise exception 'unauthenticated preview allowed';exception when raise_exception then if sqlerrm<>'authentication required' then raise;end if;end;tests:=tests+1;
 begin perform public.redeem_diamonds(10,gen_random_uuid());raise exception 'unauthenticated redeem allowed';exception when raise_exception then if sqlerrm<>'authentication required' then raise;end if;end;tests:=tests+1;
 perform set_config('role','anon',true);
 begin perform public.redeem_diamonds(10,gen_random_uuid());raise exception 'anonymous redeem allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 perform set_config('role','postgres',true);

 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);perform set_config('role','authenticated',true);
 begin update public.gift_events set diamond_source_type='FIXED_GIFT' where recipient_id=b;raise exception 'gift event type forgery allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 begin insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta) values(b,'admin_adjustment',100,100);raise exception 'wallet history forgery allowed';exception when insufficient_privilege then null;end;tests:=tests+1;
 begin perform public.redeem_diamonds(p_diamonds=>10,p_request_id=>gen_random_uuid(),p_user_id=>a);raise exception 'foreign user parameter accepted';exception when undefined_function then null;end;tests:=tests+1;
 begin perform public.redeem_diamonds(p_diamonds=>10,p_request_id=>gen_random_uuid(),p_rate=>30,p_source_type=>'FIXED_GIFT');raise exception 'client rate/source accepted';exception when undefined_function then null;end;tests:=tests+1;
 perform set_config('role','postgres',true);
 if tests<>42 then raise exception 'Unexpected assertion count: %',tests;end if;
 raise notice 'PASS: % currency assertions; recharge is covered by feature regression',tests;
end $$;
rollback;
select 'PASS: 42 currency assertions with transaction rollback' as regression;
