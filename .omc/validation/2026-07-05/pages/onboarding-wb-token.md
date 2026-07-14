# /onboarding/wb-token — TASK-SPEC URL MISMATCH (route is /wb-token)
**Spec URL:** /onboarding/wb-token · **ACTUAL URL:** /wb-token
**Validated:** 2026-07-06

## 1. Load
- **`/onboarding/wb-token` → 404** (does not exist).
- Actual route **`/wb-token`** at `src/app/(onboarding)/wb-token/page.tsx` (route group, no `/onboarding` prefix).

## 2. Interactive elements (at /wb-token)
| Element | Action | Effect | Pass |
|---|---|---|---|
| `useOnboardingGuard()` | navigate to /wb-token while authed with cabinet | redirects to `/dashboard?week=2026-W26&type=week` | ✅ |
| WbTokenForm | (renders only for onboarding users; not reachable with seeded owner) | — | ➖ |

## 3-4. N/A (redirect).

## 5. Findings
- NOT a defect — same route-group design as `/cabinet`. `/wb-token` works (redirects authed-with-cabinet users). Task spec URL was wrong.
