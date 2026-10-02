# Bible Reader — Real-device QA rules

Updated: 2026-09-02

## Regression that triggered this rule

During multilingual UI work, GitHub Actions and static checks passed, but Android/Samsung native `<select>` pickers could open without reliably applying a tapped option. The localization `MutationObserver` was rewriting `<option>` text while the native picker was active.

## Required distinction

- `CODE/CI PASS`: syntax, static validation, automated checks, build/deploy pipeline.
- `BROWSER PASS`: actual desktop browser interaction verified.
- `MOBILE REAL-USE PASS`: actual mobile device touch/native-picker interaction verified.
- `FULL QA PASS`: use only when all required layers above are actually verified.

Never call CODE/CI PASS a full inspection.

## Mobile-native interaction checklist

For every change touching navigation, localization, DOM observers, or responsive layout, verify on a real mobile device:

1. Translation selector opens and applies selection.
2. UI-language selector opens and applies selection without changing the selected Bible translation.
3. Book selector opens, scrolls, and applies a tapped book.
4. Chapter selector opens and applies selection.
5. Verse selector opens and applies selection.
6. Search input accepts keyboard text and search button works.
7. Compare, font-size, width, theme, and records controls remain tappable.
8. Records panel tabs, note editor, delete buttons, and outside-tap close work.
9. No native picker is disrupted by `MutationObserver`, timers, or DOM rewrites while open.
10. Layout does not overlap at common mobile widths.

If the current execution environment cannot perform real-device interaction, mark these checks as `PENDING REAL DEVICE` and rely on the user's real-device result before declaring FULL QA PASS.
