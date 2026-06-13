---
id: task-31
title: 'Fix backend CI baseline: circular dependencies and E2E auth throttling'
status: To Do
assignee: []
created_date: '2026-06-13 03:04'
labels:
  - qa-audit
  - backend
  - ci
  - tech-debt
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend PR #6 for task-24 is blocked by CI issues not introduced by the route-order patch. Evidence: CI Circular Dependencies found 20 cycles while workflow expects 0 or 1; E2E failed broadly because repeated /v1/auth/login calls hit 429 TOO_MANY_REQUESTS. Local backend origin/main type-check also reports existing bigint-related errors outside task-24. Need triage baseline, either reduce cycles / update baseline policy, fix E2E auth setup/rate-limit bypass, and restore type-check health or document accepted baseline before task-24 backend PR can merge cleanly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backend `npm run check:circular` passes under the CI policy or the policy has an explicit accepted baseline with diff-only enforcement.
- [ ] #2 Backend E2E auth setup no longer fails with 429 TOO_MANY_REQUESTS under CI parallel/retry load.
- [ ] #3 Backend `npm run type-check` baseline is either green or documented/managed so unrelated bigint errors do not block scoped PRs.
- [ ] #4 PR #6 can be rerun with CI gates clean or with only explicitly accepted unrelated baselines.
<!-- AC:END -->
