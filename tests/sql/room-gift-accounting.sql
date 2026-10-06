-- Isolated temporary tables; no production rows are changed. Always rolls back.
begin;
create temp table profiles(id uuid primary key, public_id bigint, display_name text, avatar_url text,country_code text,level bigint default 1,vip_level int default 0,gold bigint default 0,diamonds bigint default 0,sent_gold bigint default 0,received_gold bigint default 0,received_gifts bigint default 0,updated_at timestamptz);
create temp table rooms(id uuid primary key,name text,image_url text,owner_display_name text,owner_avatar_url text,is_active boolean default true);
create temp table room_members(room_id uuid,user_id uuid,last_seen_at timestamptz default now());
create temp table gift_catalog(id text primary key,price bigint,diamond_source_type text,is_active boolean default true);
create temp table gift_events(id uuid primary key default gen_random_uuid(),request_id uuid not null unique,sender_id uuid not null,recipient_id uuid not null,room_id uuid not null,gift_id text,amount bigint check(amount>0),diamond_source_type text,created_at timestamptz default now(),check(sender_id<>recipient_id));
create temp table diamond_lots(user_id uuid,source_type text,source_reference uuid,diamonds_amount bigint);
create temp table wallet_transactions(user_id uuid,transaction_type text,gold_delta bigint,diamond_delta bigint,gift_event_id uuid);
create function pg_temp.test_uid() returns uuid language sql as $$select '00000000-0000-0000-0000-000000000001'::uuid$$;
create function pg_temp.room_access_allowed(r uuid) returns boolean language sql as $$select exists(select 1 from pg_temp.rooms x join pg_temp.room_members m on m.room_id=x.id where x.id=r and x.is_active and m.user_id=pg_temp.test_uid() and m.last_seen_at>now()-interval '3 minutes')$$;
create function pg_temp.can_view_room(r uuid) returns boolean language sql as $$select true$$;
CREATE OR REPLACE FUNCTION pg_temp.get_gift_rankings(p_period text DEFAULT 'daily'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_start timestamptz; v_result jsonb;
begin
 if (select pg_temp.test_uid()) is null then raise exception 'authentication required'; end if;
 if p_period not in ('daily','weekly','monthly') then raise exception 'invalid period'; end if;
 v_start:=date_trunc(case p_period when 'daily' then 'day' when 'weekly' then 'week' else 'month' end,now());
 select jsonb_build_object(
  'wealth',coalesce((select jsonb_agg(to_jsonb(x)) from (select p.public_id,p.display_name,p.avatar_url,p.country_code,p.level,p.vip_level,sum(g.amount) as score from pg_temp.gift_events g join pg_temp.profiles p on p.id=g.sender_id where g.created_at>=v_start group by p.id order by sum(g.amount) desc,p.public_id limit 100) x),'[]'::jsonb),
  'charm',coalesce((select jsonb_agg(to_jsonb(x)) from (select p.public_id,p.display_name,p.avatar_url,p.country_code,p.level,p.vip_level,sum(g.amount) as score from pg_temp.gift_events g join pg_temp.profiles p on p.id=g.recipient_id where g.created_at>=v_start group by p.id order by sum(g.amount) desc,p.public_id limit 100) x),'[]'::jsonb),
  'rooms',coalesce((select jsonb_agg(to_jsonb(x)) from (select r.id,r.name,r.image_url,r.owner_display_name,r.owner_avatar_url,sum(g.amount) as score from pg_temp.gift_events g join pg_temp.rooms r on r.id=g.room_id where g.created_at>=v_start and pg_temp.can_view_room(r.id) group by r.id order by sum(g.amount) desc,r.id limit 100) x),'[]'::jsonb)
 ) into v_result;
 return v_result;
end; $function$;

CREATE OR REPLACE FUNCTION pg_temp.send_room_gift(p_room_id uuid, p_recipient_public_id bigint, p_gift_id text, p_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=pg_temp.test_uid(); recipient uuid; price bigint; source text; existing pg_temp.gift_events%rowtype; event_id uuid;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into existing from pg_temp.gift_events where request_id=p_request_id;
 if found then
  if existing.sender_id<>u or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id or not exists(select 1 from pg_temp.profiles where public_id=p_recipient_public_id and id=existing.recipient_id) then raise exception 'request id already used'; end if;
  return;
 end if;
 if not pg_temp.room_access_allowed(p_room_id) then raise exception 'room membership expired'; end if;
 select p.id into recipient from pg_temp.profiles p join pg_temp.room_members m on m.user_id=p.id
 where p.public_id=p_recipient_public_id and m.room_id=p_room_id and m.last_seen_at>now()-interval '3 minutes';
 if recipient is null or recipient=u then raise exception 'invalid recipient'; end if;
 select g.price,g.diamond_source_type into price,source from pg_temp.gift_catalog g where id=p_gift_id and is_active for share;
 if price is null or price<=0 or source not in ('FIXED_GIFT','LUCKY_GIFT') then raise exception 'gift not available'; end if;
 perform id from pg_temp.profiles where id in (u,recipient) order by id for update;
 update pg_temp.profiles set gold=gold-price,sent_gold=sent_gold+price,
 level=least(150,(sent_gold+price)/1000+1),updated_at=now() where id=u and gold>=price;
 if not found then raise exception 'insufficient gold'; end if;
 update pg_temp.profiles set diamonds=diamonds+price,received_gold=received_gold+price,received_gifts=received_gifts+1,updated_at=now() where id=recipient;
 if not found then raise exception 'invalid recipient'; end if;
 insert into pg_temp.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type)
 values(p_request_id,u,recipient,p_room_id,p_gift_id,price,source) returning id into event_id;
 insert into pg_temp.diamond_lots(user_id,source_type,source_reference,diamonds_amount) values(recipient,source,event_id,price);
 insert into pg_temp.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,gift_event_id) values
 (u,'gift_sent',-price,0,event_id),(recipient,case source when 'FIXED_GIFT' then 'fixed_gift_diamonds_received' else 'lucky_gift_diamonds_received' end,0,price,event_id);
