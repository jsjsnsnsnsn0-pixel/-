-- Registration applications are separate from host membership requests.
create table public.agency_registrations (
 id uuid primary key,
 applicant_id uuid not null references public.profiles(id) on delete cascade,
 applicant_public_id bigint not null,
 agency_name text not null check(char_length(btrim(agency_name)) between 3 and 80),
 country_code text not null check(country_code ~ '^[A-Z]{2}$'),
 agent_number text not null check(char_length(btrim(agent_number)) between 1 and 40),
 full_name text not null check(char_length(btrim(full_name)) between 5 and 150),
 logo_path text not null, identity_path text not null, portrait_path text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 submitted_at timestamptz not null default now(), reviewed_at timestamptz,
 reviewed_by uuid references public.profiles(id), review_note text
);
create unique index agency_registration_one_pending on public.agency_registrations(applicant_id) where status='pending';
create index agency_registration_review_queue on public.agency_registrations(status,submitted_at);
alter table public.agency_registrations enable row level security;
revoke all on public.agency_registrations from anon,authenticated;
grant select on public.agency_registrations to authenticated;
create policy agency_registration_private_read on public.agency_registrations for select to authenticated
 using(applicant_id=(select auth.uid()) or (select public.is_admin_role('admin')));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('agency-review','agency-review',false,5242880,array['image/jpeg','image/png','image/webp']);
-- Upload-only staging. Submitted documents are immutable to applicants.
create policy agency_review_upload on storage.objects for insert to authenticated with check(
 bucket_id='agency-review' and (storage.foldername(name))[1]=(select auth.uid())::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/(logo|identity|portrait)-[0-9a-f-]{36}\.(jpg|png|webp)$'
 and not exists(select 1 from public.agency_members where user_id=(select auth.uid()))
 and not exists(select 1 from public.agency_registrations where applicant_id=(select auth.uid()) and (status='pending' or id::text=(storage.foldername(name))[2]))
);
create policy agency_review_private_read on storage.objects for select to authenticated using(
 bucket_id='agency-review' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin_role('admin')))
);
-- No applicant UPDATE/DELETE policies and no public bucket: identity images
-- cannot leak through public profiles, room data or public agency details.

create function private.agency_registration_state() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); result jsonb; begin
 if u is null then raise exception 'authentication required';end if;
 select jsonb_build_object('id',id,'status',status,'agency_name',agency_name,'submitted_at',submitted_at)into result
 from public.agency_registrations where applicant_id=u order by submitted_at desc limit 1;
 return jsonb_build_object('application',result,'can_apply',not exists(select 1 from public.agency_members where user_id=u) and not exists(select 1 from public.agency_registrations where applicant_id=u and status='pending'));
end $$;
create function private.submit_agency_registration(p_request_id uuid,p_agency_name text,p_country_code text,p_agent_number text,p_full_name text,p_logo_path text,p_identity_path text,p_portrait_path text) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); pid bigint; previous public.agency_registrations%rowtype; path text; kind text; i int; begin
 if u is null then raise exception 'authentication required';end if;
 select public_id into pid from public.profiles where id=u for update;
 if pid is null then raise exception 'authentication required';end if;
 select * into previous from public.agency_registrations where id=p_request_id;
 if previous.id is not null then
  if previous.applicant_id<>u then raise exception 'not authorized';end if;
  if previous.agency_name<>btrim(p_agency_name) or previous.country_code<>p_country_code or previous.agent_number<>btrim(p_agent_number) or previous.full_name<>btrim(p_full_name) or previous.logo_path<>p_logo_path or previous.identity_path<>p_identity_path or previous.portrait_path<>p_portrait_path then raise exception 'request id already used';end if;
  return jsonb_build_object('id',previous.id,'status',previous.status);
 end if;
 if exists(select 1 from public.agency_members where user_id=u)then raise exception 'already in agency';end if;
 if exists(select 1 from public.agency_registrations where applicant_id=u and status='pending')then raise exception 'agency registration pending';end if;
 if p_request_id is null or p_agency_name is null or char_length(btrim(p_agency_name))not between 3 and 80 or p_country_code is null or p_country_code not in ('AD','AE','AF','AG','AI','AL','AM','AO','AQ','AR','AS','AT','AU','AW','AX','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BL','BM','BN','BO','BQ','BR','BS','BT','BV','BW','BY','BZ','CA','CC','CD','CF','CG','CH','CI','CK','CL','CM','CN','CO','CR','CU','CV','CW','CX','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','EH','ER','ES','ET','FI','FJ','FK','FM','FO','FR','GA','GB','GD','GE','GF','GG','GH','GI','GL','GM','GN','GP','GQ','GR','GS','GT','GU','GW','GY','HK','HM','HN','HR','HT','HU','ID','IE','IL','IM','IN','IO','IQ','IR','IS','IT','JE','JM','JO','JP','KE','KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MF','MG','MH','MK','ML','MM','MN','MO','MP','MQ','MR','MS','MT','MU','MV','MW','MX','MY','MZ','NA','NC','NE','NF','NG','NI','NL','NO','NP','NR','NU','NZ','OM','PA','PE','PF','PG','PH','PK','PL','PM','PN','PR','PS','PT','PW','PY','QA','RE','RO','RS','RU','RW','SA','SB','SC','SD','SE','SG','SH','SI','SJ','SK','SL','SM','SN','SO','SR','SS','ST','SV','SX','SY','SZ','TC','TD','TF','TG','TH','TJ','TK','TL','TM','TN','TO','TR','TT','TV','TW','TZ','UA','UG','UM','US','UY','UZ','VA','VC','VE','VG','VI','VN','VU','WF','WS','YE','YT','ZA','ZM','ZW') or p_agent_number is null or char_length(btrim(p_agent_number))not between 1 and 40 or p_full_name is null or char_length(btrim(p_full_name))not between 5 and 150 or cardinality(regexp_split_to_array(btrim(p_full_name),'\s+'))<3 then raise exception 'invalid agency application';end if;
 for i in 1..3 loop
  path:=(array[p_logo_path,p_identity_path,p_portrait_path])[i];kind:=(array['logo','identity','portrait'])[i];
  if path is null or path !~ ('^'||u::text||'/'||p_request_id::text||'/'||kind||'-[0-9a-f-]{36}\.(jpg|png|webp)$') or not exists(select 1 from storage.objects where bucket_id='agency-review' and name=path and owner_id=u::text and metadata->>'mimetype' in('image/jpeg','image/png','image/webp') and (metadata->>'size')::bigint between 1 and 5242880)then raise exception 'agency documents required';end if;
 end loop;
 insert into public.agency_registrations(id,applicant_id,applicant_public_id,agency_name,country_code,agent_number,full_name,logo_path,identity_path,portrait_path)
 values(p_request_id,u,pid,btrim(p_agency_name),p_country_code,btrim(p_agent_number),btrim(p_full_name),p_logo_path,p_identity_path,p_portrait_path);
 return jsonb_build_object('id',p_request_id,'status','pending');
