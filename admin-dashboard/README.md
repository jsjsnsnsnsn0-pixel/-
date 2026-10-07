# TotiChat Standalone Admin Dashboard

A separately deployed admin website. It uses the same TotiChat Supabase Auth and Postgres database, but never embeds the mobile app or a secret key.

Deploy this directory as a DIFFERENT Vercel project with Root Directory admin-dashboard; Build Command npm run build; Output Directory dist; Node 22+.
Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY using the existing TotiChat Supabase project. Publishable keys are client-safe; service_role and secret keys NEVER belong here.
Add the dashboard domain to Supabase Auth redirect allowlist for Google login.

**Backend rollout is a separate, gated operation.** The production Supabase database did not yet record the beta admin migrations when this branch was created. Review, test and apply the pending beta migrations in order before using real admin operations; never db reset production.

All protected reads and writes call dashboard_* RPC functions; only server-side permission checks are authoritative. Financial changes use audited atomic wallet RPCs, not direct profile updates. Staff cannot grant themselves Owner; URL sharing alone is insufficient.

Run npm run check for syntax and npm run build with the environment variables above. Test sign-in, role restrictions, idempotent wallet changes, audit trail, settlement rules and realtime behavior before production release.
