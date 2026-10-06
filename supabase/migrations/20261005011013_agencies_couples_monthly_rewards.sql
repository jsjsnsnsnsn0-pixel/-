create table public.agencies (
 id bigint generated always as identity(start with 1000) primary key,
 owner_id uuid not null unique references public.profiles(id)on delete cascade,
 name text not null check(char_length(btrim(name))between 3 and 80),created_at timestamptz not null default now()
);
create table public.agency_members (
 user_id uuid primary key references public.profiles(id)on delete cascade,
 agency_id bigint not null references public.agencies(id)on delete cascade,
 joined_at timestamptz not null default now()
);
create index agency_members_agency_idx on public.agency_members(agency_id);
create table public.agency_applications (
 agency_id bigint not null references public.agencies(id)on delete cascade,
 user_id uuid not null references public.profiles(id)on delete cascade,
 created_at timestamptz not null default now(),primary key(agency_id,user_id)
);
create index agency_applications_user_idx on public.agency_applications(user_id);
create table public.couples (
 id uuid primary key default gen_random_uuid(),user_a uuid not null references public.profiles(id)on delete cascade,
 user_b uuid not null references public.profiles(id)on delete cascade,requested_by uuid not null references public.profiles(id)on delete cascade,
 created_at timestamptz not null default now(),accepted_at timestamptz,ended_at timestamptz,
 check(user_a<user_b),check(requested_by in(user_a,user_b))
);
create index couples_user_a_idx on public.couples(user_a,ended_at);
create index couples_user_b_idx on public.couples(user_b,ended_at);
create table public.recharge_reward_tiers(id text primary key,label text not null,threshold_usd numeric not null check(threshold_usd>0),rewards jsonb not null);
create table public.recharge_reward_claims(user_id uuid not null references public.profiles(id)on delete cascade,tier_id text not null references public.recharge_reward_tiers(id),claim_month date not null,created_at timestamptz not null default now(),primary key(user_id,tier_id,claim_month));
create table public.couple_reward_claims(user_id uuid not null references public.profiles(id)on delete cascade,week_start date not null,rank integer not null check(rank between 1 and 3),primary key(user_id,week_start));
alter table public.store_catalog add column is_reward boolean not null default false;
-- Catalog prices are purchase prices. Activity coins below are bonuses only,
-- excluding the recharge principal that approve_recharge_request already credits.
do $$declare t text;begin
 foreach t in array array['agencies','agency_members','agency_applications','couples','recharge_reward_tiers','recharge_reward_claims','couple_reward_claims']loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
 end loop;
end$$;
create policy agencies_read on public.agencies for select to authenticated using(true);
create policy agency_members_read on public.agency_members for select to authenticated using(user_id=(select auth.uid()));
create policy agency_applications_read on public.agency_applications for select to authenticated using(user_id=(select auth.uid()));
create policy couples_read on public.couples for select to authenticated using((select auth.uid())in(user_a,user_b));
create policy recharge_tiers_read on public.recharge_reward_tiers for select to authenticated using(true);
create policy recharge_claims_read on public.recharge_reward_claims for select to authenticated using(user_id=(select auth.uid()));
create policy couple_claims_read on public.couple_reward_claims for select to authenticated using(user_id=(select auth.uid()));

create function private.agency_state()returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();a public.agencies%rowtype;begin
 if u is null then raise exception 'authentication required';end if;
 select g.*into a from public.agencies g join public.agency_members m on m.agency_id=g.id where m.user_id=u;
 return jsonb_build_object('agency',case when a.id is not null then to_jsonb(a)else null end,
 'members',case when a.id is not null then(select coalesce(jsonb_agg(private.public_profile(m.user_id)),'[]'::jsonb)from public.agency_members m where m.agency_id=a.id)else '[]'::jsonb end,
 'applications',case when a.owner_id=u then(select coalesce(jsonb_agg(private.public_profile(r.user_id)),'[]'::jsonb)from public.agency_applications r where r.agency_id=a.id)else '[]'::jsonb end,
 'available',(select coalesce(jsonb_agg(to_jsonb(g)order by g.created_at desc),'[]'::jsonb)from public.agencies g));
