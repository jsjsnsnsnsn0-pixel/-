create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_type text not null check (game_type in ('dice','rps','lucky_bag')),
  outcome text not null,
  score integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists game_results_user_created_idx on public.game_results(user_id, created_at desc);
alter table public.game_results enable row level security;

drop policy if exists "game_results_select_own" on public.game_results;
create policy "game_results_select_own" on public.game_results for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.game_results from authenticated, anon;
grant select on public.game_results to authenticated;

create or replace function public.play_fun_game(p_game_type text, p_choice text default null)
returns table(id uuid, game_type text, outcome text, score integer, details jsonb, created_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_roll integer;
  v_cpu text;
  v_outcome text;
  v_score integer := 0;
  v_details jsonb := '{}'::jsonb;
  v_id uuid;
  v_created timestamptz;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_game_type not in ('dice','rps','lucky_bag') then raise exception 'unsupported game'; end if;

  if p_game_type = 'dice' then
    v_roll := floor(random() * 6 + 1)::int;
    v_outcome := 'rolled_' || v_roll::text;
    v_score := v_roll;
    v_details := jsonb_build_object('roll', v_roll);
  elsif p_game_type = 'rps' then
    if p_choice not in ('rock','paper','scissors') then raise exception 'invalid choice'; end if;
    v_roll := floor(random() * 3)::int;
    v_cpu := (array['rock','paper','scissors'])[v_roll + 1];
    if p_choice = v_cpu then v_outcome := 'draw'; v_score := 1;
    elsif (p_choice = 'rock' and v_cpu = 'scissors') or (p_choice = 'paper' and v_cpu = 'rock') or (p_choice = 'scissors' and v_cpu = 'paper') then v_outcome := 'win'; v_score := 3;
    else v_outcome := 'loss'; v_score := 0;
    end if;
    v_details := jsonb_build_object('choice', p_choice, 'cpu', v_cpu);
  else
    v_roll := floor(random() * 100)::int;
    if v_roll < 5 then v_outcome := 'legendary'; v_score := 10;
    elsif v_roll < 25 then v_outcome := 'rare'; v_score := 5;
    elsif v_roll < 65 then v_outcome := 'common'; v_score := 2;
    else v_outcome := 'empty'; v_score := 0;
    end if;
    v_details := jsonb_build_object('roll', v_roll);
  end if;

  insert into public.game_results(user_id, game_type, outcome, score, details)
  values (v_user, p_game_type, v_outcome, v_score, v_details)
  returning game_results.id, game_results.created_at into v_id, v_created;

  return query select v_id, p_game_type, v_outcome, v_score, v_details, v_created;
end;
$$;

revoke all on function public.play_fun_game(text,text) from public, anon;
grant execute on function public.play_fun_game(text,text) to authenticated;