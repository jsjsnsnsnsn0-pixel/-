create or replace function public.search_public_profiles(p_query text, p_limit integer default 20)
returns table(
  public_id bigint,
  username text,
  display_name text,
  avatar_url text,
  level integer,
  vip_level integer,
  country_code text,
  country_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_query text := btrim(coalesce(p_query,''));
  v_limit integer := least(greatest(coalesce(p_limit,20),1),20);
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if char_length(v_query) < 2 then
    return;
  end if;

  return query
  select p.public_id,p.username,p.display_name,p.avatar_url,p.level,p.vip_level,p.country_code,p.country_name
  from public.profiles p
  where p.public_id is not null
    and p.id <> v_user
    and (
      (v_query ~ '^[0-9]+$' and p.public_id = v_query::bigint)
      or coalesce(p.username,'') ilike '%' || v_query || '%'
      or coalesce(p.display_name,'') ilike '%' || v_query || '%'
    )
  order by
    case when v_query ~ '^[0-9]+$' and p.public_id = v_query::bigint then 0 else 1 end,
    p.created_at desc
  limit v_limit;
end;
$$;

revoke all on function public.search_public_profiles(text,integer) from public, anon;
grant execute on function public.search_public_profiles(text,integer) to authenticated;
