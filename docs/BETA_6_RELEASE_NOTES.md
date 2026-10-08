# TotiChat 0.9.0-beta.6 — integrated Android test build

This build combines the approved transparent gift/profile UI, quantities 1/7/17/77/777 and explicit Send, private cloud music playlists, private-room microphone fixes, compact keyboard-aware room layout, agencies/store/inventory and reduced startup loading.

Audio fixes include local-only music volume, cancellation of pending playback after Stop/Leave, and microphone recovery when returning to the foreground while music is published. Existing production currency and moderation fixes are preserved.

Download the APK directly; the matching SHA-256 checksum and signing-certificate report are attached. Package ID: com.totichat.app; versionCode: 900006. This is a debug-signed prerelease for controlled testing, not a Play Store or general-production release. A different debug signing certificate from an older APK may prevent an in-place update. Preserve local files before removing any older installation; saved cloud playlists remain account-scoped.

Automated checks cover types/lint/assets, 51 unit tests, browser integration tests, web/admin build, Android assembly, package/version and APK signature verification. Browser backend/audio responses are mocked. Rollback-only live database regression covers currency, quantity/idempotency, admin wallet permissions/audit and private music isolation.

Before approving a public release, verify on two real Android devices: Google/native OAuth return, voice in public/private rooms, microphone recovery after backgrounding, broadcast music heard by the other device, Stop/Leave cancellation, saved playlist after restart, gifts and balance synchronization, and startup responsiveness. Live SMS/recharge/month-end business operations are not certified by these automated checks.

The independent admin source is included in the repository, not embedded in the Android app. Dedicated arbitrary level/VIP editing, general account bans and advanced CP administration remain outside the completed admin actions; this build does not claim these are finished.

Follow-up to Beta.5: production Auth confirms Google/email enabled and phone disabled. Phone login/linking is now explicitly unavailable, and Google cannot be unlinked in favor of a disabled phone provider. This protects users from failed SMS requests and account lockout. No SMS provider was enabled or purchased.
