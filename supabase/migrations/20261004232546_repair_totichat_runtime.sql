-- Restrict client writes to profile edits and message read receipts.
revoke create on schema public from public, anon, authenticated;
revoke update on public.direct_messages from authenticated;
grant update(read_at) on public.direct_messages to authenticated;
revoke insert, update, delete on public.room_members from authenticated;
grant update(is_hand_raised) on public.room_members to authenticated;
revoke insert, update, delete on public.room_invites from authenticated;
-- A permissive pending-only policy previously ORed with the package/agent check.
drop policy if exists recharge_requests_pending_only on public.recharge_requests;
create policy recharge_requests_pending_only on public.recharge_requests as restrictive
  for insert to authenticated with check (status = 'pending');

alter table public.profiles add column if not exists silver_coins bigint not null default 0 check(silver_coins>=0);
alter table public.profiles add column if not exists sent_gold bigint not null default 0 check(sent_gold>=0);
alter table public.profiles add column if not exists received_gold bigint not null default 0 check(received_gold>=0);
alter table public.profiles add column if not exists received_gifts bigint not null default 0 check(received_gifts>=0);

create table if not exists public.gift_catalog (
 id text primary key, name text not null, price bigint not null check(price>0), is_active boolean not null default true
);
alter table public.gift_catalog enable row level security;
create policy gift_catalog_read on public.gift_catalog for select to authenticated using(is_active);
grant select on public.gift_catalog to authenticated;

create table if not exists public.gift_events (
 id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
 sender_id uuid not null references public.profiles(id), recipient_id uuid not null references public.profiles(id),
 room_id uuid not null references public.rooms(id), gift_id text not null references public.gift_catalog(id),
 amount bigint not null check(amount>0), created_at timestamptz not null default now(),
 check(sender_id<>recipient_id)
);
alter table public.gift_events enable row level security;
create policy gift_events_read_participants on public.gift_events for select to authenticated
 using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
grant select on public.gift_events to authenticated;
create index gift_events_sender_idx on public.gift_events(sender_id,created_at);
create index gift_events_recipient_idx on public.gift_events(recipient_id,created_at);
create index gift_events_room_idx on public.gift_events(room_id,created_at);
create index gift_events_gift_idx on public.gift_events(gift_id);

create or replace function private.set_my_room_seat(p_room_id uuid,p_seat_number integer)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_room public.rooms%rowtype; v_member public.room_members%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_room from public.rooms where id=p_room_id and is_active for update;
 if not found then raise exception 'room not available'; end if;
 select * into v_member from public.room_members where room_id=p_room_id and user_id=v_user for update;
 if not found then raise exception 'room membership required'; end if;
 if v_member.role='owner' and p_seat_number is distinct from 1 then raise exception 'owner must keep seat one'; end if;
 if p_seat_number is not null then
  if p_seat_number<1 or p_seat_number>v_room.max_seats then raise exception 'invalid seat number'; end if;
  if exists(select 1 from public.room_seat_locks where room_id=p_room_id and seat_number=p_seat_number) then raise exception 'seat is locked'; end if;
  if exists(select 1 from public.room_members where room_id=p_room_id and seat_number=p_seat_number and user_id<>v_user) then raise exception 'seat is occupied'; end if;
 end if;
 update public.room_members set seat_number=p_seat_number,is_muted=true,is_hand_raised=false where id=v_member.id;
end; $$;
create or replace function public.set_my_room_seat(p_room_id uuid,p_seat_number integer)
returns void language sql security invoker set search_path='' as $$ select private.set_my_room_seat(p_room_id,p_seat_number); $$;

create or replace function private.set_my_room_muted(p_room_id uuid,p_muted boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());
begin
 if v_user is null then raise exception 'authentication required'; end if;
 update public.room_members set is_muted=coalesce(p_muted,true) where room_id=p_room_id and user_id=v_user and seat_number is not null;
 if not found then raise exception 'take a seat before enabling microphone'; end if;