end $function$;

insert into pg_temp.profiles(id,public_id,display_name,gold) values
('00000000-0000-0000-0000-000000000001',1,'Sender',10000),
('00000000-0000-0000-0000-000000000002',2,'Receiver',0),
('00000000-0000-0000-0000-000000000003',3,'Empty',0);
insert into pg_temp.rooms(id,name) values('00000000-0000-0000-0000-000000000010','Room');
insert into pg_temp.room_members(room_id,user_id) select '00000000-0000-0000-0000-000000000010',id from pg_temp.profiles;
insert into pg_temp.gift_catalog values('gift',100,'FIXED_GIFT',true);
do $test$
declare r uuid:='00000000-0000-0000-0000-000000000010'; request uuid:=gen_random_uuid(); rankings jsonb; failed boolean;
begin
 if pg_temp.get_gift_rankings('daily')->'wealth'<>'[]'::jsonb or exists(select 1 from pg_temp.profiles where sent_gold<>0 or received_gold<>0) then raise exception 'zero baseline failed'; end if;
 perform pg_temp.send_room_gift(r,2,'gift',request);
 if (select sent_gold from pg_temp.profiles where public_id=1)<>100 or (select received_gold from pg_temp.profiles where public_id=2)<>100 then raise exception 'same successful transaction totals failed'; end if;
 perform pg_temp.send_room_gift(r,2,'gift',request);
 if (select count(*) from pg_temp.gift_events)<>1 or (select sent_gold from pg_temp.profiles where public_id=1)<>100 then raise exception 'duplicate counted'; end if;
 failed:=false;
 begin perform pg_temp.send_room_gift(r,2,'missing',gen_random_uuid()); exception when others then failed:=true; end;
 if not failed then raise exception 'failed gift accepted'; end if;
 failed:=false;
 begin perform pg_temp.send_room_gift(gen_random_uuid(),2,'gift',gen_random_uuid()); exception when others then failed:=true; end;
 if not failed then raise exception 'outside room accepted'; end if;
 failed:=false;
 begin perform pg_temp.send_room_gift(r,1,'gift',gen_random_uuid()); exception when others then failed:=true; end;
 if not failed then raise exception 'self gift accepted'; end if;
 insert into pg_temp.wallet_transactions values(pg_temp.test_uid(),'recharge',500,0,null),(pg_temp.test_uid(),'admin_adjustment',500,0,null);
 update pg_temp.profiles set gold=gold+1000 where id=pg_temp.test_uid();
 rankings:=pg_temp.get_gift_rankings('daily');
 if (rankings->'wealth'->0->>'score')::bigint<>100 or (rankings->'charm'->0->>'score')::bigint<>100 then raise exception 'unrelated wallet operations counted'; end if;
 if rankings<>pg_temp.get_gift_rankings('daily') then raise exception 'refetch changed persisted result'; end if;
 failed:=false;
 begin perform pg_temp.send_room_gift(r,3,'gift',request); exception when others then failed:=true; end;
 if not failed then raise exception 'duplicate request with different recipient accepted'; end if;
 update pg_temp.gift_catalog set price=100000;
 failed:=false;
 begin perform pg_temp.send_room_gift(r,2,'gift',gen_random_uuid()); exception when others then failed:=true; end;
 if not failed or (select count(*) from pg_temp.gift_events)<>1 or (select count(*) from pg_temp.diamond_lots)<>1 then raise exception 'insufficient balance left economic side effects'; end if;
 update pg_temp.gift_catalog set price=100;
 -- A second sender changes the real ordering; no client increments.
 insert into pg_temp.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type)
 values(gen_random_uuid(),'00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002',r,'gift',200,'FIXED_GIFT');
 if (pg_temp.get_gift_rankings('daily')->'wealth'->0->>'public_id')::bigint<>3 or (pg_temp.get_gift_rankings('daily')->'charm'->0->>'score')::bigint<>300 then raise exception 'ranking order or charm total failed'; end if;
end $test$;
rollback;

