create or replace function private.profile_cp_by_type(p_public_id bigint,p_type_id text)returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target uuid;result jsonb;begin
 if auth.uid()is null then raise exception 'authentication required';end if;
 select id into target from public.profiles where public_id=p_public_id;
 if target is null or exists(select 1 from public.user_blocks where(blocker_id=auth.uid()and blocked_id=target)or(blocker_id=target and blocked_id=auth.uid()))then return null;end if;
 select case when count(*)=1 then jsonb_agg(jsonb_build_object(
  'subject_public_id',p_public_id,'relation_id',c.id,'type_id',c.type_id,
  'accepted_at',c.accepted_at,'ended_at',c.ended_at,
  'partner',private.public_profile(case when c.user_a=target then c.user_b else c.user_a end),
  'days',greatest(0,extract(day from now()-c.accepted_at)::integer))) -> 0 else null end into result
 from public.couples c
 join private.cp_slots a on a.user_id=c.user_a and a.type_id=c.type_id and a.couple_id=c.id
 join private.cp_slots b on b.user_id=c.user_b and b.type_id=c.type_id and b.couple_id=c.id
 where target in(c.user_a,c.user_b)and c.type_id=p_type_id and c.accepted_at is not null and c.accepted_at<=clock_timestamp()and c.ended_at is null
 and not exists(select 1 from public.couples other where other.id<>c.id and other.type_id=c.type_id and other.accepted_at is not null and other.ended_at is null and (c.user_a in(other.user_a,other.user_b)or c.user_b in(other.user_a,other.user_b)));
 return result;
end$$;

-- Check canonical accepted records as well as slots. A malformed historical record
-- must never permit a second relationship while it waits for administrator repair.
do $$declare def text;needle text:='if exists(select 1 from private.cp_slots s where';begin
 select pg_get_functiondef('private.guard_cp()'::regprocedure)into def;
 if position(needle in def)=0 then raise exception 'unexpected guard_cp definition';end if;
 def:=replace(def,needle,
 'if exists(select 1 from public.couples c where c.id<>new.id and c.ended_at is null and c.accepted_at is not null and (new.user_a in(c.user_a,c.user_b)or new.user_b in(c.user_a,c.user_b))and(c.type_id=new.type_id or exists(select 1 from private.cp_type_conflicts f where f.type_a=least(c.type_id,new.type_id)and f.type_b=greatest(c.type_id,new.type_id))))then raise exception ''partner already linked for CP type'';end if;'||chr(10)||needle);
 execute def;
end$$;
notify pgrst,'reload schema';
