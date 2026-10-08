-- Gift quantity contract + monthly settlement ledger.
alter table public.gift_events
  add column if not exists agency_id_at_receive bigint references public.agencies(id),
  add column if not exists agency_owner_id_at_receive uuid references public.profiles(id);

create or replace function private.snapshot_gift_agency()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  select am.agency_id,a.owner_id into new.agency_id_at_receive,new.agency_owner_id_at_receive
  from public.agency_members am join public.agencies a on a.id=am.agency_id
  where am.user_id=new.recipient_id limit 1;
  return new;
end
$$;
drop trigger if exists gift_events_snapshot_agency on public.gift_events;
create trigger gift_events_snapshot_agency before insert on public.gift_events
for each row execute function private.snapshot_gift_agency();

create or replace function private.send_box_gift_batch(
  p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid,p_saved boolean,p_quantity integer
) returns void language plpgsql security definer set search_path=''
as $$
declare u uuid:=auth.uid(); recipient uuid; price bigint; source text; existing public.gift_events%rowtype; event_id uuid; stock public.gift_inventory_lots%rowtype;
begin
  if u is null then raise exception 'authentication required'; end if;
  if p_quantity is null or p_quantity not in(1,7,77,777) or p_saved then raise exception 'invalid gift quantity';end if;
  if p_request_id is null then raise exception 'request id required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
  if exists(select 1 from public.gift_inventory_lots where id=p_request_id)then raise exception 'request id already used';end if;
  if exists(select 1 from private.self_gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
  select * into existing from public.gift_events where request_id=p_request_id;
  if found then
    if existing.sender_id<>u or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id or existing.quantity<>p_quantity
       or not exists(select 1 from public.profiles where public_id=p_recipient_public_id and id=existing.recipient_id)
    then raise exception 'request id already used'; end if;
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
      level=least(150,(sent_gold+price)/1000+1),updated_at=now()
  where id=u and (p_saved or gold>=price);
  if not found then raise exception 'insufficient gold'; end if;
  update public.profiles set diamonds=diamonds+price,received_gold=received_gold+price,received_gifts=received_gifts+p_quantity,updated_at=now()
  where id=recipient;
  if not found then raise exception 'invalid recipient'; end if;
  insert into public.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount,diamond_source_type,quantity)
  values(p_request_id,u,recipient,p_room_id,p_gift_id,price,source,p_quantity) returning id into event_id;
  insert into public.diamond_lots(user_id,source_type,source_reference,diamonds_amount) values(recipient,source,event_id,price);
  insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,gift_event_id) values
    (u,'gift_sent',case when p_saved then 0 else -price end,0,event_id),
    (recipient,case source when 'FIXED_GIFT' then 'fixed_gift_diamonds_received' else 'lucky_gift_diamonds_received' end,0,price,event_id);
end
$$;

create or replace function private.send_self_box_gift_batch(
  p_room_id uuid,p_gift_id text,p_request_id uuid,p_saved boolean,p_quantity integer
) returns void language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); cost bigint; existing private.self_gift_events%rowtype;profile public.profiles%rowtype;stock public.gift_inventory_lots%rowtype;
begin
  if actor is null then raise exception 'authentication required';end if;
  if p_quantity is null or p_quantity not in(1,7,77,777) or p_saved then raise exception 'invalid gift quantity';end if;
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
  update public.profiles set gold=gold-case when p_saved then 0 else cost end,updated_at=now()
  where id=actor and (p_saved or gold>=cost) returning *into profile;
  if not found then raise exception 'insufficient gold';end if;
  insert into private.self_gift_events(request_id,user_id,room_id,gift_id,amount,quantity)values(p_request_id,actor,p_room_id,p_gift_id,cost,p_quantity);
  insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta)values(actor,'gift_sent',case when p_saved then 0 else -cost end,0);
  insert into public.room_gift_feed(room_id,sender_public_id,sender_name,sender_avatar,recipient_public_id,recipient_name,recipient_avatar,gift_id,gift_name,amount,quantity)
  select p_room_id,profile.public_id,profile.display_name,profile.avatar_url,profile.public_id,profile.display_name,profile.avatar_url,id,name,cost,p_quantity from public.gift_catalog where id=p_gift_id;
end
$$;

