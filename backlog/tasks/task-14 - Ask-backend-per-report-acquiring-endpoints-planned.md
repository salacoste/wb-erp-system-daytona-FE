---
id: task-14
title: 'Ask backend: per-report acquiring endpoints planned?'
status: Done
assignee: []
created_date: '2026-04-18 15:14'
updated_date: '2026-04-19 15:33'
labels:
  - question-to-backend
  - epic-90
  - acquiring
  - backend-epics-89-91
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Request #166 asked for 3 acquiring endpoints. Backend delivered 1 daily endpoint (GET /v1/analytics/daily/acquiring).

Need backend to confirm:
A) Daily endpoint is the final scope → frontend drops Stories 90.2 (list) and 90.3 (detail by ID), builds a single acquiring analytics page
B) Per-report endpoints coming later → frontend keeps full Epic 90 scope but Stories 90.2-90.3 stay blocked

This answer unblocks task-12 (Epic 90 scope revision).

Source: Backend Epics 89-91, Story 91.5
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backend team has responded with A or B
- [x] #2 Decision documented in task-12
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RESOLVED 2026-04-19: Backend delivered ALL 3 acquiring endpoints exactly as Request #166 specified. Full Epic 90 scope restored. See doc-2.
<!-- SECTION:NOTES:END -->
