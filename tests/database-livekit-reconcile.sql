-- Queue, HMAC and role regression. Fixtures and pg_net requests roll back.
begin;
do $$
declare rid uuid:=gen_random_uuid(); uid uuid:=gen_random_uuid(); rev bigint; newer bigint; stamp bigint; sig text;
begin
 if has_function_privilege('authenticated','public.pending_livekit_reconcile()','execute') or has_function_privilege('anon','public.authorize_livekit_reconcile(text,bigint)','execute') or has_function_privilege('authenticated','public.ack_livekit_reconcile(uuid,bigint)','execute') then raise exception 'client may access server queue'; end if;
 if has_function_privilege('authenticated','private.enqueue_livekit_reconcile(uuid,uuid)','execute') or has_table_privilege('authenticated','private.livekit_reconcile_queue','select') then raise exception 'client may mutate/read queue'; end if;
 if private.authorize_livekit_reconcile(repeat('0',64),floor(extract(epoch from now()))::bigint) then raise exception 'forged signature accepted'; end if;
 stamp:=floor(extract(epoch from now()))::bigint;
 select encode(extensions.hmac(stamp::text,decrypted_secret,'sha256'),'hex') into sig from vault.decrypted_secrets where name='totichat_livekit_reconcile_hmac';
 if private.authorize_livekit_reconcile(sig,stamp) is distinct from true then raise exception 'valid signature rejected'; end if;
 if private.authorize_livekit_reconcile(sig,stamp-180) then raise exception 'expired signature accepted'; end if;
 perform private.enqueue_livekit_reconcile(rid,uid);
 select revision into rev from private.livekit_reconcile_queue where room_id=rid;
 perform private.enqueue_livekit_reconcile(rid,uid);
 select revision into newer from private.livekit_reconcile_queue where room_id=rid;
 if newer<=rev then raise exception 'revision did not advance'; end if;
 if (select cardinality(identities) from private.livekit_reconcile_queue where room_id=rid)<>1 then raise exception 'identities duplicated'; end if;
 perform private.ack_livekit_reconcile(rid,rev);
 if not exists(select 1 from private.livekit_reconcile_queue where room_id=rid) then raise exception 'stale ack lost new event'; end if;
 perform private.ack_livekit_reconcile(rid,newer);
 if exists(select 1 from private.livekit_reconcile_queue where room_id=rid) then raise exception 'latest ack failed'; end if;
 perform private.enqueue_livekit_reconcile(rid,null);
 perform private.enqueue_livekit_reconcile(rid,null);
 if (select identities from private.livekit_reconcile_queue where room_id=rid) is null then raise exception 'empty identities became null'; end if;
 if (select revision from private.livekit_reconcile_queue where room_id=rid)<=newer then raise exception 'recreated revision can match stale ack'; end if;
 if (select count(*) from pg_trigger where tgname in ('room_members_audio_reconcile','room_bans_audio_reconcile','rooms_audio_reconcile') and not tgisinternal)<>3 then raise exception 'database event trigger missing'; end if;
end $$;
rollback;
select 'PASS: backend-only queue, HMAC authorization, stale acknowledgements, unique monotonic revisions and event triggers; fixtures rolled back' as regression;