create table if not exists public.monthly_settlements(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  month_start date not null,
  diamonds_earned bigint not null default 0 check(diamonds_earned>=0),
  diamonds_manually_redeemed bigint not null default 0 check(diamonds_manually_redeemed>=0),
  diamonds_remaining bigint not null default 0 check(diamonds_remaining>=0),
  monthly_gift_count bigint not null default 0 check(monthly_gift_count>=0),
  conversion_rate numeric(8,6) not null default 0.30 check(conversion_rate>=0 and conversion_rate<=1),
  coins_generated bigint not null default 0 check(coins_generated>=0),
  host_salary numeric(20,2),
  status text not null default 'prepared' check(status in('prepared','ready','settled')),
  request_id uuid,
  diamond_redemption_id uuid references public.diamond_redemptions(id),
  prepared_at timestamptz not null default now(),
  settled_at timestamptz,
  unique(user_id,month_start),
  unique(user_id,request_id),
  check(extract(day from month_start)=1),
  check(host_salary is null or host_salary>=0)
);
create table if not exists public.monthly_settlement_agencies(
  settlement_id uuid not null references public.monthly_settlements(id) on delete cascade,
  agency_id bigint not null references public.agencies(id),
  agency_owner_id uuid not null references public.profiles(id),
  agency_target bigint not null default 0 check(agency_target>=0),
  gift_count bigint not null default 0 check(gift_count>=0),
  agent_commission numeric(20,2),
  primary key(settlement_id,agency_id),
  check(agent_commission is null or agent_commission>=0)
);
alter table public.monthly_settlements enable row level security;
alter table public.monthly_settlement_agencies enable row level security;
drop policy if exists monthly_settlements_read_authorized on public.monthly_settlements;
create policy monthly_settlements_read_authorized on public.monthly_settlements for select to authenticated
using (
  user_id=(select auth.uid())
  or exists(select 1 from public.monthly_settlement_agencies a where a.settlement_id=id and a.agency_owner_id=(select auth.uid()))
  or exists(select 1 from public.admin_roles ar where ar.user_id=(select auth.uid()) and ar.role='owner')
);
drop policy if exists monthly_settlement_agencies_read_authorized on public.monthly_settlement_agencies;
create policy monthly_settlement_agencies_read_authorized on public.monthly_settlement_agencies for select to authenticated
using (
  agency_owner_id=(select auth.uid())
  or exists(select 1 from public.monthly_settlements s where s.id=settlement_id and s.user_id=(select auth.uid()))
  or exists(select 1 from public.admin_roles ar where ar.user_id=(select auth.uid()) and ar.role='owner')
);
revoke insert,update,delete on public.monthly_settlements from public,anon,authenticated;
revoke insert,update,delete on public.monthly_settlement_agencies from public,anon,authenticated;
grant select on public.monthly_settlements,public.monthly_settlement_agencies to authenticated;

create or replace function private.require_owner() returns uuid language plpgsql security definer set search_path=''
as $$
declare u uuid:=auth.uid();
begin
  if u is null then raise exception 'authentication required';end if;
  if not exists(select 1 from public.admin_roles where user_id=u and role='owner')then raise exception 'not authorized';end if;
  return u;
end
$$;
revoke all on function private.require_owner() from public,anon,authenticated;

