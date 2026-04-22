---
id: task-13
title: 'Ask backend: advertising in operatingProfit formula?'
status: Done
assignee: []
created_date: '2026-04-18 15:13'
updated_date: '2026-04-19 15:33'
labels:
  - question-to-backend
  - daily-finance
  - backend-epics-89-91
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Frontend calculates `theoreticalProfit = sales - COGS - advertising - logistics - storage - penalties - paidAcceptance - commission` (includes advertising).

Backend's new `operatingProfit = revenueNet - cogsTotal - logistics - storage - penalties - paidAcceptance - commission` (does NOT include advertising).

Need backend to confirm one of:
A) Add advertising to the formula → frontend can replace client-side calc entirely
B) Keep as-is → frontend shows BOTH metrics: "Операционная прибыль" (from backend, pre-ads) + "Теор. прибыль" (client-side, post-ads)

This answer unblocks task-11.

Source: Backend Epics 89-91 analysis
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backend team has responded with A or B decision
- [x] #2 Decision documented in task-11 description
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RESOLVED 2026-04-19: Backend added BOTH operatingProfit (without ads) AND netProfit (with ads). netProfit = operatingProfit - advertisingSpend. This exactly matches frontend's theoreticalProfit formula. Client-side calc can be retired. See doc-2.
<!-- SECTION:NOTES:END -->
