# Room gift selection update — 2026-10-07

The room sending sheet keeps its existing transparent layout and height cap. A tap selects a gift; quantity defaults to 1 and supports 1, 7, 17, 77 and 777. Only Send starts payment. The total reflects catalog unit price multiplied by quantity. Recipient selection uses the real public ID. Selection does not purchase stock or debit funds.

Paid sends use the authenticated `send_room_gift_batch` RPC. The database validates membership, active gift and CP eligibility, locks the request and profiles, and atomically writes the total debit, receipt, recipient value/count and feed. Retry uses the same UUID for the same sender/room/recipient/gift/quantity intent. Changed quantity cannot reuse a committed receipt. Failed sends roll back. Existing single-unit and owned inventory APIs remain compatible. Self gifting retains the existing deferred reward policy.

The persisted room gift feed supplies chat lines including sender, gift, recipient and quantity. Confirmed send and realtime events refresh both feed and the seat's public received_gold value, without remounting the room or restarting audio. Feed entries deduplicate by receipt ID. Room message moderation does not pretend to delete immutable gift receipts. Cosmetic inventory, store, agency, CP and global banner behavior remain separate.

## Verification

- TypeScript and ESLint passed; referenced asset validation passed.
- 39 unit tests passed, including gift selection, explicit sending, quantities, changed recipient/gift, insufficient funds, double tap, seat value/feed updates and duplicate realtime events.
- 5 isolated preview contract tests passed, including CP and agency contracts and aggregate gift debit/feed updates.
- Transactional backend fixtures passed all five quantities, exact totals and recipient counts, same-request retry, changed quantity rejection, invalid quantity, insufficient balance rollback, self send, authentication/recipient rejection, legacy single-unit API and owned inventory consumption. All fixtures rolled back.
- The isolated review build passed. The preview starts inside the room without an app login and does not call the real Supabase client.
- Browser/Android visual and live microphone QA was unavailable in this environment; a physical-device check remains necessary.

## Existing advisor findings

No new quantity migration security finding. Two intentionally internal tables retain deny-by-default RLS with no policies: private.livekit_reconcile_queue and private.relationship_card_equipment ([advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Existing Auth leaked-password protection remains disabled ([configuration reference](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). These settings were not changed by this task.

The previously applied agency and quantity migrations were restored from server migration history after the local workspace reset. This source is preserved in the existing private preview repository; no GitHub push or APK build was performed.