end$$;
create function public.agency_state()returns jsonb language sql security invoker set search_path='' as $$select private.agency_state()$$;
create function private.create_agency(p_owner_public_id bigint,p_name text)returns bigint language plpgsql security definer set search_path='' as $$
declare t uuid;a bigint;begin
 if auth.uid()is null or not public.is_admin_role('admin')then raise exception 'not authorized';end if;
 if char_length(btrim(p_name))not between 3 and 80 then raise exception 'invalid agency name';end if;
 select id into t from public.profiles where public_id=p_owner_public_id for update;
 if t is null then raise exception 'user not found';end if;
 if exists(select 1 from public.agency_members where user_id=t)then raise exception 'user already belongs to an agency';end if;
 insert into public.agencies(owner_id,name)values(t,btrim(p_name))returning id into a;
 insert into public.agency_members values(t,a,now());return a;
end$$;
create function public.create_agency(p_owner_public_id bigint,p_name text)returns bigint language sql security invoker set search_path='' as $$select private.create_agency(p_owner_public_id,p_name)$$;
create function private.agency_action(p_agency_id bigint,p_action text,p_target_public_id bigint default null)returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t uuid;owner uuid;begin
 if u is null then raise exception 'authentication required';end if;
 select owner_id into owner from public.agencies where id=p_agency_id;
 if owner is null then raise exception 'agency not found';end if;
 if p_action='request'then
  perform 1 from public.profiles where id=u for update;
  if exists(select 1 from public.agency_members where user_id=u)then raise exception 'user already belongs to an agency';end if;
  if(select count(*)from public.agency_applications where user_id=u)>=5 then raise exception 'application limit reached';end if;
  insert into public.agency_applications values(p_agency_id,u,now())on conflict do nothing;
 elsif p_action='leave'then
  if owner=u then raise exception 'agency owner cannot leave';end if;
  delete from public.agency_members where user_id=u and agency_id=p_agency_id;
 elsif p_action in('accept','reject','remove')then
  if owner<>u and not public.is_admin_role('admin')then raise exception 'not authorized';end if;
  select id into t from public.profiles where public_id=p_target_public_id for update;
  if t is null or t=owner then raise exception 'invalid target';end if;
  if p_action='accept'then
   if not exists(select 1 from public.agency_applications where user_id=t and agency_id=p_agency_id)then raise exception 'application required';end if;
   insert into public.agency_members values(t,p_agency_id,now());
   delete from public.agency_applications where user_id=t;
  elsif p_action='reject'then delete from public.agency_applications where user_id=t and agency_id=p_agency_id;
  else delete from public.agency_members where user_id=t and agency_id=p_agency_id;end if;
 else raise exception 'invalid agency action';end if;
end$$;
create function public.agency_action(p_agency_id bigint,p_action text,p_target_public_id bigint default null)returns void language sql security invoker set search_path='' as $$select private.agency_action(p_agency_id,p_action,p_target_public_id)$$;

