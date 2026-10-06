-- Server-owned social state, commerce and support. No client wallet writes.
alter table public.profiles add column if not exists vip_expires_at timestamptz;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.wallet_transactions add column if not exists silver_delta bigint not null default 0;
alter table public.wallet_transactions drop constraint wallet_transactions_transaction_type_check;
alter table public.wallet_transactions add constraint wallet_transactions_transaction_type_check check
 (transaction_type in ('recharge','gift_sent','gift_received','admin_adjustment','diamond_conversion','store_purchase','vip_upgrade','daily_reward','task_reward'));

create table public.user_follows (
 follower_id uuid not null references public.profiles(id) on delete cascade,
 followed_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(follower_id,followed_id), check(follower_id<>followed_id)
);
create index user_follows_followed_idx on public.user_follows(followed_id,created_at desc);
create table public.friendships (
 user_a uuid not null references public.profiles(id) on delete cascade,
 user_b uuid not null references public.profiles(id) on delete cascade,
 requested_by uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(), primary key(user_a,user_b),
 check(user_a<user_b), check(requested_by in (user_a,user_b))
);
create index friendships_user_b_idx on public.friendships(user_b,status);
create table public.user_blocks (
 blocker_id uuid not null references public.profiles(id) on delete cascade,
 blocked_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id)
);
create table public.profile_visits (
 profile_id uuid not null references public.profiles(id) on delete cascade,
 visitor_id uuid not null references public.profiles(id) on delete cascade,
 visit_day date not null default (now() at time zone 'UTC')::date,
 visited_at timestamptz not null default now(), primary key(profile_id,visitor_id,visit_day),check(profile_id<>visitor_id)
);
create index profile_visits_visitor_idx on public.profile_visits(visitor_id,visited_at desc);
create table public.user_notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 type text not null check(type in ('gift','follower','friend_request','room_invite','system','visitor')),
 title text not null, description text not null default '', room_id uuid references public.rooms(id) on delete cascade,
 actor_public_id bigint, created_at timestamptz not null default now(), read_at timestamptz
);
create index user_notifications_inbox_idx on public.user_notifications(user_id,created_at desc);
create table public.store_catalog (
 id text primary key, name text not null, category text not null check(category in ('frames','cars','bubbles','badges','vip')),
 price bigint not null check(price>0), currency text not null check(currency in ('gold','silver')),
 icon text not null default '🎁', description text not null default '', duration_days integer check(duration_days between 1 and 365),
 vip_level integer check(vip_level between 1 and 8), is_active boolean not null default true
);
create table public.store_purchases (
 id uuid primary key default gen_random_uuid(), request_id uuid not null,
 user_id uuid not null references public.profiles(id) on delete cascade, item_id text not null references public.store_catalog(id),
 price bigint not null, currency text not null, created_at timestamptz not null default now(),expires_at timestamptz,
 unique(user_id,request_id)
);
create index store_purchases_inventory_idx on public.store_purchases(user_id,item_id,expires_at);
create table public.user_equipment (
 user_id uuid not null references public.profiles(id) on delete cascade, category text not null,
 item_id text not null references public.store_catalog(id), primary key(user_id,category)
);
create table public.reward_claims (
 user_id uuid not null references public.profiles(id) on delete cascade, reward_key text not null,
 claim_day date not null default (now() at time zone 'UTC')::date, gold bigint not null default 0,
 silver bigint not null default 0,created_at timestamptz not null default now(),primary key(user_id,reward_key,claim_day)
);
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 category text not null check(category in ('feedback','report','agency','custom_gift','special_id','withdrawal')),
 message text not null check(char_length(btrim(message)) between 5 and 2000),
 status text not null default 'open' check(status in ('open','answered','closed')),
 response text, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets(user_id,created_at desc);

