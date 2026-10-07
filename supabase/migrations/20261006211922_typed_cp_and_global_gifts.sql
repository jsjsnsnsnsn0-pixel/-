-- Existing CP remains love. Future types must be explicitly configured by the owner.
create table public.cp_types (
 id text primary key check(id ~ '^[a-z][a-z0-9_]{0,39}$'),
 label text not null check(char_length(label) between 1 and 80),
 enabled boolean not null default false
);
insert into public.cp_types(id,label,enabled) values('love','رفيق الروح',true);
alter table public.cp_types enable row level security;
revoke all on public.cp_types from public,anon,authenticated;
grant select on public.cp_types to authenticated;
create policy cp_types_read on public.cp_types for select to authenticated using(enabled);
alter table public.couples add column type_id text not null default 'love' references public.cp_types(id);
create index couples_type_idx on public.couples(type_id);
-- Accepted pairs are exclusive across all types; pending requests may coexist until acceptance.
create unique index couples_active_pair on public.couples(user_a,user_b) where ended_at is null and accepted_at is not null;
create unique index couples_pending_type_pair on public.couples(user_a,user_b,type_id) where ended_at is null and accepted_at is null;
-- A normalized occupancy record makes uniqueness independent of user_a/user_b ordering.
create table private.cp_slots (
 user_id uuid not null references public.profiles(id) on delete cascade,
 type_id text not null references public.cp_types(id),
 couple_id uuid not null references public.couples(id) on delete cascade,
 primary key(user_id,type_id)
);
create index cp_slots_couple on private.cp_slots(couple_id);
create index cp_slots_type on private.cp_slots(type_id);
alter table private.cp_slots enable row level security;
create policy cp_slots_internal on private.cp_slots to authenticated using(false) with check(false);
revoke all on private.cp_slots from public,anon,authenticated;
-- Migration aborts on contradictory legacy data instead of silently unlinking users.
insert into private.cp_slots(user_id,type_id,couple_id)
 select user_a,type_id,id from public.couples where accepted_at is not null and ended_at is null
 union all select user_b,type_id,id from public.couples where accepted_at is not null and ended_at is null;
-- Optional cross-type conflicts for the same user. Same-type uniqueness is unconditional.
create table private.cp_type_conflicts (
 type_a text not null references public.cp_types(id),
 type_b text not null references public.cp_types(id),
 primary key(type_a,type_b), check(type_a<type_b)
);
create index cp_type_conflicts_b on private.cp_type_conflicts(type_b);
alter table private.cp_type_conflicts enable row level security;
create policy cp_conflicts_internal on private.cp_type_conflicts to authenticated using(false) with check(false);
revoke all on private.cp_type_conflicts from public,anon,authenticated;
create function private.guard_cp() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.user_a,new.user_b,new.type_id,new.requested_by) is distinct from (old.user_a,old.user_b,old.type_id,old.requested_by) then raise exception 'CP identity cannot change';end if;
 if tg_op='UPDATE' and old.ended_at is not null and new.ended_at is null then raise exception 'ended CP cannot reopen';end if;
 if tg_op='UPDATE' and old.accepted_at is not null and new.accepted_at is distinct from old.accepted_at then raise exception 'CP acceptance cannot change';end if;
 if new.ended_at is not null then return new;end if;
 -- All supported writers lock both participants in canonical order.
 perform 1 from public.profiles where id in(new.user_a,new.user_b) order by id for update;
 if not exists(select 1 from public.cp_types where id=new.type_id and enabled)then raise exception 'CP type not available';end if;
 if exists(select 1 from public.user_blocks where (blocker_id=new.user_a and blocked_id=new.user_b)or(blocker_id=new.user_b and blocked_id=new.user_a))then raise exception 'user is blocked';end if;
 if exists(select 1 from public.couples where id<>new.id and user_a=new.user_a and user_b=new.user_b and ended_at is null and accepted_at is not null)then raise exception 'pair already linked';end if;
 if exists(select 1 from private.cp_slots s where s.couple_id<>new.id and s.user_id in(new.user_a,new.user_b) and (s.type_id=new.type_id or exists(select 1 from private.cp_type_conflicts f where f.type_a=least(s.type_id,new.type_id)and f.type_b=greatest(s.type_id,new.type_id))))then raise exception 'partner already linked for CP type';end if;
 return new;