create function private.couple_action(p_public_id bigint,p_action text)returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t uuid;r public.couples%rowtype;begin
 if u is null then raise exception 'authentication required';end if;
 select id into t from public.profiles where public_id=p_public_id;
 if t is null or t=u then raise exception 'invalid target';end if;
 perform 1 from public.profiles where id in(u,t)order by id for update;
 select *into r from public.couples where user_a=least(u,t)and user_b=greatest(u,t)and ended_at is null order by created_at desc limit 1;
 if p_action='request'then
  if exists(select 1 from public.user_blocks where(blocker_id=u and blocked_id=t)or(blocker_id=t and blocked_id=u))then raise exception 'user is blocked';end if;
  if exists(select 1 from public.couples where ended_at is null and accepted_at is not null and(u in(user_a,user_b)or t in(user_a,user_b)))then raise exception 'partner already linked';end if;
  if r.id is not null then return;end if;
  if(select count(*)from public.couples where requested_by=u and ended_at is null)>=5 then raise exception 'couple request limit reached';end if;
  insert into public.couples(user_a,user_b,requested_by)values(least(u,t),greatest(u,t),u);
  insert into public.user_notifications(user_id,type,title,description,actor_public_id)select t,'system','طلب رفيق روح',display_name,public_id from public.profiles where id=u;
 elsif p_action='accept'then
  if r.id is null or r.requested_by=u or r.accepted_at is not null then raise exception 'incoming request required';end if;
  if exists(select 1 from public.couples where ended_at is null and accepted_at is not null and(u in(user_a,user_b)or t in(user_a,user_b)))then raise exception 'partner already linked';end if;
  update public.couples set accepted_at=clock_timestamp()where id=r.id;
  update public.couples set ended_at=clock_timestamp()where id<>r.id and ended_at is null and accepted_at is null and(u in(user_a,user_b)or t in(user_a,user_b));
 elsif p_action in('reject','end')then
  if r.id is null then return;end if;
  update public.couples set ended_at=clock_timestamp()where id=r.id;
 else raise exception 'invalid couple action';end if;
end$$;
create function public.couple_action(p_public_id bigint,p_action text)returns void language sql security invoker set search_path='' as $$select private.couple_action(p_public_id,p_action)$$;
create function private.couple_rankings(p_week date)returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('user1',private.public_profile(s.user_a),'user2',private.public_profile(s.user_b),'score',s.score,'rank',s.rank)order by s.rank),'[]'::jsonb)from(
  select c.user_a,c.user_b,sum(g.amount)score,row_number()over(order by sum(g.amount)desc,c.user_a,c.user_b)rank
  from public.couples c join public.gift_events g on least(g.sender_id,g.recipient_id)=c.user_a and greatest(g.sender_id,g.recipient_id)=c.user_b
   and g.created_at>=c.accepted_at and(c.ended_at is null or g.created_at<c.ended_at)
  where c.accepted_at is not null and g.created_at>=p_week::timestamp at time zone 'UTC'and g.created_at<(p_week+7)::timestamp at time zone 'UTC'
  group by c.user_a,c.user_b order by sum(g.amount)desc,c.user_a,c.user_b limit 50
 )s;
$$;
revoke all on function private.couple_rankings(date)from public,anon,authenticated;
create function private.couple_state()returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();begin
 if u is null then raise exception 'authentication required';end if;
 return jsonb_build_object('relations',(select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('partner',private.public_profile(case when c.user_a=u then c.user_b else c.user_a end))),'[]'::jsonb)from public.couples c where u in(c.user_a,c.user_b)and c.ended_at is null),
 'current',private.couple_rankings(date_trunc('week',now()at time zone 'UTC')::date),
 'previous',private.couple_rankings(date_trunc('week',now()at time zone 'UTC')::date-7));
end$$;
create function public.couple_state()returns jsonb language sql security invoker set search_path='' as $$select private.couple_state()$$;
create function private.claim_couple_reward()returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();week date:=date_trunc('week',now()at time zone 'UTC')::date-7;entry jsonb;rank integer;item text;begin
 if u is null then raise exception 'authentication required';end if;
 perform 1 from public.profiles where id=u for update;
 select e into entry from jsonb_array_elements(private.couple_rankings(week))e where(e->'user1'->>'id'=u::text or e->'user2'->>'id'=u::text)and(e->>'rank')::integer<=3;
 if entry is null then raise exception 'previous week top three required';end if;rank:=(entry->>'rank')::integer;
 if exists(select 1 from public.couple_reward_claims where user_id=u and week_start=week)then return rank;end if;
 item:='cp_weekly_'||rank;
 insert into public.couple_reward_claims values(u,week,rank);
 insert into public.store_purchases(request_id,user_id,item_id,price,currency,expires_at)values(gen_random_uuid(),u,item,0,'gold',now()+interval '7 days');
 insert into public.user_notifications(user_id,type,title,description)values(u,'system','مكافأة رفقاء الروح','تم منح إطار المركز '||rank||' لمدة 7 أيام');return rank;
