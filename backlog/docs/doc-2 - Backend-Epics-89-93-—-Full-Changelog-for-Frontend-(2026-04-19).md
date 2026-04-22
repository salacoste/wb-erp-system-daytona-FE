---
id: doc-2
title: Backend Epics 89-93 — Full Changelog for Frontend (2026-04-19)
type: other
created_date: '2026-04-19 15:32'
---
## Summary

Comprehensive backend update covering Epics 89-93. This is the FINAL backend delivery that unblocks all frontend work. Key changes:

1. **Daily Finance +4 fields** — `advertisingSpend`, `netProfit`, `totalAdvertisingSpend`, `totalNetProfit`. The `netProfit` field is EXACTLY what frontend's `theoreticalProfit` was computing client-side. Client-side calc can be retired.
2. **Monitor Dashboard endpoint** — NEW `GET /v1/analytics/monitor/summary` returns ALL 4 periods + KPI in a SINGLE request (replaces our planned 8-request approach from doc-1).
3. **Acquiring Reports — 3 endpoints** (Request #166 fully delivered) — list, detail-by-ID, detail-by-period. All snake_case, null-preserving, 30min cache.
4. **Pipeline Health +3 fields** — `errorRate`, `tasksWithErrors`, `totalResultErrors`.
5. **Search Analytics breaking change** — `totalRevenue` removed from all 3 endpoints.
6. **SDK migration** — transparent, no frontend impact.

---

## Critical Resolution: theoreticalProfit → netProfit

**Previous question (task-13):** "Should advertising be in operatingProfit formula?"

**Backend answer:** They added BOTH:
- `operatingProfit` = revenueNet - cogs - logistics - storage - penalties - paidAcceptance - commission (WITHOUT ads)
- `netProfit` = operatingProfit - advertisingSpend (WITH ads) ← THIS replaces our client-side `theoreticalProfit`

**Frontend action:** Replace `calculateDailyTheoreticalProfit()` in `aggregation.ts` with backend's `netProfit`. The formula matches exactly: `sales - cogs - advertising - logistics - storage - penalties - paidAcceptance - commission`.

This resolves task-13 (question answered) and unblocks task-11 (integration).

---

## Critical Resolution: Monitor Dashboard — 1 endpoint replaces 8

**Previous plan (doc-1):** 8 parallel requests across 4 different endpoints.

**Backend delivered:** Single `GET /v1/analytics/monitor/summary` that returns:
- `periods.today`, `periods.yesterday`, `periods.last30Days`, `periods.prev30Days` — all pre-computed server-side
- `kpi.totalProducts`, `kpi.productsWithCogs`, `kpi.cogsCoveragePercent`, `kpi.buyoutRatePercent`, `kpi.lastSyncAt`
- `generatedAt` timestamp

**Frontend impact:** MASSIVE simplification. Tasks 16-20 can be merged/reduced. Instead of 8 parallel queries + client-side aggregation, it's 1 query + direct render.

---

## Critical Resolution: Acquiring — All 3 endpoints delivered

**Previous question (task-14):** "Per-report endpoints coming?"

**Answer:** YES — all 3 delivered exactly as Request #166 specified:
1. `GET /v1/analytics/acquiring/reports?from=&to=` — report list
2. `GET /v1/analytics/acquiring/reports/:id/detail` — detail by ID
3. `GET /v1/analytics/acquiring/detail?from=&to=` — period detail

All snake_case, `number | null` for money fields, `cached_at` in every response. Matches CLAUDE.md anti-pattern #8 (null-vs-zero) perfectly.

This resolves task-14 (question answered) and unblocks task-12 (Epic 90 scope — now FULL scope, not reduced).

---

## Complete TypeScript interfaces (from backend)

See section 8 of the raw backend changelog for copy-paste-ready interfaces:
- `MonitorSummaryResponse`, `PeriodMetrics`, `MonitorKpi`
- `AcquiringReportListItem`, `AcquiringReportDetailItem`, `AcquiringListResponse`, `AcquiringDetailResponse`
- `FinanceDailyItem` (updated +2 fields), `FinanceDailySummary` (updated +2 fields)
- `SearchQueryItem`, `SearchOrdersSummary` (REMOVED fields)
- `PipelineHealthData` (+3 fields)

---

## Backlog task impact

| Task | Impact | New status |
|---|---|---|
| task-10 (remove totalRevenue from search) | CONFIRMED — proceed as-is | Ready to implement |
| task-11 (integrate operatingProfit) | EXPANDED — now also netProfit + advertisingSpend | Update scope, unblocked |
| task-12 (revise Epic 90 scope) | REVERSED — full 3-endpoint scope restored | Update scope, unblocked |
| task-13 (question: advertising in formula) | RESOLVED — backend added both operatingProfit AND netProfit | Close |
| task-14 (question: per-report endpoints) | RESOLVED — all 3 delivered | Close |
| task-15 (question: null when COGS unknown) | LIKELY RESOLVED — money fields are `number \| null` in acquiring; check daily/finance | Verify + close |
| task-16-21 (Monitor Dashboard) | MAJOR SIMPLIFICATION — 1 endpoint replaces 8 queries, update doc-1 | Revise scope |
