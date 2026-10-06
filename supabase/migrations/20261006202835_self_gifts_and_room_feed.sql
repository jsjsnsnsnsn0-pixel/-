-- Self gifts charge Coins; rewards remain pending until the owner's deferred rules are set.
-- Ordinary gift accounting is unchanged.
create table private.self_gift_events(request_id uuid primary key,user_id uuid not null references public.profiles(id),room_id uuid not null references public.rooms(id),gift_id text not null references public.gift_catalog(id),amount bigint not null check(amount>0),rewards_status text not null default 'pending' check(rewards_status='pending'),created_at timestamptz not null default now());
alter table private.self_gift_events enable row level security;
create policy self_gift_internal_access on private.self_gift_events to authenticated using(false)with check(false);
revoke all on private.self_gift_events from public,anon,authenticated;
create table public.room_gift_feed(id uuid primary key default gen_random_uuid(),room_id uuid not null references public.rooms(id) on delete cascade,sender_public_id bigint not null,sender_name text not null,sender_avatar text,recipient_public_id bigint not null,recipient_name text not null,recipient_avatar text,gift_id text not null,gift_name text not null,amount bigint not null,created_at timestamptz not null default now());
create index room_gift_feed_room_created on public.room_gift_feed(room_id,created_at);
alter table public.room_gift_feed enable row level security;
create policy gift_feed_room_members on public.room_gift_feed for select to authenticated using(private.room_access_allowed(room_id));
grant select on public.room_gift_feed to authenticated;
revoke insert,update,delete on public.room_gift_feed from anon,authenticated;
create function private.gift_to_room_feed()returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.room_gift_feed(room_id,sender_public_id,sender_name,sender_avatar,recipient_public_id,recipient_name,recipient_avatar,gift_id,gift_name,amount) select new.room_id,s.public_id,s.display_name,s.avatar_url,r.public_id,r.display_name,r.avatar_url,g.id,g.name,new.amount from public.profiles s,public.profiles r,public.gift_catalog g where s.id=new.sender_id and r.id=new.recipient_id and g.id=new.gift_id;
 return new;end$$;
revoke all on function private.gift_to_room_feed()from public,anon,authenticated;
create trigger gift_to_room_feed after insert on public.gift_events for each row execute function private.gift_to_room_feed();
create function private.send_self_room_gift(p_room_id uuid,p_gift_id text,p_request_id uuid)returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); cost bigint; existing private.self_gift_events%rowtype;profile public.profiles%rowtype;begin
 if actor is null then raise exception 'authentication required';end if;
 if p_request_id is null then raise exception 'request id required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select *into existing from private.self_gift_events where request_id=p_request_id;
 if found then if existing.user_id<>actor or existing.room_id<>p_room_id or existing.gift_id<>p_gift_id then raise exception 'request id already used';end if;return;end if;
 if exists(select 1 from public.gift_events where request_id=p_request_id)then raise exception 'request id already used';end if;
 if not private.room_access_allowed(p_room_id)then raise exception 'room membership expired';end if;
 select price into cost from public.gift_catalog where id=p_gift_id and is_active for share;
 if cost is null or cost<=0 then raise exception 'gift not available';end if;
 update public.profiles set gold=gold-cost,updated_at=now()where id=actor and gold>=cost returning *into profile;
 if not found then raise exception 'insufficient gold';end if;
 insert into private.self_gift_events(request_id,user_id,room_id,gift_id,amount)values(p_request_id,actor,p_room_id,p_gift_id,cost);
 insert into public.wallet_transactions(user_id,transaction_type,gold_delta,diamond_delta)values(actor,'gift_sent',-cost,0);
 insert into public.room_gift_feed(room_id,sender_public_id,sender_name,sender_avatar,recipient_public_id,recipient_name,recipient_avatar,gift_id,gift_name,amount) select p_room_id,profile.public_id,profile.display_name,profile.avatar_url,profile.public_id,profile.display_name,profile.avatar_url,id,name,cost from public.gift_catalog where id=p_gift_id;
end$$;
create function public.send_self_room_gift(p_room_id uuid,p_gift_id text,p_request_id uuid)returns void language sql security invoker set search_path='' as $$select private.send_self_room_gift(p_room_id,p_gift_id,p_request_id)$$;
revoke all on function private.send_self_room_gift(uuid,text,uuid),public.send_self_room_gift(uuid,text,uuid)from public,anon;
grant execute on function private.send_self_room_gift(uuid,text,uuid),public.send_self_room_gift(uuid,text,uuid)to authenticated;
alter publication supabase_realtime add table public.room_gift_feed;
notify pgrst,'reload schema';

-- A request identifier cannot be reused across normal and self gift endpoints.
do $$declare def text;begin
 select pg_get_functiondef('private.send_room_gift(uuid,bigint,text,uuid)'::regprocedure)into def;
 def:=replace(def,'select * into existing from public.gift_events', 'if exists(select 1 from private.self_gift_events where request_id=p_request_id)then raise exception ''request id already used'';end if;'||chr(10)||' select * into existing from public.gift_events');
 execute def;
end$$;
