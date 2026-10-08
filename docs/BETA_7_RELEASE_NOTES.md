# TotiChat 0.9.0-beta.7 — smaller direct-install Android beta

## Why this version exists
A tester could not install Beta.6 after Chrome stalled at the end of a roughly 113 MB download. The official Beta.6 archive itself passed integrity, signature and clean Android 14 emulator installation checks; the original user-device refusal was not conclusively diagnosed.

Beta.7 reduces download size by optimizing the same 128 bundled JPG artworks *only inside the Android build workspace*. Names, file paths, app screens, transparent overlays, server contracts, images' composition, permissions, account balances, and Supabase project are preserved. Repository originals are unchanged.

## Verified release gate
This workflow checks dependency security, TypeScript/ESLint, assets, unit and browser suites, standalone dashboard source, Android Gradle build, actual package/version, APK signing and checksum. It **also performs clean installation and initial launch on a fresh Android 14 emulator before the release is published**. An APK over 90 MiB fails the build rather than being released as a "lite" version.

Package name: `com.totichat.app`; versionName: `0.9.0-beta.7`; versionCode: `900007`. Uses the existing production backend; phone/SMS login remains disabled because the provider is not configured.

## Installation and warnings
Download the exact `.apk` asset, not the GitHub Actions ZIP. A matching `.sha256` and signing report are attached. **This remains a debug-signed testing build** with a newly generated debug certificate, not a Play Store release; updating over a different debug-signed TotiChat build may be blocked. Preserve user files before any uninstall. Cloud playlists and server-backed balances remain tied to the account.

No new paid recharge, salary settlement, CP administration, account level/VIP edits, or global bans are claimed to be complete. On physical Android devices, test Google authentication callback, microphone in public/private rooms, music between two devices, playlist persistence, gift sending, and startup performance before wider rollout.
