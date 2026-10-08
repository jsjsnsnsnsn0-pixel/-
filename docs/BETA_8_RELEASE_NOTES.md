# TotiChat 0.9.0-beta.8 — Integrated stable-branch Android Beta
Date: 2026-10-08. Built from the latest QA-green `stabilization-room-core` source at `e27ea023cc297c3b0756c876ab4baef99f26d6f0`; source branch derived from that commit.

## Included user-visible fixes
- **Friends rooms:** real accepted-friend ownership filter; no fabricated first-two rooms.
- **New rooms:** newest-first ordering based on persisted room creation time.
- **Gift box:** a saved gift is selected first and then sent only by the explicit «إرسال من الحقيبة» action; no second Coins debit; stock gifts remain one per transaction, unlike regular gifts with quantities 1/7/17/77/777.
- **Direct messages:** last 80 messages render first and older messages can be revealed 80 at a time, with no database deletion.
- Previously integrated room, music, profile, gift inventory, dashboard and backend code is preserved; no production schema or wallets were modified as part of this APK release.

## Build verification and size
The GitHub Actions release workflow fails closed if npm security audit, lint, assets, unit tests, standalone admin checks, browser E2E, Android Gradle, APK integrity/signature, package/version fields, <90 MiB size or Android 14 emulator installation/launch fails. The 128 original JPG assets are optimized in the CI build workspace only; source originals remain unchanged. **Do not consider a download confirmed until the workflow succeeds and the GitHub Release asset exists.**

Package `com.totichat.app`, versionCode `900008`, versionName `0.9.0-beta.8`. Real backend: Supabase `bfadhdnudmsggylunhlh`; SMS login remains off until supported verification delivery is configured.

## Physical device warning
This is a **debug-signed test APK**, not a Play Store release. It may have a different signing certificate from previous debug builds even with a higher versionCode. Android can refuse in-place installation over an older differently signed `com.totichat.app`. **Do not uninstall or clear user data before backing up any device-only information.** Account-backed data is on the server, but unsynced local state may not be. APK installation on the owner's actual TECNO KL5 Android 14 remains unverified.

## Known release blockers and honest scope
- Two real independent phones: verify LiveKit voice, mic mute/unmute and room background music receive/playback, public/private rooms, reconnect and music playlist persistence.
- Verify Google sign-in callback with actual installed Android application.
- Validate wallet idempotency, actual agents/host settlements, owner Dashboard permissions and CP/VIP workflows without production financial writes.
- Triage Supabase SECURITY DEFINER warnings and private room column privileges (issues #37, #38 and #33).
- The app is not represented as 100% production ready; last weighted engineering estimate was ~68%, and device QA is still pending.

## GitHub evidence
- PR #32: friends. PR #34: newest rooms. PR #35: explicit saved gift send. PR #36: long-message rendering.
- Readiness report: `docs/TOTICHAT_READINESS_2026-10-08.md`.
- CI release: this tag's GitHub Actions run. APK SHA-256 and signing certificate verification attached to the GitHub Release.
