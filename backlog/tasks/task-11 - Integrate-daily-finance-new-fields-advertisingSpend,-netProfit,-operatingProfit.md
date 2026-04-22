---
id: task-11
title: >-
  Integrate daily finance new fields: advertisingSpend, netProfit,
  operatingProfit
status: Done
assignee: []
created_date: '2026-04-18 15:13'
updated_date: '2026-04-20 10:43'
labels:
  - daily-finance
  - backend-epics-89-93
  - unblocked
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend Epics 89-93 (2026-04-19): Daily finance now returns 4 new fields.

**Per-day (data[]):**
- `advertisingSpend: number` — ad spend from adv_daily_stats
- `netProfit: number` — operatingProfit minus advertisingSpend

**Summary:**
- `totalAdvertisingSpend: number`
- `totalNetProfit: number`

**Key decision (RESOLVED via task-13):** Backend added BOTH `operatingProfit` (pre-ads) AND `netProfit` (post-ads). Frontend's client-side `calculateDailyTheoreticalProfit()` in `aggregation.ts` computes the SAME formula as `netProfit`. Action: **retire client-side calc, use server `netProfit`**.

Files to update:
- `src/types/daily-metrics.ts` — add `advertisingSpend`, `netProfit` to `FinanceDailyData`; add `totalAdvertisingSpend`, `totalNetProfit` to summary type
- `src/lib/api/daily-analytics/api.ts` — add fields to `FinanceDailyResponseItem` + transform
- `src/lib/daily/aggregation.ts` — replace `calculateDailyTheoreticalProfit()` with `finance.netProfit` from backend; keep function as fallback if netProfit is null
- `src/types/daily-metrics.ts` — update `DailyMetrics.theoreticalProfit` → rename to `netProfit` or map server value
- `src/components/custom/dashboard/table-columns.ts` — add "Реклама" row using `advertisingSpend`
- `src/components/custom/dashboard/DailyBreakdownTooltip.tsx` — show advertisingSpend line
- `src/components/custom/dashboard/chart-config.ts` — add advertising as chart series

Null handling: apply CLAUDE.md anti-pattern #8. If `netProfit` is null (COGS unknown), show `—`.

Source: Backend Epics 89-93, doc-2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 FinanceDailyData includes advertisingSpend + netProfit (number | null)
- [ ] #2 Client-side calculateDailyTheoreticalProfit retired or used only as fallback
- [ ] #3 Daily table shows backend netProfit (not client calc)
- [ ] #4 New 'Реклама' row in daily breakdown using advertisingSpend
- [ ] #5 Null handling per CLAUDE.md anti-pattern #8

- [ ] #6 npm run type-check && npm run lint && npm test pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed via Story 91.2-FE (2026-04-20). Added advertisingSpend + netProfit + operatingProfit to FinanceDailyResponseItem and FinanceDailyData. Server-first profit: backend netProfit replaces client-side calculateDailyTheoreticalProfit (deprecated, kept as fallback). Finance-sourced advertising_spend preferred over separate API when > 0. +3 new tests. 6792 unit tests pass.
<!-- SECTION:NOTES:END -->
