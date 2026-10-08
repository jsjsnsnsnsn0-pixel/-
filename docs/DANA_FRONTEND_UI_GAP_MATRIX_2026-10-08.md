# Dana-inspired TotiChat UI/UX comparison — working audit v1
2026-10-08 · Focus: FRONTEND ONLY · Reference: static package audit of Dana Group Voice Chat Rooms 1.0.66.

## What is and is not proven
- Dana's supplied XAPK was inspected **statically**, not through logged-in end-to-end gameplay. Its file/resource names indicate features, not full verified game rules or actual paytables. Reference families: `wheel`, `egg`, `plant`, `red`, `luckys`, `room_boom`, `py_room_game_slots`.
- New user-provided **latest TotiChat build has not yet been attached in this chat**. This audit reads the LIVE code on `stabilization-room-core`, not the new APK that the owner said they will send. Re-run screen-by-screen comparison after the file arrives; do not assume Beta.8 matches another unpublished build.
- Never copy Dana screens, assets, names, effects, trademarks, or source verbatim. Use interaction patterns to make an **original TotiChat** experience, preserving project identity and all functioning features.

## Current component inventory (evidence in repository)
| Reference area | Current TotiChat frontend | Gap to finish/verify | QA proof needed |
|---|---|---|---|
| Home/discovery & featured events | `HomeScreen`, `RoomsListScreen`, `RoyalRooms`, event modals | Visual hierarchy, original banners, real chip filters; Iraq/Saudi chips need actual room metadata, not cosmetic-only state | 360×800/393×852 responsive, no horizontal scroll, real result/empty/loading states |
| Public/private room & mic seats | `VoiceRoomScreen`, `RoomStage`, `MicrophoneSeat`, room management | Clear owner/mic/seat hierarchy, overlays/keyboard safe in portrait; Dana package hints at up to 30 seats but backend rules must be checked | No panel covers seat/chat; actual two-user voice QA |
| Room music/playlists | `RoomMusicPanel`, `RoomAudioContext`, `roomMusic` | Original playback visuals, loop/shuffle/queue details, real shared audio state; no fake audio indicators | Two devices, reopening private library, proper UX for listener vs moderator |
| Gift box / lucky gifting | `GiftBoxScreen`, `GiftStoreModal`, animation | Compact selector, recipient and 1/7/17/77/777, real stock Send, transparent sheet, distinct visual animation | One confirmed send per tap, no client deductions |
| Store/inventory cosmetics | `StoreScreen`, `InventoryScreen`, `VIPScreen`, `BadgesScreen` | Unified product preview/full screen state, equip vs own, duration, affordance and error designs; unique brand styles | No free/false entitlement; store backend unchanged |
| User profile / levels / CP | `ProfileScreen`, `UserDetailProfileScreen`, `LevelScreen`, `CharmWealthScreen`, `VIPScreen` | VIP 1–10 (retain TotiChat plan), CP relationship card, frames and hierarchy across private/public profile | Compare phone screenshots and verify server-provided values |
| Messages/search/follow/social | `MessagesScreen`, `ChatDetailScreen`, `FriendsModal`, `SearchModal` | Consistent list/chat indicators, unread and empty/error, follow privacy and good RTL | Tests for long chats, 320px and Android keyboard |
| Wallet/agents/settlements | `WalletScreen`, `AgencyScreen`, `RechargeScreen`, `MonthlySettlementPanel` | Polished read-only balances and real transaction statements; recharge through agents only, **no in-app purchasing** | Never change real balance with visual state or pretend settlement |
| **Games/activities** | `LuckGamesScreen`: backend `play_fun_game` supports `dice`, `rps`, `lucky_bag`; 50-row `game_results` history | First visual batch: refresh only these 3 playable games with consistent layout/feedback. Dana wheel, egg, plant, red, room_boom, slots only **reference candidates**, not yet implemented or verified | No false coins/diamonds, fake RNG or unverified gambling; do not show future mode as working |
| Theme/festival effects, ranks, seasonal banners | existing event modals and original images, `index.css` tokens | Shared spacing/color/effects system, lazy motion, seasonal theme opt-in (not a copied Dana theme) | Low-end TECNO KL5 responsiveness and reduced-motion mode |
| Settings/account/privacy | `SettingsScreen`, `AccountSecurityScreen`, `InternetCheckScreen` | Consistent account panels, permission/audio UX, back navigation; clear real error states | Account logout/relogin and data isolation |
| Admin dashboard | separate admin source and protected RPCs | Shared brand visual components, responsive table/mobile cards and owner-staff roles | Stay OUT of backend/production financial writes for UI-only batch |

## P0 frontend changes started now
1. **TotiFun facelift:** fresh original layout, polished game cards, tactile selectable rock/paper/scissors choices with pressed semantics, actual last result panel, accessible loading/error feedback, real history with retry, and accurate "latest N rounds" score label instead of a false lifetime total. Uses the same server RPC and does **not** change games, odds, rewards, balances, or financial accounting.
2. Add a regression test for the three real server games, no client random results, and no fake wallet rewards.
3. Preserve existing other screens untouched until the incoming APK's precise feature list and screenshots can be inspected and compared.

## Acceptance criteria for a claim of visual completion
- Every target screen has a directly verified equivalent **UX function** (not a proprietary visual clone), clear active/disabled/loading/empty/error states, a backed action for functional buttons, and accessibility/RTL checks.
- Consistent behavior across login → home → room → music → gifts → profile/CP → store/inventory → games → wallet/agency.
- Tests plus real Android 14 device screenshots; 100% cannot truthfully be claimed on static resource names, CI green checks, or an APK that has not been received.
- Any gambling-style wheel/slot with paid stake or convertible rewards requires separate approval, regulatory/product review, server ledger/odds/audit and anti-abuse design. Frontend preview alone does not authorize coin movements.
- No breaking backend, auth, voice, treasury, diamonds, moderation, settlement or already-working TotiChat features.
