-- Preserve owner/moderator/authentication checks inside private implementations.
-- Expose only SECURITY INVOKER entry points, with explicit execute privileges.
do $$
declare fn record; call_args text;
begin
 for fn in
  select p.proname,p.pronargs,p.proargnames,pg_get_function_identity_arguments(p.oid) as identity_args,
   pg_get_function_arguments(p.oid) as declaration_args,pg_get_function_result(p.oid) as result_type
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prosecdef and p.proname in ('close_room','reopen_room','update_room_settings','get_room_bans','get_room_management_members','play_fun_game')
 loop
  select string_agg(quote_ident(name),',' order by ordinal) into call_args
   from unnest(fn.proargnames) with ordinality args(name,ordinal) where ordinal<=fn.pronargs;
  execute format('alter function public.%I(%s) set schema private',fn.proname,fn.identity_args);
  -- Public tables win over temporary objects in privileged implementations.
  execute format('alter function private.%I(%s) set search_path to public,pg_temp',fn.proname,fn.identity_args);
  execute format('revoke all on function private.%I(%s) from public,anon',fn.proname,fn.identity_args);
  execute format('grant execute on function private.%I(%s) to authenticated,service_role',fn.proname,fn.identity_args);
  execute format('create function public.%I(%s) returns %s language sql security invoker set search_path='''' as %L',
   fn.proname,fn.declaration_args,fn.result_type,format('select * from private.%I(%s)',fn.proname,call_args));
  execute format('revoke all on function public.%I(%s) from public,anon',fn.proname,fn.identity_args);
  execute format('grant execute on function public.%I(%s) to authenticated,service_role',fn.proname,fn.identity_args);
 end loop;
end $$;

-- First cold-start request completed but exceeded the original 5-second delivery
-- timeout. Keep durable retries and allow 30 seconds for the HTTP response.
create or replace function private.dispatch_livekit_reconcile()
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
  timeout_milliseconds:=30000
 );
end $$;
revoke all on function private.dispatch_livekit_reconcile() from public,anon,authenticated,service_role;
