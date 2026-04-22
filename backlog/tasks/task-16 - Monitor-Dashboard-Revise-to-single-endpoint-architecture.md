---
id: task-16
title: 'Monitor Dashboard: Revise to single-endpoint architecture'
status: To Do
assignee: []
created_date: '2026-04-18 15:16'
updated_date: '2026-04-19 15:36'
labels:
  - monitor-dashboard
  - foundation
  - new-feature
  - scope-change
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**MAJOR SIMPLIFICATION** — Backend delivered `GET /v1/analytics/monitor/summary` which returns ALL 4 periods + KPI in one request. This replaces the 8-parallel-query architecture from doc-1.

Old plan (doc-1): 8 requests across 4 endpoints + client-side aggregation
New plan: 1 request → direct render

**Response shape:**
```
{
  periods: { today, yesterday, last30Days, prev30Days } // each: PeriodMetrics
  kpi: { totalProducts, productsWithCogs, cogsCoveragePercent, buyoutRatePercent, lastSyncAt }
  generatedAt: string
}
```

Each PeriodMetrics: `{ salesCount, returnsCount, revenue, cogs, expenses, advertisingSpend, margin }`

**Impact on tasks 16-21:**
- task-16 (this): REWRITE — 1 hook with 1 query, trivial normalizer
- task-17 (KPI cards): Simplified — KPI data comes from same response
- task-18 (metrics table): Simplified — periods pre-computed server-side
- task-19 (weekly chart): STILL needs separate daily/finance call (monitor/summary doesn't include daily breakdown)
- task-20 (buyout + pipeline): Buyout from same response; pipeline health still separate GET /v1/monitoring/pipeline-health-grid
- task-21 (tests): Scope reduced proportionally

**Action:** Update doc-1 spec, rewrite task-16 scope, simplify tasks 17-18-20.

Source: Backend Epics 89-93, doc-2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Types match MonitorSummaryResponse / PeriodMetrics / MonitorKpi interfaces
- [ ] #2 Single useMonitorSummary() hook with 1 GET request
- [ ] #3 Normalizer per Boundary Normalizer Pattern
- [ ] #4 Unit tests for normalizer
- [ ] #5 doc-1 updated to reflect single-endpoint architecture
<!-- AC:END -->