end; $$;
create or replace function public.set_my_room_muted(p_room_id uuid,p_muted boolean)
returns void language sql security invoker set search_path='' as $$ select private.set_my_room_muted(p_room_id,p_muted); $$;

create or replace function private.set_room_seat_locked(p_room_id uuid,p_seat_number integer,p_locked boolean)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_room public.rooms%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_room from public.rooms where id=p_room_id and owner_id=v_user for update;
 if not found then raise exception 'room owner permission required'; end if;
 if p_seat_number is null or p_seat_number<2 or p_seat_number>v_room.max_seats then raise exception 'invalid seat number'; end if;
 if coalesce(p_locked,false) then
  update public.room_members set seat_number=null,is_muted=true,is_hand_raised=false where room_id=p_room_id and seat_number=p_seat_number;
  insert into public.room_seat_locks(room_id,seat_number,locked_by) values(p_room_id,p_seat_number,v_user) on conflict do nothing;
 else
  delete from public.room_seat_locks where room_id=p_room_id and seat_number=p_seat_number;
 end if;
end; $$;
create or replace function public.set_room_seat_locked(p_room_id uuid,p_seat_number integer,p_locked boolean)
returns void language sql security invoker set search_path='' as $$ select private.set_room_seat_locked(p_room_id,p_seat_number,p_locked); $$;

create or replace function private.send_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_recipient uuid; v_price bigint; v_existing public.gift_events%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into v_existing from public.gift_events where request_id=p_request_id;
 if found then
  if v_existing.sender_id<>v_user or v_existing.room_id<>p_room_id or v_existing.gift_id<>p_gift_id then raise exception 'request id already used'; end if;
  return;
 end if;
 if not private.is_room_member(p_room_id) then raise exception 'room membership required'; end if;
 select p.id into v_recipient from public.profiles p join public.room_members m on m.user_id=p.id
 where p.public_id=p_recipient_public_id and m.room_id=p_room_id;
 if v_recipient is null or v_recipient=v_user then raise exception 'invalid recipient'; end if;
 select price into v_price from public.gift_catalog where id=p_gift_id and is_active;
 if v_price is null then raise exception 'gift not available'; end if;
 -- Lock both wallets in a deterministic order to prevent cross-gift deadlocks.
 perform id from public.profiles where id in (v_user,v_recipient) order by id for update;
 update public.profiles set gold=gold-v_price,sent_gold=sent_gold+v_price,
 level=least(150,(sent_gold+v_price)/1000+1),updated_at=now() where id=v_user and gold>=v_price;
 if not found then raise exception 'insufficient gold'; end if;
 update public.profiles set diamonds=diamonds+v_price,received_gold=received_gold+v_price,received_gifts=received_gifts+1,updated_at=now() where id=v_recipient;
 insert into public.gift_events(request_id,sender_id,recipient_id,room_id,gift_id,amount) values(p_request_id,v_user,v_recipient,p_room_id,p_gift_id,v_price);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta) values
 (v_user,'gift_sent',-v_price,0),(v_recipient,'gift_received',0,v_price);
end; $$;
create or replace function public.send_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)
returns void language sql security invoker set search_path='' as $$ select private.send_room_gift(p_room_id,p_recipient_public_id,p_gift_id,p_request_id); $$;

