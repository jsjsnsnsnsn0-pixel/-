-- TASK 1 / Monthly Settlement. Forward-only, no balance reset on deployment.
-- Requires separately approved salary and commission rates. One atomic close per UTC month.
alter table public.gift_events
 add column settlement_agency_id bigint references public.agencies(id),
 add column settlement_agency_verified boolean not null default false;
create index gift_settlement_period_idx on public.gift_events(created_at,recipient_id);
create index gift_settlement_agency_idx on public.gift_events(settlement_agency_id,created_at);

-- At gift time, snapshot the agency. This must not be inferred from future memberships.
create function private.capture_gift_agency_for_settlement() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 select m.agency_id into new.settlement_agency_id
 from public.agency_members m where m.user_id=new.recipient_id;
 new.settlement_agency_verified:=true;
 return new;
end $$;
create trigger gift_agency_at_receipt before insert on public.gift_events
for each row execute function private.capture_gift_agency_for_settlement();
revoke all on function private.capture_gift_agency_for_settlement() from public,anon,authenticated;

-- Set rates explicitly by trusted server administrators before closing; no guessed percentages.
create table public.monthly_settlement_rates (
 settlement_month date primary key,
 host_salary_iqd_per_diamond numeric(20,6) not null check(host_salary_iqd_per_diamond>=0),
 agent_commission_iqd_per_diamond numeric(20,6) not null check(agent_commission_iqd_per_diamond>=0),
 approved_at timestamptz not null default now(),
 check(settlement_month=date_trunc('month',settlement_month::timestamp)::date)
);
create table public.monthly_settlement_runs (
 settlement_month date primary key,
 status text not null default 'closed' check(status='closed'),
 diamonds_earned bigint not null,
 diamonds_auto_converted bigint not null,
 coins_credited bigint not null,
 conversion_rate numeric(4,2) not null default 0.30 check(conversion_rate=0.30),
 closed_at timestamptz not null default now()
);
create table public.monthly_coin_carry (
 user_id uuid primary key references public.profiles(id),
 fraction numeric(10,4) not null default 0 check(fraction>=0 and fraction<1),
 updated_at timestamptz not null default now()
);
create table public.monthly_host_settlements (
 settlement_month date not null references public.monthly_settlement_runs(settlement_month),
 host_id uuid not null references public.profiles(id),
 diamonds_earned bigint not null check(diamonds_earned>=0),
 diamonds_manually_redeemed bigint not null check(diamonds_manually_redeemed>=0),
 diamonds_auto_converted bigint not null check(diamonds_auto_converted>=0),
 coins_credited bigint not null check(coins_credited>=0),
 coin_fraction_carried numeric(10,4) not null check(coin_fraction_carried>=0 and coin_fraction_carried<1),
 host_target bigint not null check(host_target>=0),
 host_salary_iqd numeric(22,4) not null check(host_salary_iqd>=0),
 payment_status text not null default 'unpaid' check(payment_status in('unpaid','paid')),
 redemption_id uuid references public.diamond_redemptions(id),
 created_at timestamptz not null default now(),
 primary key(settlement_month,host_id),
 check(diamonds_manually_redeemed+diamonds_auto_converted<=diamonds_earned)
);
create table public.monthly_agency_settlements (
 settlement_month date not null references public.monthly_settlement_runs(settlement_month),
 agency_id bigint not null references public.agencies(id),
 agent_id uuid not null references public.profiles(id),
 target_diamonds bigint not null check(target_diamonds>=0),
 hosts_salary_iqd numeric(22,4) not null check(hosts_salary_iqd>=0),
 agent_commission_iqd numeric(22,4) not null check(agent_commission_iqd>=0),
 payment_status text not null default 'unpaid' check(payment_status in('unpaid','paid')),
 created_at timestamptz not null default now(),
 primary key(settlement_month,agency_id)
);
-- Old month gift rows predate this snapshot; require actual audit before financial closing.
-- Approving their agency attribution is deliberately NOT exposed to ordinary clients.
create index monthly_host_user_idx on public.monthly_host_settlements(host_id,settlement_month);
create index monthly_agent_user_idx on public.monthly_agency_settlements(agent_id,settlement_month);
alter table public.monthly_settlement_rates enable row level security;
alter table public.monthly_settlement_runs enable row level security;
alter table public.monthly_coin_carry enable row level security;
alter table public.monthly_host_settlements enable row level security;
alter table public.monthly_agency_settlements enable row level security;
revoke all on public.monthly_settlement_rates,public.monthly_settlement_runs,public.monthly_coin_carry,
 public.monthly_host_settlements,public.monthly_agency_settlements from public,anon,authenticated;
grant select on public.monthly_host_settlements,public.monthly_agency_settlements to authenticated;
create policy monthly_host_own_read on public.monthly_host_settlements for select to authenticated
 using(host_id=(select auth.uid()));