create or replace function private.refresh_monthly_settlement(p_user uuid,p_month date)
returns public.monthly_settlements language plpgsql security definer set search_path=''
as $$
declare existing public.monthly_settlements%rowtype;result public.monthly_settlements%rowtype;month_end date;earned bigint:=0;redeemed bigint:=0;gift_count bigint:=0;
begin
  if p_user is null or p_month is null or extract(day from p_month)<>1 then raise exception 'invalid settlement month';end if;
  month_end:=(p_month+interval '1 month')::date;
  select * into existing from public.monthly_settlements where user_id=p_user and month_start=p_month;
  if found and existing.status='settled' then return existing;end if;
  select coalesce(sum(e.amount),0),coalesce(sum(e.quantity),0) into earned,gift_count
  from public.gift_events e
  where e.recipient_id=p_user and e.diamond_source_type='FIXED_GIFT'
    and e.created_at>=p_month::timestamptz and e.created_at<month_end::timestamptz;
  select coalesce(sum(a.diamonds_amount),0) into redeemed
  from public.diamond_lots l join public.gift_events e on e.id=l.source_reference
  join public.diamond_redemption_allocations a on a.lot_id=l.id
  where l.user_id=p_user and l.source_type='FIXED_GIFT'
    and e.created_at>=p_month::timestamptz and e.created_at<month_end::timestamptz;
  insert into public.monthly_settlements(user_id,month_start,diamonds_earned,diamonds_manually_redeemed,diamonds_remaining,monthly_gift_count,conversion_rate,host_salary,status,prepared_at)
  values(p_user,p_month,earned,redeemed,greatest(0,earned-redeemed),gift_count,0.30,existing.host_salary,
    case when existing.host_salary is not null then 'ready' else 'prepared' end,now())
  on conflict(user_id,month_start) do update set diamonds_earned=excluded.diamonds_earned,
    diamonds_manually_redeemed=excluded.diamonds_manually_redeemed,diamonds_remaining=excluded.diamonds_remaining,
    monthly_gift_count=excluded.monthly_gift_count,conversion_rate=excluded.conversion_rate,prepared_at=now()
  returning * into result;
  insert into public.monthly_settlement_agencies(settlement_id,agency_id,agency_owner_id,agency_target,gift_count)
  select result.id,e.agency_id_at_receive,max(e.agency_owner_id_at_receive),sum(e.amount),sum(e.quantity)
  from public.gift_events e
  where e.recipient_id=p_user and e.diamond_source_type='FIXED_GIFT'
    and e.created_at>=p_month::timestamptz and e.created_at<month_end::timestamptz
    and e.agency_id_at_receive is not null and e.agency_owner_id_at_receive is not null
  group by e.agency_id_at_receive
  on conflict(settlement_id,agency_id) do update set agency_owner_id=excluded.agency_owner_id,agency_target=excluded.agency_target,gift_count=excluded.gift_count;
  update public.monthly_settlements s set status=case when s.host_salary is not null
    and not exists(select 1 from public.monthly_settlement_agencies a where a.settlement_id=s.id and a.agent_commission is null)
    then 'ready' else 'prepared' end where s.id=result.id;
  select * into result from public.monthly_settlements where id=result.id;
  return result;
end
$$;
revoke all on function private.refresh_monthly_settlement(uuid,date) from public,anon,authenticated;

create or replace function public.monthly_settlement_state(p_month_start date default date_trunc('month',current_date)::date)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare u uuid:=auth.uid();s public.monthly_settlements%rowtype;
begin
  if u is null then raise exception 'authentication required';end if;
  s:=private.refresh_monthly_settlement(u,p_month_start);
  return jsonb_build_object('settlement',to_jsonb(s),'agencies',
    coalesce((select jsonb_agg(to_jsonb(a) order by a.agency_id) from public.monthly_settlement_agencies a where a.settlement_id=s.id),'[]'::jsonb));
end
$$;
revoke all on function public.monthly_settlement_state(date) from public,anon;
grant execute on function public.monthly_settlement_state(date) to authenticated;

