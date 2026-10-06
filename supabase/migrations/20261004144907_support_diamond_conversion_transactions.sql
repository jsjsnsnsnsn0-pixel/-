alter table public.wallet_transactions
  add column if not exists diamond_delta bigint not null default 0;

alter table public.wallet_transactions
  drop constraint wallet_transactions_transaction_type_check;

alter table public.wallet_transactions
  add constraint wallet_transactions_transaction_type_check
  check (transaction_type = any (array[
    'recharge'::text,
    'gift_sent'::text,
    'gift_received'::text,
    'admin_adjustment'::text,
    'diamond_conversion'::text
  ]));

create or replace function public.convert_diamonds_to_gold(p_diamonds bigint)
returns table(
  diamonds_remaining bigint,
  gold_balance bigint,
  gold_added bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_current_diamonds bigint;
  v_gold_added bigint;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;

  if p_diamonds is null or p_diamonds <= 0 then
    raise exception 'invalid diamond amount';
  end if;

  v_gold_added := floor((p_diamonds::numeric * 3) / 10)::bigint;

  if v_gold_added <= 0 then
    raise exception 'diamond amount is too small';
  end if;

  select p.diamonds
    into v_current_diamonds
  from public.profiles p
  where p.id = v_user
  for update;

  if not found then
    raise exception 'profile not found';
  end if;

  if v_current_diamonds < p_diamonds then
    raise exception 'insufficient diamonds';
  end if;

  update public.profiles p
  set diamonds = p.diamonds - p_diamonds,
      gold = p.gold + v_gold_added,
      updated_at = now()
  where p.id = v_user
  returning p.diamonds, p.gold
  into diamonds_remaining, gold_balance;

  insert into public.wallet_transactions(
    user_id,
    transaction_type,
    gold_delta,
    diamond_delta
  ) values (
    v_user,
    'diamond_conversion',
    v_gold_added,
    -p_diamonds
  );

  gold_added := v_gold_added;
  return next;
end;
$$;

revoke execute on function public.convert_diamonds_to_gold(bigint) from public, anon;
grant execute on function public.convert_diamonds_to_gold(bigint) to authenticated;