create policy monthly_agent_own_read on public.monthly_agency_settlements for select to authenticated
 using(agent_id=(select auth.uid()));

-- Manual diamond redemption uses the same 30% rate for both eligible sources.
create or replace function private.preview_diamond_redemption(p_diamonds bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); state jsonb; f bigint; l bigint; coins bigint;
begin
 if u is null then raise exception 'authentication required'; end if;
 if p_diamonds is null or p_diamonds<=0 or p_diamonds>9007199254740991 then raise exception 'invalid diamond amount'; end if;
 state:=private.wallet_diamond_state();
 if (state->>'diamonds_balance')::bigint<p_diamonds then raise exception 'insufficient diamonds'; end if;
 f:=least(p_diamonds,(state->>'fixed_diamonds')::bigint); l:=p_diamonds-f;
 if l>(state->>'lucky_diamonds')::bigint then raise exception 'insufficient redeemable diamonds'; end if;
 coins:=(f/10)*3+((f%10)*3)/10+(l/10)*3+((l%10)*3)/10;
 if coins<=0 then raise exception 'diamond amount is too small'; end if;
 return jsonb_build_object('diamonds_amount',p_diamonds,'fixed_diamonds',f,'lucky_diamonds',l,'coins_amount',coins);
end $$;

-- Keep exact fractional Coins across months: 1 diamond = 0.3 Coins, not lost.
-- Existing manual-redemption and prior ledger rows remain unchanged.
alter table public.diamond_redemptions drop constraint diamond_redemptions_coins_amount_check;
alter table public.diamond_redemptions add constraint diamond_redemptions_coins_amount_check
 check(coins_amount>=0);

