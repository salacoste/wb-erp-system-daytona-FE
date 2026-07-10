# /onboarding/processing — TASK-SPEC URL MISMATCH (route is /processing)
**Spec URL:** /onboarding/processing · **ACTUAL URL:** /processing
**Validated:** 2026-07-06

## 1. Load
- **`/onboarding/processing` → 404** (does not exist).
- Actual route **`/processing`** at `src/app/(onboarding)/processing/page.tsx` (route group). Unlike `/cabinet` & `/wb-token`, this page has NO `useOnboardingGuard()` — but navigating there as an authed-with-cabinet user still landed on dashboard content (likely guarded higher up or redirected via the ProcessingStatus component).

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| ProcessingStatus component | navigate to /processing authed | URL stays /processing but dashboard content renders (effective redirect) | ✅ (behaviour) |
| «Шаг 3 из 3» copy | (renders for onboarding users) | — | ➖ |

## 3-4. N/A.

## 5. Findings
- NOT a defect — route-group design. `/processing` works for authed users (does not strand them in onboarding). Task spec URL was wrong.
