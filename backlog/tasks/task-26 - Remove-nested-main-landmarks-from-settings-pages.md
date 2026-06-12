---
id: task-26
title: Remove nested main landmarks from settings pages
status: Done
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-12 23:13'
labels:
  - qa-audit
  - a11y
  - settings
  - frontend
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA route sweep and targeted E2E found nested `<main>` landmarks on settings pages rendered inside the dashboard layout. `/settings/notifications`, `/settings/backfill`, and `/settings/tariffs` each render a page-level `<main>` inside the layout `<main>`, causing `mainCount=2`, accessibility issues, and strict locator failures in backfill tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings pages rendered under the dashboard layout use section/div containers instead of nested page-level `<main>` landmarks.
- [x] #2 `/settings`, `/settings/notifications`, `/settings/backfill`, and `/settings/tariffs` each expose exactly one main landmark.
- [x] #3 Backfill admin E2E no longer fails due to strict-mode `locator('main')` violations.
- [x] #4 Visual layout of settings pages remains unchanged.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: implemented in merged PR #7 (4bdeb984/5fc4958a). Evidence: settings pages/loading states were changed away from nested page-level `main`; final UltraQA probe `/tmp/ultraqa-dynamic-probe-final.json` reports `/settings/notifications`, `/settings/backfill`, and `/settings/tariffs` each `mainCount: 1, h1Count: 1`; focused tests `/tmp/task23-30-focused-tests2.log` passed settings notification/backfill/tariffs tests.

Review clarification 2026-06-13: `/settings` itself is a redirect-only page (`src/app/(dashboard)/settings/page.tsx` redirects to `ROUTES.SETTINGS.NOTIFICATIONS`), so the one-main evidence for `/settings/notifications` covers the default `/settings` landing path; subroutes `/settings/backfill` and `/settings/tariffs` were also verified with `mainCount: 1`.
<!-- SECTION:NOTES:END -->
