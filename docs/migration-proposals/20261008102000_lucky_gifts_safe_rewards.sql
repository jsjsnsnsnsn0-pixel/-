-- Lucky Gifts: non-financial server-side rewards.
-- Lucky multipliers award Lucky Points only. They never multiply diamonds,
-- host salary, agency target, or settlement value.

create table if not exists private.lucky_reward_tiers(
  id uuid primary key default gen_random_uuid(),
  gift_id text references public.gift_catalog(id) on delete cascade,
  reward_tier text not null,
  label text not null,
  weight integer not null check(weight>0),
  multiplier integer not null check(multiplier>=1),
  points_per_unit integer not null default 1 check(points_per_unit>=0),
  max_daily_wins integer check(max_daily_wins is null or max_daily_wins>0),
  event_id text,
  visual_style text not null default 'flash',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table private.lucky_reward_tiers enable row level security;
revoke all on private.lucky_reward_tiers from public,anon,authenticated;

create table if not exists public.lucky_results(
  id uuid primary key default gen_random_uuid(),
  gift_event_id uuid unique references public.gift_events(id) on delete set null,
  request_id uuid not null unique,
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  sender_public_id bigint not null,
  recipient_public_id bigint not null,
  sender_name text not null,
  recipient_name text not null,
  room_id uuid not null references public.rooms(id),
  gift_id text not null references public.gift_catalog(id),
  gift_name text not null,
  quantity integer not null check(quantity in(1,7,77,777)),
  tier_id uuid,
  reward_tier text not null,
  result_label text not null,
  multiplier integer not null check(multiplier>=1),
  lucky_points bigint not null check(lucky_points>=0),
  event_id text,
  visual_style text not null default 'flash',
  created_at timestamptz not null default now()
);

create table if not exists public.lucky_point_balances(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  points bigint not null default 0 check(points>=0),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_lucky_feed(
  id uuid primary key default gen_random_uuid(),
  lucky_result_id uuid not null unique references public.lucky_results(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_public_id bigint not null,
  sender_name text not null,
  recipient_public_id bigint not null,
  recipient_name text not null,
  gift_id text not null,
  gift_name text not null,
  quantity integer not null,
  result_label text not null,
  multiplier integer not null,
  lucky_points bigint not null,
  visual_style text not null,
  created_at timestamptz not null default now()
);

alter table public.lucky_results enable row level security;
alter table public.lucky_point_balances enable row level security;
alter table public.room_lucky_feed enable row level security;

drop policy if exists lucky_results_read_participants on public.lucky_results;
create policy lucky_results_read_participants on public.lucky_results
for select to authenticated
using(
  sender_id=(select auth.uid())
  or recipient_id=(select auth.uid())
  or exists(select 1 from public.admin_roles ar where ar.user_id=(select auth.uid()) and ar.role='owner')
);

drop policy if exists lucky_points_read_owner on public.lucky_point_balances;
create policy lucky_points_read_owner on public.lucky_point_balances
for select to authenticated
using(
  user_id=(select auth.uid())
  or exists(select 1 from public.admin_roles ar where ar.user_id=(select auth.uid()) and ar.role='owner')
);

drop policy if exists room_lucky_feed_read_room on public.room_lucky_feed;
create policy room_lucky_feed_read_room on public.room_lucky_feed
for select to authenticated
using(
  private.room_access_allowed(room_id)
  or exists(select 1 from public.admin_roles ar where ar.user_id=(select auth.uid()) and ar.role='owner')
);

revoke insert,update,delete on public.lucky_results from public,anon,authenticated;
revoke insert,update,delete on public.lucky_point_balances from public,anon,authenticated;
revoke insert,update,delete on public.room_lucky_feed from public,anon,authenticated;
grant select on public.lucky_results,public.lucky_point_balances,public.room_lucky_feed to authenticated;

create index if not exists lucky_results_recipient_created_idx on public.lucky_results(recipient_id,created_at desc);
create index if not exists lucky_results_room_created_idx on public.lucky_results(room_id,created_at desc);
create index if not exists lucky_results_tier_daily_idx on public.lucky_results(recipient_id,tier_id,created_at desc);
create index if not exists room_lucky_feed_room_created_idx on public.room_lucky_feed(room_id,created_at desc);
create index if not exists lucky_reward_tiers_gift_active_idx on private.lucky_reward_tiers(gift_id,is_active);

create or replace function private.resolve_lucky_reward(
  p_request_id uuid,
  p_gift_event_id uuid,
  p_sender uuid,
  p_recipient uuid,
  p_room uuid,
  p_gift_id text,
  p_quantity integer
) returns public.lucky_results
language plpgsql
security definer
set search_path=''
as $$
declare
  existing public.lucky_results%rowtype;
  selected private.lucky_reward_tiers%rowtype;
  candidate private.lucky_reward_tiers%rowtype;
  total_weight bigint:=0;
  draw bigint:=0;
  running bigint:=0;
  gift_name text;
  sender_public bigint;
  recipient_public bigint;
  sender_display text;
  recipient_display text;
  points bigint:=0;
  inserted public.lucky_results%rowtype;
  use_specific boolean:=false;
begin
  if p_request_id is null or p_sender is null or p_recipient is null or p_room is null or p_gift_id is null then
    raise exception 'invalid lucky reward source';
  end if;
  if p_quantity not in(1,7,77,777) then raise exception 'invalid gift quantity';end if;

  perform pg_advisory_xact_lock(hashtextextended('lucky:'||p_request_id::text,0));
  select * into existing from public.lucky_results where request_id=p_request_id;
  if found then return existing;end if;

  select name into gift_name from public.gift_catalog
  where id=p_gift_id and is_active and diamond_source_type='LUCKY_GIFT';
  if gift_name is null then raise exception 'gift is not lucky';end if;

  -- Serialize a recipient's daily-cap calculation so parallel sends cannot
  -- exceed max_daily_wins.
  perform pg_advisory_xact_lock(hashtextextended('lucky-user:'||p_recipient::text||':'||current_date::text,0));

  select exists(
    select 1 from private.lucky_reward_tiers t
    where t.is_active and t.gift_id=p_gift_id
  ) into use_specific;

  select coalesce(sum(t.weight),0) into total_weight
  from private.lucky_reward_tiers t
  where t.is_active
    and (case when use_specific then t.gift_id=p_gift_id else t.gift_id is null end)
    and (
      t.max_daily_wins is null
      or (
        select count(*) from public.lucky_results r
        where r.recipient_id=p_recipient and r.tier_id=t.id
          and r.created_at>=date_trunc('day',now())
          and r.created_at<date_trunc('day',now())+interval '1 day'
      )<t.max_daily_wins
    );

  if total_weight>0 then
    draw:=floor(random()*total_weight)::bigint+1;
    for candidate in
      select t.* from private.lucky_reward_tiers t
      where t.is_active
        and (case when use_specific then t.gift_id=p_gift_id else t.gift_id is null end)
        and (
          t.max_daily_wins is null
          or (
            select count(*) from public.lucky_results r
            where r.recipient_id=p_recipient and r.tier_id=t.id
              and r.created_at>=date_trunc('day',now())
              and r.created_at<date_trunc('day',now())+interval '1 day'
          )<t.max_daily_wins
        )
      order by t.multiplier,t.id
    loop
      running:=running+candidate.weight;
      if draw<=running then selected:=candidate;exit;end if;
    end loop;
  end if;

  select public_id,display_name into sender_public,sender_display from public.profiles where id=p_sender;
  select public_id,display_name into recipient_public,recipient_display from public.profiles where id=p_recipient;
  if sender_public is null or recipient_public is null then raise exception 'lucky profile missing';end if;

  if selected.id is null then
    points:=0;
    insert into public.lucky_results(
      gift_event_id,request_id,sender_id,recipient_id,sender_public_id,recipient_public_id,
      sender_name,recipient_name,room_id,gift_id,gift_name,quantity,tier_id,reward_tier,
      result_label,multiplier,lucky_points,event_id,visual_style
    ) values(
      p_gift_event_id,p_request_id,p_sender,p_recipient,sender_public,recipient_public,
      sender_display,recipient_display,p_room,p_gift_id,gift_name,p_quantity,null,'none',
      'لا توجد مكافأة إضافية',1,0,null,'flash'
    ) returning * into inserted;
  else
    points:=p_quantity::bigint*selected.multiplier::bigint*selected.points_per_unit::bigint;
    insert into public.lucky_results(
      gift_event_id,request_id,sender_id,recipient_id,sender_public_id,recipient_public_id,
      sender_name,recipient_name,room_id,gift_id,gift_name,quantity,tier_id,reward_tier,
      result_label,multiplier,lucky_points,event_id,visual_style
    ) values(
      p_gift_event_id,p_request_id,p_sender,p_recipient,sender_public,recipient_public,
      sender_display,recipient_display,p_room,p_gift_id,gift_name,p_quantity,selected.id,selected.reward_tier,
      selected.label,selected.multiplier,points,selected.event_id,selected.visual_style
    ) returning * into inserted;

    insert into public.lucky_point_balances(user_id,points,updated_at)
    values(p_recipient,points,now())
    on conflict(user_id) do update
      set points=public.lucky_point_balances.points+excluded.points,updated_at=now();
  end if;

  insert into public.room_lucky_feed(
    lucky_result_id,room_id,sender_public_id,sender_name,recipient_public_id,recipient_name,
    gift_id,gift_name,quantity,result_label,multiplier,lucky_points,visual_style
  ) values(
    inserted.id,p_room,sender_public,sender_display,recipient_public,recipient_display,
    p_gift_id,gift_name,p_quantity,inserted.result_label,inserted.multiplier,inserted.lucky_points,inserted.visual_style
  );

  return inserted;
end
$$;
revoke all on function private.resolve_lucky_reward(uuid,uuid,uuid,uuid,uuid,text,integer) from public,anon,authenticated;

create or replace function private.resolve_lucky_gift_event()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.diamond_source_type='LUCKY_GIFT' then
    perform private.resolve_lucky_reward(new.request_id,new.id,new.sender_id,new.recipient_id,new.room_id,new.gift_id,new.quantity);
  end if;
  return new;
end
$$;
drop trigger if exists gift_events_lucky_reward on public.gift_events;
create trigger gift_events_lucky_reward
after insert on public.gift_events
for each row execute function private.resolve_lucky_gift_event();

create or replace function private.resolve_self_lucky_gift_event()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare source_type text;
begin
  select diamond_source_type into source_type from public.gift_catalog where id=new.gift_id;
  if source_type='LUCKY_GIFT' then
    perform private.resolve_lucky_reward(new.request_id,null,new.user_id,new.user_id,new.room_id,new.gift_id,new.quantity);
  end if;
  return new;
end
$$;
drop trigger if exists self_gift_events_lucky_reward on private.self_gift_events;
create trigger self_gift_events_lucky_reward
after insert on private.self_gift_events
for each row execute function private.resolve_self_lucky_gift_event();

create or replace function public.lucky_result_by_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare u uuid:=auth.uid();r public.lucky_results%rowtype;
begin
  if u is null then raise exception 'authentication required';end if;
  select * into r from public.lucky_results where request_id=p_request_id;
  if not found then return null;end if;
  if u not in(r.sender_id,r.recipient_id)
     and not private.room_access_allowed(r.room_id)
     and not exists(select 1 from public.admin_roles ar where ar.user_id=u and ar.role='owner')
  then raise exception 'not authorized';end if;
  return jsonb_build_object(
    'id',r.id,'request_id',r.request_id,'room_id',r.room_id,'gift_id',r.gift_id,'gift_name',r.gift_name,
    'sender_public_id',r.sender_public_id,'sender_name',r.sender_name,
    'recipient_public_id',r.recipient_public_id,'recipient_name',r.recipient_name,
    'quantity',r.quantity,'reward_tier',r.reward_tier,'result_label',r.result_label,
    'multiplier',r.multiplier,'lucky_points',r.lucky_points,'event_id',r.event_id,
    'visual_style',r.visual_style,'created_at',r.created_at
  );
end
$$;
revoke all on function public.lucky_result_by_request(uuid) from public,anon;
grant execute on function public.lucky_result_by_request(uuid) to authenticated;

create or replace function public.configure_lucky_reward_tier(
  p_gift_id text,
  p_reward_tier text,
  p_label text,
  p_weight integer,
  p_multiplier integer,
  p_points_per_unit integer,
  p_max_daily_wins integer,
  p_event_id text,
  p_visual_style text,
  p_is_active boolean,
  p_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare tier private.lucky_reward_tiers%rowtype;
begin
  perform private.require_owner();
  if p_weight<=0 or p_multiplier<1 or p_points_per_unit<0
     or (p_max_daily_wins is not null and p_max_daily_wins<=0)
  then raise exception 'invalid lucky tier';end if;
  if p_gift_id is not null and not exists(
    select 1 from public.gift_catalog where id=p_gift_id and diamond_source_type='LUCKY_GIFT'
  ) then raise exception 'gift is not lucky';end if;

  if p_id is null then
    insert into private.lucky_reward_tiers(
      gift_id,reward_tier,label,weight,multiplier,points_per_unit,max_daily_wins,event_id,visual_style,is_active
    ) values(
      p_gift_id,p_reward_tier,p_label,p_weight,p_multiplier,p_points_per_unit,p_max_daily_wins,p_event_id,
      coalesce(nullif(p_visual_style,''),'flash'),coalesce(p_is_active,true)
    ) returning * into tier;
  else
    update private.lucky_reward_tiers set
      gift_id=p_gift_id,reward_tier=p_reward_tier,label=p_label,weight=p_weight,multiplier=p_multiplier,
      points_per_unit=p_points_per_unit,max_daily_wins=p_max_daily_wins,event_id=p_event_id,
      visual_style=coalesce(nullif(p_visual_style,''),'flash'),is_active=coalesce(p_is_active,true),updated_at=now()
    where id=p_id returning * into tier;
    if not found then raise exception 'lucky tier not found';end if;
  end if;

  return jsonb_build_object(
    'id',tier.id,'gift_id',tier.gift_id,'reward_tier',tier.reward_tier,'label',tier.label,
    'weight',tier.weight,'multiplier',tier.multiplier,'points_per_unit',tier.points_per_unit,
    'max_daily_wins',tier.max_daily_wins,'event_id',tier.event_id,'visual_style',tier.visual_style,'is_active',tier.is_active
  );
end
$$;
revoke all on function public.configure_lucky_reward_tier(text,text,text,integer,integer,integer,integer,text,text,boolean,uuid) from public,anon;
grant execute on function public.configure_lucky_reward_tier(text,text,text,integer,integer,integer,integer,text,text,boolean,uuid) to authenticated;

-- Initial non-financial server configuration for the existing real Lucky Gift.
-- The owner can change these weights/limits later through configure_lucky_reward_tier
-- without shipping a new app release.
insert into private.lucky_reward_tiers(gift_id,reward_tier,label,weight,multiplier,points_per_unit,max_daily_wins,visual_style)
select 'g11','standard','Lucky ×1',7000,1,1,null,'flash'
where exists(select 1 from public.gift_catalog where id='g11' and diamond_source_type='LUCKY_GIFT')
and not exists(select 1 from private.lucky_reward_tiers where gift_id='g11' and reward_tier='standard');

insert into private.lucky_reward_tiers(gift_id,reward_tier,label,weight,multiplier,points_per_unit,max_daily_wins,visual_style)
select 'g11','boost','Lucky ×7',2500,7,1,null,'cards'
where exists(select 1 from public.gift_catalog where id='g11' and diamond_source_type='LUCKY_GIFT')
and not exists(select 1 from private.lucky_reward_tiers where gift_id='g11' and reward_tier='boost');

insert into private.lucky_reward_tiers(gift_id,reward_tier,label,weight,multiplier,points_per_unit,max_daily_wins,visual_style)
select 'g11','rare','Lucky ×77',480,77,1,3,'wheel'
where exists(select 1 from public.gift_catalog where id='g11' and diamond_source_type='LUCKY_GIFT')
and not exists(select 1 from private.lucky_reward_tiers where gift_id='g11' and reward_tier='rare');

insert into private.lucky_reward_tiers(gift_id,reward_tier,label,weight,multiplier,points_per_unit,max_daily_wins,visual_style)
select 'g11','jackpot','Lucky ×777',20,777,1,1,'jackpot'
where exists(select 1 from public.gift_catalog where id='g11' and diamond_source_type='LUCKY_GIFT')
and not exists(select 1 from private.lucky_reward_tiers where gift_id='g11' and reward_tier='jackpot');

notify pgrst,'reload schema';