end$$;
create function public.claim_couple_reward()returns integer language sql security invoker set search_path='' as $$select private.claim_couple_reward()$$;
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)select 'cp_weekly_'||n,'إطار رفقاء الروح TOP '||n,'frames',1,'gold','💖','إطار تصنيف الأسبوع الماضي',7,true from generate_series(1,3)n;

create function private.claim_recharge_reward(p_tier_id text)returns jsonb language plpgsql security definer set search_path='' as $$
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
create function public.claim_recharge_reward(p_tier_id text)returns jsonb language sql security invoker set search_path='' as $$select private.claim_recharge_reward(p_tier_id)$$;
do $$declare grant_row record;begin
 for grant_row in select p.oid::regprocedure::text signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private')and p.proname in('agency_state','create_agency','agency_action','couple_action','couple_state','claim_couple_reward','claim_recharge_reward')loop
  execute format('revoke all on function %s from public,anon',grant_row.signature);execute format('grant execute on function %s to authenticated',grant_row.signature);
 end loop;
end$$;
notify pgrst,'reload schema';

insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_9_9_1','إطار الأفاتار الناري الملكي','frames',1,'gold','🔥','مكافأة نشاط شحن معتمد',7,true);
insert into public.recharge_reward_tiers values('tier_9_9','إعادة شحن 9.9 دولارًا',9.9,'[{"type": "vip", "vipLevel": 1, "days": 3, "name": "اشتراك VIP1 ملكي"}, {"type": "cosmetic", "catalog_id": "reward_tier_9_9_1", "days": 7, "name": "إطار الأفاتار الناري الملكي"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_49_9_1','إطار الياقوت الأزرق المشع','frames',1,'gold','💎','مكافأة نشاط شحن معتمد',15,true);
insert into public.recharge_reward_tiers values('tier_49_9','إعادة شحن 49.9 دولارًا',49.9,'[{"type": "vip", "vipLevel": 2, "days": 7, "name": "اشتراك VIP2 الإمبراطوري"}, {"type": "cosmetic", "catalog_id": "reward_tier_49_9_1", "days": 15, "name": "إطار الياقوت الأزرق المشع"}, {"type": "coins", "coins": 15000, "name": "15,000 عملة ذهبية إضافية"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_100_1','مركبة السفينة البحرية 3D','cars',1,'gold','🚢','مكافأة نشاط شحن معتمد',15,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_100_2','إطار الطبيعة الأخضر الفخم','frames',1,'gold','🍄','مكافأة نشاط شحن معتمد',15,true);
insert into public.recharge_reward_tiers values('tier_100','إعادة شحن 100 دولار',100,'[{"type": "vip", "vipLevel": 2, "days": 15, "name": "اشتراك VIP2 الملكي الفاخر"}, {"type": "cosmetic", "catalog_id": "reward_tier_100_1", "days": 15, "name": "مركبة السفينة البحرية 3D"}, {"type": "cosmetic", "catalog_id": "reward_tier_100_2", "days": 15, "name": "إطار الطبيعة الأخضر الفخم"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_300_1','دخولية النمر الأبيض الملكي 3D','cars',1,'gold','🐅','مكافأة نشاط شحن معتمد',15,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_300_2','إطار التاج الإمبراطوري الذهبي','frames',1,'gold','👑','مكافأة نشاط شحن معتمد',15,true);
insert into public.recharge_reward_tiers values('tier_300','إعادة شحن 300 دولار',300,'[{"type": "vip", "vipLevel": 3, "days": 15, "name": "اشتراك VIP3 الملكي المتألق"}, {"type": "cosmetic", "catalog_id": "reward_tier_300_1", "days": 15, "name": "دخولية النمر الأبيض الملكي 3D"}, {"type": "cosmetic", "catalog_id": "reward_tier_300_2", "days": 15, "name": "إطار التاج الإمبراطوري الذهبي"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_500_1','دخولية الأسد الإمبراطوري 3D','cars',1,'gold','🦁','مكافأة نشاط شحن معتمد',15,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_500_2','إكليل الغار الماسي الأزرق المشع','frames',1,'gold','💎','مكافأة نشاط شحن معتمد',15,true);
insert into public.recharge_reward_tiers values('tier_500','إعادة شحن 500 دولار',500,'[{"type": "vip", "vipLevel": 4, "days": 15, "name": "اشتراك VIP4 الإمبراطوري"}, {"type": "cosmetic", "catalog_id": "reward_tier_500_1", "days": 15, "name": "دخولية الأسد الإمبراطوري 3D"}, {"type": "cosmetic", "catalog_id": "reward_tier_500_2", "days": 15, "name": "إكليل الغار الماسي الأزرق المشع"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_1000_3','سيارة فيراري الخارقة 3D','cars',1,'gold','🏎️','مكافأة نشاط شحن معتمد',30,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_1000_4','إطار أجنحة النسر الذهبية','frames',1,'gold','🦅','مكافأة نشاط شحن معتمد',30,true);
insert into public.recharge_reward_tiers values('tier_1000','إعادة شحن 1000 دولار',1000,'[{"type": "coins", "coins": 50000, "name": "50,000 عملة ذهبية فورية"}, {"type": "request", "category": "special_id", "name": "معرف مميز سداسي AABBCCD"}, {"type": "vip", "vipLevel": 5, "days": 15, "name": "اشتراك VIP5 النبيل"}, {"type": "cosmetic", "catalog_id": "reward_tier_1000_3", "days": 30, "name": "سيارة فيراري الخارقة 3D"}, {"type": "cosmetic", "catalog_id": "reward_tier_1000_4", "days": 30, "name": "إطار أجنحة النسر الذهبية"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_1500_3','عجلة الزمن الكونية النادرة 3D','cars',1,'gold','🌌','مكافأة نشاط شحن معتمد',30,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_1500_4','إطار الياقوت الإمبراطوري المتوج','frames',1,'gold','👑','مكافأة نشاط شحن معتمد',30,true);
insert into public.recharge_reward_tiers values('tier_1500','إعادة شحن 1500 دولار',1500,'[{"type": "coins", "coins": 100000, "name": "100,000 عملة ذهبية فورية"}, {"type": "request", "category": "special_id", "name": "معرف مميز سباعي فخم AABBCCC"}, {"type": "vip", "vipLevel": 6, "days": 30, "name": "اشتراك أسطوري VIP6"}, {"type": "cosmetic", "catalog_id": "reward_tier_1500_3", "days": 30, "name": "عجلة الزمن الكونية النادرة 3D"}, {"type": "cosmetic", "catalog_id": "reward_tier_1500_4", "days": 30, "name": "إطار الياقوت الإمبراطوري المتوج"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_3000_4','مركبة سفينة الفضاء النفاثة 3D','cars',1,'gold','🚀','مكافأة نشاط شحن معتمد',30,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_3000_5','إطار العرش الماسي والياقوت الملكي','frames',1,'gold','👑','مكافأة نشاط شحن معتمد',30,true);
insert into public.recharge_reward_tiers values('tier_3000','إعادة شحن 3000 دولار',3000,'[{"type": "coins", "coins": 200000, "name": "200,000 عملة ذهبية فورية"}, {"type": "request", "category": "custom_gift", "name": "هدية خاصة حصرية XXXXXX"}, {"type": "vip", "vipLevel": 7, "days": 30, "name": "اشتراك ملكي فائق VIP7"}, {"type": "request", "category": "special_id", "name": "معرف ملكي سداسي نادر AAABBB"}, {"type": "cosmetic", "catalog_id": "reward_tier_3000_4", "days": 30, "name": "مركبة سفينة الفضاء النفاثة 3D"}, {"type": "cosmetic", "catalog_id": "reward_tier_3000_5", "days": 30, "name": "إطار العرش الماسي والياقوت الملكي"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_5000_7','إطار الألماس الأخضر $5000','frames',1,'gold','💎','مكافأة نشاط شحن معتمد',30,true);
insert into public.recharge_reward_tiers values('tier_5000','إعادة شحن 5000 دولار',5000,'[{"type": "request", "category": "feedback", "name": "بانر رسمي باسمك بالتطبيق"}, {"type": "request", "category": "feedback", "name": "شاشة افتتاحية كاملة مفتوحة"}, {"type": "request", "category": "custom_gift", "name": "هدية مخصصة 3D خاصة بك"}, {"type": "request", "category": "feedback", "name": "مركبة نفاثة أسطورية مخصصة"}, {"type": "vip", "vipLevel": 8, "days": 15, "name": "أعلى رتبة إمبراطورية VIP8"}, {"type": "request", "category": "special_id", "name": "معرف خماسي ملكي نادر AAABB"}, {"type": "coins", "coins": 400000, "name": "400,000 عملة ذهبية فورية"}, {"type": "cosmetic", "catalog_id": "reward_tier_5000_7", "days": 30, "name": "إطار الألماس الأخضر $5000"}]'::jsonb);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_10000_3','طائرة نفاثة ألماسيّة ملكية 3D','cars',1,'gold','🚀','مكافأة نشاط شحن معتمد',30,true);
insert into public.store_catalog(id,name,category,price,currency,icon,description,duration_days,is_reward)values('reward_tier_10000_7','إطار الذهب والماس الأسطوري $10000','frames',1,'gold','👑','مكافأة نشاط شحن معتمد',30,true);
insert into public.recharge_reward_tiers values('tier_10000','إعادة شحن 10000 دولار',10000,'[{"type": "request", "category": "feedback", "name": "بانر رئيسي فائق الفخامة $10000"}, {"type": "request", "category": "feedback", "name": "دخولية إمبراطورية أسطورية شاشة مفتوحة"}, {"type": "request", "category": "custom_gift", "name": "هدية سوبر أسطورية 3D الأغلى في التطبيق"}, {"type": "cosmetic", "catalog_id": "reward_tier_10000_3", "days": 30, "name": "طائرة نفاثة ألماسيّة ملكية 3D"}, {"type": "vip", "vipLevel": 8, "days": 30, "name": "أعلى رتبة إمبراطورية VIP8 كاملة"}, {"type": "request", "category": "special_id", "name": "معرف رباعي أسطوري ملكي نادر AABB"}, {"type": "coins", "coins": 1200000, "name": "1,200,000 عملة ذهبية فورية"}, {"type": "cosmetic", "catalog_id": "reward_tier_10000_7", "days": 30, "name": "إطار الذهب والماس الأسطوري $10000"}]'::jsonb);

create or replace function private.purchase_store_item(p_item_id text,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.store_catalog%rowtype; s public.store_purchases%rowtype; p public.profiles%rowtype; expiry timestamptz; begin
 if u is null then raise exception 'authentication required'; end if;
 if p_request_id is null then raise exception 'request ID required'; end if;
 select * into p from public.profiles where id=u for update;
 select * into s from public.store_purchases where user_id=u and request_id=p_request_id;
 if found then
  if s.item_id<>p_item_id then raise exception 'request ID already used'; end if;
  return to_jsonb(s);
 end if;
 select * into c from public.store_catalog where id=p_item_id and is_active and not is_reward for share;
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

