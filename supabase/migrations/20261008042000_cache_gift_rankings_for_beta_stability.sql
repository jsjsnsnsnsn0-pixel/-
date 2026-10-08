-- Backend-only TotiChat rankings repair, deployed live on 2026-10-08.
-- No user, room, gift, wallet, diamonds, or permission records are changed.
-- The shared cache contains raw room totals in private schema. Every API read
-- still checks private.can_view_room() for the authenticated caller.
create table if not exists private.gift_rankings_cache(
 period text primary key check(period in ('daily','weekly','monthly')),
 period_start timestamptz not null,
 updated_at timestamptz not null default now(),
 wealth jsonb not null default '[]'::jsonb,
 charm jsonb not null default '[]'::jsonb,
 rooms jsonb not null default '[]'::jsonb
);
revoke all on private.gift_rankings_cache from public,anon,authenticated;

CREATE OR REPLACE FUNCTION private.refresh_gift_rankings_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_period text; v_start timestamptz; v_wealth jsonb; v_charm jsonb; v_rooms jsonb;
begin
 for v_period in select unnest(array['daily','weekly','monthly']::text[]) loop
   v_start:=pg_catalog.date_trunc(
     case v_period when 'daily' then 'day' when 'weekly' then 'week' else 'month' end,
     now());
   select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc,x.public_id),'[]'::jsonb)
   into v_wealth
   from (
     select p.public_id,p.display_name,p.avatar_url,p.country_code,p.level,p.vip_level,
       sum(g.amount) as score
     from public.gift_events g join public.profiles p on p.id=g.sender_id
     where g.created_at>=v_start
     group by p.id order by sum(g.amount) desc,p.public_id limit 100
   ) x;
   select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc,x.public_id),'[]'::jsonb)
   into v_charm
   from (
     select p.public_id,p.display_name,p.avatar_url,p.country_code,p.level,p.vip_level,
       sum(g.amount) as score
     from public.gift_events g join public.profiles p on p.id=g.recipient_id
     where g.created_at>=v_start
     group by p.id order by sum(g.amount) desc,p.public_id limit 100
   ) x;
   -- Compute all room totals privately; visibility is enforced on every read.
   select coalesce(jsonb_agg(to_jsonb(x) order by x.score desc,x.id),'[]'::jsonb)
   into v_rooms
   from (
     select r.id,r.name,r.image_url,r.owner_display_name,r.owner_avatar_url,
      sum(g.amount) as score
     from public.gift_events g join public.rooms r on r.id=g.room_id
     where g.created_at>=v_start
     group by r.id
   ) x;
   insert into private.gift_rankings_cache(period,period_start,updated_at,wealth,charm,rooms)
   values(v_period,v_start,now(),v_wealth,v_charm,v_rooms)
   on conflict(period) do update
   set period_start=excluded.period_start,updated_at=excluded.updated_at,
     wealth=excluded.wealth,charm=excluded.charm,rooms=excluded.rooms;
 end loop;
end $function$;

CREATE OR REPLACE FUNCTION private.get_gift_rankings_cached(p_period text DEFAULT 'daily'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_wealth jsonb; v_charm jsonb; v_rooms jsonb; v_start timestamptz; v_visible jsonb;
begin
 if auth.uid() is null then raise exception 'authentication required';end if;
 if p_period not in ('daily','weekly','monthly') then raise exception 'invalid period';end if;
 select wealth,charm,rooms,period_start
 into v_wealth,v_charm,v_rooms,v_start
 from private.gift_rankings_cache where period=p_period;
 if v_start is distinct from pg_catalog.date_trunc(
    case p_period when 'daily' then 'day' when 'weekly' then 'week' else 'month' end,now())
 then return jsonb_build_object('wealth','[]'::jsonb,'charm','[]'::jsonb,'rooms','[]'::jsonb);
 end if;
 select coalesce(jsonb_agg(value order by ordinality),'[]'::jsonb) into v_visible
 from (
   select value,ordinality from pg_catalog.jsonb_array_elements(v_rooms) with ordinality
   where private.can_view_room((value->>'id')::uuid)
   order by ordinality limit 100
 ) allowed;
 return jsonb_build_object('wealth',v_wealth,'charm',v_charm,'rooms',v_visible);
end $function$;

CREATE OR REPLACE FUNCTION private.get_gift_rankings(p_period text DEFAULT 'daily'::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$select private.get_gift_rankings_cached(p_period)$function$;

revoke all on function private.refresh_gift_rankings_cache() from public,anon,authenticated,service_role;
revoke all on function private.get_gift_rankings_cached(text) from public,anon;
grant execute on function private.get_gift_rankings_cached(text) to authenticated;
select private.refresh_gift_rankings_cache();
select cron.schedule('totichat-gift-rankings-refresh','* * * * *','select private.refresh_gift_rankings_cache()');
notify pgrst,'reload schema';
