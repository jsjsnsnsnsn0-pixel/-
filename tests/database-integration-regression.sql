-- Validate existing official contact and client contracts, rolling back all fixtures.
begin;
do $$
declare
 actor uuid := gen_random_uuid(); actor_public_id bigint; pkg uuid; first_request record; second_request record;
 before_gold bigint; after_gold bigint; owner_uuid uuid; owner_count bigint; agent_count bigint;
begin
 select id into strict owner_uuid from public.profiles where public_id=451305 and display_name='TR72';
 select count(*) into owner_count from public.profiles where public_id=451305;
 select count(*) into agent_count from public.recharge_agents where display_name='TotiChat Official Recharge' and country_code='IQ' and is_active;
 if owner_count<>1 or agent_count<>1 then raise exception 'official identity is not unique'; end if;
 if not exists(select 1 from public.recharge_agents where user_id=owner_uuid and display_name='TotiChat Official Recharge' and country_code='IQ' and country_name='Iraq' and phone is null and contact_info->>'channel'='in_app' and contact_info->>'public_id'='451305') then
  raise exception 'existing official agent contact mismatch';
 end if;
 insert into auth.users(id,aud,role,email) values(actor,'authenticated','authenticated',actor::text||'@test.invalid');
 update public.profiles set country_code='IQ',country_name='Iraq' where id=actor;
 select gold,public_id into before_gold,actor_public_id from public.profiles where id=actor;
 select id into strict pkg from public.recharge_packages where is_active order by price_usd,id limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 perform set_config('role','authenticated',true);
 select * into strict first_request from public.create_recharge_request(pkg);
 select * into strict second_request from public.create_recharge_request(pkg);
 if first_request.request_id<>second_request.request_id then raise exception 'pending recharge is duplicated'; end if;
 if first_request.agent_display_name<>'TotiChat Official Recharge' or first_request.contact_info->>'channel'<>'in_app' or first_request.contact_info->>'public_id'<>'451305' or first_request.agent_phone is not null then
  raise exception 'recharge RPC contact contract mismatch';
 end if;
 if not exists(select 1 from public.search_public_profiles('451305',20) where public_id=451305 and display_name='TR72') then
  raise exception 'official profile is not searchable';
 end if;
 insert into public.direct_messages(recipient_public_id,content,message_type) values(451305,'Integration contact regression','text');
 if not exists(select 1 from public.direct_messages where sender_id=actor and recipient_id=owner_uuid and content='Integration contact regression') then raise exception 'official direct message recipient mismatch'; end if;
 select gold into after_gold from public.profiles where id=actor;
 if before_gold<>after_gold then raise exception 'pending recharge changed balance'; end if;
 perform set_config('role','postgres',true);
end $$;
rollback;
select 'PASS: existing owner/agent, real in-app contact, searchable profile, idempotent pending recharge, no premature credit; fixtures rolled back' as regression;
