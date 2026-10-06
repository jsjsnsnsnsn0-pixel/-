-- Keep paid membership usable when a shorter promotional upgrade expires.
create function private.vip_entitlement(p_id uuid)returns table(level integer,expires_at timestamptz)language sql stable security definer set search_path='' as $$
 select v.level,v.expires_at from(
  select p.vip_level as level,p.vip_expires_at as expires_at from public.profiles p where p.id=p_id and p.vip_level>0 and(p.vip_expires_at is null or p.vip_expires_at>now())
  union all select c.vip_level,s.expires_at from public.store_purchases s join public.store_catalog c on c.id=s.item_id where s.user_id=p_id and c.category='vip'and(s.expires_at is null or s.expires_at>now())
  union all select 0,null::timestamptz
 )v order by v.level desc,v.expires_at desc nulls first limit 1;
$$;
revoke all on function private.vip_entitlement(uuid)from public,anon,authenticated;
create or replace function private.public_profile(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'public_id',p.public_id,'username',p.username,'display_name',p.display_name,'avatar_url',p.avatar_url,
 'bio',p.bio,'country_code',p.country_code,'country_name',p.country_name,'gender',p.gender,'level',p.level,
 'vip_level',(select v.level from private.vip_entitlement(p.id)v),'vip_expires_at',(select v.expires_at from private.vip_entitlement(p.id)v),
 'received_gold',p.received_gold,'sent_gold',p.sent_gold,'received_gifts',p.received_gifts,'last_seen_at',p.last_seen_at,
 'friends_count',(select count(*) from public.friendships f where (p.id in(f.user_a,f.user_b)) and f.status='accepted'),
 'followers_count',(select count(*) from public.user_follows f where f.followed_id=p.id),
 'following_count',(select count(*) from public.user_follows f where f.follower_id=p.id),
 'visitors_count',(select count(distinct v.visitor_id) from public.profile_visits v where v.profile_id=p.id),
 'equipment',coalesce((select jsonb_object_agg(e.category,jsonb_build_object('id',c.id,'icon',c.icon,'name',c.name)) from public.user_equipment e
 join public.store_catalog c on c.id=e.item_id where e.user_id=p.id and exists(select 1 from public.store_purchases s where s.user_id=p.id and s.item_id=e.item_id and(s.expires_at is null or s.expires_at>now()))),'{}'::jsonb))
 from public.profiles p where p.id=p_id;
$$;
create or replace function private.purchase_store_item(p_item_id text,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.store_catalog%rowtype; s public.store_purchases%rowtype; p public.profiles%rowtype; expiry timestamptz; active_level integer; active_expiry timestamptz; begin
 if u is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request ID required'; end if;
 select * into p from public.profiles where id=u for update;
 select level,expires_at into active_level,active_expiry from private.vip_entitlement(u);
 select * into s from public.store_purchases where user_id=u and request_id=p_request_id;
 if found then
  if s.item_id<>p_item_id then raise exception 'request ID already used'; end if;
  return to_jsonb(s);
 end if;
 select * into c from public.store_catalog where id=p_item_id and is_active and not is_reward for share;
 if not found then raise exception 'item unavailable'; end if;
 if c.category='vip' and active_level>c.vip_level then raise exception 'cannot downgrade active VIP'; end if;
 if c.category<>'vip' and exists(select 1 from public.store_purchases where user_id=u and item_id=c.id and(expires_at is null or expires_at>now()))then raise exception 'item already owned'; end if;
 if c.currency='gold' and p.gold<c.price then raise exception 'insufficient gold'; end if;
 if c.currency='silver' and p.silver_coins<c.price then raise exception 'insufficient silver'; end if;
 expiry:=case when c.duration_days is not null then now()+make_interval(days=>c.duration_days)else null end;
 if c.category='vip' and active_level=c.vip_level then
  if active_expiry is null then raise exception 'lifetime VIP already active';end if;
  expiry:=active_expiry+make_interval(days=>c.duration_days);
 end if;
 update public.profiles set gold=gold-case when c.currency='gold'then c.price else 0 end,
 silver_coins=silver_coins-case when c.currency='silver'then c.price else 0 end,
 vip_level=case when c.category='vip'then c.vip_level else vip_level end,
 vip_expires_at=case when c.category='vip'then expiry else vip_expires_at end where id=u;
 insert into public.store_purchases(request_id,user_id,item_id,price,currency,expires_at)values(p_request_id,u,c.id,c.price,c.currency,expiry)returning *into s;
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,silver_delta)values(u,case when c.category='vip'then 'vip_upgrade'else 'store_purchase'end,
 case when c.currency='gold'then -c.price else 0 end,case when c.currency='silver'then -c.price else 0 end);
 insert into public.user_notifications(user_id,type,title,description)values(u,'system','تم اعتماد الشراء',c.name);
 return to_jsonb(s);
