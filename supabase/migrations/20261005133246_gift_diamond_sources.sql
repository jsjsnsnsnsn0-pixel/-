-- Forward-only: preserve existing balances; never infer historical gift provenance.
-- Internal gold column remains Coins, for compatibility with recharge/store RPCs.
lock table public.profiles, public.gift_catalog, public.gift_events in share row exclusive mode;
alter table public.gift_catalog add column diamond_source_type text;
update public.gift_catalog set diamond_source_type=case when id='g11' then 'LUCKY_GIFT' else 'FIXED_GIFT' end;
alter table public.gift_catalog alter column diamond_source_type set not null;
alter table public.gift_catalog add constraint gift_catalog_diamond_source_check check(diamond_source_type in ('FIXED_GIFT','LUCKY_GIFT'));
-- No default: future catalog entries must explicitly choose the server-side type.
alter table public.gift_events add column diamond_source_type text;
alter table public.gift_events add constraint gift_events_diamond_source_check check(diamond_source_type in ('FIXED_GIFT','LUCKY_GIFT'));
-- Historical events keep NULL: definitions at the time of receipt are unknown.
create table public.diamond_lots (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 source_type text not null check(source_type in ('FIXED_GIFT','LUCKY_GIFT','LEGACY_UNKNOWN')),
 source_reference uuid unique references public.gift_events(id),
 diamonds_amount bigint not null check(diamonds_amount>0), created_at timestamptz not null default now(),
 check((source_type='LEGACY_UNKNOWN' and source_reference is null) or (source_type<>'LEGACY_UNKNOWN' and source_reference is not null))
);
create index diamond_lots_user_idx on public.diamond_lots(user_id,created_at,id);
create table public.diamond_redemptions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 request_id uuid not null, diamonds_amount bigint not null check(diamonds_amount>0),
 fixed_diamonds bigint not null check(fixed_diamonds>=0), lucky_diamonds bigint not null check(lucky_diamonds>=0),
 coins_amount bigint not null check(coins_amount>0), created_at timestamptz not null default now(),
 unique(user_id,request_id), check(fixed_diamonds::numeric+lucky_diamonds=diamonds_amount)
);
create table public.diamond_redemption_allocations (
 redemption_id uuid not null references public.diamond_redemptions(id), lot_id uuid not null references public.diamond_lots(id),
 diamonds_amount bigint not null check(diamonds_amount>0), primary key(redemption_id,lot_id)
);
create index diamond_allocations_lot_idx on public.diamond_redemption_allocations(lot_id);
-- Issuances and allocations are append-only; remaining = issued - allocated.
create function private.guard_diamond_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'diamond ledger is immutable' using errcode='42501'; end $$;
revoke all on function private.guard_diamond_immutable() from public,anon,authenticated;
create trigger diamond_lots_immutable before update or delete on public.diamond_lots for each row execute function private.guard_diamond_immutable();
create trigger diamond_redemptions_immutable before update or delete on public.diamond_redemptions for each row execute function private.guard_diamond_immutable();
create trigger diamond_allocations_immutable before update or delete on public.diamond_redemption_allocations for each row execute function private.guard_diamond_immutable();
alter table public.diamond_lots enable row level security;
alter table public.diamond_redemptions enable row level security;
alter table public.diamond_redemption_allocations enable row level security;
revoke all on public.diamond_lots,public.diamond_redemptions,public.diamond_redemption_allocations from public,anon,authenticated;
grant select on public.diamond_lots,public.diamond_redemptions,public.diamond_redemption_allocations to authenticated;
create policy diamond_lots_read_own on public.diamond_lots for select to authenticated using(user_id=(select auth.uid()));
create policy diamond_redemptions_read_own on public.diamond_redemptions for select to authenticated using(user_id=(select auth.uid()));
create policy diamond_allocations_read_own on public.diamond_redemption_allocations for select to authenticated using(exists(select 1 from public.diamond_redemptions r where r.id=redemption_id and r.user_id=(select auth.uid())));
insert into public.diamond_lots(user_id,source_type,diamonds_amount) select id,'LEGACY_UNKNOWN',diamonds from public.profiles where diamonds>0;
alter table public.wallet_transactions add column gift_event_id uuid references public.gift_events(id);
alter table public.wallet_transactions add column diamond_redemption_id uuid references public.diamond_redemptions(id);
alter table public.wallet_transactions drop constraint wallet_transactions_transaction_type_check;
alter table public.wallet_transactions add constraint wallet_transactions_transaction_type_check check(transaction_type in (
 'recharge','gift_sent','gift_received','admin_adjustment','diamond_conversion','store_purchase','vip_upgrade','daily_reward','task_reward',
 'fixed_gift_diamonds_received','lucky_gift_diamonds_received','fixed_diamonds_redeemed','lucky_diamonds_redeemed','coins_from_diamond_redemption'));

