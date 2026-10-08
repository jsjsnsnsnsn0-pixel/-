# TotiChat integration and performance audit — 2026-10-08

## Source reconciliation

This branch reconciles the approved UI snapshot (GitHub f1a2c006, local tree 736bb480), music/private-room fixes (956002ad), and the independent administration website (1b4c2528). The approved transparent profile sheets, gift selection and quantities 1/7/17/77/777, relationship validation, draggable minimized room, agency navigation and inventory interfaces remain available alongside cloud music and administration. This is incremental integration, not a replacement app.

## Fixed findings

- Room switching previously left the current room before admission to the new room. The client now uses the existing atomic join_room RPC; rejected entry retains current membership.
- The newer profile loader restored viewer-scoped CP fallback, allowing stale/wrong partners. The validated target-scoped read is retained and adapted to newer profile presentation.
- Conflicting gift-call argument orders are reconciled; explicit Send, inventory consumption and retry IDs retain their existing contracts.
- Gift confirmation refreshes the recipient counter and feed; duplicate delivery remains deduplicated.
- The deployed moderation-log policy compared m.room_id to itself, allowing unrelated-room moderator reads. It now compares to room_moderation_log.room_id. The change is applied and tested on production with rollback-only fixtures.
- Lucky-source eligible base diamond conversion displayed 30% but the server quoted 10%. The agreed 30% rate is applied to future eligible redemptions; historic receipts and diamond lots are untouched. Cosmetic lucky reward points remain separate. All 42 currency assertions pass against the live functions after updating the expected arithmetic.
- Mixed room CSS targeted another header structure, expanding the room identity image and stacking controls. Restored the approved compact/glass stylesheet while keeping keyboard-aware toolbar behavior; mobile browser assertions now constrain header height.
- Android audio selection with an empty/octet-stream MIME now accepts a supported extension and validates/decode-checks before uploading a normalized audio file.
- Network operations have a 20-second deadline and respect caller cancellation. Writes are not automatically retried.
- A later server migration rejected the approved quantity 17 for fixed/self/lucky gifts. All three quantity guards and the lucky receipt constraint now retain 1/7/17/77/777; transactional fixed/lucky quantities, exact debit/credit, self sends, retry and failure rollback tests pass.
- Identical room-owner indexes and duplicate recharge read policies caused unnecessary work. The duplicate index is removed and the policies are combined with identical OR semantics; recharge regression passes.
- Database history restored with actual applied versions. Unexecuted/duplicate future-dated SQL proposals are isolated under docs/migration-proposals and cannot be replayed by migration tooling. Current production history includes 89 applied migrations.

## Performance

Same installed dependency environment: main JavaScript drops from 901.62 kB (256.34 kB gzip) to 390.19 kB (123.94 kB gzip). The pinned LiveKit SDK is loaded dynamically on room entry, not at login. This is a bundle measurement, not a measured device FPS/startup guarantee.

Full account-wide synchronization is replaced by coalesced per-domain refreshes; events arriving during requests are retained. Background fallback polls stop while hidden. Foreground app fallback is 30 seconds instead of 15; rankings are 60 seconds instead of 15. Seat profiles use the newer short cache/in-flight deduplication and force-refresh the recipient after a confirmed gift. Room mapping groups members, seat locks and links rather than repeatedly scanning lists.

## Validation

- TypeScript, ESLint, referenced assets and production build pass.
- 49 unit/DOM/lifecycle tests pass, including gift selection/retries, canonical CP, account security, audio disposal, refresh queue bursts/in-flight events and network timeout/cancellation.
- npm audit: zero known vulnerabilities in this run.
- Independent dashboard JavaScript syntax validation and build with the existing project's public publishable key pass.
- Ten rollback-only production SQL suites pass: core wallet/room contracts, 42 currency assertions, commerce/VIP/rewards/social, recharge integration, audio signaling, room controls, agreed UI server contracts, LiveKit reconciliation, gift quantities/idempotency and new music persistence/isolation/playback/retry plus room-scoped moderation logs.
- Literal client/admin RPCs and database tables have live counterparts; avatars, user-music and agency-review are storage buckets, not missing public tables. Dynamic RPC contracts are additionally exercised by the SQL suites.
- Local browser tests could not launch: Chromium is absent, and its permitted download returned an invalid ZIP. GitHub browser validation must pass before merging or releasing.

## Remaining release checks and feature limits

This audit does not certify that every desired product feature is complete. Phone SMS provider setup, Google/native OAuth return, two-device LiveKit voice/music, actual recharge operations, Android performance and month-end settlement operations require end-to-end verification. The independent dashboard still lacks dedicated tested actions for arbitrary account level/VIP changes, general account banning and advanced CP administration. Historical schema before the first migration is not captured, so rebuilding an empty database solely from this migration history remains unsupported.

Security advisors include intentionally inaccessible audit/internal tables and authenticated SECURITY DEFINER APIs; all public SECURITY DEFINER functions deny anonymous execution, but authenticated API permissions still need per-function review. Leaked-password protection remains disabled in project authentication settings. Remaining performance advisories are informational foreign-key index candidates and unused-index observations; these need workload evidence before adding/removing indexes. No APK is built or deployed by this audit. No real user balances, relationships or settlements were modified by fixtures.
