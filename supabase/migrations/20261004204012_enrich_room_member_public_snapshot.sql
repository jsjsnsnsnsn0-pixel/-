alter table public.room_members add column if not exists member_username text;
alter table public.room_members add column if not exists member_level integer;
alter table public.room_members add column if not exists member_vip_level integer;

create or replace function public.populate_room_member_snapshot()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  select p.public_id,p.username,p.display_name,p.avatar_url,p.level,p.vip_level
    into new.member_public_id,new.member_username,new.member_display_name,new.member_avatar_url,new.member_level,new.member_vip_level
  from public.profiles p
  where p.id=new.user_id;
  return new;
end;
$$;

update public.room_members m
set member_public_id=p.public_id,
    member_username=p.username,
    member_display_name=p.display_name,
    member_avatar_url=p.avatar_url,
    member_level=p.level,
    member_vip_level=p.vip_level
from public.profiles p
where p.id=m.user_id;

create or replace function public.sync_profile_room_snapshots()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  update public.room_members
  set member_public_id=new.public_id,
      member_username=new.username,
      member_display_name=new.display_name,
      member_avatar_url=new.avatar_url,
      member_level=new.level,
      member_vip_level=new.vip_level
  where user_id=new.id;

  update public.rooms
  set owner_public_id=new.public_id,
      owner_display_name=new.display_name,
      owner_avatar_url=new.avatar_url
  where owner_id=new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_room_snapshots on public.profiles;
create trigger profiles_sync_room_snapshots
after update of public_id,username,display_name,avatar_url,level,vip_level on public.profiles
for each row execute function public.sync_profile_room_snapshots();
