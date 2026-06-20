---
id: task-38
title: Fix login form pre-hydration native submit and duplicate auth retry
status: Done
assignee: []
created_date: '2026-06-16 17:09'
updated_date: '2026-06-16 17:09'
labels:
  - qa-audit
  - auth
  - security
  - e2e
  - ui-validation
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Supply planning E2E setup exposed that login could stay on `/login` after submit. Live diagnostic showed the form could natively submit before React hydration, leaking credentials into the URL (`/login?email=...&password=...`) with no API request. After preventing pre-hydration submit, diagnostic also showed failed login was retried automatically because global React Query mutation retry is enabled, causing duplicate `/v1/auth/login` POSTs and faster 429 throttling. Fixed by disabling login controls until hydration and setting the login mutation `retry: false`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Login submit does not leak password into the URL before hydration.
- [x] #2 Login submit sends exactly one `/v1/auth/login` POST per user click.
- [x] #3 Login mutation does not inherit global React Query mutation retries.
- [x] #4 Login unit tests cover no automatic retry even when global mutation retries are enabled.
- [x] #5 Targeted type-check, lint, and live browser diagnostics pass or are explained if backend throttle prevents a real success response.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: `src/components/custom/LoginForm.tsx` now disables fields/buttons until client hydration (`isHydrated`) to prevent native pre-hydration submit; login mutation has `retry: false` to avoid duplicate credential submissions under global mutation retry defaults. Added regression in `src/components/custom/LoginForm.test.tsx` that enables global mutation retries and asserts `loginUser` is called exactly once on failure.

Verification: `npm test -- --run src/components/custom/LoginForm.test.tsx` => 10 passed. `npm run type-check` => passed. `npx eslint src/components/custom/LoginForm.tsx src/components/custom/LoginForm.test.tsx --max-warnings=0` => passed. Live diagnostic after fix `/tmp/live-login-diagnostic-after-retry-fix.log`: URL stayed `/login` (no password query), exactly one POST to `/v1/auth/login`; backend returned 429 because earlier repeated setup attempts had already triggered throttle. Mocked-success browser check `/tmp/live-login-mocked-success-check.log`: exactly one POST, `passwordInUrl=false`, auth storage written, no console warnings/errors.
<!-- SECTION:NOTES:END -->
