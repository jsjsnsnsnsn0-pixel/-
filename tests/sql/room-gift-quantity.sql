begin;
do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();r uuid:=gen_random_uuid();req uuid;q integer;pid bigint;start_gold bigint:=1000000;total bigint:=0;count_total bigint:=0;cost bigint;gift text;bad boolean;before_gold bigint;
begin
 insert into auth.users(id,email,raw_user_meta_data)values(a,a::text||'@example.invalid','{}'),(b,b::text||'@example.invalid','{}');
 update public.profiles set gold=start_gold where id=a;
 select public_id into pid from public.profiles where id=b;
 select id,price into gift,cost from public.gift_catalog where is_active and relationship_type_id is null and diamond_source_type='FIXED_GIFT' order by price limit 1;
 assert gift is not null,'catalog required';
 insert into public.rooms(id,owner_id,name)values(r,a,'Transactional gift quantity test');
 insert into public.room_members(room_id,user_id)values(r,a),(r,b);
 perform set_config('request.jwt.claim.sub',a::text,true);
 foreach q in array array[1,7,17,77,777] loop
  req:=gen_random_uuid();perform public.send_room_gift_batch(r,pid,gift,req,q);perform public.send_room_gift_batch(r,pid,gift,req,q);
  total:=total+cost*q;count_total:=count_total+q;
  assert (select gold from public.profiles where id=a)=start_gold-total,'exact total debit';
  assert (select received_gold from public.profiles where id=b)=total,'recipient value';
  assert (select received_gifts from public.profiles where id=b)=count_total,'recipient quantity';
  assert (select count(*)from public.gift_events where request_id=req)=1,'duplicate event';
  assert exists(select 1 from public.room_gift_feed where room_id=r and quantity=q and amount=cost*q),'chat feed quantity';
  bad:=false;begin perform public.send_room_gift_batch(r,pid,gift,req,case when q=1 then 7 else 1 end);exception when others then bad:=true;end;assert bad,'same request changed quantity must fail';
 end loop;
 before_gold:=(select gold from public.profiles where id=a);req:=gen_random_uuid();bad:=false;
 begin perform public.send_room_gift_batch(r,pid,gift,req,2);exception when others then bad:=true;end;assert bad,'invalid quantity';assert (select gold from public.profiles where id=a)=before_gold,'invalid quantity rollback';
 update public.profiles set gold=0 where id=a;req:=gen_random_uuid();bad:=false;
 begin perform public.send_room_gift_batch(r,pid,gift,req,7);exception when others then bad:=true;end;assert bad,'insufficient must fail';assert not exists(select 1 from public.gift_events where request_id=req),'no failed receipt';assert (select received_gold from public.profiles where id=b)=total,'no failed recipient credit';
 update public.profiles set gold=1000 where id=a;
 req:=gen_random_uuid();perform public.send_room_gift_batch(r,(select public_id from public.profiles where id=a),gift,req,7);perform public.send_room_gift_batch(r,(select public_id from public.profiles where id=a),gift,req,7);
 assert (select gold from public.profiles where id=a)=1000-cost*7,'self debit once';assert (select received_gold from public.profiles where id=a)=0,'self does not mint rewards';
 -- Existing one-unit APIs and rewarded bag gifts remain compatible.
 before_gold:=(select gold from public.profiles where id=a);req:=gen_random_uuid();
 perform public.send_room_gift(r,pid,gift,req);perform public.send_room_gift(r,pid,gift,req);
 assert (select gold from public.profiles where id=a)=before_gold-cost,'old single-unit debit';
 assert (select quantity from public.gift_events where request_id=req)=1,'old event default quantity';
 insert into public.gift_inventory_lots(id,user_id,gift_id,remaining,unit_price,diamond_source_type)select gen_random_uuid(),a,gift,1,cost,'FIXED_GIFT' from generate_series(1,5);
 before_gold:=(select gold from public.profiles where id=a);req:=gen_random_uuid();
 perform public.send_inventory_room_gift(r,pid,gift,req);perform public.send_inventory_room_gift(r,pid,gift,req);
 assert (select gold from public.profiles where id=a)=before_gold,'bag gift no second debit';
 assert (select sum(remaining)from public.gift_inventory_lots where user_id=a)=4,'bag consumed once';
 -- A missing recipient and missing authentication must not charge.
 delete from public.room_members where room_id=r and user_id=b;req:=gen_random_uuid();bad:=false;
 begin perform public.send_room_gift_batch(r,pid,gift,req,7);exception when others then bad:=true;end;assert bad,'departed recipient rejected';
 assert (select gold from public.profiles where id=a)=before_gold,'invalid recipient rollback';
 perform set_config('request.jwt.claim.sub','',true);bad:=false;
 begin perform public.send_room_gift_batch(r,pid,gift,gen_random_uuid(),7);exception when others then bad:=true;end;assert bad,'authentication required';
 assert not has_function_privilege('anon','public.send_room_gift_batch(uuid,bigint,text,uuid,integer)','execute'),'anonymous denied';
 assert has_function_privilege('authenticated','public.send_room_gift_batch(uuid,bigint,text,uuid,integer)','execute'),'authenticated allowed';
end$$;
select 'quantity, idempotency, totals, failure rollback, self gift, existing single send and bag checks passed' as result;
rollback;