create or replace function private.send_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); recipient uuid; price bigint; source text; existing public.gift_events%rowtype; event_id uuid;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
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
 update public.profiles set gold=gold-price,sent_gold=sent_gold+price,
 level=least(150,(sent_gold+price)/1000+1),updated_at=now() where id=u and gold>=price;
 if not found then raise exception 'insufficient gold'; end if;
 update public.profiles set diamonds=diamonds+price,received_gold=received_gold+price,received_gifts=received_gifts+1,updated_at=now() where id=recipient;
 if not found then raise exception 'invalid recipient'; end if;
 insert into public.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type)
 values(p_request_id,u,recipient,p_room_id,p_gift_id,price,source) returning id into event_id;
 insert into public.diamond_lots(user_id,source_type,source_reference,diamonds_amount) values(recipient,source,event_id,price);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,gift_event_id) values
 (u,'gift_sent',-price,0,event_id),(recipient,case source when 'FIXED_GIFT' then 'fixed_gift_diamonds_received' else 'lucky_gift_diamonds_received' end,0,price,event_id);
end $$;

-- Internal source balances. Only definer RPCs call this helper.
create function private.diamond_remaining(p_user uuid) returns table(id uuid,source_type text,remaining bigint,created_at timestamptz)
language sql stable set search_path='' as $$
 select l.id,l.source_type,(l.diamonds_amount-coalesce(a.used,0))::bigint,l.created_at from public.diamond_lots l
 left join lateral (select sum(x.diamonds_amount) used from public.diamond_redemption_allocations x where x.lot_id=l.id) a on true where l.user_id=p_user;
$$;
revoke all on function private.diamond_remaining(uuid) from public,anon,authenticated;
create function private.wallet_diamond_state() returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); f bigint; l bigint; balance bigint;
begin
 if u is null then raise exception 'authentication required'; end if;
 select diamonds into balance from public.profiles where id=u;
 if not found then raise exception 'profile not found'; end if;
 select coalesce(sum(remaining) filter(where source_type='FIXED_GIFT'),0),coalesce(sum(remaining) filter(where source_type='LUCKY_GIFT'),0) into f,l from private.diamond_remaining(u);
 return jsonb_build_object('fixed_diamonds',f,'lucky_diamonds',l,'legacy_diamonds',greatest(0,balance::numeric-f-l),'diamonds_balance',balance);
end $$;
-- Amount only. Fixed sources first, then Lucky; FIFO within each source.
-- Floor each source subtotal once, matching existing deterministic floor policy.
-- Division before multiplication avoids bigint overflow (30/100 = 3/10).
create function private.preview_diamond_redemption(p_diamonds bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); state jsonb; f bigint; l bigint; coins bigint;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_diamonds is null or p_diamonds<=0 or p_diamonds>9007199254740991 then raise exception 'invalid diamond amount'; end if;
 state:=private.wallet_diamond_state();
 if (state->>'diamonds_balance')::bigint<p_diamonds then raise exception 'insufficient diamonds'; end if;
 f:=least(p_diamonds,(state->>'fixed_diamonds')::bigint); l:=p_diamonds-f;
 if l>(state->>'lucky_diamonds')::bigint then raise exception 'insufficient redeemable diamonds'; end if;
 coins:=(f/10)*3+((f%10)*3)/10+l/10;
 if coins<=0 then raise exception 'diamond amount is too small'; end if;
 return jsonb_build_object('diamonds_amount',p_diamonds,'fixed_diamonds',f,'lucky_diamonds',l,'coins_amount',coins);