insert into public.store_catalog(id,name,category,price,currency,icon,duration_days,description) values
 ('f1','إطار التنين الذهبي','frames',2500,'gold','🐉',30,'إطار ذهبي يظهر حول صورتك'),
 ('f2','إطار الأجنحة الملكية','frames',1800,'gold','👑',30,'إطار ملكي حول صورتك'),
 ('f3','إطار زهرة الكرز الفضي','frames',450,'silver','🌸',7,'إطار وردي حول صورتك'),
 ('f4','إطار النيون الفضائي','frames',1200,'gold','⚡',30,'إطار نيون حول صورتك'),
 ('c1','لامبورغيني أفينتادور الذهبية','cars',9900,'gold','🏎️',30,'شارة دخول تظهر عند انضمامك للغرفة'),
 ('c2','طائرة الهيليكوبتر الخاصة','cars',6500,'gold','🚁',30,'شارة دخول تظهر عند انضمامك للغرفة'),
 ('c3','اليخت الملكي الفاخر','cars',8000,'gold','🛥️',30,'شارة دخول تظهر عند انضمامك للغرفة'),
 ('c4','الحصان العربي الأبيض','cars',800,'silver','🐎',15,'شارة دخول تظهر عند انضمامك للغرفة'),
 ('b1','فقاعة الملكية الذهبية','bubbles',800,'gold','💬',30,'لون ذهبي للرسائل الجديدة'),
 ('b2','فقاعة الفضاء الأرجوانية','bubbles',300,'silver','🔮',15,'لون أرجواني للرسائل الجديدة'),
 ('bd1','وسام كبار الداعمين','badges',3500,'gold','💎',null,'وسام تجميلي في الملف الشخصي'),
 ('bd2','وسام فارس المجلس','badges',500,'silver','🛡️',null,'وسام تجميلي في الملف الشخصي');
insert into public.store_catalog(id,name,category,price,currency,icon,duration_days,vip_level,description)
 select 'vip'||n,'VIP '||n,'vip',p,'gold','👑',30,n,'عضوية لمدة 30 يومًا وشارة وإطار VIP ودخول غرف VIP'
 from (values (1,63000),(2,150000),(3,490000),(4,1960000),(5,3900000),(6,5800000),(7,8300000),(8,12000000)) as v(n,p);

