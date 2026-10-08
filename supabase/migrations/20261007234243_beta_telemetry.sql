-- One-month beta observability. Store only bounded event codes; never messages, tokens or credentials.
create table public.beta_event_log(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id),
 category text not null check(category in(
 'app_crash','api_error','audio_disconnect','room_reconnect','gift_failure',
 'wallet_failure','music_failure','login_failure')),
 code text not null check(code ~ '^[a-z0-9_]{3,64}$'),
 platform text check(platform in('android','web','ios','unknown')),
 app_version text,
 created_at timestamptz not null default now()
);
create index beta_event_category_idx on public.beta_event_log(created_at desc,category);
create index beta_event_user_time_idx on public.beta_event_log(user_id,created_at desc);
alter table public.beta_event_log enable row level security;
revoke all on public.beta_event_log from public,anon,authenticated;
create function public.beta_record_event(
 p_category text,p_code text,p_platform text default 'unknown',
 p_version text default '0.9.0-beta.1'
) returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then return false;end if;
 if p_category not in('app_crash','api_error','audio_disconnect','room_reconnect',
  'gift_failure','wallet_failure','music_failure','login_failure')
  or coalesce(p_code,'') !~ '^[a-z0-9_]{3,64}$' then return false;end if;
 if p_platform not in('android','web','ios','unknown') then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended('beta_event:'||actor::text,0));
 if (select count(*) from public.beta_event_log where user_id=actor and created_at>now()-interval '24 hours')>=100
 then return false;end if;
 insert into public.beta_event_log(user_id,category,code,platform,app_version)
 values(actor,p_category,p_code,p_platform,left(coalesce(p_version,''),40));
 return true;
end $$;
revoke all on function public.beta_record_event(text,text,text,text) from public,anon;
grant execute on function public.beta_record_event(text,text,text,text) to authenticated;
create function public.dashboard_beta_health() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.dashboard_require('reports.view');
 return jsonb_build_object(
 'last_24h',(select coalesce(jsonb_object_agg(category,total),'{}'::jsonb) from
  (select category,count(*)total from public.beta_event_log
   where created_at>now()-interval '24 hours' group by category) grouped),
 'last_7_days',(select count(*) from public.beta_event_log where created_at>now()-interval '7 days'),
 'recent_codes',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb)from(
  select category,code,count(*) total from public.beta_event_log
   where created_at>now()-interval '7 days'
   group by category,code order by count(*) desc limit 15
 ) t)
 );
end $$;
revoke all on function public.dashboard_beta_health() from public,anon;
grant execute on function public.dashboard_beta_health() to authenticated;
notify pgrst,'reload schema';
