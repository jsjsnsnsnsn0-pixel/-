CREATE OR REPLACE FUNCTION private.create_room(p_name text, p_description text DEFAULT NULL::text, p_image_url text DEFAULT NULL::text, p_max_seats integer DEFAULT 8, p_category text DEFAULT 'عامة'::text, p_is_private boolean DEFAULT false, p_is_vip boolean DEFAULT false, p_tags text[] DEFAULT '{}'::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
 SECURITY DEFINER
AS $function$
declare
  v_user uuid := (select auth.uid());
  v_room_id uuid;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'room name is required';
  end if;
  if p_max_seats < 1 or p_max_seats > 20 then
    raise exception 'invalid seat count';
  end if;

  insert into public.rooms(
    owner_id, name, description, image_url, max_seats,
    category, is_private, is_vip, tags
  ) values (
    v_user, btrim(p_name), nullif(btrim(coalesce(p_description,'')), ''),
    nullif(btrim(coalesce(p_image_url,'')), ''), p_max_seats,
    coalesce(nullif(btrim(p_category), ''), 'عامة'),
    coalesce(p_is_private, false), coalesce(p_is_vip, false),
    coalesce(p_tags, '{}'::text[])
  ) returning id into v_room_id;

  insert into public.room_members(room_id, user_id, seat_number, role, is_muted)
  values (v_room_id, v_user, 1, 'owner', true);

  return v_room_id;
end;
$function$
;

-- Equivalent unique constraint already protects each occupied seat.
drop index if exists public.room_members_room_seat_uidx;
alter table public.direct_messages validate constraint direct_message_text_length;
create index room_audio_signals_created_idx on public.room_audio_signals(created_at);
create or replace function private.clean_audio_signals()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.sender_id is distinct from (select auth.uid()) then raise exception 'invalid sender'; end if;
 if (select count(*) from public.room_audio_signals where sender_id=new.sender_id and created_at>now()-interval '2 minutes')>=1000 then
  raise exception 'audio signaling rate limit exceeded';
 end if;
 delete from public.room_audio_signals where created_at<now()-interval '10 minutes';
 return new;
end; $$;
revoke all on function private.clean_audio_signals() from public,anon,authenticated;
create trigger clean_audio_signals_before_insert before insert on public.room_audio_signals
for each row execute function private.clean_audio_signals();