do $$ declare t text; begin
 foreach t in array array['user_follows','friendships','user_blocks','profile_visits','user_notifications','store_catalog','store_purchases','user_equipment','reward_claims','support_tickets'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy follows_read on public.user_follows for select to authenticated using(follower_id=(select auth.uid()) or followed_id=(select auth.uid()));
create policy friendships_read on public.friendships for select to authenticated using(user_a=(select auth.uid()) or user_b=(select auth.uid()));
create policy blocks_read on public.user_blocks for select to authenticated using(blocker_id=(select auth.uid()));
create policy visits_read on public.profile_visits for select to authenticated using(profile_id=(select auth.uid()));
create policy notifications_read on public.user_notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_mark_read on public.user_notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant update(read_at) on public.user_notifications to authenticated;
create policy catalog_read on public.store_catalog for select to authenticated using(is_active);
create policy purchases_read on public.store_purchases for select to authenticated using(user_id=(select auth.uid()));
create policy equipment_read on public.user_equipment for select to authenticated using(user_id=(select auth.uid()));
create policy rewards_read on public.reward_claims for select to authenticated using(user_id=(select auth.uid()));
create policy tickets_read on public.support_tickets for select to authenticated using(user_id=(select auth.uid()) or public.is_admin_role('support') or public.is_admin_role('admin'));

create function private.public_profile(p_id uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'public_id',p.public_id,'username',p.username,'display_name',p.display_name,'avatar_url',p.avatar_url,
 'bio',p.bio,'country_code',p.country_code,'country_name',p.country_name,'gender',p.gender,'level',p.level,
 'vip_level',case when p.vip_expires_at is null or p.vip_expires_at>now() then p.vip_level else 0 end,'vip_expires_at',p.vip_expires_at,
 'received_gold',p.received_gold,'sent_gold',p.sent_gold,'received_gifts',p.received_gifts,'last_seen_at',p.last_seen_at,
 'friends_count',(select count(*) from public.friendships f where (p.id in(f.user_a,f.user_b)) and f.status='accepted'),
 'followers_count',(select count(*) from public.user_follows f where f.followed_id=p.id),
 'following_count',(select count(*) from public.user_follows f where f.follower_id=p.id),
 'visitors_count',(select count(distinct v.visitor_id) from public.profile_visits v where v.profile_id=p.id),
 'equipment',coalesce((select jsonb_object_agg(e.category,jsonb_build_object('id',c.id,'icon',c.icon,'name',c.name)) from public.user_equipment e
 join public.store_catalog c on c.id=e.item_id where e.user_id=p.id and exists(select 1 from public.store_purchases s where s.user_id=p.id and s.item_id=e.item_id and(s.expires_at is null or s.expires_at>now()))),'{}'::jsonb))
 from public.profiles p where p.id=p_id;
$$;
revoke all on function private.public_profile(uuid) from public,anon,authenticated;

create function private.social_profile(p_public_id bigint,p_visit boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t uuid; r jsonb; begin
 if u is null then raise exception 'authentication required'; end if;
 select id into t from public.profiles where public_id=p_public_id;
 if t is null then raise exception 'user not found'; end if;
 if p_visit and t<>u and not exists(select 1 from public.user_blocks where(blocker_id=u and blocked_id=t)or(blocker_id=t and blocked_id=u)) then
  insert into public.profile_visits(profile_id,visitor_id) values(t,u) on conflict(profile_id,visitor_id,visit_day) do update set visited_at=now();
 end if;
 r:=private.public_profile(t);
 return r||jsonb_build_object('is_following',exists(select 1 from public.user_follows where follower_id=u and followed_id=t),
 'is_blocked',exists(select 1 from public.user_blocks where blocker_id=u and blocked_id=t),
 'friend_status',coalesce((select case when status='accepted' then 'accepted' when requested_by=u then 'sent' else 'received' end from public.friendships where user_a=least(u,t) and user_b=greatest(u,t)),'none'));
end $$;
create function public.social_profile(p_public_id bigint,p_visit boolean default false) returns jsonb language sql security invoker set search_path='' as $$select private.social_profile(p_public_id,p_visit)$$;

create function private.social_action(p_public_id bigint,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t uuid; s public.friendships%rowtype; begin
 if u is null then raise exception 'authentication required'; end if;
 select id into t from public.profiles where public_id=p_public_id;
 if t is null or t=u then raise exception 'invalid target'; end if;
 -- Deterministic locks protect crossed requests and actions from racing.
 perform 1 from public.profiles where id in(u,t) order by id for update;
 if p_action='block' then
  insert into public.user_blocks values(u,t,now()) on conflict do nothing;
  delete from public.user_follows where(follower_id=u and followed_id=t)or(follower_id=t and followed_id=u);
  delete from public.friendships where user_a=least(u,t)and user_b=greatest(u,t);
 elsif p_action='unblock' then delete from public.user_blocks where blocker_id=u and blocked_id=t;
 else
  if exists(select 1 from public.user_blocks where(blocker_id=u and blocked_id=t)or(blocker_id=t and blocked_id=u)) then raise exception 'user is blocked'; end if;
  if p_action='follow' then insert into public.user_follows values(u,t,now()) on conflict do nothing;
  elsif p_action='unfollow' then delete from public.user_follows where follower_id=u and followed_id=t;
  elsif p_action='request' then
   insert into public.friendships(user_a,user_b,requested_by) values(least(u,t),greatest(u,t),u) on conflict do nothing;
  elsif p_action='accept' then
   select * into s from public.friendships where user_a=least(u,t)and user_b=greatest(u,t)for update;
   if not found or s.requested_by=u or s.status<>'pending' then raise exception 'incoming request required'; end if;
   update public.friendships set status='accepted' where user_a=s.user_a and user_b=s.user_b;
  elsif p_action in('reject','remove_friend','cancel_request') then
   select * into s from public.friendships where user_a=least(u,t)and user_b=greatest(u,t);
   if p_action='reject' and(s.requested_by=u or s.status<>'pending')then raise exception 'incoming request required'; end if;
   if p_action='cancel_request' and(s.requested_by<>u or s.status<>'pending')then raise exception 'outgoing request required'; end if;
   delete from public.friendships where user_a=least(u,t)and user_b=greatest(u,t);
  else raise exception 'invalid social action'; end if;
 end if;
 return private.social_profile(p_public_id,false);
end $$;
create function public.social_action(p_public_id bigint,p_action text)returns jsonb language sql security invoker set search_path='' as $$select private.social_action(p_public_id,p_action)$$;

create function private.social_list(p_kind text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r jsonb; begin
 if u is null then raise exception 'authentication required'; end if;
 select coalesce(jsonb_agg(private.public_profile(t.id)||jsonb_build_object('created_at',t.at)order by t.at desc),'[]'::jsonb) into r from(
  select followed_id id,created_at at from public.user_follows where p_kind='following'and follower_id=u
  union all select follower_id,created_at from public.user_follows where p_kind='followers'and followed_id=u
  union all select case when user_a=u then user_b else user_a end,created_at from public.friendships where u in(user_a,user_b)and((p_kind='friends'and status='accepted')or(p_kind='requests'and status='pending'and requested_by<>u))
  union all select visitor_id,max(visited_at) from public.profile_visits where p_kind='visitors'and profile_id=u group by visitor_id
  union all select blocked_id,created_at from public.user_blocks where p_kind='blocked'and blocker_id=u
 )t;
 if p_kind not in('following','followers','friends','requests','visitors','blocked') then raise exception 'invalid social list'; end if;
 return r;
end $$;
create function public.social_list(p_kind text)returns jsonb language sql security invoker set search_path='' as $$select private.social_list(p_kind)$$;

create function private.touch_presence()returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 update public.profiles set last_seen_at=now() where id=auth.uid()and(last_seen_at is null or last_seen_at<now()-interval '1 minute');
end$$;
create function public.touch_presence()returns void language sql security invoker set search_path='' as $$select private.touch_presence()$$;

create function private.purchase_store_item(p_item_id text,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.store_catalog%rowtype; s public.store_purchases%rowtype; p public.profiles%rowtype; expiry timestamptz; begin
 if u is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request ID required'; end if;
 select * into p from public.profiles where id=u for update;
 select * into s from public.store_purchases where user_id=u and request_id=p_request_id;
 if found then
  if s.item_id<>p_item_id then raise exception 'request ID already used'; end if;
  return to_jsonb(s);
 end if;
 select * into c from public.store_catalog where id=p_item_id and is_active for share;
 if not found then raise exception 'item unavailable'; end if;
 if c.category='vip' and p.vip_level>c.vip_level and(p.vip_expires_at is null or p.vip_expires_at>now()) then raise exception 'cannot downgrade active VIP'; end if;
 if c.category<>'vip' and exists(select 1 from public.store_purchases where user_id=u and item_id=c.id and(expires_at is null or expires_at>now()))then raise exception 'item already owned'; end if;
 if c.currency='gold' and p.gold<c.price then raise exception 'insufficient gold'; end if;
 if c.currency='silver' and p.silver_coins<c.price then raise exception 'insufficient silver'; end if;
 expiry:=case when c.duration_days is not null then now()+make_interval(days=>c.duration_days)else null end;
 if c.category='vip' and p.vip_level=c.vip_level and p.vip_expires_at>now()then expiry:=p.vip_expires_at+make_interval(days=>c.duration_days);end if;
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
create function public.purchase_store_item(p_item_id text,p_request_id uuid)returns jsonb language sql security invoker set search_path='' as $$select private.purchase_store_item(p_item_id,p_request_id)$$;

create function private.equip_store_item(p_item_id text,p_category text)returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
 if u is null then raise exception 'authentication required'; end if;
 perform 1 from public.profiles where id=u for update;
 if p_category not in('frames','cars','bubbles','badges')then raise exception 'invalid category';end if;
 if p_item_id is null then delete from public.user_equipment where user_id=u and category=p_category;update public.profiles set updated_at=now()where id=u;return;end if;
 if not exists(select 1 from public.store_purchases s join public.store_catalog c on c.id=s.item_id where s.user_id=u and c.id=p_item_id and c.category=p_category and(s.expires_at is null or s.expires_at>now()))then raise exception 'valid ownership required';end if;
 insert into public.user_equipment values(u,p_category,p_item_id)on conflict(user_id,category)do update set item_id=excluded.item_id;
 update public.profiles set updated_at=now()where id=u;
end$$;
create function public.equip_store_item(p_item_id text,p_category text)returns void language sql security invoker set search_path='' as $$select private.equip_store_item(p_item_id,p_category)$$;

create function private.claim_reward(p_key text)returns jsonb language plpgsql security definer set search_path='' as $$
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
  if not exists(select 1 from public.room_members where user_id=u and joined_at<=now()-interval '5 minutes')then raise exception 'task incomplete';end if;s:=70;
 else raise exception 'invalid reward';end if;
 insert into public.reward_claims(user_id,reward_key,claim_day,gold,silver)values(u,p_key,today,g,s)returning *into r;
 update public.profiles set gold=gold+g,silver_coins=silver_coins+s where id=u;
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,silver_delta)values(u,case when p_key='daily'then 'daily_reward'else 'task_reward'end,g,s);
 return to_jsonb(r)||jsonb_build_object('already_claimed',false);
end$$;
create function public.claim_reward(p_key text)returns jsonb language sql security invoker set search_path='' as $$select private.claim_reward(p_key)$$;

create function private.submit_support_ticket(p_category text,p_message text)returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t uuid;begin
 if u is null then raise exception 'authentication required';end if;
 perform 1 from public.profiles where id=u for update;
 if p_category not in('feedback','report','agency','custom_gift','special_id','withdrawal') or char_length(btrim(p_message))not between 5 and 2000 then raise exception 'invalid support request';end if;
 if(select count(*)from public.support_tickets where user_id=u and created_at>now()-interval '1 hour')>=5 then raise exception 'support request limit reached';end if;
 if p_category='custom_gift'and coalesce((select sum(price_usd)from public.recharge_requests where user_id=u and status='approved'and created_at>=date_trunc('month',now()at time zone 'UTC')at time zone 'UTC'),0)<1500 then raise exception 'monthly recharge requirement not met';end if;
 if p_category='withdrawal'and(select diamonds from public.profiles where id=u)<5000 then raise exception 'minimum withdrawal is 5000 diamonds';end if;
 insert into public.support_tickets(user_id,category,message)values(u,p_category,btrim(p_message))returning id into t;
 return t;
end$$;
create function public.submit_support_ticket(p_category text,p_message text)returns uuid language sql security invoker set search_path='' as $$select private.submit_support_ticket(p_category,p_message)$$;
create function private.respond_support_ticket(p_id uuid,p_response text,p_status text)returns void language plpgsql security definer set search_path='' as $$
declare t public.support_tickets%rowtype;begin
 if auth.uid()is null or not(public.is_admin_role('admin')or public.is_admin_role('support'))then raise exception 'not authorized';end if;
 if char_length(btrim(p_response))not between 1 and 2000 or p_status not in('answered','closed')then raise exception 'invalid response';end if;
 update public.support_tickets set response=btrim(p_response),status=p_status,updated_at=now()where id=p_id returning *into t;
 if not found then raise exception 'ticket not found';end if;
 insert into public.user_notifications(user_id,type,title,description)values(t.user_id,'system','رد الدعم على طلبك',btrim(p_response));
end$$;
create function public.respond_support_ticket(p_id uuid,p_response text,p_status text)returns void language sql security invoker set search_path='' as $$select private.respond_support_ticket(p_id,p_response,p_status)$$;

create function private.social_notifications()returns trigger language plpgsql security definer set search_path='' as $$
declare actor_name text;actor_public bigint;target uuid;begin
 if tg_table_name='user_follows'then
  select display_name,public_id into actor_name,actor_public from public.profiles where id=new.follower_id;
  insert into public.user_notifications(user_id,type,title,description,actor_public_id)values(new.followed_id,'follower','متابع جديد',actor_name,actor_public);
 elsif tg_table_name='friendships'then
  target:=case when new.requested_by=new.user_a then new.user_b else new.user_a end;
  select display_name,public_id into actor_name,actor_public from public.profiles where id=new.requested_by;
  insert into public.user_notifications(user_id,type,title,description,actor_public_id)values(target,'friend_request','طلب صداقة',actor_name,actor_public);
 elsif tg_table_name='room_invites'then
  insert into public.user_notifications(user_id,type,title,description,room_id)values(new.target_user_id,'room_invite','دعوة غرفة','وصلتك دعوة إلى غرفة',new.room_id);
 end if;return new;
end$$;
revoke all on function private.social_notifications()from public,anon,authenticated;
create trigger notify_follow after insert on public.user_follows for each row execute function private.social_notifications();
create trigger notify_friend_request after insert on public.friendships for each row execute function private.social_notifications();
create trigger notify_room_invite after insert on public.room_invites for each row execute function private.social_notifications();

create function private.unban_room_user(p_room_id uuid,p_public_id bigint)returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid()is null or not exists(select 1 from public.rooms where id=p_room_id and owner_id=auth.uid())then raise exception 'room owner permission required';end if;
 delete from public.room_bans where room_id=p_room_id and public_id=p_public_id;
end$$;
create function public.unban_room_user(p_room_id uuid,p_public_id bigint)returns void language sql security invoker set search_path='' as $$select private.unban_room_user(p_room_id,p_public_id)$$;

-- Wrappers remain invokers; implementations reject missing authentication.
do $$declare grant_row record;begin
 for grant_row in select n.nspname,p.oid,p.oid::regprocedure::text as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname in('private','public')and p.proname in('social_profile','social_action','social_list','touch_presence','purchase_store_item','equip_store_item','claim_reward','submit_support_ticket','respond_support_ticket','unban_room_user')loop
  execute format('revoke all on function %s from public,anon',grant_row.signature);
  execute format('grant execute on function %s to authenticated',grant_row.signature);
 end loop;
end$$;
-- Realtime is for the caller's RLS-filtered inbox; other data uses explicit refresh.
alter publication supabase_realtime add table public.user_notifications;
notify pgrst,'reload schema';

-- Enforce VIP expiry and one joined room per user.
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

  if v_room.is_private and v_room.owner_id<>v_user and not exists (select 1 from public.room_members where room_id=p_room_id and user_id=v_user) and not exists (
    select 1 from public.room_invites i
    where i.room_id=p_room_id and i.target_user_id=v_user
      and i.used_at is null and i.expires_at>now()
  ) then
    raise exception 'private room requires an invitation';
  end if;

  if v_room.is_vip and v_room.owner_id<>v_user then
    select case when p.vip_expires_at is null or p.vip_expires_at>now()then coalesce(p.vip_level,0)else 0 end into v_vip_level from public.profiles p where p.id=v_user;
    if coalesce(v_vip_level,0)<1 then raise exception 'VIP membership required'; end if;
  end if;

  delete from public.room_members where user_id=v_user and room_id<>p_room_id;

  insert into public.room_members(room_id,user_id,seat_number,role,is_muted)
  values (p_room_id,v_user,null,case when v_room.owner_id=v_user then 'owner'else 'member'end,true)
  on conflict (room_id,user_id) do nothing;

  update public.room_invites set used_at=coalesce(used_at,now())
  where room_id=p_room_id and target_user_id=v_user and used_at is null;
end;
$function$
;