create or replace function public.set_monthly_settlement_compensation(
  p_public_id bigint,p_month_start date,p_host_salary numeric,p_agency_commissions jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare target uuid;s public.monthly_settlements%rowtype;a record;commission numeric;
begin
  perform private.require_owner();
  if p_host_salary is null or p_host_salary<0 then raise exception 'invalid host salary';end if;
  select id into target from public.profiles where public_id=p_public_id;
  if target is null then raise exception 'user not found';end if;
  s:=private.refresh_monthly_settlement(target,p_month_start);
  if s.status='settled' then raise exception 'settlement already finalized';end if;
  update public.monthly_settlements set host_salary=p_host_salary where id=s.id;
  for a in select * from public.monthly_settlement_agencies where settlement_id=s.id loop
    if not (p_agency_commissions ? a.agency_id::text) then raise exception 'agency commission required';end if;
    commission:=(p_agency_commissions->>a.agency_id::text)::numeric;
    if commission<0 then raise exception 'invalid agency commission';end if;
    update public.monthly_settlement_agencies set agent_commission=commission where settlement_id=s.id and agency_id=a.agency_id;
  end loop;
  s:=private.refresh_monthly_settlement(target,p_month_start);
  return jsonb_build_object('settlement',to_jsonb(s),'agencies',
    coalesce((select jsonb_agg(to_jsonb(x) order by x.agency_id) from public.monthly_settlement_agencies x where x.settlement_id=s.id),'[]'::jsonb));
end
$$;
revoke all on function public.set_monthly_settlement_compensation(bigint,date,numeric,jsonb) from public,anon,authenticated;
grant execute on function public.set_monthly_settlement_compensation(bigint,date,numeric,jsonb) to authenticated;

create or replace function public.finalize_monthly_settlement(p_public_id bigint,p_month_start date,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare target uuid;s public.monthly_settlements%rowtype;redemption uuid;lot record;left_to_use bigint;take bigint;coins bigint;month_end date;
begin
  perform private.require_owner();
  if p_request_id is null then raise exception 'request id required';end if;
  if p_month_start is null or extract(day from p_month_start)<>1 then raise exception 'invalid settlement month';end if;
  if p_month_start>=date_trunc('month',current_date)::date then raise exception 'month is not closed';end if;
  select id into target from public.profiles where public_id=p_public_id;
  if target is null then raise exception 'user not found';end if;
  perform pg_advisory_xact_lock(hashtextextended(target::text||':'||p_month_start::text,0));
  s:=private.refresh_monthly_settlement(target,p_month_start);
  select * into s from public.monthly_settlements where id=s.id for update;
  if s.status='settled' then
    return jsonb_build_object('settlement',to_jsonb(s),'agencies',
      coalesce((select jsonb_agg(to_jsonb(a) order by a.agency_id) from public.monthly_settlement_agencies a where a.settlement_id=s.id),'[]'::jsonb));
  end if;
  if s.status<>'ready' or s.host_salary is null then raise exception 'settlement compensation incomplete';end if;
  if exists(select 1 from public.monthly_settlement_agencies a where a.settlement_id=s.id and a.agent_commission is null)
  then raise exception 'settlement compensation incomplete';end if;
  perform id from public.profiles where id=target for update;
  left_to_use:=s.diamonds_remaining;
  coins:=floor(left_to_use*s.conversion_rate)::bigint;
  month_end:=(p_month_start+interval '1 month')::date;
  if left_to_use>0 then
    if coins<=0 then raise exception 'settlement amount too small';end if;
    if exists(select 1 from public.diamond_redemptions where user_id=target and request_id=p_request_id)then raise exception 'request id already used';end if;
    insert into public.diamond_redemptions(user_id,request_id,diamonds_amount,fixed_diamonds,lucky_diamonds,coins_amount)
    values(target,p_request_id,left_to_use,left_to_use,0,coins) returning id into redemption;
    for lot in
      select r.* from private.diamond_remaining(target) r
      join public.diamond_lots l on l.id=r.id join public.gift_events e on e.id=l.source_reference
      where r.source_type='FIXED_GIFT' and r.remaining>0
        and e.created_at>=p_month_start::timestamptz and e.created_at<month_end::timestamptz
      order by r.created_at,r.id
    loop
      exit when left_to_use=0;
      take:=least(left_to_use,lot.remaining);
      insert into public.diamond_redemption_allocations(redemption_id,lot_id,diamonds_amount) values(redemption,lot.id,take);
      left_to_use:=left_to_use-take;
    end loop;
    if left_to_use<>0 then raise exception 'settlement ledger mismatch';end if;
    update public.profiles set diamonds=diamonds-s.diamonds_remaining,gold=gold+coins,updated_at=now()
    where id=target and diamonds>=s.diamonds_remaining;
    if not found then raise exception 'insufficient diamonds';end if;
    insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,diamond_redemption_id)
    values(target,'fixed_diamonds_redeemed',0,-s.diamonds_remaining,redemption),
          (target,'coins_from_diamond_redemption',coins,0,redemption);
  end if;
  update public.monthly_settlements
  set coins_generated=coins,status='settled',request_id=p_request_id,diamond_redemption_id=redemption,settled_at=now()
  where id=s.id returning * into s;
  return jsonb_build_object('settlement',to_jsonb(s),'agencies',
    coalesce((select jsonb_agg(to_jsonb(a) order by a.agency_id) from public.monthly_settlement_agencies a where a.settlement_id=s.id),'[]'::jsonb));
end
$$;
revoke all on function public.finalize_monthly_settlement(bigint,date,uuid) from public,anon,authenticated;
grant execute on function public.finalize_monthly_settlement(bigint,date,uuid) to authenticated;
notify pgrst,'reload schema';
