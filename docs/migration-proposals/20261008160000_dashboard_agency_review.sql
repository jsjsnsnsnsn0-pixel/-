-- Owner/staff agency review: writes real agencies, membership, private documents, notifications.
-- Existing applications, identity keys, wallet and monthly settlement data are preserved.
alter table public.agency_registrations
 drop constraint agency_registrations_status_check;
alter table public.agency_registrations
 add constraint agency_registrations_status_check
 check(status in('pending','approved','rejected','changes_requested'));

create policy agency_documents_for_beta_review on storage.objects
for select to authenticated using(
 bucket_id='agency-review' and
 private.dashboard_has_permission((select auth.uid()),'agencies.view')
);
create function public.dashboard_agency_review(
 p_application_id uuid,p_action text,p_note text default ''
) returns jsonb language plpgsql security definer set search_path='' as $$
declare reg public.agency_registrations%rowtype;ag_id bigint;next_status text;
begin
 if p_action not in('approve','reject','request_changes') then raise exception 'invalid review action';end if;
 perform private.dashboard_require(case when p_action='approve' then 'agencies.approve' else 'agencies.reject' end);
 if p_application_id is null then raise exception 'application required';end if;
 if p_action<>'approve' and length(btrim(coalesce(p_note,'')))<5 then
  raise exception 'review note is required for rejection or corrections';end if;
 select * into reg from public.agency_registrations where id=p_application_id for update;
 if not found then raise exception 'agency application not found';end if;
 next_status:=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'changes_requested' end;
 if reg.status=next_status then
  return jsonb_build_object('id',reg.id,'status',reg.status,'already_processed',true);
 end if;
 if reg.status<>'pending' then raise exception 'application already reviewed';end if;
 if p_action='approve' then
  perform 1 from public.profiles where id=reg.applicant_id for update;
  if not found then raise exception 'applicant unavailable';end if;
  if exists(select 1 from public.agency_members where user_id=reg.applicant_id)
    or exists(select 1 from public.agencies where owner_id=reg.applicant_id)
  then raise exception 'applicant already has an agency';end if;
  insert into public.agencies(owner_id,name) values(reg.applicant_id,reg.agency_name) returning id into ag_id;
  insert into public.agency_members(user_id,agency_id,joined_at)
    values(reg.applicant_id,ag_id,now());
 end if;
 update public.agency_registrations set status=next_status,review_note=nullif(btrim(coalesce(p_note,'')),''),
  reviewed_by=auth.uid(),reviewed_at=now() where id=reg.id;
 insert into public.user_notifications(user_id,type,title,description) values(
  reg.applicant_id,'system','تحديث طلب الوكالة',
  case p_action when 'approve' then 'تم قبول طلب الوكالة وإضافة العضوية بنجاح.'
   when 'reject' then 'تم رفض طلب الوكالة. راجع الملاحظات وأعد التقديم عند الحاجة.'
   else 'يحتاج طلب الوكالة إلى تعديلات. يمكنك إعادة تقديم البيانات.'end);
 insert into public.dashboard_audit(actor_id,action,target_id,metadata)
 values(auth.uid(),'agency.'||p_action,reg.applicant_id,
  jsonb_build_object('application',reg.id,'public_id',reg.applicant_public_id,'agency_id',ag_id,'note',left(coalesce(p_note,''),500)));
 return jsonb_build_object('id',reg.id,'status',next_status,'agency_id',ag_id,'already_processed',false);
end $$;
revoke all on function public.dashboard_agency_review(uuid,text,text) from public,anon;
grant execute on function public.dashboard_agency_review(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
