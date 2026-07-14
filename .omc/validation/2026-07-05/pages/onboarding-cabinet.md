# /onboarding/cabinet — TASK-SPEC URL MISMATCH (route is /cabinet)
**Spec URL:** /onboarding/cabinet · **ACTUAL URL:** /cabinet (route group `(onboarding)`)
**Validated:** 2026-07-06

## 1. Load
- **`/onboarding/cabinet` → 404 «This page could not be found»** — this URL does NOT exist.
- Per `src/lib/routes.ts:12`: «Onboarding routes (using route groups, so no /onboarding prefix in URL)». The actual route is **`/cabinet`** (file at `src/app/(onboarding)/cabinet/page.tsx`).
- This is a **task-spec error**, not a code bug. The 3 onboarding pages live at `/cabinet`, `/wb-token`, `/processing`.

## 2. Interactive elements (at the REAL url /cabinet)
| Element | Action | Effect | Pass |
|---|---|---|---|
| `useOnboardingGuard()` | navigate to /cabinet while authed with a cabinet | redirects to `/dashboard?week=2026-W26&type=week` | ✅ |
| CabinetCreationForm | (only renders for unauthed/no-cabinet users — not testable with current seeded owner) | — | ➖ |

## 3. Data vs API — N/A (redirect).

## 4. AP#8 runtime — N/A.

## 5. Findings
- **NOT a defect** — the routes work at their designed URLs (`/cabinet`, `/wb-token`, `/processing`). The validation task spec listed incorrect URLs (`/onboarding/...`). Verified: `/cabinet` → redirect to dashboard (guard fires for authed-with-cabinet users, which is the correct behaviour). Form-level validation not exercised (would require an unauthed/no-cabinet session).
- See `onboarding-wb-token.md`, `onboarding-processing.md` for siblings.
