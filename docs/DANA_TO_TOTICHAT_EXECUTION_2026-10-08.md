# Dana reference → TotiChat execution map (2026-10-08)

## Scope and ground truth
- **Reference:** user-supplied Dana Group Voice Chat Rooms 1.0.66 XAPK, *static package inspection only*. Flutter, Agora RTC, Tencent IM, music and layered VIP/CP/gift artwork were observed as client dependencies/resources, not verified server contracts. Do not copy Dana assets, code, UI screens, trademarked visuals, or API secrets.
- **Product to change:** TotiChat, React/TypeScript/Vite/Capacitor, connected to project `bfadhdnudmsggylunhlh`, with LiveKit audio and a standalone admin site.
- **Safe starting point:** `stabilization-room-core` at `6efa22235ae6e30a9e703f8b36f0f64bd9372376`. The release `v0.9.0-beta.7` is immutable and contains two additional build/release commits. Do not force-push `main` (still behind) or overwrite any released build.
- **Environment checked:** Existing production tables include rooms, memberships, audio, gift, wallet, agency, CP, month-end settlements, user music, accepted friendships, dashboard roles and audits. Table presence is **not** proof of operational readiness.
- **Production safety:** No direct account balance, wallet, diamond lot, payroll, accepted CP, room ownership, or owner-role modifications in reference work. Server must authorize privileged and financial operations. Use rollback-only fixtures for SQL tests. No `db reset`.
- **Current verified issue fixed by this branch:** The UI Friends tab previously used `list.slice(0, 2)`, showing unrelated rooms. It now asks the existing RLS-protected `friendships` table for `accepted` relationships, filters by real room-owner auth ID, and presents loading/error/empty states. No schema changes.

## Prioritized comparison and acceptance plan

| Priority | Feature | Existing TotiChat evidence | Dana-inspired UX goal | Evidence needed before shipping |
|---|---|---|---|---|
| P0 | APK installation | Beta.7 CI built and emulator-installed; the physical device failure is not explained | Small, straightforward install | Actual device install, signing compatibility, package ID, logs |
| P0 | Authentication | Supabase Auth + native OAuth configured in source | Reliable entry, account-specific state | Real Google return + SMS provider decision, background restore |
| P0 | Rooms & microphones | Rooms, protected seats, moderation, LiveKit token function | Predictable room/seat/owner flow | Two real users on two phones, private join, seat racing, denied permissions |
| P0 | Shared music | LiveKit room music publisher + private music library + commands | Remember user's music; make remote listeners hear the same song | Persist/reopen library; real two-device audio, loss/recovery |
| P0 | Gifts and lucky gifts | Gift catalog, events, wallet ledger, quantity path 1/7/17/77/777 | Select recipient/quantity first, Send only once | Duplicate request/retry, exact debit/credit, recipient animations |
| P0 | Owner/admin | Separate admin source, database permissions/audit RPCs | Clear staff actions and owner protection | Non-owner denies privileged RPCs; live staff access test |
| P1 | Discovery and friends | Room listing exists; friend-tab source fabricated first two entries | Real followed/friends rooms, no made-up results | Accepted friends only; RLS per-user read; loading/error/no matches |
| P1 | Profile/levels/VIP/CP | Profiles, relationship tables, VIP equipment and UI assets | Cohesive progression and relationship cards | Account-only visibility; server entitlement; correct CP partner |
| P1 | Agents, diamond and monthly close | Agency + settlement tables/RPCs; 30% diamond conversion agreed | Statements for agencies and hosts, auditable month close | Freeze/report before clearing; double-close idempotence; rollback-safe trial |
| P2 | Performance and visuals | Home/room images, motion effects, lazy-loaded LiveKit | Fast entrance with minimal animated overlays | Startup measurements, bundle+image audit, low-end Android RAM |
| P3 | Additional games/themes | Some games/event surfaces exist | Add original seasonal features gradually | Product policy, economy balancing, accessibility review |

## Design constraints
1. Keep TotiChat's existing original visual identity. Use tokens, spacing, hierarchy, accessibility, responsive layouts and sheet behavior as product patterns—not exact Dana screens/assets.
2. Do not replace working backend with mocked state. No frontend-controlled wallet/diamonds/role elevation; no duplicate send after network failure.
3. Preserve saved songs across reloads, synchronize room music from server state and keep audio independent of chat/gift repaint.
4. Show true loading/empty/error UI; never invent room counts, friendships, payments or membership entitlements.
5. Keep work in small reviewable branches and use GitHub CI and Android acceptance gates. A passing browser mock is not real-device audio proof.

## Deployment gate
1. `npm run check` and `npm run test:e2e` pass on the proposed merge commit.
2. Public Supabase contract matches current schema/RLS; admin security/performance advisor warnings reviewed per function, not blindly suppressed.
3. Google sign-in, Android first-install/update behavior, private/public room, LiveKit audio and playlist persistence verified on actual devices.
4. Financial and month-end transaction invariants proved in rollback-only tests; no real balances or settlements altered by QA.
5. Only then issue a new versioned APK with stable signing, verified hash, and explicit user-facing Beta limitations.

## Next implementation batches
- Batch 1 (this PR): real accepted-friends room list + unit checks.
- Batch 2: reproduce and repair any remaining physical Android installation issue with logs; verify real Google OAuth and LiveKit device matrix.
- Batch 3: reconcile UI screen-by-screen against the inspected source and create original design tokens/components without replacing working flows.
- Batch 4: finish tested owner/staff admin actions, settlement reports and long-running performance monitoring; release through a new version rather than mutating Beta.7.
