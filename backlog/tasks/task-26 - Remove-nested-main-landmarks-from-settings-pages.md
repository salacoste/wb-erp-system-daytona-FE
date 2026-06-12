---
id: task-26
title: Remove nested main landmarks from settings pages
status: To Do
assignee: []
created_date: '2026-06-12 13:02'
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
- [ ] #1 Settings pages rendered under the dashboard layout use section/div containers instead of nested page-level `<main>` landmarks.
- [ ] #2 `/settings`, `/settings/notifications`, `/settings/backfill`, and `/settings/tariffs` each expose exactly one main landmark.
- [ ] #3 Backfill admin E2E no longer fails due to strict-mode `locator('main')` violations.
- [ ] #4 Visual layout of settings pages remains unchanged.
<!-- AC:END -->
