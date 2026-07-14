---
id: task-51
title: >-
  /analytics/search: position-change color likely inverted — confirm backend
  sign then fix (BD-25)
status: Done
assignee: []
created_date: '2026-07-02 09:15'
labels:
  - frontend
  - business-data
  - ux-validation
  - search
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
SearchPositionMoversTable.tsx:74-85 colors positionChange>0 green, <0 red. On Wildberries a LOWER position number = better rank, so if positionChange is Δ(avg position) a decrease (negative) is an improvement and should be green — i.e. the colors are likely backwards. positionChange is passed through raw (search-position-trends-normalizer.ts:44), so the sign convention is the backend's. STEP 1: confirm the backend definition of positionChange (delta of position number, or a pre-signed 'improvement' value). STEP 2: if it's Δ-position, swap the colors (or drive color from the `trend` enum improving/declining).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backend sign convention for positionChange confirmed and documented in a comment
- [x] #2 Color mapping matches business reality (improvement=green, decline=red) — verified against a known mover
- [x] #3 If driven off the `trend` enum, mapping is improving→green / declining→red / stable→muted
- [x] #4 type-check/eslint/vitest pass at baseline
<!-- AC:END -->
