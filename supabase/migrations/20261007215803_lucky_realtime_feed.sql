do $$
begin
  if not exists(
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='room_lucky_feed'
  ) then
    alter publication supabase_realtime add table public.room_lucky_feed;
  end if;
end
$$;
