-- Extend the existing gift ledger and store, with prepaid stock as a separate entitlement.
create table public.gift_categories(id text primary key,label text not null,sort_order integer not null,enabled boolean not null default true);
alter table public.gift_categories enable row level security;
create policy gift_categories_read on public.gift_categories for select to authenticated using(enabled);
revoke all on public.gift_categories from anon,authenticated;grant select on public.gift_categories to authenticated;
insert into public.gift_categories(id,label,sort_order)values('luck','حظ',10),('custom','مخصص',20),('cp','CP',30),('nation','الأمة',40),('gift','هدية',50);
alter table public.gift_catalog add column category_id text not null default 'gift' references public.gift_categories(id);
alter table public.gift_catalog add column relationship_type_id text references public.cp_types(id);
alter table public.gift_catalog add column icon text not null default '🎁';
alter table public.gift_catalog add column description text not null default '';
alter table public.gift_catalog add column preview_url text check(preview_url is null or preview_url like 'https://%' or preview_url like '/%');
alter table public.gift_catalog add column animation_type text not null default 'sparkle' check(animation_type in('pulse','rocket','lion','car','crown','sparkle'));
alter table public.gift_catalog add column rarity text;
alter table public.gift_catalog add column duration_days integer check(duration_days between 1 and 365);
alter table public.gift_catalog add constraint gift_cp_type_required check((category_id='cp')=(relationship_type_id is not null));
create index gift_catalog_type_idx on public.gift_catalog(relationship_type_id);
create index gift_catalog_category_idx on public.gift_catalog(category_id);
-- Move existing presentation descriptors to the real catalog; keep names/prices unchanged.
update public.gift_catalog set icon=case id when 'g1'then '🌹'when 'g2'then '💖'when 'g3'then '💐'when 'g4'then '👑'when 'g5'then '🏎️'when 'g6'then '🦁'when 'g7'then '🐉'when 'g8'then '🚀'when 'g9'then '💍'when 'g10'then '🦅'when 'g11'then '🎲'when 'g12'then '🏰'else icon end,
 animation_type=case id when 'g2'then 'pulse'when 'g4'then 'crown'when 'g5'then 'car'when 'g6'then 'lion'when 'g7'then 'pulse'when 'g8'then 'rocket'when 'g10'then 'pulse'when 'g11'then 'pulse'when 'g12'then 'crown'else animation_type end;
update public.gift_catalog set category_id='luck'where diamond_source_type='LUCKY_GIFT';
create table public.gift_inventory_lots(
 id uuid primary key, user_id uuid not null references public.profiles(id)on delete cascade,
 gift_id text not null references public.gift_catalog(id),remaining integer not null default 1 check(remaining between 0 and 1),
 unit_price bigint not null check(unit_price>0),diamond_source_type text not null check(diamond_source_type in('FIXED_GIFT','LUCKY_GIFT')),
 expires_at timestamptz,consumed_at timestamptz,consumed_request_id uuid unique,created_at timestamptz not null default now()
);
create index gift_inventory_owner_idx on public.gift_inventory_lots(user_id,gift_id,created_at);
create index gift_inventory_catalog_idx on public.gift_inventory_lots(gift_id);
alter table public.gift_inventory_lots enable row level security;
create policy gift_inventory_own_read on public.gift_inventory_lots for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.gift_inventory_lots from anon,authenticated;grant select on public.gift_inventory_lots to authenticated;
create table public.gift_box_banners(id uuid primary key default gen_random_uuid(),title text not null,subtitle text,image_url text,
 starts_at timestamptz not null default now(),ends_at timestamptz,is_active boolean not null default true,
 check(ends_at is null or ends_at>starts_at));
alter table public.gift_box_banners enable row level security;
create policy gift_banner_read on public.gift_box_banners for select to authenticated using(is_active and starts_at<=now()and(ends_at is null or ends_at>now()));
revoke all on public.gift_box_banners from anon,authenticated;grant select on public.gift_box_banners to authenticated;
create function private.assert_cp_gift(p_gift text,p_recipient uuid)returns void language plpgsql security definer set search_path='' as $$
declare typ text;pid bigint;valid jsonb;begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 select relationship_type_id into typ from public.gift_catalog g join public.gift_categories c on c.id=g.category_id and c.enabled where g.id=p_gift and g.is_active;
 if not found then raise exception 'gift not available';end if;
 if typ is null then return;end if;
 select public_id into pid from public.profiles where id=auth.uid();valid:=private.profile_cp_by_type(pid,typ);
 if valid is null or (p_recipient is not null and (valid->'partner'->>'public_id')::bigint is distinct from (select public_id from public.profiles where id=p_recipient))then raise exception 'active matching relationship required';end if;
