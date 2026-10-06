# TotiChat UI/UX refinement — evolution, not redesign

## Audit before editing — 2026-10-06

All screen/common/room/modal TSX files were inventoried for controls, dialogs, typography, spacing and state handling. Existing identity: green gradient Home, pale green Messages, dark navy/purple room and social surfaces, gold/red VIP and ranking illustrations, light Recharge/forms and dark premium Wallet. Existing Cairo/Tajawal system font stack remains. No shared theme/token registry existed beyond CSS animation/gradient helpers; extracted tokens now describe existing values.

| Pattern | Existing convention | Inconsistency to address |
|---|---|---|
| Colors | #1fa373 Home, #0b0c16 dark, #141629 surfaces, #f8fafc light, purple/cyan actions, #f59e0b gold | State feedback and bare social/agency pages |
| Typography | Strong titles, 12–14px content, tiny decorative badges | 9–11px metadata used for important IDs and actions |
| Spacing | 16px page gutters, 12px rows, 8–12px gaps | Dense inputs/buttons, inconsistent section gaps |
| Radius | 16px cards, 12px controls, 24px sheets, circular avatars | Shared metrics absent; keep distinct functional shapes |
| Controls | Lucide icons, gradients, pressed scale | Many 24–36px hit areas, missing focus/accessible names |
| Room cards | Two-column grid/featured carousel, cover crop, owner/count/category | Click-only wrappers, UUID overflow, fallback fake VIP level |
| Room seats | Avatar, muted/speaking icons, locked/empty seat, genuine activity | Small names; ensure speaking ring never obscures text |
| Sheets/dialogs | Dark rounded sheets with backdrop | No shared Android Back dismissal or focus policy |
| Profile/VIP | Existing unified profiles, crests, decorative frames | Preserve artwork; improve names/IDs/stat readability |
| Messages | Fixed meta/text/avatar matrix | Low-contrast previews, no direct-conversation empty state |
| Search | Debounced backend accounts and current rooms | UUID row overflow, nested clickable targets, unclear initial state |
| Wallet | Existing Coins/Diamonds/source distinctions and completed ledger records | Long transaction UUIDs and no empty list feedback |
| Forms | Create already validates and submits inline | Inconsistent labels/focus/touch sizing |
| Loading/error | App shell transition and compact lazy progress; server hooks | Some bare text, missing inline retry hierarchy |

## Functional prerequisite

P0/P1 code stabilization passed 20 units and 45 Chromium cases in run 37407781484. No fake ranking actions remain, economic caches reconcile, minimize preserves session on Home, and lazy navigation no longer replaces the screen with a full-screen loader. Real-device microphone/transport verification remains explicitly pending; UI changes do not certify it. Economy, auth, RLS, room permission and realtime/audio semantics are outside this phase.

## Batch 1 — global consistency and navigation presentation

- Screens: shared app shell, navigation and every screen using shared search/avatar/button components.
- Components: index.css extracted palette/spacing/touch/radius/motion tokens; UIState reusable inline loading/empty/error feedback; PremiumButton, SearchBar, UserAvatar, BottomNavigation.
- Fixes: 44px action heights, visible keyboard focus, a labelled search/clear control, keyboard-operable clickable avatars, current-page semantics and reduced-motion support.
- Preserved: all colors/artwork/routes/actions/data/business calls; no new subscriptions or dependencies.
- Checks before commit: TypeScript, ESLint and 20 unit/DOM cases passed. Browser suite will run through CI; local Chromium remains unavailable.
- Device checks pending: keyboard/insets, actual touch and native Back.

## Remaining batches

Home/cards → voice room/sheets/profile card → full profile/messages/search/rankings → Wallet/Agency/forms/states → responsive/RTL/screenshots. Report each commit and its checks below. Existing functional roadmap remains active; UI polish must not silently implement or replace unfinished features.

APK/AAB: **NOT REQUESTED — skipped by owner instruction.**

## Batch 2 — Home and room cards

- Screens: Home and Rooms List; components: RoomCard and native Home room-card actions.
- Fixed: room cards are single native buttons (keyboard/touch supported, no nested action), long UUIDs wrap on shared cards, image decode/lazy loading and brief pressed feedback, readable names/counts, Home empty state, selected-filter semantics and RTL Rooms List.
- Presentation integrity: unknown country is omitted rather than defaulting to Iraq; VIP room cards do not invent VIP5/VIP6 for an owner with no VIP. Decorative numbered medals were replaced by an audio icon because this list is not the backend room ranking.
- Preserved: card variants, cover aspect ratios, owner/actual counts/category, joins, create/search/filter controls, banners and ranking entry points.
- Checks: TypeScript/ESLint passed; 23 units/DOM passed in the working increment, including exactly one join action per card. Batch 1 Chromium CI succeeded in run 37409278581 (45 browser tests); Android skipped. Further responsive screenshots and browser checks continue below.
- Real devices: thumbnail quality, long Arabic names and finger targets still require review.

## Batch 3 — voice room, sheets and profile card

