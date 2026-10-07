-- The profile read validates both exclusivity slots in the same statement.
-- Keep profile_cp compatible and add a typed read endpoint for future CP types.
create function private.profile_cp_by_type(p_public_id bigint,p_type_id text)returns jsonb language plpgsql stable security definer set search_path='' as $$
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
 where target in(c.user_a,c.user_b)and c.type_id=p_type_id and c.accepted_at is not null and c.accepted_at<=clock_timestamp()and c.ended_at is null;
 return result;
end$$;
create function public.profile_cp_by_type(p_public_id bigint,p_type_id text)returns jsonb language sql stable security invoker set search_path='' as $$select private.profile_cp_by_type(p_public_id,p_type_id)$$;
create or replace function private.profile_cp(p_public_id bigint)returns jsonb language sql stable security invoker set search_path='' as $$select private.profile_cp_by_type(p_public_id,'love')$$;
revoke all on function private.profile_cp_by_type(bigint,text),public.profile_cp_by_type(bigint,text)from public,anon;
grant execute on function private.profile_cp_by_type(bigint,text),public.profile_cp_by_type(bigint,text)to authenticated;
-- Pending requests remain available; accepted rows must pass the same occupancy validation.
do $$declare def text;predicate text:='and (c.accepted_at is null or (c.accepted_at<=clock_timestamp() and exists(select 1 from private.cp_slots a join private.cp_slots b on b.couple_id=a.couple_id where a.couple_id=c.id and a.user_id=c.user_a and b.user_id=c.user_b and a.type_id=c.type_id and b.type_id=c.type_id)))';begin
 select pg_get_functiondef('private.couple_state()'::regprocedure)into def;
 if position('and c.ended_at is null' in def)=0 then raise exception 'unexpected couple_state definition';end if;
 def:=replace(def,'and c.ended_at is null','and c.ended_at is null '||predicate);execute def;
 select pg_get_functiondef('private.cp_state()'::regprocedure)into def;
 if position('and c.ended_at is null' in def)=0 then raise exception 'unexpected cp_state definition';end if;
 def:=replace(def,'and c.ended_at is null','and c.ended_at is null '||predicate);execute def;
end$$;
notify pgrst,'reload schema';
