---
id: task-24
title: Reconcile dashboard processing-status endpoint contract
status: To Do
assignee: []
created_date: '2026-06-12 13:02'
updated_date: '2026-06-12 23:06'
labels:
  - qa-audit
  - backend-contract
  - dashboard
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA audit found that dashboard loads call `/v1/imports/historical?limit=5`, which currently returns 404 from the backend and surfaces console errors/warnings in `useProcessingStatus`. Decide whether to restore that endpoint or update the frontend to the supported backend path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Loading `/dashboard` does not produce a 404 for historical import/processing status data.
- [ ] #2 The dashboard processing-status UI shows a valid empty/success/error state without console errors.
- [ ] #3 Frontend API client and backend route contract are documented or covered by an integration/unit test.
- [ ] #4 The fix preserves cabinet-scoped authorization semantics.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reconciled 2026-06-13: remains open. PR #7 did not change `src/hooks/useProcessingStatus.ts` or backend route precedence for `/v1/imports/historical?limit=5`; current frontend still calls that endpoint and prior browser evidence `/tmp/task23-30-browser-sweep.json` did not prove dashboard processing-status 404 is resolved. Keep To Do until backend/frontend contract is fixed and verified with cabinet-scoped route/API evidence.
<!-- SECTION:NOTES:END -->
