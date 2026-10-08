# Beta.6 release verification — 2026-10-08

Application source: `1cab9e2fa35a27eb84ef219cbd107d76abe9d65b`.
Production backend: `bfadhdnudmsggylunhlh` (existing TotiChat project).

## Verified during this continuation

- Local lint/types/assets, 51 unit/DOM/lifecycle tests, production web build and independent admin syntax validation pass. Dependency audit reports zero known vulnerabilities in this run.
- Main startup chunk is approximately 391 KB; LiveKit remains deferred until room entry. This is not an Android speed measurement.
- Live rollback-only SQL checks pass for 42 currency assertions, administrative wallet authorization/idempotency/audit, music ownership/moderation isolation and gift quantities/retries. No existing users' balances or records were changed.
- New `tests/database-monthly-release-regression.sql` passes against the live functions. It checks denial of host self-finalization; mandatory compensation before clearing; 30% conversion of eligible fixed diamonds; preservation of historical earned diamonds, salary, agency target and commission; and duplicate-request protection. All fixture accounts, gifts, agency, ledger and audit entries are rolled back.
- Exactly one owner account exists and matches the previously designated owner email. No ownership assignment was changed.
- Public Auth settings confirm Google/email active and phone inactive. Beta.6 disables unavailable phone entry/linking and prevents unlinking Google in favor of the disabled phone provider. Enabling SMS requires verified provider configuration and a build with `VITE_PHONE_AUTH_ENABLED=true`.
- Beta.5 pipeline completed full browser/Android/signature/package validation. Beta.6 additionally fixes the provider-availability issue; only Beta.6 should be used for final acceptance.

## Final CI evidence

- Beta.6 APK pipeline: https://github.com/jsjsnsnsnsn0-pixel/TotiChat/actions/runs/37770026179
- PR validation: https://github.com/jsjsnsnsnsn0-pixel/TotiChat/actions/runs/37770031167
- Source review: https://github.com/jsjsnsnsnsn0-pixel/TotiChat/pull/27

The workflow publishes the direct APK, matching SHA-256 checksum and signing report only after the application/browser checks, Android assembly and package/version/signature verification succeed. Verify the linked run's final conclusion and release assets; this document does not replace those results.

## Acceptance required on physical devices

1. Google login and native callback on Android.
2. Voice on two devices in public and private rooms, including foreground/background microphone recovery.
3. Music heard by another participant, Stop/Leave cancellation, local-only volume and playlist persistence after restart.
4. Gift recipient/quantity/Send and synchronized balances.
5. Measured startup and room responsiveness on the target phone.

This is a debug-signed controlled beta, not a Play Store/general-public release. A signing mismatch with an older debug APK may prevent in-place installation. Dedicated arbitrary account level/VIP editing, general account bans and advanced CP administration remain incomplete product scope. Live paid recharge/SMS and operational month-end approval/payout are not certified. The settlement regression covers fixed-diamond close, not every business scenario or concurrent race.
