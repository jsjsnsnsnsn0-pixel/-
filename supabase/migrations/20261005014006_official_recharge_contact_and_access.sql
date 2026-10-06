-- Contact details are explicitly public customer-service channels, never Auth phones.
comment on column public.recharge_agents.phone is 'Optional dedicated public customer-service phone. Never copy auth.users.phone here.';
comment on column public.recharge_agents.contact_info is 'Public contact JSON: channel=in_app, public_id=<TotiChat ID>, optional whatsapp and phone for dedicated customer-service numbers. Never store the account login phone.';
alter table public.recharge_agents add constraint recharge_agents_contact_object check (jsonb_typeof(contact_info)='object');

-- Requests are created only through the package/country/active-agent checked RPC.
revoke insert,update,delete on public.recharge_requests from anon,authenticated;
create policy recharge_requests_select_admin on public.recharge_requests for select to authenticated
using (public.is_admin_role('admin') or public.is_admin_role('agent_manager'));

-- Preserve each quote while deriving the in-app destination from the actual agent account.
create or replace function private.create_recharge_request(p_package_id uuid)
returns table(request_id uuid,package_id uuid,price_usd numeric,gold_amount bigint,agent_id uuid,agent_display_name text,agent_phone text,payment_methods jsonb,contact_info jsonb,country_code text,country_name text)
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();p public.profiles%rowtype;pkg public.recharge_packages%rowtype;a public.recharge_agents%rowtype;r uuid;agent_public_id bigint;
begin
 if u is null then raise exception 'authentication required';end if;
 select *into p from public.profiles where id=u;
 if p.country_code is null or p.country_code=''then raise exception 'user country is not set';end if;
 select *into pkg from public.recharge_packages where id=p_package_id and is_active for share;
 if not found then raise exception 'recharge package not found';end if;
 select ag.*into a from public.recharge_agents ag where ag.country_code=p.country_code and ag.is_active order by ag.created_at,ag.id limit 1 for share;
 if not found then raise exception 'no official recharge agent is configured for this country';end if;
 select public_id into agent_public_id from public.profiles where id=a.user_id;
 if agent_public_id is null then raise exception 'agent profile not available';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 select q.id into r from public.recharge_requests q where q.user_id=u and q.agent_id=a.id and q.package_id=pkg.id and q.status='pending'and q.price_usd=pkg.price_usd and q.gold_amount=pkg.gold_amount order by q.created_at desc limit 1;
 if r is null then
  insert into public.recharge_requests(user_id,agent_id,package_id,price_usd,gold_amount,status)
  values(u,a.id,pkg.id,pkg.price_usd,pkg.gold_amount,'pending')returning id into r;
 end if;
 return query select r,pkg.id,pkg.price_usd,pkg.gold_amount,a.id,a.display_name,a.phone,a.payment_methods,
  a.contact_info||jsonb_build_object('channel','in_app','public_id',agent_public_id::text),a.country_code,a.country_name;
end$$;
revoke all on function private.create_recharge_request(uuid)from public,anon;
grant execute on function private.create_recharge_request(uuid)to authenticated;

