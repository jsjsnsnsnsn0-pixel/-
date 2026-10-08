-- Applied on production Supabase (TotiChat) 2026-10-08.
-- Avoid row lock contention on profiles during room creation.
-- Preserve one room per owner and preserve all existing room data.
create or replace function private.one_room_per_owner()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if tg_op='UPDATE' and new.owner_id is not distinct from old.owner_id
 then return new;end if;
 if new.owner_id is null then raise exception 'authentication required';end if;
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended('totichat:single-room:'||new.owner_id::text,1729)
 );
 if exists(select 1 from public.rooms where owner_id=new.owner_id and id<>new.id)
 then raise exception 'account already owns a room';end if;
 return new;
end
$$;
