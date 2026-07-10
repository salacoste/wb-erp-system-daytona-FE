# /register — public auth
**Route:** /register · **Validated:** 2026-07-06

## 1. Load
- Page exists at `src/app/(auth)/register/page.tsx`. For authed users → redirects to `/dashboard?week=2026-W26&type=week` ✅ (verified).

## 2. Interactive elements
| Element | Action | Effect | Pass |
|---|---|---|---|
| Authed redirect | goto /register while authed | → /dashboard (no point registering when logged in) | ✅ |
| Form fields + validation | (not exercised — would create throwaway account on real BE; form component at register/page.tsx) | ➖ |

## 3. Data vs API
- Registration endpoint `POST /v1/auth/register` — not exercised to avoid polluting the user table. Redirect-when-authed behaviour verified.

## 4. AP#8 runtime — N/A.

## 5. Findings
- No defects in the redirect path. Form submission not tested (account-creating mutation on real data — skipped per destructive-ops guidance).