create or replace function private.get_gift_rankings(p_period text default 'daily')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_start timestamptz; v_result jsonb;
begin
 if (select auth.uid()) is null then raise exception 'authentication required'; end if;
 if p_period not in ('daily','weekly','monthly') then raise exception 'invalid period'; end if;
 v_start:=date_trunc(case p_period when 'daily' then 'day' when 'weekly' then 'week' else 'month' end,now());
 select jsonb_build_object(
  'wealth',coalesce((select jsonb_agg(to_jsonb(x)) from (select p.public_id,p.display_name,p.avatar_url,p.country_code,p.level,p.vip_level,sum(g.amount) as score from public.gift_events g join public.profiles p on p.id=g.sender_id where g.created_at>=v_start group by p.id order by sum(g.amount) desc,p.public_id limit 100) x),'[]'::jsonb),
  'charm',coalesce((select jsonb_agg(to_jsonb(x)) from (select p.public_id,p.display_name,p.avatar_url,p.country_code,p.level,p.vip_level,sum(g.amount) as score from public.gift_events g join public.profiles p on p.id=g.recipient_id where g.created_at>=v_start group by p.id order by sum(g.amount) desc,p.public_id limit 100) x),'[]'::jsonb),
  'rooms',coalesce((select jsonb_agg(to_jsonb(x)) from (select r.id,r.name,r.image_url,r.owner_display_name,r.owner_avatar_url,sum(g.amount) as score from public.gift_events g join public.rooms r on r.id=g.room_id where g.created_at>=v_start and private.can_view_room(r.id) group by r.id order by sum(g.amount) desc,r.id limit 100) x),'[]'::jsonb)
 ) into v_result;
 return v_result;
end; $$;
create or replace function public.get_gift_rankings(p_period text default 'daily')
returns jsonb language sql security invoker set search_path='' as $$ select private.get_gift_rankings(p_period); $$;

-- Only a recipient can mark a message read; message content/participants stay immutable.
alter table public.direct_messages add constraint direct_message_text_length check(message_type<>'text' or (content is not null and char_length(btrim(content)) between 1 and 1000)) not valid;

