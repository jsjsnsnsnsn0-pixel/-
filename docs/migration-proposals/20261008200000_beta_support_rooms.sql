-- Beta moderation and support: server permissions, bounded queries, full audit history.
insert into public.dashboard_permissions(id,label)values('reports.manage','Reports / Manage')
on conflict(id) do nothing;

create function public.dashboard_support_tickets() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare response jsonb;
begin
 perform private.dashboard_require('reports.view');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into response from(
  select t.id,t.category,t.message,t.status,t.response,t.created_at,t.updated_at,
     p.public_id,p.display_name
  from public.support_tickets t join public.profiles p on p.id=t.user_id
  order by case when t.status='open' then 0 when t.status='answered' then 1 else 2 end,
    t.created_at desc limit 100
 ) t;
 return response;
end $$;
create function public.dashboard_reply_support_ticket(p_ticket_id uuid,p_reply text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ticket public.support_tickets%rowtype;
begin
 perform private.dashboard_require('reports.manage');
 if p_ticket_id is null or length(btrim(coalesce(p_reply,''))) not between 5 and 1000
 then raise exception 'valid ticket and reply are required';end if;
 select * into ticket from public.support_tickets where id=p_ticket_id for update;
 if not found then raise exception 'support request not found';end if;
 if ticket.status='closed' then raise exception 'closed request cannot be changed';end if;
 if ticket.status='answered' and ticket.response=btrim(p_reply)
 then return jsonb_build_object('id',ticket.id,'status',ticket.status,'already_processed',true);
 end if;
 update public.support_tickets set response=btrim(p_reply),status='answered',updated_at=now()
 where id=ticket.id;
 insert into public.user_notifications(user_id,type,title,description)values(
  ticket.user_id,'system','رد الدعم الفني على طلبك','تم الرد على تذكرتك، راجع مركز المساعدة لقراءة الرد.');
 insert into public.dashboard_audit(actor_id,action,target_id,metadata)values(
  auth.uid(),'support.reply',ticket.user_id,
  jsonb_build_object('ticket_id',ticket.id,'category',ticket.category));
 return jsonb_build_object('id',ticket.id,'status','answered','already_processed',false);
end $$;

create function public.dashboard_rooms() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare response jsonb;
begin
 perform private.dashboard_require('rooms.view');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into response from(
  select r.id,r.name,r.is_active,r.is_private,r.max_seats,r.created_at,r.owner_public_id,
    coalesce(r.owner_display_name,p.display_name) owner_name,
    (select count(*) from public.room_members m
      where m.room_id=r.id and m.last_seen_at>now()-interval '3 minutes') as members,
    (select count(*) from public.room_members m
      where m.room_id=r.id and m.seat_number is not null and not m.is_muted
        and m.last_seen_at>now()-interval '3 minutes') as active_mics,
    (select count(*) from public.room_moderation_log ml where ml.room_id=r.id) moderation_actions
  from public.rooms r left join public.profiles p on p.id=r.owner_id
  order by r.is_active desc,r.created_at desc limit 100
 ) t;
 return response;
end $$;
create function public.dashboard_close_room(p_room_id uuid,p_reason text)returns jsonb
language plpgsql security definer set search_path='' as $$
declare room public.rooms%rowtype;
begin
 perform private.dashboard_require('rooms.close');
 if p_room_id is null or length(btrim(coalesce(p_reason,''))) not between 10 and 300
 then raise exception 'room and reason are required';end if;
 select * into room from public.rooms where id=p_room_id for update;
 if not found then raise exception 'room does not exist';end if;
 if not room.is_active then
  return jsonb_build_object('room_id',p_room_id,'closed',true,'already_closed',true);
 end if;
 update public.rooms set is_active=false,updated_at=now() where id=room.id;
 insert into public.room_moderation_log(room_id,actor_id,target_id,action,details)
 values(room.id,auth.uid(),room.owner_id,'room_closed',
  jsonb_build_object('reason',btrim(p_reason),'by_dashboard',true));
 insert into public.dashboard_audit(actor_id,action,target_id,metadata)
 values(auth.uid(),'rooms.close',room.owner_id,
  jsonb_build_object('room_id',room.id,'reason',btrim(p_reason)));
 insert into public.user_notifications(user_id,type,title,description,room_id)
 values(room.owner_id,'system','تم إغلاق غرفتك',
  'تم إغلاق الغرفة بقرار إداري. راجع مركز المساعدة للاستفسار.',room.id);
 return jsonb_build_object('room_id',room.id,'closed',true,'already_closed',false);
end $$;
do $$declare routine text;begin
 foreach routine in array array[
  'dashboard_support_tickets()','dashboard_reply_support_ticket(uuid,text)',
  'dashboard_rooms()','dashboard_close_room(uuid,text)'
 ] loop
  execute format('revoke all on function public.%s from public,anon',routine);
  execute format('grant execute on function public.%s to authenticated',routine);
 end loop;
end $$;
notify pgrst,'reload schema';