end $$;
create function public.agency_registration_state() returns jsonb language sql stable security invoker set search_path='' as $$select private.agency_registration_state()$$;
create function public.submit_agency_registration(p_request_id uuid,p_agency_name text,p_country_code text,p_agent_number text,p_full_name text,p_logo_path text,p_identity_path text,p_portrait_path text) returns jsonb language sql security invoker set search_path='' as $$select private.submit_agency_registration(p_request_id,p_agency_name,p_country_code,p_agent_number,p_full_name,p_logo_path,p_identity_path,p_portrait_path)$$;
revoke all on function private.agency_registration_state(),public.agency_registration_state(),private.submit_agency_registration(uuid,text,text,text,text,text,text,text),public.submit_agency_registration(uuid,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function private.agency_registration_state(),public.agency_registration_state(),private.submit_agency_registration(uuid,text,text,text,text,text,text,text),public.submit_agency_registration(uuid,text,text,text,text,text,text,text) to authenticated;

-- Safe public directory: no applicant documents or owner UUIDs.
create function private.agency_directory() returns jsonb language plpgsql stable security definer set search_path='' as $$begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'logo_url',a.logo_url,'owner_name',p.display_name,'members_count',(select count(*)from public.agency_members m where m.agency_id=a.id),'requested',exists(select 1 from public.agency_applications r where r.agency_id=a.id and r.user_id=auth.uid()))order by a.name,a.id)from public.agencies a join public.profiles p on p.id=a.owner_id),'[]'::jsonb);
end $$;
create function public.agency_directory() returns jsonb language sql stable security invoker set search_path='' as $$select private.agency_directory()$$;
revoke all on function private.agency_directory(),public.agency_directory() from public,anon,authenticated;
grant execute on function private.agency_directory(),public.agency_directory() to authenticated;

-- An uncertain host retry must succeed even when its first request reached the limit.
create or replace function private.agency_action(p_agency_id bigint,p_action text,p_target_public_id bigint default null)returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();t uuid;owner uuid;begin
 if u is null then raise exception 'authentication required';end if;
 select owner_id into owner from public.agencies where id=p_agency_id;
 if owner is null then raise exception 'agency not found';end if;
 if p_action='request'then
  perform 1 from public.profiles where id=u for update;
  if exists(select 1 from public.agency_members where user_id=u)then raise exception 'user already belongs to an agency';end if;
  if exists(select 1 from public.agency_applications where agency_id=p_agency_id and user_id=u)then return;end if;
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

create or replace function private.agency_detail(p_agency_id bigint) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.agencies%rowtype; member boolean; begin
 if u is null then raise exception 'authentication required';end if;
 select * into a from public.agencies where id=p_agency_id;
 if a.id is null then raise exception 'agency not found';end if;
 member:=exists(select 1 from public.agency_members where user_id=u and agency_id=a.id);
 return jsonb_build_object('agency',jsonb_build_object('id',a.id,'name',a.name,'logo_url',a.logo_url),
 'is_member',member,'can_manage',a.owner_id=u,'can_leave',member and a.owner_id<>u,
 'has_pending_request',exists(select 1 from public.agency_applications where user_id=u and agency_id=a.id),
 'can_request',not exists(select 1 from public.agency_members where user_id=u) and not exists(select 1 from public.agency_applications where user_id=u and agency_id=a.id),
 'members',(select coalesce(jsonb_agg(private.public_profile(m.user_id) order by m.joined_at),'[]'::jsonb)from public.agency_members m where m.agency_id=a.id and not exists(select 1 from public.user_blocks b where(b.blocker_id=u and b.blocked_id=m.user_id)or(b.blocker_id=m.user_id and b.blocked_id=u))),
 'applications',case when a.owner_id=u then(select coalesce(jsonb_agg(private.public_profile(r.user_id)),'[]'::jsonb)from public.agency_applications r where r.agency_id=a.id)else '[]'::jsonb end);
end $$;
