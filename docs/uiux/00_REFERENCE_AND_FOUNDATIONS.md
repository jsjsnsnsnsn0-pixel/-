# TotiChat UI/UX evidence audit — 2026-10-09

Scope: isolated Vercel preview only; no production app, backend or APK changes.

Owner override: preserve existing TotiChat branding and colors. Skip UX-009 and the black/gold palette-replacement directives. Do not change the original falcon logo or visible app name.

## Stage 00

UX-001: BLOCKED. Dana XAPK resources listed in the PDF are static evidence, not a date-stamped real app walkthrough. No authenticated live Dana session supplied.

UX-002: REVIEWABLE PROPOSAL. The new UI audit tab provides clickable links between TotiChat Home, rooms, voice room, gifts, profile, and messages. Candidate return path: Splash -> authentication -> Home -> Room -> Seat -> Gift -> Exit, with profile and messaging branches. Owner review outstanding.

UX-003: PARTIAL. RTL/LTR specimen demonstrates ID and Latin username isolation. Current production screen components may hardcode dir=rtl; full bilingual screen review not done.

UX-004: BLOCKED. Dana exact spacing measurements cannot be inferred from static resources.

UX-005: DRAFT. Seven state examples Normal, Loading, Empty, Offline, Error, Permission, Disabled. State matrix is required across Auth S001-009; Home S010-019; Rooms S020-038; Messages S039-043; Profile S044-052; Wallet S053-059; Settings S060-070. Follow-up per-screen QA pending.

## Stage 01

UX-006: Voice social, warm, friendly and clear; do not overwhelm core room controls with decoration.
UX-007: Keep existing falcon logo aspect ratio, legibility, artwork and internal text unmodified.
UX-008: adaptive launcher icon concept needs separate owner consent.
UX-009: OMIT all color changes as explicitly requested.
UX-010: Specimens shown with 100%, 125%, 150% scale; full accessibility QA pending. Suggested sizes: display 28/34, heading 20/28, 16/24, body 14/21, labels 12/16.
UX-011: 4dp increments: 4, 8, 12, 16, 20, 24, 32; practical side margin 16-20dp; 48x48dp tap target. Use top screen-width selector for 320, 360, 390, 430dp preliminary review; these are CSS widths, not physical device tests.
UX-012: index C01-C24 in visual lab; reusable, editable, stateful Figma components still pending.

## User flow restrictions

Tapping a gift selects only and never sends. Explicit recipient, gift, quantity, full price, separate confirmation.
Music queue should distinguish local temporary from saved persistent, without claiming backend persistence.
Keyboard should not permanently lift room controls.
All real audio, authentication, coin ledger, agency settlement, purchases and moderation permissions are outside this UI-only preview.

## Verifiability

No task is considered complete until its concrete visual asset/component, state variants and applicable test evidence are available. Work remains staged and reviewable, not 100% verified.
