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
  from public.diamond_lots l
  join public.gift_events e on e.id=l.source_reference
  join public.diamond_redemption_allocations a on a.lot_id=l.id
  where l.user_id=p_user and l.source_type='FIXED_GIFT'
    and e.created_at>=p_month::timestamptz and e.created_at<month_end::timestamptz;

  insert into public.monthly_settlements(
    user_id,month_start,diamonds_earned,diamonds_manually_redeemed,diamonds_remaining,monthly_gift_count,conversion_rate,host_salary,status,prepared_at
  ) values(
    p_user,p_month,earned,redeemed,greatest(0,earned-redeemed),gift_count,0.30,existing.host_salary,
    case when existing.host_salary is not null then 'ready' else 'prepared' end,now()
  )
  on conflict(user_id,month_start) do update set
    diamonds_earned=excluded.diamonds_earned,
    diamonds_manually_redeemed=excluded.diamonds_manually_redeemed,
    diamonds_remaining=excluded.diamonds_remaining,
    monthly_gift_count=excluded.monthly_gift_count,
    conversion_rate=excluded.conversion_rate,
    prepared_at=now()
  returning * into result;

  insert into public.monthly_settlement_agencies(settlement_id,agency_id,agency_owner_id,agency_target,gift_count)
  select result.id,e.agency_id_at_receive,min(e.agency_owner_id_at_receive::text)::uuid,sum(e.amount),sum(e.quantity)
  from public.gift_events e
  where e.recipient_id=p_user and e.diamond_source_type='FIXED_GIFT'
    and e.created_at>=p_month::timestamptz and e.created_at<month_end::timestamptz
    and e.agency_id_at_receive is not null and e.agency_owner_id_at_receive is not null
  group by e.agency_id_at_receive
  on conflict(settlement_id,agency_id) do update set
    agency_owner_id=excluded.agency_owner_id,
    agency_target=excluded.agency_target,
    gift_count=excluded.gift_count;

  update public.monthly_settlements s
  set status=case
    when s.host_salary is not null
     and not exists(select 1 from public.monthly_settlement_agencies a where a.settlement_id=s.id and a.agent_commission is null)
    then 'ready' else 'prepared' end
  where s.id=result.id;

  select * into result from public.monthly_settlements where id=result.id;
  return result;
end
$$;
revoke all on function private.refresh_monthly_settlement(uuid,date) from public,anon,authenticated;
