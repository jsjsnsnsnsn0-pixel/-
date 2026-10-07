-- Restore the agreed gift quantity workflow without changing legacy RPC contracts.
-- Allowed quantities are fixed by product design: 1 / 7 / 17 / 77 / 777.
alter table public.gift_events add column if not exists quantity integer not null default 1;
alter table public.gift_events drop constraint if exists gift_events_quantity_check;
alter table public.gift_events add constraint gift_events_quantity_check check(quantity in (1,7,17,77,777));

alter table private.self_gift_events add column if not exists quantity integer not null default 1;
alter table private.self_gift_events drop constraint if exists self_gift_events_quantity_check;
alter table private.self_gift_events add constraint self_gift_events_quantity_check check(quantity in (1,7,17,77,777));

alter table public.room_gift_feed add column if not exists quantity integer not null default 1;
alter table public.room_gift_feed drop constraint if exists room_gift_feed_quantity_check;
alter table public.room_gift_feed add constraint room_gift_feed_quantity_check check(quantity in (1,7,17,77,777));

create or replace function private.gift_to_room_feed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.room_gift_feed(
  room_id,sender_public_id,sender_name,sender_avatar,
  recipient_public_id,recipient_name,recipient_avatar,
  gift_id,gift_name,amount,quantity
 )
 select new.room_id,s.public_id,s.display_name,s.avatar_url,
        r.public_id,r.display_name,r.avatar_url,
        g.id,g.name,new.amount,coalesce(new.quantity,1)
 from public.profiles s, public.profiles r, public.gift_catalog g
 where s.id=new.sender_id and r.id=new.recipient_id and g.id=new.gift_id;
 return new;
end $$;
revoke all on function private.gift_to_room_feed() from public,anon,authenticated;

create function private.send_room_gift_quantity(
 p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_quantity integer,p_request_id uuid
) returns void language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid();
 recipient uuid;
 unit_price bigint;
 total bigint;
 source text;
 existing public.gift_events%rowtype;
 event_id uuid;
begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 if p_quantity not in (1,7,17,77,777) then raise exception 'invalid gift quantity'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));

 select * into existing from public.gift_events where request_id=p_request_id;
 if found then
  if existing.sender_id<>actor or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id
     or existing.quantity<>p_quantity
     or not exists(select 1 from public.profiles where public_id=p_recipient_public_id and id=existing.recipient_id)
  then raise exception 'request id already used'; end if;
  return;
 end if;
 if exists(select 1 from private.self_gift_events where request_id=p_request_id) then raise exception 'request id already used'; end if;
 if not private.room_access_allowed(p_room_id) then raise exception 'room membership expired'; end if;

 select p.id into recipient
 from public.profiles p join public.room_members m on m.user_id=p.id
 where p.public_id=p_recipient_public_id and m.room_id=p_room_id and m.last_seen_at>now()-interval '3 minutes';
 if recipient is null or recipient=actor then raise exception 'invalid recipient'; end if;

 select g.price,g.diamond_source_type into unit_price,source
 from public.gift_catalog g where id=p_gift_id and is_active for share;
 if unit_price is null or unit_price<=0 or source not in ('FIXED_GIFT','LUCKY_GIFT') then raise exception 'gift not available'; end if;
 if unit_price > 9007199254740991 / p_quantity then raise exception 'gift total too large'; end if;
 total:=unit_price*p_quantity;

 perform id from public.profiles where id in(actor,recipient) order by id for update;
 update public.profiles
 set gold=gold-total,sent_gold=sent_gold+total,level=least(150,(sent_gold+total)/1000+1),updated_at=now()
 where id=actor and gold>=total;
 if not found then raise exception 'insufficient gold'; end if;

 update public.profiles
 set diamonds=diamonds+total,received_gold=received_gold+total,received_gifts=received_gifts+p_quantity,updated_at=now()
 where id=recipient;
 if not found then raise exception 'invalid recipient'; end if;

 insert into public.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type,quantity)
 values(p_request_id,actor,recipient,p_room_id,p_gift_id,total,source,p_quantity)
 returning id into event_id;

 insert into public.diamond_lots(user_id,source_type,source_reference,diamonds_amount)
 values(recipient,source,event_id,total);

 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,gift_event_id) values
 (actor,'gift_sent',-total,0,event_id),
 (recipient,case source when 'FIXED_GIFT' then 'fixed_gift_diamonds_received' else 'lucky_gift_diamonds_received' end,0,total,event_id);