- Screens: Voice Room and room member card; sheets: Room Info, Management, Gift Store, existing Home event modals, diamond redemption and daily reward.
- Components: shared dismissable-layer hook, overlay stack and a single native Back listener. Topmost overlay closes first; Escape closes it, keyboard focus stays in it, background scroll is locked and restored on cleanup. Native Back from an active room opens existing room options; it never silently calls leave-room. Unmount removes listeners.
- Fixes: consistent 44px mic/speaker/gift/hand/leave-seat targets, explicit pressed/busy state, keyboard-accessible empty/locked seats, readable truncated seat names, contained room UUID, wrapped announcement, safe sheet padding, labelled close buttons, member-list empty state, shortened profile-card sheet metrics. Existing decorations remain.
- Preserved: permission flow, capture/signaling/speaking-energy logic, mic moderation rules, gift requests/idempotency, seat actions, profile fields and all event/reward actions. No economy/RLS/auth changes.
- Tests: TypeScript/ESLint, 23 unit/DOM and web build passed before commit. Tests include top-overlay cleanup, Back destinations and Escape without leave. Added browser checks at 320/360/430px with ten seats, 44px controls and gift/options Escape; CI screenshots are uploaded separately. Real native Back/device keyboard/audio still need hardware verification.

## Batch 4 — profiles, messages, search and rankings

- Screens/components: existing Profile and full-profile view, ShimmeringAccountName, Friends list, Messages, Chat Detail, Search and Wealth/Charm/Room rankings.
- Fixes: readable plain names on dark surfaces (VIP artwork unchanged), long names constrained/wrapped, profile row keyboard actions, country/gender displayed only when present, clearer stats/actions, inline profile/relationship loading and retry, readable message previews/unread badges, conversation empty state, accessible official/system rows, chat empty state and input label.
- Search results are one native row action, with actual IDs wrapping, counts/host metadata readable and inline search/empty guidance. No new search API or extra initial requests.
- Ranking lower rows render only actual backend entries; seven invented empty numbered users/rooms are gone. Empty periods have an explicit state. Actual totals/period selection and podium artwork remain.
- All old social/couple/friend/message/search actions remain; no financial or audio logic changed. The chat no longer claims every user is online when `isOnline` is false.
- Checks before commit: TypeScript/ESLint and 23 unit/DOM cases passed. Batch 3 Chromium CI succeeded (48 tests, ten-seat widths 320/360/430px), Android skipped. Additional cross-screen screenshots and long-text checks follow in the final batch. Real keyboard/native interaction remains pending.

## Batch 5 — Wallet, Agency, forms and state polish

- Screens: Wallet, Recharge, Agency, Create Room, Edit Profile, profile bootstrap, Help; existing Login/VIP/Badge/name-theme overlays receive the same dismissal behavior without changing their functional logic.
- Fixes: Coins/Diamonds hierarchy retained, transaction amounts isolated LTR with original currency/sign, dates and UUIDs wrap independently, filtered transaction empty state, source-load retry, selected-record tabs, Agency headers/IDs/actions unified, destructive agency actions distinct, real pending-applications empty state, required create-name hint and busy progress, clear form field focus/text size, keyboard-operable form rows, named and dismissable recharge/edit/bootstrap sheets.
- Existing Recharge records shortcut is retained with an accessible name and 44px touch target. Final review removed an unnecessary duplicate added in this batch; navigation architecture unchanged.
- Preserved: balances/source calculations, conversion quotes/idempotency, recharge requests/agent-only payment, agency membership/permissions, profile saves, authentication and all previous actions. No database/RLS/economy/realtime changes.
- Games/Luck Games and full recharge-request records are still functional-roadmap items: current transaction model has no game-result type; no fake Games records or fabricated empty totals were added. Existing ledger records remain separate from pending recharge requests.
- Checks before commit: TypeScript/ESLint, 23 unit/DOM and web build passed. Batch 4 Chromium passed 48 tests; Android skipped. Added cross-screen screenshot/overflow review at 320/360/430px, long Arabic profile name and 320×480 short viewport; 52 browser cases now collected. Genuine Arabic IME/native Back and live audio require a device.

## Batch 6 — Responsive review and interaction polish

- Screens/components: Home banner/search/create controls, full profile badges, Recharge records shortcut, shared disabled controls.
- Banner indicators keep small decorative dots inside 44px buttons; automatic rotation respects reduced motion and hidden tabs. Long profile names retain actual level/country/gender badges. No fabricated data or business logic changes.
- Batch 5 CI: 23 unit cases and 49 browser cases passed; three cross-screen cases exposed duplicate records navigation. Removed the redundant entry and kept the original action. Final cross-screen and visual checks are rerun, including 320/360/430px, ten mic seats and short viewport.
- Physical-device verification remains: microphone/audio permissions and routing, Android Back/minimize/restore, Arabic IME, Bluetooth/background audio, performance on low-end phones. APK/AAB: NOT REQUESTED — skipped by owner instruction.

- Screenshot review additionally found a low-contrast non-VIP ID on dark full profile. Shared ID supports dark-surface text while retaining VIP gradients; copy action gains keyboard access and a 44px target.
