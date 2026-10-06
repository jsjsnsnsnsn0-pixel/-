# Room core stabilization — 2026-10-06

Branch: `stabilization-room-core`. Reviewed starting commit: `908ca4401ac91933d188a41a649e0263a2c59435`.

## Reviewed context

Read the original TotiChat audit and the repository's frontend, integration, currency and Android icon reports. Retained the existing authentication, wallet, diamond source accounting, Android identity/icon and server-backed features. This increment repairs the newest room core additions; it does not reapply the old fixes or database migrations.

## Findings and changes

- Two malformed JSX handlers in RoomManagementModal prevented TypeScript compilation. Corrected the closing braces.
- Room settings used undeclared Room fields and always started with enabled switches. Added the actual server-backed fields to the Room type and mapping, initialized the editor from persisted values when opening, and kept unsaved edits through periodic refreshes.
- Saving settings now awaits a server readback before reporting completion. A successful mutation followed by a failed refresh has a distinct message. Closing a room refreshes the confirmed state and clears the room immediately.
- The welcome announcement reads the existing `welcome_message`, with a legacy description fallback. The database has no separate public room ID column; removed the undeclared `publicId` reference and retained the actual UUID without fabricating an identifier.
- A room with disabled public chat disables the composer and guards submission. Disabled gift effects suppress the local animation without suppressing the server gift transaction. Vehicle and entrance settings are preserved; this change does not implement missing vehicle/entrance effects.
- Refreshing a public room previously retained an active room after the current user's membership was removed. It now requires the user's current membership, allowing the existing audio cleanup to stop capture and detach the room.
- Added accessible labels to room controls and updated the older browser scenarios for the existing exit dialog and gift-to-recharge path.

## Validation before commit

| Check | Result |
| --- | --- |
| TypeScript and ESLint (`npm run lint`) | PASS |
| Unit and DOM integration (`node --import tsx --test tests/unit/*.test.ts`) | 17/17 PASS |
| Asset validation | PASS |
| Production bundling | PASS; isolated test public configuration, not a release APK |
| Dependency audit | 0 vulnerabilities |
| Whitespace check | PASS |
| Playwright test discovery | PASS |
| Chromium browser execution | BLOCKED: downloaded archives from the available browser sources were incomplete HTML responses, not browser ZIPs |

The new DOM integration uses the real AppProvider, RoomManagementModal, VoiceRoomScreen and audio lifecycle hook with isolated server responses. It verifies persisted false flags, save readback and failure, welcome updates, disabled composer, gift effect suppression/enabling, membership removal, capture cleanup and owner room closure. Browser cases were added for the same paths but are not claimed as executed. DOM integration does not establish two-device voice transport, layout fidelity or real Google OAuth.

The normal tsx CLI could not create its IPC socket in this environment. Node's `--import tsx --test` executed the same test files successfully. jsdom and its types are pinned dev dependencies with the lockfile updated.

Read-only production schema/function inspection confirmed the room column names and the existing update_room_settings contract. No production DDL, data mutation, financial adjustment or migration application was performed.

## Remaining work

- Execute the full Chromium suite in a browser-capable runner before release, then build the APK from this branch with the real public configuration.
- Verify Google OAuth callback, microphone permission, background/resume behavior and voice between two physical Android devices; TURN remains a separate infrastructure task.
- Completed in the follow-up below: ordinary listener information/member view.
- Completed in the follow-up below: owner closed room list and reopening.
- Preserve the earlier report's remaining admin, support, direct voice message and migration-history work as separate increments.

The commit targets this branch only; no main merge or APK release is part of this increment.


## Follow-up: public room information and owner reopening

Starting point: `5841de39ce2e715529aa6323a19587c871e4509b`.

- Room title and member-count buttons now open a separate accessible public information dialog. It renders the current room and membership snapshots; ordinary listeners do not call management RPCs. Selecting a member opens the existing profile card.
- The server query includes active rooms and the current owner's rooms. Inactive owned rooms are held separately from the live list. The existing RLS can_view_room permits owner access to closed rooms; the existing reopen_room RPC enforces ownership.
- Closing a room takes the owner to the room list. Their closed rooms have a reopen action with a pending state, server readback and explicit error handling. Reopening preserves the UUID and does not automatically join or create a replacement room. Attempts to join an inactive room are rejected locally before the join RPC.
- DOM regression coverage extends through close/reopen success and failure, own/other closed room separation, inactive join rejection, and the ordinary listener info buttons. All 17 tests pass; the scenario contains additional assertions rather than duplicate test counters. Lint, assets, build and whitespace checks pass.
- Browser discovery includes 41 scenarios; two new browser cases cover listener information and owner reopening. Execution remains unavailable locally for the previously documented Chromium download reason.
- The existing GitHub validation/APK workflow now also runs on pushes to stabilization-room-core, enabling the full browser suite and conditional APK pipeline on the working branch with its existing public configuration. No store publication or main merge is introduced. The remote run's actual result must be checked separately.

No database migration, production record mutation, new finance behavior or fabricated member data is introduced by this follow-up.


### Remote validation follow-up

GitHub run `37404597168` on `389d49cd7d59cbcc7fa14dffa6f949f145486fee` executed Chromium successfully: 38/41 browser scenarios passed. Three failures were test locators: the former create-screen title, the renamed gift recharge button, and a welcome-text locator matching both the announcement and editor textarea. Corrected these specific selectors to the current heading, recharge title and announcement paragraph. No test was removed, skipped or weakened to accept an error. The APK job correctly stayed blocked while validation failed. A subsequent run is required to confirm the full suite and APK result.