end$$;
create function private.consume_gift_stock(p_gift text,p_request uuid)returns public.gift_inventory_lots language plpgsql security definer set search_path='' as $$
declare lot public.gift_inventory_lots%rowtype;begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 select *into lot from public.gift_inventory_lots where user_id=auth.uid()and gift_id=p_gift and remaining>0 and(expires_at is null or expires_at>clock_timestamp())order by created_at,id limit 1 for update;
 if not found then raise exception 'gift inventory unavailable';end if;
 update public.gift_inventory_lots set remaining=remaining-1,consumed_at=now(),consumed_request_id=p_request where id=lot.id;return lot;
end$$;
create function private.buy_gift_stock(p_gift_id text,p_request_id uuid)returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();g public.gift_catalog%rowtype;lot public.gift_inventory_lots%rowtype;begin
 if u is null then raise exception 'authentication required';end if;
 if p_request_id is null then raise exception 'request id required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));

 select * into lot from public.gift_inventory_lots where id=p_request_id;
 if found then if lot.user_id<>u or lot.gift_id<>p_gift_id then raise exception 'request id already used';end if;return lot.id;end if;
 if exists(select 1 from public.gift_events where request_id=p_request_id)or exists(select 1 from private.self_gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
 perform 1 from public.profiles where id=u for update;
 select *into g from public.gift_catalog where id=p_gift_id and is_active for share;
 if not found then raise exception 'gift not available';end if;
 perform private.assert_cp_gift(p_gift_id,null);
 update public.profiles set gold=gold-g.price,updated_at=now()where id=u and gold>=g.price;
 if not found then raise exception 'insufficient gold';end if;
 insert into public.gift_inventory_lots(id,user_id,gift_id,unit_price,diamond_source_type,expires_at)values(p_request_id,u,g.id,g.price,g.diamond_source_type,case when g.duration_days is null then null else now()+make_interval(days=>g.duration_days)end);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta)values(u,'store_purchase',-g.price,0);
 return p_request_id;
end$$;
create function public.buy_gift_stock(p_gift_id text,p_request_id uuid)returns uuid language sql security invoker set search_path='' as $$select private.buy_gift_stock(p_gift_id,p_request_id)$$;
create function private.gift_box_state()returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 return jsonb_build_object('server_now',clock_timestamp(),
 'categories',coalesce((select jsonb_agg(to_jsonb(c)order by sort_order,id)from public.gift_categories c where enabled),'[]'::jsonb),
 'gifts',coalesce((select jsonb_agg(to_jsonb(g)order by price,id)from public.gift_catalog g join public.gift_categories c on c.id=g.category_id and c.enabled where g.is_active),'[]'::jsonb),
 'inventory',coalesce((select jsonb_agg(to_jsonb(l)order by created_at,id)from public.gift_inventory_lots l where l.user_id=auth.uid()and remaining>0 and(expires_at is null or expires_at>clock_timestamp())),'[]'::jsonb),
 'banner',(select jsonb_build_object('title',title,'subtitle',subtitle,'image_url',image_url)from public.gift_box_banners where is_active and starts_at<=now()and(ends_at is null or ends_at>now())order by starts_at desc,id limit 1));
end$$;
create function public.gift_box_state()returns jsonb language sql stable security invoker set search_path='' as $$select private.gift_box_state()$$;
CREATE OR REPLACE FUNCTION private.send_box_gift(p_room_id uuid, p_recipient_public_id bigint, p_gift_id text, p_request_id uuid, p_saved boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); recipient uuid; price bigint; source text; existing public.gift_events%rowtype; event_id uuid; stock public.gift_inventory_lots%rowtype;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 if exists(select 1 from public.gift_inventory_lots where id=p_request_id)then raise exception 'request id already used';end if;
 
 if exists(select 1 from private.self_gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
 select * into existing from public.gift_events where request_id=p_request_id;
 if found then
  if existing.sender_id<>u or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id or not exists(select 1 from public.profiles where public_id=p_recipient_public_id and id=existing.recipient_id) then raise exception 'request id already used'; end if;
  return;
 end if;
 if not private.room_access_allowed(p_room_id) then raise exception 'room membership expired'; end if;
 select p.id into recipient from public.profiles p join public.room_members m on m.user_id=p.id
 where p.public_id=p_recipient_public_id and m.room_id=p_room_id and m.last_seen_at>now()-interval '3 minutes';
 if recipient is null or recipient=u then raise exception 'invalid recipient'; end if;
 select g.price,g.diamond_source_type into price,source from public.gift_catalog g where id=p_gift_id and is_active for share;
 if price is null or price<=0 or source not in ('FIXED_GIFT','LUCKY_GIFT') then raise exception 'gift not available'; end if;
 perform id from public.profiles where id in (u,recipient) order by id for update;
 perform private.assert_cp_gift(p_gift_id,recipient);
 if p_saved then stock:=private.consume_gift_stock(p_gift_id,p_request_id);price:=stock.unit_price;source:=stock.diamond_source_type;end if;
 update public.profiles set gold=gold-case when p_saved then 0 else price end,sent_gold=sent_gold+price,
 level=least(150,(sent_gold+price)/1000+1),updated_at=now() where id=u and (p_saved or gold>=price);
 if not found then raise exception 'insufficient gold'; end if;
 update public.profiles set diamonds=diamonds+price,received_gold=received_gold+price,received_gifts=received_gifts+1,updated_at=now() where id=recipient;
 if not found then raise exception 'invalid recipient'; end if;
 insert into public.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type)
 values(p_request_id,u,recipient,p_room_id,p_gift_id,price,source) returning id into event_id;
 insert into public.diamond_lots(user_id,source_type,source_reference,diamonds_amount) values(recipient,source,event_id,price);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,gift_event_id) values
 (u,'gift_sent',case when p_saved then 0 else -price end,0,event_id),(recipient,case source when 'FIXED_GIFT' then 'fixed_gift_diamonds_received' else 'lucky_gift_diamonds_received' end,0,price,event_id);
