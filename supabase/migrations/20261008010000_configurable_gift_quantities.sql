-- TASK 1: quantity choices configured on the server, never trusted from the client.
-- Existing quantities, RPC signatures, gifts, diamonds and balances are preserved.
create table public.gift_quantity_configuration (
  quantity integer primary key check (quantity in (1,7,17,77,777)),
  enabled boolean not null default true,
  sort_order integer not null
);
insert into public.gift_quantity_configuration(quantity,enabled,sort_order)
values (1,true,1),(7,true,2),(17,false,3),(77,true,4),(777,true,5);
alter table public.gift_quantity_configuration enable row level security;
revoke all on public.gift_quantity_configuration from public,anon,authenticated;
grant select on public.gift_quantity_configuration to authenticated;
create policy gift_quantity_config_read on public.gift_quantity_configuration
for select to authenticated using (enabled);
create function private.gift_quantity_is_enabled(p_quantity integer) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.gift_quantity_configuration where quantity=p_quantity and enabled) $$;
revoke all on function private.gift_quantity_is_enabled(integer) from public,anon,authenticated;
create function public.gift_quantity_choices() returns integer[]
language sql stable security definer set search_path=''
as $$ select coalesce(array_agg(quantity order by sort_order),array[1]::integer[])
from public.gift_quantity_configuration where enabled $$;
revoke all on function public.gift_quantity_choices() from public,anon;
grant execute on function public.gift_quantity_choices() to authenticated;

-- Preserve the original atomic, idempotent gift functions; only change
-- hard-coded quantity permission to the backend configuration above.
CREATE OR REPLACE FUNCTION private.send_box_gift_batch(p_room_id uuid, p_recipient_public_id bigint, p_gift_id text, p_request_id uuid, p_saved boolean, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); recipient uuid; price bigint; source text; existing public.gift_events%rowtype; event_id uuid; stock public.gift_inventory_lots%rowtype;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_quantity is null or not private.gift_quantity_is_enabled(p_quantity) or p_saved then raise exception 'invalid gift quantity';end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 if exists(select 1 from public.gift_inventory_lots where id=p_request_id)then raise exception 'request id already used';end if;
 if exists(select 1 from private.self_gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
 select * into existing from public.gift_events where request_id=p_request_id;
 if found then
  if existing.sender_id<>u or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id or existing.quantity<>p_quantity or not exists(select 1 from public.profiles where public_id=p_recipient_public_id and id=existing.recipient_id) then raise exception 'request id already used'; end if;
  return;
 end if;
 if not private.room_access_allowed(p_room_id) then raise exception 'room membership expired'; end if;
 select p.id into recipient from public.profiles p join public.room_members m on m.user_id=p.id
 where p.public_id=p_recipient_public_id and m.room_id=p_room_id and m.last_seen_at>now()-interval '3 minutes';
 if recipient is null or recipient=u then raise exception 'invalid recipient'; end if;
 select g.price,g.diamond_source_type into price,source from public.gift_catalog g where id=p_gift_id and is_active for share;
 if price is null or price<=0 or source not in ('FIXED_GIFT','LUCKY_GIFT') then raise exception 'gift not available'; end if;
 price:=price*p_quantity;
 perform id from public.profiles where id in (u,recipient) order by id for update;
 perform private.assert_cp_gift(p_gift_id,recipient);
 if p_saved then stock:=private.consume_gift_stock(p_gift_id,p_request_id);price:=stock.unit_price;source:=stock.diamond_source_type;end if;
 update public.profiles set gold=gold-case when p_saved then 0 else price end,sent_gold=sent_gold+price,
 level=least(150,(sent_gold+price)/1000+1),updated_at=now() where id=u and (p_saved or gold>=price);
 if not found then raise exception 'insufficient gold'; end if;
 update public.profiles set diamonds=diamonds+price,received_gold=received_gold+price,received_gifts=received_gifts+p_quantity,updated_at=now() where id=recipient;
 if not found then raise exception 'invalid recipient'; end if;
 insert into public.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type,quantity)
 values(p_request_id,u,recipient,p_room_id,p_gift_id,price,source,p_quantity) returning id into event_id;
 insert into public.diamond_lots(user_id,source_type,source_reference,diamonds_amount) values(recipient,source,event_id,price);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,gift_event_id) values
 (u,'gift_sent',case when p_saved then 0 else -price end,0,event_id),(recipient,case source when 'FIXED_GIFT' then 'fixed_gift_diamonds_received' else 'lucky_gift_diamonds_received' end,0,price,event_id);
end $function$;

CREATE OR REPLACE FUNCTION private.send_self_box_gift_batch(p_room_id uuid, p_gift_id text, p_request_id uuid, p_saved boolean, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); cost bigint; existing private.self_gift_events%rowtype;profile public.profiles%rowtype;stock public.gift_inventory_lots%rowtype;begin
 if actor is null then raise exception 'authentication required';end if;
 if p_quantity is null or not private.gift_quantity_is_enabled(p_quantity) or p_saved then raise exception 'invalid gift quantity';end if;
 if p_request_id is null then raise exception 'request id required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 if exists(select 1 from public.gift_inventory_lots where id=p_request_id)then raise exception 'request id already used';end if;
 select *into existing from private.self_gift_events where request_id=p_request_id;
 if found then if existing.user_id<>actor or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id or existing.quantity<>p_quantity then raise exception 'request id already used';end if;return;end if;
 if exists(select 1 from public.gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
 if not private.room_access_allowed(p_room_id)then raise exception 'room membership expired';end if;
 select price into cost from public.gift_catalog where id=p_gift_id and is_active for share;
 if cost is null or cost<=0 then raise exception 'gift not available';end if;
 cost:=cost*p_quantity;
 perform 1 from public.profiles where id=actor for update;
 perform private.assert_cp_gift(p_gift_id,actor);
 if p_saved then stock:=private.consume_gift_stock(p_gift_id,p_request_id);cost:=stock.unit_price;end if;
 update public.profiles set gold=gold-case when p_saved then 0 else cost end,updated_at=now()where id=actor and (p_saved or gold>=cost) returning *into profile;
 if not found then raise exception 'insufficient gold';end if;
 insert into private.self_gift_events(request_id,user_id,room_id,gift_id,amount,quantity)values(p_request_id,actor,p_room_id,p_gift_id,cost,p_quantity);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta)values(actor,'gift_sent',case when p_saved then 0 else -cost end,0);
 insert into public.room_gift_feed(room_id,sender_public_id,sender_name,sender_avatar,recipient_public_id,recipient_name,recipient_avatar,gift_id,gift_name,amount,quantity) select p_room_id,profile.public_id,profile.display_name,profile.avatar_url,profile.public_id,profile.display_name,profile.avatar_url,id,name,cost,p_quantity from public.gift_catalog where id=p_gift_id;
end$function$;


notify pgrst, 'reload schema';
