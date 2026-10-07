-- TASK 3: Lucky bonus is cosmetic-only. Never creates financial diamonds, salary or agent target.
-- Gift's ordinary paid amount remains with the existing atomic gift/diamond system.
-- Lucky probabilities and reward multipliers live server-side and can be changed without mobile releases.
create table public.lucky_reward_tiers (
 id text primary key check(length(id) between 2 and 50),
 label text not null,
 weight integer not null check(weight between 1 and 1000000),
 multiplier integer not null check(multiplier between 1 and 10000),
 points_per_gift integer not null check(points_per_gift between 0 and 10000),
 max_daily_wins integer check(max_daily_wins between 1 and 1000000),
 event_id text,
 enabled boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
-- Initial backend configuration is cosmetic-only; not catalog products, not Coins or Diamonds.
insert into public.lucky_reward_tiers(id,label,weight,multiplier,points_per_gift,max_daily_wins,sort_order)
values ('common','عادي',70,1,1,null,10),
       ('spark','متألق',20,7,1,500,20),
       ('rare','نادر',9,77,1,50,30),
       ('legend','أسطوري',1,777,1,5,40);

create table public.lucky_bonus_results (
 gift_event_id uuid primary key references public.gift_events(id),
 request_id uuid not null unique,
 sender_id uuid not null references public.profiles(id),
 recipient_id uuid not null references public.profiles(id),
 room_id uuid not null references public.rooms(id),
 gift_id text not null references public.gift_catalog(id),
 sender_name text not null,
 recipient_name text not null,
 gift_name text not null,
 quantity integer not null check(quantity between 1 and 777),
 tier_id text not null references public.lucky_reward_tiers(id),
 multiplier integer not null check(multiplier between 1 and 10000),
 lucky_points bigint not null check(lucky_points>=0),
 event_id text,
 created_at timestamptz not null default now()
);
create index lucky_result_receiver_idx on public.lucky_bonus_results(recipient_id,created_at desc);
create index lucky_result_room_idx on public.lucky_bonus_results(room_id,created_at desc);
create index lucky_result_daily_caps_idx on public.lucky_bonus_results(recipient_id,tier_id,created_at);

alter table public.lucky_reward_tiers enable row level security;
alter table public.lucky_bonus_results enable row level security;
revoke all on public.lucky_reward_tiers,public.lucky_bonus_results from public,anon,authenticated;
grant select on public.lucky_reward_tiers,public.lucky_bonus_results to authenticated;
create policy lucky_tiers_read on public.lucky_reward_tiers for select to authenticated using(enabled);
create policy lucky_results_authorized_read on public.lucky_bonus_results
 for select to authenticated
 using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid())
       or private.room_access_allowed(room_id));

-- Account Lucky Points are derived exclusively from immutable gift results.
-- They do not enter any profile Diamonds field or agency salary target.
create function public.lucky_points_state() returns jsonb
language sql stable security definer set search_path=''
as $$ select jsonb_build_object('total_lucky_points',coalesce(sum(lucky_points),0))
 from public.lucky_bonus_results where recipient_id=auth.uid() $$;
revoke all on function public.lucky_points_state() from public,anon;
grant execute on function public.lucky_points_state() to authenticated;

create function private.award_cosmetic_lucky_bonus() returns trigger
language plpgsql security definer set search_path=''
as $$
declare
 v_total bigint;
 v_roll bigint;
 v_choice public.lucky_reward_tiers%rowtype;
 v_names record;
begin
 if new.diamond_source_type<>'LUCKY_GIFT' then return new;end if;
 if not exists(select 1 from public.gift_catalog g
               where g.id=new.gift_id and g.category_id='luck')then return new;end if;

 -- One participant/day mutex prevents concurrent results from bypassing daily limits.
 perform pg_advisory_xact_lock(hashtextextended(
  'lucky_cosmetic:'||new.recipient_id::text||':'||(now() at time zone 'UTC')::date::text,0));

 select coalesce(sum(weight),0) into v_total
 from public.lucky_reward_tiers t
 where t.enabled and t.event_id is null and
  (t.max_daily_wins is null or
   (select count(*) from public.lucky_bonus_results r
     where r.recipient_id=new.recipient_id and r.tier_id=t.id
      and r.created_at>=(now() at time zone 'UTC')::date::timestamp at time zone 'UTC'
      and r.created_at<((now() at time zone 'UTC')::date+1)::timestamp at time zone 'UTC')<t.max_daily_wins);
 if v_total=0 then return new;end if;

 -- Result drawn on trusted Postgres, never in the browser. Points are nonredeemable cosmetics.
 v_roll:=floor(random()*v_total)::bigint;
 select chosen.* into v_choice from
  (select t.*,sum(t.weight)over(order by t.sort_order,t.id) ceiling
   from public.lucky_reward_tiers t
   where t.enabled and t.event_id is null and
   (t.max_daily_wins is null or
    (select count(*) from public.lucky_bonus_results r
     where r.recipient_id=new.recipient_id and r.tier_id=t.id
       and r.created_at>=(now() at time zone 'UTC')::date::timestamp at time zone 'UTC'
       and r.created_at<((now() at time zone 'UTC')::date+1)::timestamp at time zone 'UTC')<t.max_daily_wins)
  ) chosen where v_roll<chosen.ceiling order by chosen.ceiling limit 1;
 if v_choice.id is null then raise exception 'lucky tier selection failed';end if;
 select s.display_name sender_name,r.display_name recipient_name,g.name gift_name
 into v_names from public.profiles s,public.profiles r,public.gift_catalog g
 where s.id=new.sender_id and r.id=new.recipient_id and g.id=new.gift_id;
 if not found then raise exception 'lucky gift metadata unavailable';end if;

 insert into public.lucky_bonus_results(
  gift_event_id,request_id,sender_id,recipient_id,room_id,gift_id,
  sender_name,recipient_name,gift_name,quantity,tier_id,multiplier,lucky_points,event_id)
 values(new.id,new.request_id,new.sender_id,new.recipient_id,new.room_id,new.gift_id,
  v_names.sender_name,v_names.recipient_name,v_names.gift_name,new.quantity,
  v_choice.id,v_choice.multiplier,
  new.quantity::bigint*v_choice.multiplier::bigint*v_choice.points_per_gift::bigint,null);
 return new;
end $$;
revoke all on function private.award_cosmetic_lucky_bonus() from public,anon,authenticated;
create trigger gift_cosmetic_lucky_reward after insert on public.gift_events
for each row execute function private.award_cosmetic_lucky_bonus();

-- Supabase Realtime room announcements (room members only via RLS above).
do $$ begin
 alter publication supabase_realtime add table public.lucky_bonus_results;
exception when duplicate_object then null;
end $$;
notify pgrst,'reload schema';