end $$;
create function private.redeem_diamonds(p_diamonds bigint,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); previous public.diamond_redemptions%rowtype; quote jsonb; redemption uuid; lot record; left_to_use bigint:=p_diamonds; take bigint;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_diamonds is null or p_diamonds<=0 or p_diamonds>9007199254740991 then raise exception 'invalid diamond amount'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 -- Every issuance and redemption locks this same wallet, preventing concurrent reuse.
 perform id from public.profiles where id=u for update;
 if not found then raise exception 'profile not found'; end if;
 select * into previous from public.diamond_redemptions where user_id=u and request_id=p_request_id;
 if found then
  if previous.diamonds_amount<>p_diamonds then raise exception 'request id already used'; end if;
  return to_jsonb(previous);
 end if;
 quote:=private.preview_diamond_redemption(p_diamonds);
 insert into public.diamond_redemptions(user_id,request_id,diamonds_amount,fixed_diamonds,lucky_diamonds,coins_amount)
 values(u,p_request_id,p_diamonds,(quote->>'fixed_diamonds')::bigint,(quote->>'lucky_diamonds')::bigint,(quote->>'coins_amount')::bigint) returning id into redemption;
 for lot in select * from private.diamond_remaining(u) where source_type in ('FIXED_GIFT','LUCKY_GIFT') and remaining>0 order by source_type,created_at,id loop
  exit when left_to_use=0;
  take:=least(left_to_use,lot.remaining);
  insert into public.diamond_redemption_allocations values(redemption,lot.id,take);
  left_to_use:=left_to_use-take;
 end loop;
 if left_to_use<>0 then raise exception 'insufficient redeemable diamonds'; end if;
 update public.profiles set diamonds=diamonds-p_diamonds,gold=gold+(quote->>'coins_amount')::bigint,updated_at=now() where id=u and diamonds>=p_diamonds;
 if not found then raise exception 'insufficient diamonds'; end if;
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,diamond_redemption_id)
 select u,case s when 'FIXED_GIFT' then 'fixed_diamonds_redeemed' else 'lucky_diamonds_redeemed' end,0,-n,redemption
 from (values('FIXED_GIFT',(quote->>'fixed_diamonds')::bigint),('LUCKY_GIFT',(quote->>'lucky_diamonds')::bigint)) v(s,n) where n>0;
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,diamond_redemption_id)
 values(u,'coins_from_diamond_redemption',(quote->>'coins_amount')::bigint,0,redemption);
 return quote||jsonb_build_object('id',redemption);
end $$;
-- Old clients remain source-aware; only the new API offers explicit retry IDs.
create or replace function private.convert_diamonds_to_gold(p_diamonds bigint)
returns table(diamonds_remaining bigint,gold_balance bigint,gold_added bigint) language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 result:=private.redeem_diamonds(p_diamonds,gen_random_uuid());
 select p.diamonds,p.gold,(result->>'coins_amount')::bigint into diamonds_remaining,gold_balance,gold_added from public.profiles p where id=auth.uid();
 return next;
end $$;
create function public.wallet_diamond_state() returns jsonb language sql security invoker set search_path='' as $$select private.wallet_diamond_state()$$;
create function public.preview_diamond_redemption(p_diamonds bigint) returns jsonb language sql security invoker set search_path='' as $$select private.preview_diamond_redemption(p_diamonds)$$;
create function public.redeem_diamonds(p_diamonds bigint,p_request_id uuid) returns jsonb language sql security invoker set search_path='' as $$select private.redeem_diamonds(p_diamonds,p_request_id)$$;
revoke all on function private.wallet_diamond_state(),public.wallet_diamond_state(),private.preview_diamond_redemption(bigint),public.preview_diamond_redemption(bigint),private.redeem_diamonds(bigint,uuid),public.redeem_diamonds(bigint,uuid) from public,anon,authenticated;
grant execute on function private.wallet_diamond_state(),public.wallet_diamond_state(),private.preview_diamond_redemption(bigint),public.preview_diamond_redemption(bigint),private.redeem_diamonds(bigint,uuid),public.redeem_diamonds(bigint,uuid) to authenticated;
notify pgrst,'reload schema';
