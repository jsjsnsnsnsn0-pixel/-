-- Server-driven revocation. No LiveKit or Supabase API secret is stored in SQL.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema private to service_role;
create sequence private.livekit_reconcile_revision;
create table private.livekit_reconcile_queue (
 room_id uuid primary key,
 revision bigint not null default nextval('private.livekit_reconcile_revision'),
 identities uuid[] not null default '{}',
 updated_at timestamptz not null default now()
);
alter table private.livekit_reconcile_queue enable row level security;
revoke all on private.livekit_reconcile_queue from public,anon,authenticated;
revoke all on sequence private.livekit_reconcile_revision from public,anon,authenticated;

-- Secret generated on the server and encrypted at rest. It never leaves Vault.
do $$begin
 if not exists(select 1 from vault.secrets where name='totichat_livekit_reconcile_hmac') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'totichat_livekit_reconcile_hmac','Internal LiveKit reconciliation HMAC key');
 end if;
end $$;

create function private.authorize_livekit_reconcile(p_signature text,p_timestamp bigint)
returns boolean language sql security definer set search_path='' as $$
 select coalesce(abs(extract(epoch from now())-p_timestamp)<=120 and
  decode(p_signature,'hex')=extensions.hmac(p_timestamp::text,s.decrypted_secret,'sha256'),false)
 from vault.decrypted_secrets s where s.name='totichat_livekit_reconcile_hmac'
$$;
revoke all on function private.authorize_livekit_reconcile(text,bigint) from public,anon,authenticated;
grant execute on function private.authorize_livekit_reconcile(text,bigint) to service_role;
create function public.authorize_livekit_reconcile(p_signature text,p_timestamp bigint)
returns boolean language sql security invoker set search_path='' as $$select private.authorize_livekit_reconcile(p_signature,p_timestamp)$$;
revoke all on function public.authorize_livekit_reconcile(text,bigint) from public,anon,authenticated;
grant execute on function public.authorize_livekit_reconcile(text,bigint) to service_role;

create function private.pending_livekit_reconcile()
returns table(room_id uuid,revision bigint,identities uuid[]) language sql security definer set search_path='' as $$
 select q.room_id,q.revision,q.identities from private.livekit_reconcile_queue q order by q.updated_at limit 50
$$;
revoke all on function private.pending_livekit_reconcile() from public,anon,authenticated;
grant execute on function private.pending_livekit_reconcile() to service_role;
create function public.pending_livekit_reconcile()
returns table(room_id uuid,revision bigint,identities uuid[]) language sql security invoker set search_path='' as $$select * from private.pending_livekit_reconcile()$$;
revoke all on function public.pending_livekit_reconcile() from public,anon,authenticated;
grant execute on function public.pending_livekit_reconcile() to service_role;

create function private.ack_livekit_reconcile(p_room_id uuid,p_revision bigint)
returns void language sql security definer set search_path='' as $$delete from private.livekit_reconcile_queue where room_id=p_room_id and revision=p_revision$$;
revoke all on function private.ack_livekit_reconcile(uuid,bigint) from public,anon,authenticated;
grant execute on function private.ack_livekit_reconcile(uuid,bigint) to service_role;
create function public.ack_livekit_reconcile(p_room_id uuid,p_revision bigint)
returns void language sql security invoker set search_path='' as $$select private.ack_livekit_reconcile(p_room_id,p_revision)$$;
revoke all on function public.ack_livekit_reconcile(uuid,bigint) from public,anon,authenticated;
grant execute on function public.ack_livekit_reconcile(uuid,bigint) to service_role;

create function private.dispatch_livekit_reconcile()
returns void language plpgsql security definer set search_path='' as $$
declare signing_key text; stamp text;
begin
 if not exists(select 1 from private.livekit_reconcile_queue) then return; end if;
 select decrypted_secret into strict signing_key from vault.decrypted_secrets where name='totichat_livekit_reconcile_hmac';
 stamp:=floor(extract(epoch from now()))::bigint::text;
 perform net.http_post(
  url:='https://bfadhdnudmsggylunhlh.supabase.co/functions/v1/livekit-reconcile',
  body:='{}'::jsonb,
  headers:=jsonb_build_object('Content-Type','application/json','x-toti-timestamp',stamp,'x-toti-signature',encode(extensions.hmac(stamp,signing_key,'sha256'),'hex')),
  timeout_milliseconds:=5000
 );
end $$;
revoke all on function private.dispatch_livekit_reconcile() from public,anon,authenticated,service_role;

create function private.enqueue_livekit_reconcile(p_room_id uuid,p_user_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 insert into private.livekit_reconcile_queue(room_id,identities)
 values(p_room_id,case when p_user_id is null then '{}'::uuid[] else array[p_user_id] end)
 on conflict(room_id) do update set revision=nextval('private.livekit_reconcile_revision'),
  identities=coalesce((select array_agg(distinct identity) from unnest(private.livekit_reconcile_queue.identities||excluded.identities) identity),'{}'::uuid[]),updated_at=now();
 -- HTTP is queued by pg_net and only runs after transaction commit.
 -- Dispatch failures leave the durable queue for the scheduled retry.
 begin perform private.dispatch_livekit_reconcile(); exception when others then raise warning 'LiveKit dispatch deferred; durable queue retained'; end;
end $$;
revoke all on function private.enqueue_livekit_reconcile(uuid,uuid) from public,anon,authenticated,service_role;

create function private.room_audio_reconcile_event()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='room_members' then
  if tg_op='DELETE' then perform private.enqueue_livekit_reconcile(old.room_id,old.user_id);
  elsif tg_op='INSERT' then perform private.enqueue_livekit_reconcile(new.room_id,new.user_id);
  elsif old.seat_number is distinct from new.seat_number or old.is_muted is distinct from new.is_muted or old.user_id is distinct from new.user_id or old.room_id is distinct from new.room_id then
   perform private.enqueue_livekit_reconcile(new.room_id,new.user_id);
   if old.room_id is distinct from new.room_id or old.user_id is distinct from new.user_id then perform private.enqueue_livekit_reconcile(old.room_id,old.user_id); end if;
  end if;
 elsif tg_table_name='room_bans' then
  if tg_op='DELETE' then perform private.enqueue_livekit_reconcile(old.room_id,old.user_id);
  else perform private.enqueue_livekit_reconcile(new.room_id,new.user_id); end if;
 elsif tg_table_name='rooms' then
  if tg_op='DELETE' then perform private.enqueue_livekit_reconcile(old.id);
  elsif old.is_active is distinct from new.is_active then perform private.enqueue_livekit_reconcile(new.id); end if;
 end if;
 return null;
end $$;
revoke all on function private.room_audio_reconcile_event() from public,anon,authenticated,service_role;

create trigger room_members_audio_reconcile after insert or update or delete on public.room_members for each row execute function private.room_audio_reconcile_event();
create trigger room_bans_audio_reconcile after insert or update or delete on public.room_bans for each row execute function private.room_audio_reconcile_event();
create trigger rooms_audio_reconcile after update or delete on public.rooms for each row execute function private.room_audio_reconcile_event();

-- Run only when queue entries remain; idle minutes make no HTTP request.
select cron.schedule('totichat-livekit-reconcile-retry','* * * * *','select private.dispatch_livekit_reconcile()');
