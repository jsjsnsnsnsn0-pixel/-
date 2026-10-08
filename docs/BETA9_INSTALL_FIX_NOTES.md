# TotiChat Beta.9 — Install Fix companion APK

### Why
Beta.8 (currently working on the owner's TECNO Android device) and original Beta.9 were signed with different transient GitHub Actions debug keystores. Android therefore rejects replacing the same `com.totichat.app` package in-place.

### Immediate non-destructive fix
This build preserves **all Beta.9 source-code fixes and production Supabase connections**, but packages the APK under **`com.totichat.app.beta9`**, labeled **TotiChat Beta 9 Fix**. Its Android application identity is different from Beta.8, so both packages can be installed on the same device at once. You **do not need to uninstall Beta.8**; its private device data remains under its original package.

CI must prove coexistence by installing the known SHA-256-verified Beta.8 released APK **first**, then this actual newly built companion APK on the **same Android 14 emulator**, and show both packages installed. The workflow also tests TypeScript, 70+ unit tests, browser E2E, production-config constraints, Gradle build, APK structure and signing.

### Important tradeoffs
- Beta.9 Fix is a **parallel test app**, NOT an in-place upgrade or a permanent signing repair. It has its own device-local storage and permissions. Existing Beta.8 app remains unchanged. Server-backed accounts remain in the same authorized Supabase project.
- The current **Google OAuth deep-link scheme remains `com.totichat.app://auth/callback`**, matching Supabase's existing redirect. Because both apps may handle that scheme, Android might present an **app chooser**; select **TotiChat Beta 9 Fix**, not the old Beta.8. On some Android versions/default-handler settings Google login may still route to the old app; this needs real-device verification and possibly a separately whitelisted callback scheme.
- Do not put financial or unsynced local-only data in this test version assuming it automatically migrates to the original installation.
- Production release updates still require a **single owner-controlled keystore in protected GitHub Actions secrets**; do not commit the keystore or passwords to source control. Issue #39 remains open.
- This does **not** certify LiveKit cross-device voice/music, full user acceptance, admin payroll operations, or 100% project completion.

VersionName `0.9.0-beta.9`, versionCode `900009`. Original TotiChat Beta.8: `com.totichat.app`. Companion: `com.totichat.app.beta9`. No DB changes.