end $function$
;
CREATE OR REPLACE FUNCTION private.send_self_box_gift(p_room_id uuid, p_gift_id text, p_request_id uuid, p_saved boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid:=auth.uid(); cost bigint; existing private.self_gift_events%rowtype;profile public.profiles%rowtype;stock public.gift_inventory_lots%rowtype;begin
 if actor is null then raise exception 'authentication required';end if;
 if p_request_id is null then raise exception 'request id required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 if exists(select 1 from public.gift_inventory_lots where id=p_request_id)then raise exception 'request id already used';end if;
 
 select *into existing from private.self_gift_events where request_id=p_request_id;
 if found then if existing.user_id<>actor or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id then raise exception 'request id already used';end if;return;end if;
 if exists(select 1 from public.gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
 if not private.room_access_allowed(p_room_id)then raise exception 'room membership expired';end if;
 select price into cost from public.gift_catalog where id=p_gift_id and is_active for share;
 if cost is null or cost<=0 then raise exception 'gift not available';end if;
 perform 1 from public.profiles where id=actor for update;
 perform private.assert_cp_gift(p_gift_id,actor);
 if p_saved then stock:=private.consume_gift_stock(p_gift_id,p_request_id);cost:=stock.unit_price;end if;
 update public.profiles set gold=gold-case when p_saved then 0 else cost end,updated_at=now()where id=actor and (p_saved or gold>=cost) returning *into profile;
 if not found then raise exception 'insufficient gold';end if;
 insert into private.self_gift_events(request_id,user_id,room_id,gift_id,amount)values(p_request_id,actor,p_room_id,p_gift_id,cost);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta)values(actor,'gift_sent',case when p_saved then 0 else -cost end,0);
 insert into public.room_gift_feed(room_id,sender_public_id,sender_name,sender_avatar,recipient_public_id,recipient_name,recipient_avatar,gift_id,gift_name,amount) select p_room_id,profile.public_id,profile.display_name,profile.avatar_url,profile.public_id,profile.display_name,profile.avatar_url,id,name,cost from public.gift_catalog where id=p_gift_id;
end$function$
;

create or replace function private.send_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)returns void language sql security definer set search_path='' as $$select private.send_box_gift(p_room_id,p_recipient_public_id,p_gift_id,p_request_id,false)$$;
create or replace function private.send_self_room_gift(p_room_id uuid,p_gift_id text,p_request_id uuid)returns void language sql security definer set search_path='' as $$select private.send_self_box_gift(p_room_id,p_gift_id,p_request_id,false)$$;
create function private.send_inventory_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 if p_recipient_public_id=(select public_id from public.profiles where id=auth.uid())then perform private.send_self_box_gift(p_room_id,p_gift_id,p_request_id,true);
 else perform private.send_box_gift(p_room_id,p_recipient_public_id,p_gift_id,p_request_id,true);end if;
end$$;
create function public.send_inventory_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)returns void language sql security invoker set search_path='' as $$select private.send_inventory_room_gift(p_room_id,p_recipient_public_id,p_gift_id,p_request_id)$$;
revoke all on function private.assert_cp_gift(text,uuid),private.consume_gift_stock(text,uuid),private.send_box_gift(uuid,bigint,text,uuid,boolean),private.send_self_box_gift(uuid,text,uuid,boolean)from public,anon,authenticated;
revoke all on function private.buy_gift_stock(text,uuid),public.buy_gift_stock(text,uuid),private.gift_box_state(),public.gift_box_state(),private.send_inventory_room_gift(uuid,bigint,text,uuid),public.send_inventory_room_gift(uuid,bigint,text,uuid)from public,anon;
grant execute on function private.buy_gift_stock(text,uuid),public.buy_gift_stock(text,uuid),private.gift_box_state(),public.gift_box_state(),private.send_inventory_room_gift(uuid,bigint,text,uuid),public.send_inventory_room_gift(uuid,bigint,text,uuid)to authenticated;
notify pgrst,'reload schema';
