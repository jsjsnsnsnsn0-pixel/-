-- Make the old client RPC use validated, per-minute server-side rankings.
-- Old and new output JSON was compared across three periods and user roles.
create or replace function private.get_gift_rankings(p_period text default 'daily')
returns jsonb language sql stable security definer set search_path=''
as $$select private.get_gift_rankings_cached(p_period)$$;
-- Keep cache current without requiring another APK or app frontend deployment.
select cron.schedule(
 'totichat-gift-rankings-refresh',
 '* * * * *',
 'select private.refresh_gift_rankings_cache()'
);
notify pgrst,'reload schema';
