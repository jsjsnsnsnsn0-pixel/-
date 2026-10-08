# TotiChat reference room upgrade — 2026-10-06

Implemented incrementally on the existing application. Reference screenshots guide hierarchy and glass surfaces; no third-party design/assets were copied.

| Area | Existing component / change |
| --- | --- |
| Room | `VoiceRoomScreen` retains membership, audio, seats and gifts; `RoomStage` gets compact image/name/actual UUID header, lighter glass surfaces, independent emoji composer and direct private-message shortcut. Music remains in tools. |
| Seats | `MicrophoneSeat` retains the existing seat count and handlers; transparent circles with armchair/lock, small seat numbers, real mic/speaking/role/VIP/equipment states. Seat area can scroll for large seat counts and short screens. |
| User sheet | One `RoomUserProfileModal`, same transparent PNG avatar header for every account, current public badges, shared relationship card, social and separate moderation actions. `room_user_permissions` reads actual room membership/roles/protection and block state. Existing mutation RPCs continue enforcing authorization. No self kick/ban/role management. |
| Public profile | `ProfileHero` retains the existing avatar-backed large header; primary CP precedes actual statistics, agency and equipped items. Information/relationships tabs and expandable relationship details share `RelationshipCard`. No independent uploaded cover system was invented. |
| CP | Existing canonical `couples` records, occupancy uniqueness, pair/type conflicts and legacy action RPCs retained. `profile_relationships` invokes the same validated type-scoped read for every enabled catalog type. Both endpoints read the same relation UUID. |
| Future presentation | Catalog stores label, primary flag, icon/colors/frame/effect metadata and optional level thresholds. Server-owned `experience` is nullable; ranks/EXP only render when actual values and configured thresholds exist. New types remain unconfigured. |
| Agency | Target-scoped public summary (actual ID/name/member count) replaces viewer-dependent lookup. Independent profile section remains; existing own-agency portal works. Agency logos and a new public agency details page remain future work as requested. |
| Counters | CP days derive from `accepted_at` and server time, updated while open. Account counters come from public profile RPC. Wealth/charm ranks are hidden when absent; unrelated account level or a local gift-total formula cannot masquerade as rank. |
| Preserved | Gift send/accounting and animation, no center gift text panel, global click-to-room gift banner, draggable room-background minimized card, transparent exit choices, account security/linking/settings, audio lifecycle and existing management. |

## Validation

- TypeScript, ESLint, image-asset validation, production builds passed.
- 37 unit/DOM tests cover prior regressions plus role-dependent room sheet, CP/no CP, self, unavailable permission read, empty/locked/occupied/muted/speaking seats and automatic relationship days without invented EXP.
- Rollback-only database tests passed: room permission matrix, forged moderation rejection, membership revocation, canonical reciprocal CP/invalid-slot exclusion/replacement, typed uniqueness and cross-type conflicts, successful/ordinary/private global gifts, idempotency and safe navigation eligibility.
- No real relationships or user balances were altered by tests. Database migration only adds presentation/progress fields and permission/public-summary reads; only existing love catalog styling is configured.
- Managed browser/Android visual QA was unavailable; no claim of real-device visual or WebRTC transport testing.
- GitHub remains held pending the user's collective upload instruction.

## Private Site

The private Site is an isolated UI review and opens directly in the room without an application login. It uses the current production screen components with clearly labelled preview fixtures, mock providers and audio. The preview adapter implements the latest relationship and permission read contracts. No real accounts, balances or database authorization are changed. The real app retains its normal authentication.