end $$;
create or replace function private.claim_recharge_reward(p_tier_id text)returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();month date:=date_trunc('month',now()at time zone 'UTC')::date;t public.recharge_reward_tiers%rowtype;p public.profiles%rowtype;i jsonb;coins bigint:=0;lvl integer;days integer;expires timestamptz;begin
 if u is null then raise exception 'authentication required';end if;
 select *into p from public.profiles where id=u for update;
 select *into t from public.recharge_reward_tiers where id=p_tier_id;
 if not found then raise exception 'reward tier unavailable';end if;
 if exists(select 1 from public.recharge_reward_claims where user_id=u and tier_id=t.id and claim_month=month)then return jsonb_build_object('already_claimed',true);end if;
 if coalesce((select sum(price_usd)from public.recharge_requests where user_id=u and status='approved'and created_at>=month::timestamp at time zone 'UTC'),0)<t.threshold_usd then raise exception 'monthly recharge requirement not met';end if;
 insert into public.recharge_reward_claims(user_id,tier_id,claim_month)values(u,t.id,month);
 for i in select *from jsonb_array_elements(t.rewards)loop
  if i->>'type'='coins'then coins:=coins+(i->>'coins')::bigint;
  elsif i->>'type'='vip'then
   lvl:=(i->>'vipLevel')::integer;days:=(i->>'days')::integer;expires:=now()+make_interval(days=>days);
   insert into public.store_purchases(request_id,user_id,item_id,price,currency,expires_at)values(gen_random_uuid(),u,'vip'||lvl,0,'gold',expires);
   if p.vip_level<=lvl or(p.vip_expires_at is not null and p.vip_expires_at<=now())then
    update public.profiles set vip_level=lvl,vip_expires_at=case when vip_level=lvl and vip_expires_at>expires then vip_expires_at else expires end where id=u;
    select *into p from public.profiles where id=u;
   end if;
  elsif i->>'type'='cosmetic'then
   insert into public.store_purchases(request_id,user_id,item_id,price,currency,expires_at)values(gen_random_uuid(),u,i->>'catalog_id',0,'gold',now()+make_interval(days=>(i->>'days')::integer));
  elsif i->>'type'='request'then
   insert into public.support_tickets(user_id,category,message)values(u,i->>'category','استحقاق نشاط الشحن '||t.label||': '||(i->>'name'));
  end if;
 end loop;
 if coins>0 then
  update public.profiles set gold=gold+coins where id=u;
  insert into public.wallet_transactions(user_id,transaction_type,gold_delta)values(u,'task_reward',coins);
 end if;
 insert into public.user_notifications(user_id,type,title,description)values(u,'system','مكافآت نشاط الشحن','تم اعتماد مكافآت '||t.label||'. الطلبات الخاصة تراجعها الإدارة.');
 return jsonb_build_object('already_claimed',false,'gold',coins);
end$$;
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

  if v_room.is_private and v_room.owner_id<>v_user and not exists (select 1 from public.room_members where room_id=p_room_id and user_id=v_user and last_seen_at>now()-interval '3 minutes') and not exists (
    select 1 from public.room_invites i
    where i.room_id=p_room_id and i.target_user_id=v_user
      and i.used_at is null and i.expires_at>now()
  ) then
    raise exception 'private room requires an invitation';
  end if;

  if v_room.is_vip and v_room.owner_id<>v_user then
    select level into v_vip_level from private.vip_entitlement(v_user);
    if coalesce(v_vip_level,0)<1 then raise exception 'VIP membership required'; end if;
  end if;

  delete from public.room_members where user_id=v_user and room_id<>p_room_id;

  insert into public.room_members(room_id,user_id,seat_number,role,is_muted)
  values (p_room_id,v_user,null,case when v_room.owner_id=v_user then 'owner'else 'member'end,true)
  on conflict (room_id,user_id) do update set last_seen_at=now(),is_muted=true,seat_number=null,role=excluded.role;

  update public.room_invites set used_at=coalesce(used_at,now())
  where room_id=p_room_id and target_user_id=v_user and used_at is null;