end$$;
create function private.sync_cp_slots() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from private.cp_slots where couple_id=new.id;
 if new.ended_at is null and new.accepted_at is not null then
  insert into private.cp_slots(user_id,type_id,couple_id)values(new.user_a,new.type_id,new.id),(new.user_b,new.type_id,new.id);
 end if;return new;
end$$;
revoke all on function private.guard_cp(),private.sync_cp_slots() from public,anon,authenticated;
create trigger guard_cp before insert or update on public.couples for each row execute function private.guard_cp();
create trigger sync_cp_slots after insert or update on public.couples for each row execute function private.sync_cp_slots();
create function private.cp_action(p_public_id bigint,p_action text,p_type_id text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t uuid;r public.couples%rowtype;label text;
begin
 if u is null then raise exception 'authentication required';end if;
 select id into t from public.profiles where public_id=p_public_id;
 if t is null or t=u then raise exception 'invalid target';end if;
 perform 1 from public.profiles where id in(u,t) order by id for update;
 select * into r from public.couples where user_a=least(u,t) and user_b=greatest(u,t) and type_id=p_type_id and ended_at is null order by created_at desc limit 1;
 if p_action='request' then
  select c.label into label from public.cp_types c where id=p_type_id and enabled;
  if label is null then raise exception 'CP type not available';end if;
  if r.id is not null then return;end if;
  if(select count(*)from public.couples where requested_by=u and ended_at is null and accepted_at is null)>=5 then raise exception 'couple request limit reached';end if;
  insert into public.couples(user_a,user_b,requested_by,type_id)values(least(u,t),greatest(u,t),u,p_type_id);
  insert into public.user_notifications(user_id,type,title,description,actor_public_id)select t,'system','طلب '||label,display_name,public_id from public.profiles where id=u;
 elsif p_action='accept' then
  if r.id is null or r.requested_by=u or r.accepted_at is not null then raise exception 'incoming request required';end if;
  update public.couples set accepted_at=clock_timestamp()where id=r.id;
  -- Cancel only incompatible requests; different types with different partners stay possible.
  update public.couples c set ended_at=clock_timestamp()where c.id<>r.id and c.ended_at is null and c.accepted_at is null and
  ((c.user_a=r.user_a and c.user_b=r.user_b) or
   ((u in(c.user_a,c.user_b)or t in(c.user_a,c.user_b))and(c.type_id=p_type_id or exists(select 1 from private.cp_type_conflicts f where f.type_a=least(c.type_id,p_type_id)and f.type_b=greatest(c.type_id,p_type_id)))));
 elsif p_action in('reject','end') then
  if r.id is null then return;end if;
  if p_action='reject' and r.accepted_at is not null then raise exception 'incoming request required';end if;
  update public.couples set ended_at=clock_timestamp()where id=r.id;
 else raise exception 'invalid couple action';end if;
end$$;
create function public.cp_action(p_public_id bigint,p_action text,p_type_id text)returns void language sql security invoker set search_path='' as $$select private.cp_action(p_public_id,p_action,p_type_id)$$;
create or replace function private.couple_action(p_public_id bigint,p_action text)returns void language sql security invoker set search_path='' as $$select private.cp_action(p_public_id,p_action,'love')$$;
revoke all on function private.cp_action(bigint,text,text),public.cp_action(bigint,text,text)from public,anon;
grant execute on function private.cp_action(bigint,text,text),public.cp_action(bigint,text,text)to authenticated;
-- Keep legacy profile card, rankings and rewards scoped to their original type.
do $$declare def text;begin
 select pg_get_functiondef('private.couple_rankings(date)'::regprocedure)into def;
 def:=replace(def,'where c.accepted_at is not null','where c.type_id=''love'' and c.accepted_at is not null');execute def;
 select pg_get_functiondef('private.couple_state()'::regprocedure)into def;
 def:=replace(def,'where u in(c.user_a,c.user_b)','where c.type_id=''love'' and u in(c.user_a,c.user_b)');execute def;
 select pg_get_functiondef('private.profile_cp(bigint)'::regprocedure)into def;
 def:=replace(def,'where target in(user_a,user_b)','where type_id=''love'' and target in(user_a,user_b)');execute def;
end$$;
-- Explicit gift eligibility: no guessed price thresholds or preselected large gifts.
alter table public.gift_catalog add column global_announcement_enabled boolean not null default false;
create table public.global_gift_announcements (
 id uuid primary key references public.room_gift_feed(id)on delete cascade,
 room_id uuid not null references public.rooms(id)on delete cascade,
 gift_id text not null,gift_name text not null,
 sender_name text not null,recipient_name text not null,
 created_at timestamptz not null default clock_timestamp()
);
create index global_gift_announcements_recent on public.global_gift_announcements(created_at);
create index global_gift_announcements_room on public.global_gift_announcements(room_id);
alter table public.global_gift_announcements enable row level security;
revoke all on public.global_gift_announcements from public,anon,authenticated;
grant select on public.global_gift_announcements to authenticated;
create function private.gift_announcement_visible(p_room_id uuid)returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid()is not null and exists(select 1 from public.rooms r where r.id=p_room_id and r.is_active and not r.is_private
 and(not r.is_vip or r.owner_id=auth.uid()or(select level from private.vip_entitlement(auth.uid()))>0)
 and not exists(select 1 from public.room_bans b where b.room_id=r.id and b.user_id=auth.uid()and(b.expires_at is null or b.expires_at>now())));
$$;
revoke all on function private.gift_announcement_visible(uuid)from public,anon;
grant execute on function private.gift_announcement_visible(uuid)to authenticated;
create policy global_gifts_visible on public.global_gift_announcements for select to authenticated using(created_at>now()-interval '20 seconds'and private.gift_announcement_visible(room_id));
create function private.announce_large_gift()returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.global_gift_announcements(id,room_id,gift_id,gift_name,sender_name,recipient_name)
 select new.id,new.room_id,new.gift_id,new.gift_name,new.sender_name,new.recipient_name
 from public.gift_catalog g join public.rooms r on r.id=new.room_id
 where g.id=new.gift_id and g.is_active and g.global_announcement_enabled and r.is_active and not r.is_private;
 return new;
end$$;
revoke all on function private.announce_large_gift()from public,anon,authenticated;
create trigger announce_large_gift after insert on public.room_gift_feed for each row execute function private.announce_large_gift();
alter publication supabase_realtime add table public.global_gift_announcements;
notify pgrst,'reload schema';
-- Typed read endpoint for future CP screens; legacy couple_state stays unchanged.
create function private.cp_state()returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();begin
 if u is null then raise exception 'authentication required';end if;
 return jsonb_build_object('types',(select coalesce(jsonb_agg(to_jsonb(t)order by t.id),'[]'::jsonb)from public.cp_types t where enabled),
 'relations',(select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('type_label',t.label,'partner',private.public_profile(case when c.user_a=u then c.user_b else c.user_a end))order by c.created_at desc),'[]'::jsonb)from public.couples c join public.cp_types t on t.id=c.type_id where u in(c.user_a,c.user_b)and c.ended_at is null));
end$$;
create function public.cp_state()returns jsonb language sql security invoker set search_path='' as $$select private.cp_state()$$;
revoke all on function private.cp_state(),public.cp_state()from public,anon;
grant execute on function private.cp_state(),public.cp_state()to authenticated;
notify pgrst,'reload schema';