end $$;

create function public.send_room_gift_quantity(
 p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_quantity integer,p_request_id uuid
) returns void language sql security invoker set search_path='' as $$
 select private.send_room_gift_quantity(p_room_id,p_recipient_public_id,p_gift_id,p_quantity,p_request_id)
$$;

create function private.send_self_room_gift_quantity(
 p_room_id uuid,p_gift_id text,p_quantity integer,p_request_id uuid
) returns void language plpgsql security definer set search_path='' as $$
declare
 actor uuid:=auth.uid();
 unit_price bigint;
 total bigint;
 existing private.self_gift_events%rowtype;
 profile public.profiles%rowtype;
begin
 if actor is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 if p_quantity not in (1,7,17,77,777) then raise exception 'invalid gift quantity'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));

 select * into existing from private.self_gift_events where request_id=p_request_id;
 if found then
  if existing.user_id<>actor or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id or existing.quantity<>p_quantity
  then raise exception 'request id already used'; end if;
  return;
 end if;
 if exists(select 1 from public.gift_events where request_id=p_request_id) then raise exception 'request id already used'; end if;
 if not private.room_access_allowed(p_room_id) then raise exception 'room membership expired'; end if;

 select price into unit_price from public.gift_catalog where id=p_gift_id and is_active for share;
 if unit_price is null or unit_price<=0 then raise exception 'gift not available'; end if;
 if unit_price > 9007199254740991 / p_quantity then raise exception 'gift total too large'; end if;
 total:=unit_price*p_quantity;

 update public.profiles set gold=gold-total,updated_at=now()
 where id=actor and gold>=total returning * into profile;
 if not found then raise exception 'insufficient gold'; end if;

 insert into private.self_gift_events(request_id,user_id,room_id,gift_id,amount,quantity)
 values(p_request_id,actor,p_room_id,p_gift_id,total,p_quantity);

 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta)
 values(actor,'gift_sent',-total,0);

 insert into public.room_gift_feed(
  room_id,sender_public_id,sender_name,sender_avatar,
  recipient_public_id,recipient_name,recipient_avatar,
  gift_id,gift_name,amount,quantity
 )
 select p_room_id,profile.public_id,profile.display_name,profile.avatar_url,
        profile.public_id,profile.display_name,profile.avatar_url,
        id,name,total,p_quantity
 from public.gift_catalog where id=p_gift_id;
end $$;

create function public.send_self_room_gift_quantity(
 p_room_id uuid,p_gift_id text,p_quantity integer,p_request_id uuid
) returns void language sql security invoker set search_path='' as $$
 select private.send_self_room_gift_quantity(p_room_id,p_gift_id,p_quantity,p_request_id)
$$;

revoke all on function private.send_room_gift_quantity(uuid,bigint,text,integer,uuid),
 public.send_room_gift_quantity(uuid,bigint,text,integer,uuid),
 private.send_self_room_gift_quantity(uuid,text,integer,uuid),
 public.send_self_room_gift_quantity(uuid,text,integer,uuid)
from public,anon;
grant execute on function private.send_room_gift_quantity(uuid,bigint,text,integer,uuid),
 public.send_room_gift_quantity(uuid,bigint,text,integer,uuid),
 private.send_self_room_gift_quantity(uuid,text,integer,uuid),
 public.send_self_room_gift_quantity(uuid,text,integer,uuid)
to authenticated;

create or replace function public.room_gift_totals(p_room_id uuid)
returns table(recipient_public_id bigint,quantity bigint)
language sql stable security invoker set search_path='' as $$
 select f.recipient_public_id,sum(f.quantity)::bigint
 from public.room_gift_feed f
 where f.room_id=p_room_id
 group by f.recipient_public_id
$$;
revoke all on function public.room_gift_totals(uuid) from public,anon;
grant execute on function public.room_gift_totals(uuid) to authenticated;

notify pgrst,'reload schema';
