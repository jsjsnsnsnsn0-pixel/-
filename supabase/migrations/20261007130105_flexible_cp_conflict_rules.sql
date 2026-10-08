-- Make CP exclusivity extensible without changing the currently active relationship type.
-- Same-type occupancy remains strictly unique per user through private.cp_slots.
-- Cross-type conflicts can now be configured either per-user or only for the same pair.

drop index if exists public.couples_active_pair;

create unique index if not exists couples_active_type_pair
  on public.couples(user_a,user_b,type_id)
  where ended_at is null and accepted_at is not null;

create table if not exists private.cp_pair_type_conflicts (
  type_a text not null references public.cp_types(id) on delete cascade,
  type_b text not null references public.cp_types(id) on delete cascade,
  primary key(type_a,type_b),
  check(type_a < type_b)
);

alter table private.cp_pair_type_conflicts enable row level security;
drop policy if exists cp_pair_conflicts_internal on private.cp_pair_type_conflicts;
create policy cp_pair_conflicts_internal on private.cp_pair_type_conflicts
  to authenticated using(false) with check(false);
revoke all on private.cp_pair_type_conflicts from public,anon,authenticated;

create or replace function private.guard_cp()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if tg_op='UPDATE'
     and (new.user_a,new.user_b,new.type_id,new.requested_by)
         is distinct from
         (old.user_a,old.user_b,old.type_id,old.requested_by)
  then
    raise exception 'CP identity cannot change';
  end if;

  if tg_op='UPDATE' and old.ended_at is not null and new.ended_at is null then
    raise exception 'ended CP cannot reopen';
  end if;

  if tg_op='UPDATE' and old.accepted_at is not null
     and new.accepted_at is distinct from old.accepted_at
  then
    raise exception 'CP acceptance cannot change';
  end if;

  if new.ended_at is not null then
    return new;
  end if;

  -- Serialize decisions for both accounts so two simultaneous accepts cannot
  -- bypass occupancy/conflict checks.
  perform 1
  from public.profiles
  where id in(new.user_a,new.user_b)
  order by id
  for update;

  if not exists(
    select 1 from public.cp_types
    where id=new.type_id and enabled
  ) then
    raise exception 'CP type not available';
  end if;

  if exists(
    select 1
    from public.user_blocks
    where (blocker_id=new.user_a and blocked_id=new.user_b)
       or (blocker_id=new.user_b and blocked_id=new.user_a)
  ) then
    raise exception 'user is blocked';
  end if;

  -- One active relationship of the same type per account, regardless of
  -- partner. This is the core rule requested for e.g. love CP.
  if exists(
    select 1
    from private.cp_slots s
    where s.couple_id<>new.id
      and s.user_id in(new.user_a,new.user_b)
      and s.type_id=new.type_id
  ) then
    raise exception 'partner already linked for CP type';
  end if;

  -- Optional user-wide conflicts between different types. Example: if the
  -- owner later decides type A and type B can never coexist on one account.
  if exists(
    select 1
    from private.cp_slots s
    join private.cp_type_conflicts f
      on f.type_a=least(s.type_id,new.type_id)
     and f.type_b=greatest(s.type_id,new.type_id)
    where s.couple_id<>new.id
      and s.user_id in(new.user_a,new.user_b)
  ) then
    raise exception 'CP type conflicts with active relationship';
  end if;

  -- Optional pair-only conflicts. This lets the owner decide later that the
  -- same two users may not combine specific types, without blocking those
  -- types with different partners.
  if exists(
    select 1
    from public.couples c
    join private.cp_pair_type_conflicts f
      on f.type_a=least(c.type_id,new.type_id)
     and f.type_b=greatest(c.type_id,new.type_id)
    where c.id<>new.id
      and c.user_a=new.user_a
      and c.user_b=new.user_b
      and c.ended_at is null
      and c.accepted_at is not null
  ) then
    raise exception 'CP types conflict for this pair';
  end if;

  return new;
end
$$;

revoke all on function private.guard_cp() from public,anon,authenticated;

create or replace function private.cp_action(
  p_public_id bigint,
  p_action text,
  p_type_id text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  t uuid;
  r public.couples%rowtype;
  label text;
begin
  if u is null then
    raise exception 'authentication required';
  end if;

  select id into t
  from public.profiles
  where public_id=p_public_id;

  if t is null or t=u then
    raise exception 'invalid target';
  end if;

  perform 1
  from public.profiles
  where id in(u,t)
  order by id
  for update;

  select * into r
  from public.couples
  where user_a=least(u,t)
    and user_b=greatest(u,t)
    and type_id=p_type_id
    and ended_at is null
  order by created_at desc
  limit 1;

  if p_action='request' then
    select c.label into label
    from public.cp_types c
    where id=p_type_id and enabled;

    if label is null then
      raise exception 'CP type not available';
    end if;

    if r.id is not null then
      return;
    end if;

    if (
      select count(*)
      from public.couples
      where requested_by=u
        and ended_at is null
        and accepted_at is null
    ) >= 5 then
      raise exception 'couple request limit reached';
    end if;

    insert into public.couples(user_a,user_b,requested_by,type_id)
    values(least(u,t),greatest(u,t),u,p_type_id);

    insert into public.user_notifications(
      user_id,type,title,description,actor_public_id
    )
    select t,'system','طلب '||label,display_name,public_id
    from public.profiles
    where id=u;

  elsif p_action='accept' then
    if r.id is null or r.requested_by=u or r.accepted_at is not null then
      raise exception 'incoming request required';
    end if;

    -- guard_cp is the final authority and runs while both accounts are locked.
    update public.couples
    set accepted_at=clock_timestamp()
    where id=r.id;

    -- Cancel only requests that can no longer be accepted under configured
    -- rules. Unrelated future CP types remain untouched.
    update public.couples c
    set ended_at=clock_timestamp()
    where c.id<>r.id
      and c.ended_at is null
      and c.accepted_at is null
      and (
        (
          (u in(c.user_a,c.user_b) or t in(c.user_a,c.user_b))
          and (
            c.type_id=p_type_id
            or exists(
              select 1
              from private.cp_type_conflicts f
              where f.type_a=least(c.type_id,p_type_id)
                and f.type_b=greatest(c.type_id,p_type_id)
            )
          )
        )
        or (
          c.user_a=r.user_a
          and c.user_b=r.user_b
          and exists(
            select 1
            from private.cp_pair_type_conflicts f
            where f.type_a=least(c.type_id,p_type_id)
              and f.type_b=greatest(c.type_id,p_type_id)
          )
        )
      );

  elsif p_action in('reject','end') then
    if r.id is null then
      return;
    end if;

    if p_action='reject' and r.accepted_at is not null then
      raise exception 'incoming request required';
    end if;

    update public.couples
    set ended_at=clock_timestamp()
    where id=r.id;

  else
    raise exception 'invalid couple action';
  end if;
end
$$;

revoke all on function private.cp_action(bigint,text,text) from public,anon;
grant execute on function private.cp_action(bigint,text,text) to authenticated;

comment on table private.cp_type_conflicts is
  'User-wide cross-type CP conflicts. Same-type uniqueness is always enforced separately.';
comment on table private.cp_pair_type_conflicts is
  'Cross-type conflicts that apply only when the same two accounts are paired.';

notify pgrst,'reload schema';
