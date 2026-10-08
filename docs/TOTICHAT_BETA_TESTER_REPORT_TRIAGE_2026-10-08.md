# TotiChat Beta — Tester Report Triage and Non-Destructive Fixes
Date: 2026-10-08
Scope: shipped Android Beta `0.9.0-beta.2` source branch. **No APK was rebuilt or republished.** No production wallet, user, room, gift or agency records were changed by the client-side UX patch.

## Verified backend evidence (read-only)
- 21 rooms exist and are marked active: 17 public, 4 private.
- 21 rooms belong to 10 distinct owner accounts; four owner accounts collectively have 11 extra historical rooms beyond their first. **Do not delete or merge these rooms automatically.**
- Mobile Beta fetches four sources at once: `rooms`, `room_members`, `room_seat_locks` and `user_room_links`. Previously a failed *optional* query rejected the whole room refresh.
- `set_my_room_seat` Postgres statement statistics during investigation: 301 observed executions; approx. 132ms mean, 4.7s maximum. Audio permission updates and LiveKit transport still need real-device verification.
- Actual room IDs are UUIDs, not simple numeric identifiers. User account IDs are public numeric IDs.

## Findings, proposed code changes, and remaining QA
| # | Item | Code prepared on this feature branch | Completion criteria |
|---|---|---|---|
| 1 | Overlapping home floating box on return from room | Replaced draggable large minimized-room overlay with a smaller fixed return-to-room button above bottom navigation; preserves return action | Test room minimize -> home -> messages -> back -> room on Android, with system keyboard and small screen |
| 2 | Missing public/owned rooms and multiple rooms per account | Makes room listing independent of optional metadata requests; preserves current in-room member/seat state during member-request timeout; adds explicit **غرفي** / My Rooms filter without deleting historical rooms | Test own 2+ public/private rooms; authenticated RLS; slow network, and room owner joining a private room |
| 3 | Oversized messages/settings/room capsule | Room header includes compact photo/title/UUID and explicit Manage action for authorized moderator/owner, with smaller private-message button and 2-column tools panel retained | Android 360px, 390px, landscape/short device, dialog dismissal, room ownership permissions |
| 4 | Slow mic/seat switching | **Not resolved**; confirmed backend latency spike up to ~4.7s. Current server rules intentionally keep room owners on microphone seat 1; changing that rule requires product approval and security tests. Avoid risky production change before stress tests | Two real devices, seat 1-20, mute/unmute, permission granted/denied, mic switching, same-room concurrent users, LiveKit published audio |
| 5 | User vs room ID confusion | Split search into **البحث عن حساب** and **البحث عن غرفة**. Numeric public account ID shows exact account only; room lookup matches UUID exactly. Removed premature search-modal dismissal before room join completes | Test account ID vs UUID vs username, agency-branded profile names, zero results, self-ID and partial IDs |
| 6 | Entry/exit/re-entry slow | Room refresh no longer drops the active room merely because member metadata timed out; a successfully committed join remains visible if a later directory fetch fails; successful room creation displays a recoverable warning rather than encouraging a duplicate create request | Real Android enter/exit/rejoin private and public; failed RPC recovery; LiveKit room reconnection |
| 7 | Working pages (recharge/diamonds/VIP/profile/login) | Preserved; these sections have not been edited | Regression spot-check before release |
| 8 | Music controls lower than desired | Music access moved from bottom toolbar into top header; now-playing controls moved above seats | Verify owner plays MP3, pause/resume, listener hears stream and music continues correctly |

## Release gate
- Source code is prepared **only on** `fix/beta-room-ux-search-reliability-20261008`.
- CI is configured to run TypeScript, ESLint, asset checks, unit tests, Vite build, and Chromium mobile-viewport browser tests **without releasing another APK**.
- Passing static/browser tests is **not** proof that the installed APK contains these changes; it does not.
- Do not merge into the shipped Beta or publish a new APK without explicit approval and an actual Android regression pass.
- Open backend-only fixes separately only after reproducing and testing (no unnecessary changes to accounts, balances or historical room rows).

## Mobile acceptance path
Login -> home -> Create Room -> room list -> join -> tap seat -> mute/unmute -> switch seat -> room settings -> message/search -> exit -> home -> return -> music -> owner private-room re-entry. Capture network RPC and real audio behavior when latency/timeout persists.