-- Publish only existing, RLS-protected tables; avoid duplicate-publication errors.
do $$ declare t text; begin
 foreach t in array array['profiles','wallet_transactions','gift_events'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
   execute format('alter publication supabase_realtime add table public.%I',t);
  end if;
 end loop;
end $$;

CREATE OR REPLACE FUNCTION private.create_recharge_request(p_package_id uuid)
 RETURNS TABLE(request_id uuid, package_id uuid, price_usd numeric, gold_amount bigint, agent_id uuid, agent_display_name text, agent_phone text, payment_methods jsonb, contact_info jsonb, country_code text, country_name text)
 LANGUAGE plpgsql
 SET search_path TO ''
 SECURITY DEFINER
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_country_code text;
  v_country_name text;
  v_package public.recharge_packages%rowtype;
  v_agent public.recharge_agents%rowtype;
  v_request_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select p.country_code, p.country_name
    into v_country_code, v_country_name
  from public.profiles p
  where p.id = v_user;

  if v_country_code is null or v_country_code = '' then
    raise exception 'user country is not set';
  end if;

  select *
    into v_package
  from public.recharge_packages pkg
  where pkg.id = p_package_id
    and pkg.is_active = true;

  if not found then
    raise exception 'recharge package not found';
  end if;

  select *
    into v_agent
  from public.recharge_agents agent
  where agent.country_code = v_country_code
    and agent.is_active = true
  order by agent.created_at, agent.id
  limit 1;

  if not found then
    raise exception 'no official recharge agent is configured for this country';
  end if;

  -- Serialize requests for this user and reuse an existing pending request.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select rq.id into v_request_id from public.recharge_requests rq
  where rq.user_id = v_user and rq.package_id = p_package_id
    and rq.agent_id = v_agent.id and rq.status = 'pending'
    and rq.gold_amount = v_package.gold_amount and rq.price_usd = v_package.price_usd
  order by rq.created_at desc limit 1;
  if v_request_id is null then
  insert into public.recharge_requests (
    user_id, agent_id, package_id, amount_iqd, price_usd, gold_amount, status
  )
  values (
    v_user, v_agent.id, v_package.id, null, v_package.price_usd, v_package.gold_amount, 'pending'
  )
  returning id into v_request_id;
  end if;

  return query
  select
    v_request_id,
    v_package.id,
    v_package.price_usd,
    v_package.gold_amount,
    v_agent.id,
    v_agent.display_name,
    v_agent.phone,
    v_agent.payment_methods,
    v_agent.contact_info,
    v_country_code,
    v_country_name;
end;
$function$
;
create or replace function public.create_recharge_request(p_package_id uuid)
 returns TABLE(request_id uuid, package_id uuid, price_usd numeric, gold_amount bigint, agent_id uuid, agent_display_name text, agent_phone text, payment_methods jsonb, contact_info jsonb, country_code text, country_name text)
 language sql security invoker set search_path='' as $$ select * from private.create_recharge_request(p_package_id); $$;
revoke all on function private.create_recharge_request(uuid) from public, anon;
grant execute on function private.create_recharge_request(uuid) to authenticated;
revoke all on function public.create_recharge_request(uuid) from public, anon;
grant execute on function public.create_recharge_request(uuid) to authenticated;

CREATE OR REPLACE FUNCTION private.approve_recharge_request(p_request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare r public.recharge_requests%rowtype; begin if not public.is_admin_role('admin') and not public.is_admin_role('agent_manager') then raise exception 'not authorized'; end if; select * into r from public.recharge_requests where id=p_request_id for update; if not found then raise exception 'recharge request not found'; end if; if r.status <> 'pending' then raise exception 'request is not pending'; end if; update public.recharge_requests set status='approved', updated_at=now() where id=r.id; update public.profiles set gold=gold+r.gold_amount, updated_at=now() where id=r.user_id; insert into public.wallet_transactions(user_id,recharge_request_id,transaction_type,gold_delta) values(r.user_id,r.id,'recharge',r.gold_amount); end; $function$
;
create or replace function public.approve_recharge_request(p_request_id uuid)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.approve_recharge_request(p_request_id); $$;
revoke all on function private.approve_recharge_request(uuid) from public, anon;
grant execute on function private.approve_recharge_request(uuid) to authenticated;
revoke all on function public.approve_recharge_request(uuid) from public, anon;
grant execute on function public.approve_recharge_request(uuid) to authenticated;

CREATE OR REPLACE FUNCTION private.set_room_moderator(p_room_id uuid, p_target_public_id bigint, p_enabled boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_target public.room_members%rowtype;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not exists (
    select 1 from public.rooms r where r.id = p_room_id and r.owner_id = v_user
  ) then
    raise exception 'room owner permission required';
  end if;

  select * into v_target
  from public.room_members m
  where m.room_id = p_room_id and m.member_public_id = p_target_public_id;

  if not found then raise exception 'target user is not in this room'; end if;
  if v_target.user_id = v_user or v_target.role = 'owner' then
    raise exception 'owner role cannot be changed';
  end if;

  update public.room_members
  set role = case when coalesce(p_enabled,false) then 'moderator' else 'member' end
  where id = v_target.id;
end;
$function$
;
create or replace function public.set_room_moderator(p_room_id uuid, p_target_public_id bigint, p_enabled boolean)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.set_room_moderator(p_room_id,p_target_public_id,p_enabled); $$;
revoke all on function private.set_room_moderator(uuid,bigint,boolean) from public, anon;
grant execute on function private.set_room_moderator(uuid,bigint,boolean) to authenticated;
revoke all on function public.set_room_moderator(uuid,bigint,boolean) from public, anon;
grant execute on function public.set_room_moderator(uuid,bigint,boolean) to authenticated;

CREATE OR REPLACE FUNCTION private.search_public_profiles(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(public_id bigint, username text, display_name text, avatar_url text, level integer, vip_level integer, country_code text, country_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_query text := btrim(coalesce(p_query,''));
  v_limit integer := least(greatest(coalesce(p_limit,20),1),20);
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if char_length(v_query) < 2 then
    return;
  end if;

  return query
  select p.public_id,p.username,p.display_name,p.avatar_url,p.level,p.vip_level,p.country_code,p.country_name
  from public.profiles p
  where p.public_id is not null
    and p.id <> v_user
    and (
      (v_query ~ '^[0-9]{1,18}$' and p.public_id = v_query::bigint)
      or coalesce(p.username,'') ilike '%' || v_query || '%'
      or coalesce(p.display_name,'') ilike '%' || v_query || '%'
    )
  order by
    case when v_query ~ '^[0-9]{1,18}$' and p.public_id = v_query::bigint then 0 else 1 end,
    p.created_at desc
  limit v_limit;
end;
$function$
;
create or replace function public.search_public_profiles(p_query text, p_limit integer DEFAULT 20)
 returns TABLE(public_id bigint, username text, display_name text, avatar_url text, level integer, vip_level integer, country_code text, country_name text)
 language sql security invoker set search_path='' as $$ select * from private.search_public_profiles(p_query,p_limit); $$;
revoke all on function private.search_public_profiles(text,integer) from public, anon;
grant execute on function private.search_public_profiles(text,integer) to authenticated;
revoke all on function public.search_public_profiles(text,integer) from public, anon;
grant execute on function public.search_public_profiles(text,integer) to authenticated;

CREATE OR REPLACE FUNCTION private.moderate_room_seat(p_room_id uuid, p_seat_number integer, p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_is_owner boolean;
  v_is_moderator boolean;
  v_target public.room_members%rowtype;
  v_action text := lower(btrim(coalesce(p_action,'')));
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_seat_number is null or p_seat_number < 1 or p_seat_number > 20 then
    raise exception 'invalid seat number';
  end if;

  select exists(select 1 from public.rooms r where r.id=p_room_id and r.owner_id=v_user)
    into v_is_owner;
  select exists(
    select 1 from public.room_members m
    where m.room_id=p_room_id and m.user_id=v_user and m.role='moderator'
  ) into v_is_moderator;

  if not coalesce(v_is_owner,false) and not coalesce(v_is_moderator,false) then
    raise exception 'room moderation permission required';
  end if;

  select * into v_target
  from public.room_members m
  where m.room_id=p_room_id and m.seat_number=p_seat_number;
  if not found then raise exception 'seat is empty'; end if;

  if v_target.role='owner' then raise exception 'owner cannot be moderated'; end if;
  if v_is_moderator and v_target.role='moderator' then
    raise exception 'moderator cannot moderate another moderator';
  end if;

  if v_action='mute' then
    update public.room_members set is_muted=true where id=v_target.id;
  elsif v_action='unmute' then
    update public.room_members set is_muted=false where id=v_target.id;
  elsif v_action='remove' then
    update public.room_members
    set seat_number=null,is_muted=true,is_hand_raised=false
    where id=v_target.id;
  else
    raise exception 'unsupported moderation action';
  end if;
end;
$function$
;
create or replace function public.moderate_room_seat(p_room_id uuid, p_seat_number integer, p_action text)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.moderate_room_seat(p_room_id,p_seat_number,p_action); $$;
revoke all on function private.moderate_room_seat(uuid,integer,text) from public, anon;
grant execute on function private.moderate_room_seat(uuid,integer,text) to authenticated;
revoke all on function public.moderate_room_seat(uuid,integer,text) from public, anon;
grant execute on function public.moderate_room_seat(uuid,integer,text) to authenticated;

CREATE OR REPLACE FUNCTION private.convert_diamonds_to_gold(p_diamonds bigint)
 RETURNS TABLE(diamonds_remaining bigint, gold_balance bigint, gold_added bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_current_diamonds bigint;
  v_gold_added bigint;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  if p_diamonds is null or p_diamonds <= 0 then
    raise exception 'invalid diamond amount';
  end if;

  v_gold_added := floor((p_diamonds::numeric * 3) / 10)::bigint;

  if v_gold_added <= 0 then
    raise exception 'diamond amount is too small';
  end if;

  select p.diamonds
    into v_current_diamonds
  from public.profiles p
  where p.id = v_user
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_current_diamonds < p_diamonds then
    raise exception 'insufficient diamonds';
  end if;

  update public.profiles p
  set diamonds = p.diamonds - p_diamonds,
      gold = p.gold + v_gold_added,
      updated_at = now()
  where p.id = v_user
  returning p.diamonds, p.gold
  into diamonds_remaining, gold_balance;

  insert into public.wallet_transactions(
    user_id,
    transaction_type,
    gold_delta,
    diamond_delta
  ) values (
    v_user,
    'diamond_conversion',
    v_gold_added,
    -p_diamonds
  );

  gold_added := v_gold_added;
  return next;
end;
$function$
;
create or replace function public.convert_diamonds_to_gold(p_diamonds bigint)
 returns TABLE(diamonds_remaining bigint, gold_balance bigint, gold_added bigint)
 language sql security invoker set search_path='' as $$ select * from private.convert_diamonds_to_gold(p_diamonds); $$;
revoke all on function private.convert_diamonds_to_gold(bigint) from public, anon;
grant execute on function private.convert_diamonds_to_gold(bigint) to authenticated;
revoke all on function public.convert_diamonds_to_gold(bigint) from public, anon;
grant execute on function public.convert_diamonds_to_gold(bigint) to authenticated;

CREATE OR REPLACE FUNCTION private.create_room(p_name text, p_description text DEFAULT NULL::text, p_image_url text DEFAULT NULL::text, p_max_seats integer DEFAULT 8, p_category text DEFAULT 'عامة'::text, p_is_private boolean DEFAULT false, p_is_vip boolean DEFAULT false, p_tags text[] DEFAULT '{}'::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
 SECURITY DEFINER
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_room_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'room name is required';
  end if;
  if p_max_seats < 1 or p_max_seats > 20 then
    raise exception 'invalid seat count';
  end if;

  insert into public.rooms(
    owner_id, name, description, image_url, max_seats,
    category, is_private, is_vip, tags
  ) values (
    v_user, btrim(p_name), nullif(btrim(coalesce(p_description,'')), ''),
    nullif(btrim(coalesce(p_image_url,'')), ''), p_max_seats,
    coalesce(nullif(btrim(p_category), ''), 'عامة'),
    coalesce(p_is_private, false), coalesce(p_is_vip, false),
    coalesce(p_tags, '{}'::text[])
  ) returning id into v_room_id;

  insert into public.room_members(room_id, user_id, seat_number, role, is_muted)
  values (v_room_id, v_user, 1, 'owner', false);

  return v_room_id;
end;
$function$
;
create or replace function public.create_room(p_name text, p_description text DEFAULT NULL::text, p_image_url text DEFAULT NULL::text, p_max_seats integer DEFAULT 8, p_category text DEFAULT 'عامة'::text, p_is_private boolean DEFAULT false, p_is_vip boolean DEFAULT false, p_tags text[] DEFAULT '{}'::text[])
 returns uuid
 language sql security invoker set search_path='' as $$ select * from private.create_room(p_name,p_description,p_image_url,p_max_seats,p_category,p_is_private,p_is_vip,p_tags); $$;
revoke all on function private.create_room(text,text,text,integer,text,boolean,boolean,text[]) from public, anon;
grant execute on function private.create_room(text,text,text,integer,text,boolean,boolean,text[]) to authenticated;
revoke all on function public.create_room(text,text,text,integer,text,boolean,boolean,text[]) from public, anon;
grant execute on function public.create_room(text,text,text,integer,text,boolean,boolean,text[]) to authenticated;

CREATE OR REPLACE FUNCTION private.join_room(p_room_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
 SECURITY DEFINER
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_vip_level integer;
begin
  if v_user is null then raise exception 'authentication required'; end if;

  select * into v_room from public.rooms r where r.id=p_room_id and r.is_active=true;
  if not found then raise exception 'room not available'; end if;

  if exists (select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=v_user) then
    raise exception 'you are banned from this room';
  end if;

  if v_room.is_private and v_room.owner_id<>v_user and not exists (
    select 1 from public.room_invites i
    where i.room_id=p_room_id and i.target_user_id=v_user
      and i.used_at is null and i.expires_at>now()
  ) then
    raise exception 'private room requires an invitation';
  end if;

  if v_room.is_vip and v_room.owner_id<>v_user then
    select coalesce(p.vip_level,0) into v_vip_level from public.profiles p where p.id=v_user;
    if coalesce(v_vip_level,0)<1 then raise exception 'VIP membership required'; end if;
  end if;

  insert into public.room_members(room_id,user_id,seat_number,role,is_muted)
  values (p_room_id,v_user,null,'member',true)
  on conflict (room_id,user_id) do nothing;

  update public.room_invites set used_at=coalesce(used_at,now())
  where room_id=p_room_id and target_user_id=v_user and used_at is null;
end;
$function$
;
create or replace function public.join_room(p_room_id uuid)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.join_room(p_room_id); $$;
revoke all on function private.join_room(uuid) from public, anon;
grant execute on function private.join_room(uuid) to authenticated;
revoke all on function public.join_room(uuid) from public, anon;
grant execute on function public.join_room(uuid) to authenticated;

CREATE OR REPLACE FUNCTION private.leave_room(p_room_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
 SECURITY DEFINER
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_owner uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  select r.owner_id into v_owner
  from public.rooms r
  where r.id = p_room_id;

  if v_owner = v_user then
    update public.room_members
    set is_muted = true,
        is_hand_raised = false,
        seat_number = 1
    where room_id = p_room_id and user_id = v_user;
    return;
  end if;

  delete from public.room_members
  where room_id = p_room_id and user_id = v_user;
end;
$function$
;
create or replace function public.leave_room(p_room_id uuid)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.leave_room(p_room_id); $$;
revoke all on function private.leave_room(uuid) from public, anon;
grant execute on function private.leave_room(uuid) to authenticated;
revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;

CREATE OR REPLACE FUNCTION private.ban_room_seat(p_room_id uuid, p_seat_number integer, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
 SECURITY DEFINER
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_target public.room_members%rowtype;
begin
  if not exists (select 1 from public.rooms r where r.id=p_room_id and r.owner_id=v_user) then
    raise exception 'room owner permission required';
  end if;

  select * into v_target from public.room_members m
  where m.room_id=p_room_id and m.seat_number=p_seat_number;
  if not found then raise exception 'seat is empty'; end if;
  if v_target.user_id=v_user then raise exception 'owner cannot ban self'; end if;

  insert into public.room_bans(room_id,user_id,public_id,display_name,avatar_url,banned_by,reason)
  values (p_room_id,v_target.user_id,v_target.member_public_id,v_target.member_display_name,v_target.member_avatar_url,v_user,nullif(btrim(coalesce(p_reason,'')),''))
  on conflict (room_id,user_id) do update set
    public_id=excluded.public_id, display_name=excluded.display_name,
    avatar_url=excluded.avatar_url, banned_by=excluded.banned_by,
    reason=excluded.reason, created_at=now();

  delete from public.room_members where room_id=p_room_id and user_id=v_target.user_id;
end;
$function$
;
create or replace function public.ban_room_seat(p_room_id uuid, p_seat_number integer, p_reason text DEFAULT NULL::text)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.ban_room_seat(p_room_id,p_seat_number,p_reason); $$;
revoke all on function private.ban_room_seat(uuid,integer,text) from public, anon;
grant execute on function private.ban_room_seat(uuid,integer,text) to authenticated;
revoke all on function public.ban_room_seat(uuid,integer,text) from public, anon;
grant execute on function public.ban_room_seat(uuid,integer,text) to authenticated;

CREATE OR REPLACE FUNCTION private.invite_room_user(p_room_id uuid, p_target_public_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_target uuid;
  v_allowed boolean;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_target_public_id is null or p_target_public_id <= 0 then
    raise exception 'invalid target public id';
  end if;

  select (
    r.owner_id=v_user or exists(
      select 1 from public.room_members m
      where m.room_id=r.id and m.user_id=v_user and m.role='moderator'
    )
  ) into v_allowed
  from public.rooms r where r.id=p_room_id;

  if not coalesce(v_allowed,false) then
    raise exception 'room moderation permission required';
  end if;

  select p.id into v_target from public.profiles p where p.public_id=p_target_public_id;
  if v_target is null then raise exception 'target user not found'; end if;
  if v_target=v_user then raise exception 'cannot invite yourself'; end if;
  if exists(select 1 from public.room_bans b where b.room_id=p_room_id and b.user_id=v_target) then
    raise exception 'target user is banned from this room';
  end if;

  delete from public.room_invites where room_id=p_room_id and target_user_id=v_target;
  insert into public.room_invites(room_id,target_user_id,target_public_id,invited_by,expires_at,used_at)
  values(p_room_id,v_target,p_target_public_id,v_user,now()+interval '24 hours',null);
end;
$function$
;
create or replace function public.invite_room_user(p_room_id uuid, p_target_public_id bigint)
 returns void
 language sql security invoker set search_path='' as $$ select * from private.invite_room_user(p_room_id,p_target_public_id); $$;
revoke all on function private.invite_room_user(uuid,bigint) from public, anon;
grant execute on function private.invite_room_user(uuid,bigint) to authenticated;
revoke all on function public.invite_room_user(uuid,bigint) from public, anon;
grant execute on function public.invite_room_user(uuid,bigint) to authenticated;

revoke all on function private.set_my_room_seat(uuid,integer) from public, anon;
grant execute on function private.set_my_room_seat(uuid,integer) to authenticated;
revoke all on function public.set_my_room_seat(uuid,integer) from public, anon;
grant execute on function public.set_my_room_seat(uuid,integer) to authenticated;
revoke all on function private.set_my_room_muted(uuid,boolean) from public, anon;
grant execute on function private.set_my_room_muted(uuid,boolean) to authenticated;
revoke all on function public.set_my_room_muted(uuid,boolean) from public, anon;
grant execute on function public.set_my_room_muted(uuid,boolean) to authenticated;
revoke all on function private.set_room_seat_locked(uuid,integer,boolean) from public, anon;
grant execute on function private.set_room_seat_locked(uuid,integer,boolean) to authenticated;
revoke all on function public.set_room_seat_locked(uuid,integer,boolean) from public, anon;
grant execute on function public.set_room_seat_locked(uuid,integer,boolean) to authenticated;
revoke all on function private.send_room_gift(uuid,bigint,text,uuid) from public, anon;
grant execute on function private.send_room_gift(uuid,bigint,text,uuid) to authenticated;
revoke all on function public.send_room_gift(uuid,bigint,text,uuid) from public, anon;
grant execute on function public.send_room_gift(uuid,bigint,text,uuid) to authenticated;
revoke all on function private.get_gift_rankings(text) from public, anon;
grant execute on function private.get_gift_rankings(text) to authenticated;
revoke all on function public.get_gift_rankings(text) from public, anon;
grant execute on function public.get_gift_rankings(text) to authenticated;
grant usage on schema private to authenticated;
insert into public.gift_catalog(id,name,price) values ('g1','وردة دمشقية',10) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g2','قلب الحب النقي',50) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g3','باقة توليب ملكية',120) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g4','تاج الأمراء الذهبي',500) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g5','سيارة لامبورغيني',1500) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g6','أسد الصحراء الملكي',3000) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g7','تنين النار الأسطوري',5000) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g8','صاروخ نحو الفضاء',8000) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g9','خاتم الألماس الفاخر',2000) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g10','صقر الخليج الحر',2500) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g11','نرد الحظ الذهبي',300) on conflict(id) do nothing;
insert into public.gift_catalog(id,name,price) values ('g12','قصر الأساطير الذهبي',12000) on conflict(id) do nothing;
