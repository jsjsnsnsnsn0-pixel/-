# P0/P1 — remove fake wealth and charm values

Owner update, 2026-10-06. This is an additive requirement to Master Prompt v4, immediately before its FINAL ACCEPTANCE; earlier requirements remain active. The complete original Master Prompt is not present in this checkout and has not been reconstructed or overwritten.

## Source of truth

- `private.send_room_gift` is the existing economic authority. It requires authenticated sender and active room membership, a different recipient with current room membership, and an active catalog gift. Price and FIXED_GIFT/LUCKY_GIFT source come from the server catalog, never the client.
- A successful database transaction debits gold, credits diamonds, updates `profiles.sent_gold`/`received_gold`, creates one `gift_events` row, a diamond lot and the existing two wallet accounting entries linked to that event. Ranking sums the event once, not the two wallet entries.
- `gift_events.request_id` is unique and locked before processing; a retry with identical arguments returns without another debit or contribution. Conflicting reuse fails. Sender/recipient rows are locked in consistent order.
- `gift_events` has mandatory room/sender/recipient/request IDs, positive amount and no-self-gift constraints. It stores completed events; there is no failed/cancelled status column or cancellation/refund RPC in the inspected current gift model. Failed RPC calls roll back and never produce eligible events. Do not invent a status field or a second economy.
- Existing `get_gift_rankings` aggregates `gift_events` by sender/recipient for daily/weekly/monthly periods with deterministic public-ID tie breaking. Recharge and administrative wallet entries are outside that table and do not enter ranking.
- Own lifetime totals use existing protected server-maintained `sent_gold` and `received_gold`; the personal total no longer incorrectly becomes zero when the user is outside the ranking's top 100. Rankings retain their selected period; the personal row explicitly says total support/receipts inside rooms.

## Historical audit — no destructive changes

Read-only reconciliation found eight gift events, total 310 gold. Each has exactly one matching sender debit and one recipient credit. No missing room, self gift or nonpositive amount was found. Per-user sent/received caches reconcile exactly with event sums. No 50,000 economic total was found in this reconciliation.

The eight records have no seed/test-origin marker, so their origin cannot be reliably classified as real use versus prior test use from these fields. None was deleted, reset or relabelled. Production cleanup requires explicit owner approval. No schema migration or production financial write was needed.

## Changes

- Removed 50,000 support/receive actions, the quick-support presets/modal, simulated handlers and unused client ranking mutation API. No replacement fixed amount exists.
- Existing AppProvider realtime/profile refresh drives immediate ranking refetch when own sent/received contributions change; its existing 15-second recovery remains. Ranking requests do not overlap in one effect generation and old-account/old-period results are discarded. No new subscription was introduced.
- Existing wealth/charm thresholds remain `min(150, floor(total / 1000) + 1)`. Wealth now uses sent support rather than a possibly unrelated profile level. Ranking badges are omitted unless the backend provides their actual dedicated level; general profile level is not presented as charm level.
- Room minimize opens Home while keeping room membership/audio and a return bar. Main navigation remains available while minimized. Room options use a compact two-button accessible bottom sheet.
- Navigation state updates use React transitions and the lazy fallback is a small top progress indicator, removing the full-screen loading message.
- Microphone still acquires real `getUserMedia` only on explicit seated-user action before unmuting; denied permission cannot unmute. Failed peer track attachment now stops capture and clears the stream so retry can initialize again. Android RECORD_AUDIO configuration already existed and was preserved.

## Verification

- TypeScript + ESLint: passed.
- Unit/DOM integration tests: 20 passed, including real provider minimize with no leave/capture-stop, server profile contribution thresholds, no testing controls, and opt-in Android workflow guard.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Asset check and Vite web build: passed. This is not an Android build.
- SQL regression: `tests/sql/room-gift-accounting.sql` copies the inspected backend gift/ranking function bodies into temporary objects, replaces auth/access helpers only for its isolated fixture, and ends with rollback. Covers zero baseline, matching sender/receiver value, duplicate and conflicting retry, unavailable gift failure, outside-room failure, self gift rejection, recharge/admin exclusion, stable backend refetch, ordering changes and insufficient-balance atomicity. Passed against Postgres; no production rows changed. It does not replace real RLS role tests or concurrent-device testing.
- Read-only security checks: authenticated clients have no INSERT privilege on gift events and no UPDATE/INSERT on protected gold/sent/received/level columns. Editable profile also excludes them. Security advisors reported existing room SECURITY DEFINER warnings and disabled leaked-password protection, unrelated to this change; no auth configuration changed.
- Browser suite: **45 passed (43.9s)** in GitHub Actions run [37407781484](https://github.com/jsjsnsnsnsn0-pixel/TotiChat/actions/runs/37407781484), testing code commit `05038ed4a39647558a732d893df8b7a58a311870`. CI also passed TypeScript, ESLint, 20 unit tests, audit and web build. Local execution was blocked by missing Playwright Chromium; remote CI resolved that environment limitation. Android job conclusion: **skipped**.

## Updated priority and remaining work

P0 remains real microphone/transport verification, minimize to Home, compact options and navigation without full-screen loading. P1 is room-only real gift wealth/charm, backend ranking and synchronized totals with no fabricated defaults. Continue Agency, Profile, Followed Rooms, Ranking UI, Search, Recharge Records, Luck Games and all earlier uncompleted tasks after this increment; this report does not declare them finished.

Real Android permission flow, Bluetooth/background behavior and two-device audio across NAT still require device testing. TURN is not configured. Tests with mocked browser media/signaling are not proof of live audio.

## FINAL ACCEPTANCE

APK/AAB: **NOT REQUESTED — skipped by owner instruction.** Push/PR CI performs validation only. The existing Android job is gated to explicit workflow dispatch with `build_android=true`; do not dispatch it without a new owner request. Do not delete historical data, fabricate totals, change thresholds or create another economy. Browser CI and remaining device tests must be reported honestly.
