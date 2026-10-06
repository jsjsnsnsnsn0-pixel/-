alter table public.room_members add column last_seen_at timestamptz not null default now();
alter table public.room_members add column member_equipment jsonb not null default '{}'::jsonb;
alter table public.room_members alter column is_muted set default true;
create index room_members_heartbeat_idx on public.room_members(last_seen_at);
create function private.fill_room_equipment()returns trigger language plpgsql security definer set search_path='' as $$declare p jsonb;begin
 p:=private.public_profile(new.user_id);new.member_equipment:=coalesce(p->'equipment','{}'::jsonb);new.member_vip_level:=coalesce((p->>'vip_level')::integer,0);return new;
end$$;
revoke all on function private.fill_room_equipment()from public,anon,authenticated;
create trigger zzzz_fill_room_equipment before insert or update on public.room_members for each row execute function private.fill_room_equipment();
create function private.sync_room_profile()returns trigger language plpgsql security definer set search_path='' as $$begin
 update public.room_members set member_display_name=new.display_name,member_avatar_url=new.avatar_url,member_username=new.username,member_level=new.level where user_id=new.id;
 update public.rooms set owner_display_name=new.display_name,owner_avatar_url=new.avatar_url where owner_id=new.id;
 return new;
end$$;
revoke all on function private.sync_room_profile()from public,anon,authenticated;
create trigger profile_sync_rooms after update on public.profiles for each row execute function private.sync_room_profile();
create or replace function private.touch_presence()returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 update public.profiles set last_seen_at=now() where id=auth.uid()and(last_seen_at is null or last_seen_at<now()-interval '1 minute');
 delete from public.room_members where last_seen_at<now()-interval '3 minutes';
end$$;
create function private.room_heartbeat(p_room_id uuid)returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 update public.room_members set last_seen_at=now()where room_id=p_room_id and user_id=auth.uid();
end$$;
create function public.room_heartbeat(p_room_id uuid)returns void language sql security invoker set search_path='' as $$select private.room_heartbeat(p_room_id)$$;
revoke all on function private.room_heartbeat(uuid),public.room_heartbeat(uuid)from public,anon;
grant execute on function private.room_heartbeat(uuid),public.room_heartbeat(uuid)to authenticated;
create or replace function private.leave_room(p_room_id uuid)returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 delete from public.room_members where room_id=p_room_id and user_id=auth.uid();
end$$;
create function private.financial_notification()returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.user_notifications(user_id,type,title,description)values(new.user_id,case when new.transaction_type='gift_received'then 'gift'else 'system'end,
 case new.transaction_type when 'recharge'then 'تم اعتماد الشحن'when 'gift_received'then 'وصلتك هدية'when 'gift_sent'then 'تم إرسال الهدية'when 'daily_reward'then 'تم استلام الصندوق اليومي'when 'task_reward'then 'تم اعتماد المكافأة'when 'diamond_conversion'then 'تم تحويل الألماس'else 'تم تحديث المحفظة'end,
 new.gold_delta||' ذهب · '||new.diamond_delta||' ألماس · '||new.silver_delta||' فضة');return new;
end$$;
revoke all on function private.financial_notification()from public,anon,authenticated;
create trigger notify_financial_change after insert on public.wallet_transactions for each row execute function private.financial_notification();
create function private.notify_profile_visit()returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.user_notifications(user_id,type,title,description,actor_public_id)select new.profile_id,'visitor','زائر جديد',display_name,public_id from public.profiles where id=new.visitor_id;return new;
end$$;
revoke all on function private.notify_profile_visit()from public,anon,authenticated;
create trigger notify_profile_visit after insert on public.profile_visits for each row execute function private.notify_profile_visit();
notify pgrst,'reload schema';

create function private.end_blocked_couples()returns trigger language plpgsql security definer set search_path='' as $$begin
 update public.couples set ended_at=clock_timestamp()where ended_at is null and user_a=least(new.blocker_id,new.blocked_id)and user_b=greatest(new.blocker_id,new.blocked_id);return new;
end$$;
revoke all on function private.end_blocked_couples()from public,anon,authenticated;
create trigger end_blocked_couples after insert on public.user_blocks for each row execute function private.end_blocked_couples();

