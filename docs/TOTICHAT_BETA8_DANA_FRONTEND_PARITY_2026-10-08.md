# Original TotiChat design parity audit from supplied Beta.8 APK and Dana 1.0.66 XAPK
2026-10-08. **Frontend UI/UX comparison, not copied code/assets or paid game rules.**

## Verified immutable files
- Submitted TotiChat APK: `TotiChat-Beta-0.9.0-beta.8.apk`, **32,799,506 bytes**, SHA-256 `ffc7bcec593cf9868c40a6fd4e6f5ac58ed1d00a2757230f577105f7bb28ad7d`. ZIP integrity valid (no bad entries). This exactly matches the previously released GitHub Beta.8 binary and includes compiled Vite/Capacitor frontend.
- Beta.8 APK had 668 total ZIP entries, including 229 under `assets/` and 128 packaged JPGs. Number of compiled screen JavaScript chunks with `Screen-` in filenames: 27. This is a build artifact, not a complete list of live screens/routes, because Vite may merge chunks.
- Dana XAPK package was accessible locally, ZIP integrity valid; nested core APK `com.sync.partynow.company.apk` inspected statically. The core contained 2,220 ZIP entries and 1,569 paths under `assets/flutter_assets/assets/`.
- Dana resource name matches (overlapping groups, **not verified game counts**): wheel 40, egg 40, plant 23, red 32, luckys 47, room_boom 45, slots 13, CP 71, friendship 88, music 43, room 423. These counts cover resource filename matches and can overlap; **not equivalent to 40 working games, screens, payouts or live features**.
- Dana is a third-party reference; do not extract or publish its proprietary art, Flutter/Dart code, sound tracks, branding or API keys into the TotiChat repository. Build original UI and first-party assets.

## UI/UX target matrix — STATUS at source revision before this batch
| UX domain | Beta.8 / TotiChat current situation | Reference-inspired improvement and acceptance |
|---|---|---|
| Home party discovery | Six discover banners; featured ranking podiums and popular rooms; country chips selected visually without filtering. | **This batch:** real country-filtered rooms from server-backed owner's `profiles.country_code`, popularity using actual `usersCount`, 8 lazy-image cards, explicit empty-state fallback, all-rooms route. Royal screens keep independent controls. |
| Event banners | Six clickable images were non-keyboard-accessible divs. | **This batch:** native focusable buttons with action labels, original images preserved. |
| Room management / seats | Already has actual room, protected seat, chat, owner/moderation UX | Owner/mic/seat state, accessible overlays, no keyboard covering controls, route and mic state consistency. No fabricated participants. |
| Shared music | Real private song upload/list and LiveKit, banner+panel and recent PR #40 fixes | Consistent mini-player, playback error states, selected song/queue/loop/shuffle (latter not yet implemented), live two-phone audio QA. |
| Gifts | Confirmed select recipient then explicit send, quantity 1/7/17/77/777 for catalog; saved inventory path separate | Original transparent bottom sheet, animations budgeted for low-end phones, no duplicate debit. |
| Store and inventory | Store catalog, user wallet, cosmetics, owned state, CP/VIP sections | Filtered catalog, equip vs buy, preview/fullscreen, consistent permission state. No false VIP/ownership. |
| Relationships and social | Profile, CP, ranks, friends, messaging | Clear individual roles, levels and relationship progression. Preserve server truth. |
| Wallet/agency | Real wallet and agent requests (outside-app recharge only) | Improve hierarchy, statements and empty/error loading; never fake recharge outcomes. |
| Games | TotiFun already supported protected `dice`, `rps`, `lucky_bag`. Dana has resources referring to wheel, egg, plant, red, room boom and slots. | Earlier PR #41 refreshed three real games. Remaining reference modes need original, fully operational *no-stake* mechanics or separate audited server games; static artwork alone cannot count as complete. |
| Settings, login, privacy | Current account and security screens exist | Consistent contrast, RTL, field hints, validation and accessible navigation. |

## Important distinction for user acceptance
`Beta.8` is an **older immutable binary**: it does not yet contain PR #40's music UX safeguards, PR #41's TotiFun visual refresh, or the source changes in this branch. They must be verified in a *new* APK release before claiming they're installed.

## Defect confirmed and fixed in this batch
`HomeScreen` previously set `selectedFilter` to `iraq`/`saudi` but always rendered `rooms.slice(0,4)`, and extra countries in the dropdown had click handlers that did nothing. `AppContext` never set `Room.countryFlag`. Country chips therefore showed false functionality.

The fix reads only `profiles.id,country_code` for room owners as **optional public metadata** (permission/RLS failures don't hide rooms), derives ISO regional-flag emojis safely, and filters real room data with truthful empty states. It adds no columns, does not mutate accounts, and uses existing Supabase client credentials.

## Release checks and remaining gates
1. CI: TypeScript, lint, assets, unit, admin, build and Playwright.
2. Display on actual Android 14 TECNO KL5 with existing Beta.8 baseline, and visually inspect revised Home at 360×800 and short keyboard viewport.
3. Verify multiple real owner-country profile records are readable through normal authenticated RLS and country filter matches displayed cards. Countries unknown remain unknown, not guessed.
4. Review remaining 27+ screen areas independently. 100% UX completion must be backed by screenshot/page-state and touch/error tests, not by APK resource counts.
