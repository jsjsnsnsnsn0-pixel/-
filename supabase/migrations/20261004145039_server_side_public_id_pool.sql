create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.account_id_pool (
  position integer primary key,
  public_id bigint not null unique,
  is_claimed boolean not null default false,
  claimed_by uuid unique references auth.users(id) on delete set null,
  claimed_at timestamp with time zone
);

revoke all on private.account_id_pool from public, anon, authenticated;

insert into private.account_id_pool(position, public_id)
select ordinality::integer, public_id
from unnest(array[920003,451305,158884,535125,453731,202982,900386,768057,552009,524790,694528,885893,191342,925940,109867,961040,718957,883228,660672,369030,485114,152285,635345,677951,684912,890608,487437,137203,617017,914510,849800,781475,387753,827270,633259,265202,723875,259025,749692,450828,538473,855037,801117,700482,211348,747687,394803,252994,426108,115732,331739,788111,683198,101311,555374,395395,899343,610280,933179,693965,904231,879597,919630,743186,115775,598994,441217,735890,298936,703208,182313,105244,634053,247279,287886,647223,360819,215940,155150,199704,146789,761638,289699,845498,465813,380686,866218,797956,948483,851469,677312,633303,868082,980510,676071,593117,492169,480923,565696,703146,790876,228854,840741,835230,805062,591427,751559,445002,636410,923676,704882,994416,571375,225072,152802,409830,260095,864050,938736,243761,917850,381010,876688,509806,318561,511615,917785,543748,881432,212207,889082,649697,895505,694096,590404,391252,255572,177275,160361,735041,522312,581235,121412,313626,464462,689050,148185,715764,312008,497448,395989,208939,103251,462542,953901,907981,196341,195190,421111,964709,834506,250709,407969,627495,591249,469431,805801,196429,302177,203853,924812,937396,699389,606666,292243,205273,828681,959822,255365,186037,951781,437869,580776,855607,343713,834553,242431,295746,494619,637894,547641,444245,136315,437524,815221,208325,111361,498036,177025,941698,259265,553627,678509,239674,153170,149073,954671,301505,202300,362285,915490,495262,596715,290149,816578,637201,945092,298265,582555,715002,415866,279261,863850]::bigint[]) with ordinality as ids(public_id, ordinality)
on conflict (public_id) do nothing;

create or replace function private.claim_account_id(p_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_public_id bigint;
begin
  select p.public_id
    into v_public_id
  from private.account_id_pool p
  where p.claimed_by = p_user_id
  limit 1;

  if v_public_id is not null then
    return v_public_id;
  end if;

  select p.public_id
    into v_public_id
  from private.account_id_pool p
  where p.is_claimed = false
  order by p.position
  for update skip locked
  limit 1;

  if v_public_id is null then
    raise exception 'no public account IDs are available';
  end if;

  update private.account_id_pool p
  set is_claimed = true,
      claimed_by = p_user_id,
      claimed_at = now()
  where p.public_id = v_public_id;

  return v_public_id;
end;
$$;

revoke execute on function private.claim_account_id(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_public_id bigint;
begin
  v_public_id := private.claim_account_id(new.id);

  insert into public.profiles (id, public_id, display_name, avatar_url)
  values (
    new.id,
    v_public_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'New User'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set public_id = coalesce(public.profiles.public_id, excluded.public_id),
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
      updated_at = now();

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
