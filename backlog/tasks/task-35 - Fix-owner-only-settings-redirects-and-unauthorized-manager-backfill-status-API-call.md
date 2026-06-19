---
id: task-35
title: >-
  Fix owner-only settings redirects and unauthorized manager backfill status API
  call
status: Done
assignee: []
created_date: '2026-06-16 16:55'
updated_date: '2026-06-16 16:55'
labels:
  - qa-audit
  - ui-validation
  - access-control
  - settings
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live role/settings validation found that manager access to owner-only settings pages triggered React router updates during render. `/settings/backfill` also issued `/v1/admin/backfill/status` for manager before redirect, producing 403/API console noise. Fixed by moving redirects to `useEffect` and gating `useBackfillStatus` with `enabled: isOwner`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manager navigation to `/settings/tariffs` no longer logs React router render-update errors.
- [x] #2 Manager navigation to `/settings/backfill` no longer calls owner-only backfill status API before redirect.
- [x] #3 Owner access to tariffs/backfill settings pages remains functional.
- [x] #4 Targeted unit tests, type-check, ESLint, and live owner/manager browser smoke pass.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation: moved non-owner redirects in `src/app/(dashboard)/settings/tariffs/page.tsx` and `src/app/(dashboard)/settings/backfill/page.tsx` from render path into `useEffect`; gated `useBackfillStatus({ enabled: isOwner })` to prevent manager 403 API calls.

Verification: `npm test -- --run 'src/app/(dashboard)/settings/tariffs/__tests__/page.test.tsx' 'src/app/(dashboard)/settings/backfill/__tests__/page.test.tsx'` => 30 tests passed. `npm run type-check` => passed. `npx eslint 'src/app/(dashboard)/settings/tariffs/page.tsx' 'src/app/(dashboard)/settings/backfill/page.tsx' --max-warnings=0` => passed. Live Playwright smoke `.omx/live-role-settings-form-check-fast.cjs` => owner+manager 16 routes, failing=0; JSON evidence `/tmp/live-role-settings-form-check-fast-after-owner-redirect-fix.json`.
<!-- SECTION:NOTES:END -->
