revoke all on function public.update_room_settings(uuid,text,text,text,boolean,boolean,boolean,boolean) from public, anon;
revoke all on function public.close_room(uuid) from public, anon;
revoke all on function public.reopen_room(uuid) from public, anon;
grant execute on function public.update_room_settings(uuid,text,text,text,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.close_room(uuid) to authenticated;
grant execute on function public.reopen_room(uuid) to authenticated;
