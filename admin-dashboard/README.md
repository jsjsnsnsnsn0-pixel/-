# TotiChat Admin — approved frontend implementation

## Current entry point

The **root `index.html`** on branch `feature/restore-approved-admin-ui-20261010`
uses the October 7, 2026 purple/pink dashboard HTML layout approved by the Owner.

It is **real frontend code** backed by the existing Supabase:
- `index.html` — approved sidebar, topbar, dashboard cards, mobile navigation, detail drawer, authenticated gate.
- `approved-front.css` — responsive styling for real forms and data views without changing approved visual identity.
- `approved-front.js` — Google OAuth, `dashboard_session` RBAC, safe navigation, live users, overview, agency applications, audits, CSV export, and reused live catalog, wallet, moderation, roles, settlements and beta-monitoring pages.
- `approved-20261007-original.html` — **unchanged visual reference** with demo data (not production, no database writes).
- `approved-live.html` — independent frontend integration review entry.
- `legacy-connected.html` + `app.js` — previous connected frontend retained for rollback.

### What is real

All live data is retrieved via existing Supabase RPCs with each staff user's OAuth session.
There are no seeded users or fake balances in the frontend runtime.
UI calls for agency review, wallet modification and catalog edits use the existing
authenticated, server-side RPCs only after role checks and confirmations.
If an operation lacks verified backend support, the UI says so; it does not
pretend to complete the operation.

### Access rules

Owner and **explicitly trusted primary Super Admin partner** only may view
the comprehensive host agency section in UI. Other Super Admins are blocked
there. DB staff may use the dedicated host agency application approval section
only. Customer Service sees complaints without sanction actions.
Host Agent and Charging Agent roles are app-side rather than general dashboard accounts.

**Security work remains blocking:** the current backend `dashboard_session` does
**not** issue `primary_partner`, and some existing agency/settlement RPCs still
authorize too broadly. Before merge, deploy a carefully reviewed additive
backend migration that identifies exactly two trusted accounts and enforces access
for all sensitive RPCs, documents and monthly compensation data. Frontend hiding
alone is not a security boundary. Do not edit financial records as part of UI work.

### Development verification

```sh
cd admin-dashboard
npm run check
npm run build
```

`npm run build` requires the existing TotiChat `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` (public key), already configured for the
independent Vercel project. Never ship service_role secrets in frontend assets.

**Deployment note:** Latest GitHub branch contains the new connected frontend.
Vercel preview publication currently needs renewed authorization for the
`xd-481e` team (403). Do not claim an old preview deployment represents
the latest commit.

No Supabase migrations, currency entries, or production app front-end
components were modified on this branch.
