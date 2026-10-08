-- Read-only monthly settlement reporting; preserve historical earned diamonds and compensation.
-- Settlement changes remain Owner-only via the verified existing financial RPCs.
create function public.dashboard_monthly_settlements(p_month date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require('settlements.view');
 if p_month is null or extract(day from p_month)<>1 then
  raise exception 'first day of month is required';end if;
 return jsonb_build_object(
  'month',p_month,
  'entries',coalesce((
   select jsonb_agg(to_jsonb(entry) order by entry.public_id) from(
    select s.id,s.month_start,s.status,s.diamonds_earned,s.diamonds_manually_redeemed,
      s.diamonds_remaining,s.monthly_gift_count,s.conversion_rate,s.coins_generated,
      s.host_salary,s.prepared_at,s.settled_at,
      p.public_id,p.display_name,
      coalesce((
       select jsonb_agg(jsonb_build_object(
        'agency_id',a.agency_id,'name',ag.name,'agency_target',a.agency_target,
        'gift_count',a.gift_count,'agent_commission',a.agent_commission
       ) order by a.agency_id)
       from public.monthly_settlement_agencies a
       left join public.agencies ag on ag.id=a.agency_id
       where a.settlement_id=s.id
      ),'[]'::jsonb) as agencies
    from public.monthly_settlements s
    join public.profiles p on p.id=s.user_id
    where s.month_start=p_month order by p.public_id limit 500
   ) entry
  ),'[]'::jsonb),
  'totals',(select jsonb_build_object(
    'hosts',count(*),'earned_diamonds',coalesce(sum(diamonds_earned),0),
    'unredeemed_diamonds',coalesce(sum(diamonds_remaining),0),
    'host_salaries',coalesce(sum(host_salary),0),
    'generated_coins',coalesce(sum(coins_generated),0),
    'settled',count(*) filter(where status='settled'),
    'pending',count(*) filter(where status<>'settled')
   ) from public.monthly_settlements where month_start=p_month),
  'total_agent_commissions',(select coalesce(sum(a.agent_commission),0)
    from public.monthly_settlement_agencies a
    join public.monthly_settlements s on s.id=a.settlement_id where s.month_start=p_month)
 );
end $$;
revoke all on function public.dashboard_monthly_settlements(date) from public,anon;
grant execute on function public.dashboard_monthly_settlements(date) to authenticated;

create function public.dashboard_monthly_save_compensation(
 p_public_id bigint,p_month_start date,p_host_salary numeric,p_commissions jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;target uuid;
begin
 perform private.dashboard_require_owner();
 result:=public.set_monthly_settlement_compensation(
  p_public_id,p_month_start,p_host_salary,coalesce(p_commissions,'{}'::jsonb));
 select id into target from public.profiles where public_id=p_public_id;
 insert into public.dashboard_audit(actor_id,action,target_id,metadata) values(
  auth.uid(),'settlements.compensation',target,
  jsonb_build_object('month',p_month_start,'public_id',p_public_id,
     'host_salary',p_host_salary,'commissions',coalesce(p_commissions,'{}'::jsonb)));
 return result;
end $$;
revoke all on function public.dashboard_monthly_save_compensation(bigint,date,numeric,jsonb) from public,anon;
grant execute on function public.dashboard_monthly_save_compensation(bigint,date,numeric,jsonb) to authenticated;

create function public.dashboard_monthly_finalize(
 p_public_id bigint,p_month_start date,p_request_id uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;target uuid;was_settled boolean;
begin
 perform private.dashboard_require_owner();
 if p_request_id is null then raise exception 'request id required';end if;
 select id into target from public.profiles where public_id=p_public_id;
 if target is null then raise exception 'user not found';end if;
 select exists(select 1 from public.monthly_settlements where user_id=target
 and month_start=p_month_start and status='settled') into was_settled;
 result:=public.finalize_monthly_settlement(p_public_id,p_month_start,p_request_id);
 if not was_settled then
  insert into public.dashboard_audit(actor_id,action,target_id,metadata)values(
   auth.uid(),'settlements.finalize',target,
   jsonb_build_object('month',p_month_start,'public_id',p_public_id,
    'request_id',p_request_id,'result',result->'settlement'));
 end if;
 return result;
end $$;
revoke all on function public.dashboard_monthly_finalize(bigint,date,uuid) from public,anon;
grant execute on function public.dashboard_monthly_finalize(bigint,date,uuid) to authenticated;
notify pgrst,'reload schema';
