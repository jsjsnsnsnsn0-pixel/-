# TotiChat Beta 0.9.0-beta.2 — direct APK installation

This branch packages the already integrated TotiChat Android Beta as an **APK directly attached to a GitHub prerelease** instead of forcing the tester to download and extract the ~110MB GitHub Actions artifact ZIP.

## Direct download

After workflow `TotiChat Beta Direct APK` finishes successfully, visit:
https://github.com/jsjsnsnsnsn0-pixel/TotiChat/releases/tag/v0.9.0-beta.2

In **Assets**, tap `TotiChat-Beta-0.9.0-beta.2.apk` (not `Source code (zip)`).
This is a debug-signed test APK. The workflow verifies AndroidManifest.xml, classes.dex, package name, version name, ZIP integrity, and SHA-256 before publishing it.

## Phone installation

1. Use an Android browser to download the actual `.apk` release asset, not the GitHub Actions artifact archive (`.zip`).
2. Open Downloads and tap the APK. Permit "Install unknown apps" for that browser/file manager when prompted.
3. If Android reports *App not installed* due to a signature mismatch with another debug build, back up account-associated/local data before uninstalling the old debug build. Do not delete app data casually.
4. Verify login, room joining, two-device audio, mute/unmute, gifts and synchronization with Supabase. Report device/Android version, steps and screenshots.

## Safety

This release uses the existing Supabase project, keeps `com.totichat.app`, changes versionCode to `900002`, and does not modify database balances or production deployments. It is **not** a Play Store release or proof of real-device audio stability. Beta dashboard SQL migrations from the integration branch still require separate review and rollout. Do not publish a success link until the release exists and has a .apk asset.
