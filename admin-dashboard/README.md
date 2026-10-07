# TotiChat Admin — independent administration website

## Live site

- https://bfadhdnudmsggylunhlh.supabase.co/functions/v1/totichat-admin
- Hosted independently as a Supabase Edge Function. The existing TotiChat Vercel application remains unchanged.
- Dedicated Vercel project creation is blocked by a 403 account-scope permission error, so deployment through the existing Vercel application is deliberately avoided.

## Owner and login

- Owner's existing Supabase Auth account: xxjjh20@gmail.com, confirmed as the only Owner in admin_roles.
- Username 'admin' is only an alias to this real Owner email. Its password must be the Owner's genuine Supabase Auth password, NOT 'admin'.
- Google OAuth for the same email is also available; the dashboard URL needs to be allowlisted in Supabase Auth redirects.
- Staff use individual Supabase Auth accounts and receive permissions only through Owner-controlled server-side RBAC.

## Verified backend

Eight production migrations successfully applied 2026-10-08: beta_admin_roles_wallet, room_music_state, beta_roles_realtime, dashboard_agency_review, beta_telemetry, dashboard_monthly_settlements, beta_catalog_administration, beta_support_rooms.
24 public dashboard_* functions registered. Owner has audited, authenticated APIs for users, wallets, role assignments, agency applications, host/agent compensation and settlements, gift/store catalogs, room moderation, tickets, audit, beta telemetry and flags.
Tests: no-session dashboard_session yields allowed=false; unauthenticated overview and wallet adjustment denied; RLS enabled on administrative tables with no authenticated direct UPDATE grant. No actual wallet balance or monthly settlement was changed by these tests.
Some prior features (such as general user ban, arbitrary VIP/levels, advanced CP administration) do not yet have dedicated tested dashboard actions; they must not be presented as complete.

## Alternative dedicated Vercel deployment

Create a new Vercel project 'totichat-admin' with Root Directory 'admin-dashboard', build 'npm run build' and Output Directory 'dist'; set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (a publishable key only). Never point this build at the existing TotiChat app Vercel project. Run npm run check and browser tests before activating production.
