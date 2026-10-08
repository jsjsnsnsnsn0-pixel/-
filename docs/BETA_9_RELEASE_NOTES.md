# TotiChat 0.9.0-beta.9 — safer Backend room reads and UI game updates

Release preparation: 2026-10-08, derived from stabilization-room-core at commit `11801dbe35e4c1ff667a67a54867e12f331d0771`.

## Shipped changes
- Six **original, on-device, free and no-stake** arcade mini-games: wheel, eggs, garden, greeting envelopes, safe squares, symbol matching. They do **not** read or modify wallet/Coins/Diamonds/agency pay.
- Existing three server-backed TotiFun games preserved; new lobby with feedback, accessibility, accurate historical count.
- Real country room filters with known public owner ISO country codes through existing RLS-safe public profile RPC and honest empty states; Trending by actual room-member count.
- Accessible event banners and a real all-rooms link. Previously merged music publish/unpublish and moderation controls fix included.
- Secure room discovery: `public.rooms_client` is an RLS-invoker view excluding `password_hash`. Additive migration applied to production and checked: same 23 rooms as base, `security_invoker=true`, authenticated SELECT allowed, anon SELECT denied, no password column.
- No financial data, account roles, agency settlement records, or gifts modified.

## Verified CI gates
NPM audit, TypeScript/lint/unit test, Vite and independent admin dashboard builds, Playwright E2E, JPG artifact optimization, Gradle assembleDebug, APK integrity, package ID/versionCode, apksigner, Android 14 emulator clean install + app launch. This describes CI verification, NOT proof of real-device parity.

Package `com.totichat.app`; `versionName 0.9.0-beta.9`; `versionCode 900009`; Supabase project `bfadhdnudmsggylunhlh`.

### IMPORTANT: Android signature upgrades are not solved
This is a temporary **debug-signed APK**. GitHub ephemeral CI runners generate different debug certificates across releases. Installing Beta.9 directly over the user's installed Beta.8 can fail with Android's app-signature mismatch even when Beta.9 is clean and validated. Never promise in-place update. Back up any unsynced device-local files/preferences before considering an uninstall. Use future permanent owner-controlled release keystore stored only in protected CI secrets; beta-to-beta seamless updates cannot work until that mechanism is deployed. Tracker issue #39.

### Known launch blockers
- In-place update signing mismatch; Google Android OAuth on the real phone; real two-device LiveKit audio and shared playlist music; mobile performance on budget devices; owner-dashboard/agency-host monthly settlement operational checks and production security findings.
- Old `public.rooms` grants remain for previously shipped APKs; issue #37 stays open until legacy clients can be retired; the new APK uses the password-free view.
- Not 100% production ready; release is for testing only and no real money stakes. Do not describe anything from Dana's static XAPK as proven interactive behavior.

Refs: PR #40–#45; `docs/TOTICHAT_BETA8_DANA_FRONTEND_PARITY_2026-10-08.md`, `docs/DANA_FRONTEND_UI_GAP_MATRIX_2026-10-08.md`.
