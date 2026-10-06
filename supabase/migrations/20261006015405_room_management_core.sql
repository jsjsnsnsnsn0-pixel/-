alter table public.rooms add column if not exists chat_enabled boolean not null default true;
alter table public.rooms add column if not exists welcome_message text not null default '';
alter table public.rooms add column if not exists external_image_url text;
alter table public.rooms add column if not exists password_hash text;
alter table public.rooms add column if not exists gift_effects_enabled boolean not null default true;
alter table public.rooms add column if not exists vehicle_effects_enabled boolean not null default true;
alter table public.rooms add column if not exists entrance_effects_enabled boolean not null default true;

create table if not exists public.room_moderation_log (
  id uuid primary key default gen_random_uuid(), room_id uuid not null references public.rooms(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade, target_id uuid references auth.users(id) on delete set null,
  action text not null, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.room_moderation_log enable row level security;

drop policy if exists room_moderation_log_read on public.room_moderation_log;
create policy room_moderation_log_read on public.room_moderation_log for select to authenticated using (
  exists(select 1 from public.rooms r where r.id=room_id and r.owner_id=auth.uid()) or
  exists(select 1 from public.room_members m where m.room_id=room_id and m.user_id=auth.uid() and m.role='moderator')
);

create or replace function public.update_room_settings(p_room_id uuid, p_name text default null, p_welcome_message text default null, p_image_url text default null, p_chat_enabled boolean default null, p_gift_effects_enabled boolean default null, p_vehicle_effects_enabled boolean default null, p_entrance_effects_enabled boolean default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from rooms where id=p_room_id and owner_id=auth.uid()) then raise exception 'owner permission required'; end if;
 update rooms set name=coalesce(nullif(trim(p_name),''),name), description=coalesce(p_welcome_message,description), welcome_message=coalesce(p_welcome_message,welcome_message), image_url=coalesce(p_image_url,image_url), chat_enabled=coalesce(p_chat_enabled,chat_enabled), gift_effects_enabled=coalesce(p_gift_effects_enabled,gift_effects_enabled), vehicle_effects_enabled=coalesce(p_vehicle_effects_enabled,vehicle_effects_enabled), entrance_effects_enabled=coalesce(p_entrance_effects_enabled,entrance_effects_enabled) where id=p_room_id;
 insert into room_moderation_log(room_id,actor_id,action) values(p_room_id,auth.uid(),'update_settings');
end $$;

create or replace function public.close_room(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from rooms where id=p_room_id and owner_id=auth.uid()) then raise exception 'owner permission required'; end if;
 update rooms set is_active=false where id=p_room_id;
 insert into room_moderation_log(room_id,actor_id,action) values(p_room_id,auth.uid(),'close_room');
end $$;

create or replace function public.reopen_room(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from rooms where id=p_room_id and owner_id=auth.uid()) then raise exception 'owner permission required'; end if;
 update rooms set is_active=true where id=p_room_id;
 insert into room_moderation_log(room_id,actor_id,action) values(p_room_id,auth.uid(),'reopen_room');
end $$;

grant execute on function public.update_room_settings(uuid,text,text,text,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.close_room(uuid) to authenticated;
grant execute on function public.reopen_room(uuid) to authenticated;
