drop trigger if exists profiles_sync_room_snapshots on public.profiles;

create or replace function private.sync_profile_room_snapshots()
returns trigger
language plpgsql
security definer
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

revoke all on function private.sync_profile_room_snapshots() from public, anon, authenticated;

create trigger profiles_sync_room_snapshots
after update of public_id,username,display_name,avatar_url,level,vip_level on public.profiles
for each row execute function private.sync_profile_room_snapshots();

drop function if exists public.sync_profile_room_snapshots();
