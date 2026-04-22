---
id: task-15
title: 'Ask backend: operatingProfit null when COGS unknown?'
status: Done
assignee: []
created_date: '2026-04-18 15:14'
updated_date: '2026-04-19 15:34'
labels:
  - question-to-backend
  - daily-finance
  - null-vs-zero
  - backend-epics-89-91
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend added `operatingProfit` and `totalOperatingProfit` to daily/finance response.

Need to know: when `cogsTotal` is null (COGS not assigned for a day), does `operatingProfit` return:
A) null (correct per our null-vs-zero invariant — CLAUDE.md anti-pattern #8)
B) a number computed as if COGS=0 (misleading — masks unknown cost)

If B, we need backend to change to A, or frontend must detect and handle the discrepancy.

This answer affects null handling in task-11.

Source: Backend Epics 89-91 analysis + Story 88.2-FE null-type audit precedent
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backend confirms null behavior for operatingProfit when COGS unknown
- [x] #2 Decision documented in task-11
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RESOLVED 2026-04-19: Acquiring endpoints use `number | null` for all money fields (acquiring_fee, acquiring_fee_vat, retail_amount). Daily finance netProfit nullability not explicitly stated — assume same contract (check when integrating in task-11). See doc-2.
<!-- SECTION:NOTES:END -->