create function private.close_monthly_settlement(p_month date) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_start timestamptz;
 v_end timestamptz;
 v_host_rate numeric;
 v_agent_rate numeric;
 h record;
 ag record;
 lot record;
 v_earned bigint;
 v_manual bigint;
 v_available bigint;
 v_remaining bigint;
 v_fixed bigint;
 v_lucky bigint;
 v_target bigint;
 v_coin_exact numeric;
 v_coins bigint;
 v_carry numeric;
 v_redemption uuid;
 v_take bigint;
 v_earned_total bigint:=0;
 v_converted_total bigint:=0;
 v_coins_total bigint:=0;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'service role required';end if;
 if p_month is null or p_month<>date_trunc('month',p_month::timestamp)::date then
  raise exception 'month must start on first day';
 end if;
 v_start:=p_month::timestamp at time zone 'UTC';
 v_end:=(p_month+interval '1 month')::timestamp at time zone 'UTC';
 if v_end>now() then raise exception 'cannot close a current or future month';end if;
 perform pg_advisory_xact_lock(hashtextextended('totichat_month_close_'||p_month::text,0));
 if exists(select 1 from public.monthly_settlement_runs where settlement_month=p_month) then
  return jsonb_build_object('status','already_closed','month',p_month);
 end if;
 select host_salary_iqd_per_diamond,agent_commission_iqd_per_diamond
 into v_host_rate,v_agent_rate from public.monthly_settlement_rates where settlement_month=p_month;
 if not found then raise exception 'approved settlement rates required';end if;
 -- Block new gift writes while snapshotting; no partial or changing target.
 lock table public.gift_events in share row exclusive mode;
 if exists(select 1 from public.gift_events where created_at>=v_start and created_at<v_end
            and not settlement_agency_verified) then
  raise exception 'legacy gift agency attribution must be audited first';
 end if;
 insert into public.monthly_settlement_runs(settlement_month,diamonds_earned,diamonds_auto_converted,coins_credited)
 values(p_month,0,0,0);
 -- Locks are ordered by host ID; redemption uses the same per-user profile lock.
 for h in select recipient_id user_id,coalesce(sum(amount),0)::bigint earned,
            coalesce(sum(amount)filter(where settlement_agency_id is not null),0)::bigint agency_target
          from public.gift_events where created_at>=v_start and created_at<v_end
          group by recipient_id order by recipient_id loop
  perform 1 from public.profiles where id=h.user_id for update;
  if not found then raise exception 'missing recipient profile';end if;
  select coalesce(sum(a.diamonds_amount),0)::bigint into v_manual
  from public.diamond_redemption_allocations a
  join public.diamond_lots l on l.id=a.lot_id
  join public.gift_events g on g.id=l.source_reference
  where g.recipient_id=h.user_id and g.created_at>=v_start and g.created_at<v_end;
  v_available:=0;v_fixed:=0;v_lucky:=0;
  for lot in select r.* from private.diamond_remaining(h.user_id) r
             join public.diamond_lots l on l.id=r.id
             join public.gift_events g on g.id=l.source_reference
             where g.created_at>=v_start and g.created_at<v_end and r.remaining>0
             order by r.created_at,r.id loop
    v_available:=v_available+lot.remaining;
    if lot.source_type='FIXED_GIFT' then v_fixed:=v_fixed+lot.remaining;
    elsif lot.source_type='LUCKY_GIFT' then v_lucky:=v_lucky+lot.remaining;
    else raise exception 'unclassified diamond lot';end if;
  end loop;
  if v_manual+v_available<>h.earned then raise exception 'diamond ledger does not reconcile';end if;
  select coalesce(fraction,0) into v_carry from public.monthly_coin_carry
   where user_id=h.user_id for update;
  v_carry:=coalesce(v_carry,0);
  v_coin_exact:=v_available::numeric*0.30+v_carry;
  v_coins:=floor(v_coin_exact)::bigint;
  v_carry:=v_coin_exact-v_coins;
  v_redemption:=null;
  if v_available>0 then
    insert into public.diamond_redemptions(user_id,request_id,diamonds_amount,fixed_diamonds,lucky_diamonds,coins_amount)
    values(h.user_id,gen_random_uuid(),v_available,v_fixed,v_lucky,v_coins) returning id into v_redemption;
    v_remaining:=v_available;
    for lot in select r.* from private.diamond_remaining(h.user_id) r
               join public.diamond_lots l on l.id=r.id
               join public.gift_events g on g.id=l.source_reference
               where g.created_at>=v_start and g.created_at<v_end and r.remaining>0
               order by r.created_at,r.id loop
      v_take:=lot.remaining;
      insert into public.diamond_redemption_allocations(redemption_id,lot_id,diamonds_amount)
      values(v_redemption,lot.id,v_take);
      v_remaining:=v_remaining-v_take;
    end loop;
    if v_remaining<>0 then raise exception 'unallocated monthly diamonds';end if;
    update public.profiles set diamonds=diamonds-v_available,gold=gold+v_coins,updated_at=now()
     where id=h.user_id and diamonds>=v_available;
    if not found then raise exception 'insufficient diamonds during settlement';end if;
    insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,diamond_redemption_id)
    select h.user_id,case source when 'FIXED_GIFT' then 'fixed_diamonds_redeemed'
                               else 'lucky_diamonds_redeemed' end,0,-amount,v_redemption
    from (values('FIXED_GIFT',v_fixed),('LUCKY_GIFT',v_lucky)) as kinds(source,amount) where amount>0;
    insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta,diamond_redemption_id)
    values(h.user_id,'coins_from_diamond_redemption',v_coins,0,v_redemption);
  end if;
  insert into public.monthly_coin_carry(user_id,fraction,updated_at) values(h.user_id,v_carry,now())
  on conflict(user_id)do update set fraction=excluded.fraction,updated_at=now();
  insert into public.monthly_host_settlements(
   settlement_month,host_id,diamonds_earned,diamonds_manually_redeemed,
   diamonds_auto_converted,coins_credited,coin_fraction_carried,host_target,host_salary_iqd,redemption_id)
  values(p_month,h.user_id,h.earned,v_manual,v_available,v_coins,v_carry,h.agency_target,
         round(h.agency_target*v_host_rate,4),v_redemption);
  v_earned_total:=v_earned_total+h.earned;
  v_converted_total:=v_converted_total+v_available;
  v_coins_total:=v_coins_total+v_coins;
 end loop;
 -- Historic agency attributions stay frozen on gift_events, not current membership.
 for ag in select g.settlement_agency_id agency_id,a.owner_id agent_id,sum(g.amount)::bigint target
           from public.gift_events g join public.agencies a on a.id=g.settlement_agency_id
           where g.created_at>=v_start and g.created_at<v_end and g.settlement_agency_id is not null
           group by g.settlement_agency_id,a.owner_id loop
  insert into public.monthly_agency_settlements(settlement_month,agency_id,agent_id,
   target_diamonds,hosts_salary_iqd,agent_commission_iqd)
  values(p_month,ag.agency_id,ag.agent_id,ag.target,round(ag.target*v_host_rate,4),
         round(ag.target*v_agent_rate,4));
 end loop;
 update public.monthly_settlement_runs set diamonds_earned=v_earned_total,
  diamonds_auto_converted=v_converted_total,coins_credited=v_coins_total
 where settlement_month=p_month;
 return jsonb_build_object('status','closed','month',p_month,'diamonds_earned',v_earned_total,
   'diamonds_converted',v_converted_total,'coins_credited',v_coins_total);
end $$;
revoke all on function private.close_monthly_settlement(date) from public,anon,authenticated;
create function public.close_monthly_settlement(p_month date) returns jsonb
language sql security invoker set search_path='' as $$
 select private.close_monthly_settlement(p_month) $$;
revoke all on function public.close_monthly_settlement(date) from public,anon,authenticated;
grant execute on function private.close_monthly_settlement(date),public.close_monthly_settlement(date) to service_role;
notify pgrst,'reload schema';