end;
$function$
;

notify pgrst,'reload schema';
create function private.room_access_allowed(p_room_id uuid)returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid()is not null and exists(select 1 from public.rooms r join public.room_members m on m.room_id=r.id where r.id=p_room_id and r.is_active and m.user_id=auth.uid()and m.last_seen_at>now()-interval '3 minutes'and(not r.is_vip or r.owner_id=auth.uid()or(select level from private.vip_entitlement(auth.uid()))>0));
$$;
create function public.room_access_allowed(p_room_id uuid)returns boolean language sql stable security invoker set search_path='' as $$select private.room_access_allowed(p_room_id)$$;
revoke all on function private.room_access_allowed(uuid),public.room_access_allowed(uuid)from public,anon;
grant execute on function private.room_access_allowed(uuid),public.room_access_allowed(uuid)to authenticated;
create policy audio_live_membership on public.room_audio_signals as restrictive for all to authenticated using(public.room_access_allowed(room_id))with check(public.room_access_allowed(room_id));
create policy room_messages_live_membership on public.room_messages as restrictive for all to authenticated using(public.room_access_allowed(room_id))with check(public.room_access_allowed(room_id));
create or replace function private.room_heartbeat(p_room_id uuid)returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 if not private.room_access_allowed(p_room_id)then delete from public.room_members where room_id=p_room_id and user_id=auth.uid();return;end if;
 update public.room_members set last_seen_at=now()where room_id=p_room_id and user_id=auth.uid();
end$$;
notify pgrst,'reload schema';

create or replace function private.claim_reward(p_key text)returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); g bigint:=0; s bigint:=0; today date:=(now()at time zone 'UTC')::date; r public.reward_claims%rowtype;begin
 if u is null then raise exception 'authentication required';end if;
 perform 1 from public.profiles where id=u for update;
 select *into r from public.reward_claims where user_id=u and reward_key=p_key and claim_day=today;
 if found then return to_jsonb(r)||jsonb_build_object('already_claimed',true);end if;
 if p_key='daily' then g:=300;s:=150;
 elsif p_key='login' then s:=50;
 elsif p_key='follow_two' then
  if(select count(*)from public.user_follows where follower_id=u and(created_at at time zone 'UTC')::date=today)<2 then raise exception 'task incomplete';end if;s:=40;
 elsif p_key='listen_five' then
  if not exists(select 1 from public.room_members where user_id=u and joined_at<=now()-interval '5 minutes' and private.room_access_allowed(room_id))then raise exception 'task incomplete';end if;s:=70;
 else raise exception 'invalid reward';end if;
 insert into public.reward_claims(user_id,reward_key,claim_day,gold,silver)values(u,p_key,today,g,s)returning *into r;
 update public.profiles set gold=gold+g,silver_coins=silver_coins+s where id=u;
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,silver_delta)values(u,case when p_key='daily'then 'daily_reward'else 'task_reward'end,g,s);
 return to_jsonb(r)||jsonb_build_object('already_claimed',false);
end$$;

create or replace function private.send_room_gift(p_room_id uuid,p_recipient_public_id bigint,p_gift_id text,p_request_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_recipient uuid; v_price bigint; v_existing public.gift_events%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request id required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into v_existing from public.gift_events where request_id=p_request_id;
 if found then
  if v_existing.sender_id<>v_user or v_existing.room_id<>p_room_id or v_existing.gift_id<>p_gift_id or not exists(select 1 from public.profiles where public_id=p_recipient_public_id and id=v_existing.recipient_id)then raise exception 'request id already used'; end if;
  return;
 end if;
 if not private.room_access_allowed(p_room_id)then raise exception 'room membership expired';end if;
 select p.id into v_recipient from public.profiles p join public.room_members m on m.user_id=p.id
 where p.public_id=p_recipient_public_id and m.room_id=p_room_id and m.last_seen_at>now()-interval '3 minutes';
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

