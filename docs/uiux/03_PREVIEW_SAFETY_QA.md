# UI-only runtime safety gates (scope v2)

The preview now rejects in-browser simulated Supabase writes instead of displaying a fake server success. All `insert`, `update`, `upsert`, `delete` pseudo-queries return an explicit preview-only error. Read queries can supply labeled sample data. Real Supabase credentials are never used in this preview.
- Gift send returns `false`, reports demo-only limitation, and never debits sample balances.
- Recharge cannot issue coins; a clear notice reminds that production uses verified agents.
- Private conversation send cannot imply real delivered status.
- Prototype state changes (e.g. posts, follows, 4-tabs) are local and clearly labeled as such.
- Preview network popup: `navigator.onLine===false` means offline; optional browser 2g/slow-2g hints can indicate weak quality; toolbar simulation lets reviewer inspect it. These are not server-verified audio network diagnostics.
- Monthly entitlement settlement and owner protected role must be verified against real backend in a separately authorized integration stage.

QA automation in `.github/workflows/uiux-preview-qa.yml` checks TypeScript and Vite build on preview branch only. A green workflow is still not a real-phone UI or backend acceptance test.
