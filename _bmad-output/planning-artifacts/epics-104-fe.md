# Epic 104-FE: Backend Coordination Follow-up — Daily Breakdown + FCU 10th Category

**Priority**: P1 (closes gaps surfaced in backend 2026-05-15 follow-up audit)
**Estimate**: ~8 SP (range [6, 10])
**Source**: Backend coordination follow-up 2026-05-15 confirmed `/v1/analytics/daily/finance` and `/v1/analytics/daily/advertising` are live (Epic 88 Stories 88.1+88.2); FCU aggregation already integrated but 10th category may be view-mode gated
**Created**: 2026-05-15

## Objective

Replace zero-fallback rendering in Daily Breakdown table (finance + advertising rows) with real backend data from two now-live endpoints. Verify FCU `delivery_to_warehouse` (10th cost category) renders correctly on Unit Economics SKU view and decide whether to extend to brand/cabinet views.

## Context

Backend 2026-05-15 confirmed:
1. **Daily Finance**: `GET /v1/analytics/daily/finance?from=&to=` — shipped Epic 88 Story 88.1, returns 17 per-day finance fields (`revenueGross`, `cogsTotal`, `grossProfit`, `marginPct`, `logistics`, `storage`, `penalties`, `paidAcceptance`, `commission`, `operatingProfit`, `advertisingSpend`, `netProfit`, `salesCount`, `returnsCount`, etc.). Sources: `wb_finance_raw` + `cogs` + `adv_daily_stats`. Cache 10 min.
2. **Daily Advertising**: `GET /v1/analytics/daily/advertising?from=&to=` — shipped Epic 88 Story 88.2, returns 9 per-day ad fields (`spend`, `views`, `clicks`, `ctr`, `cpc`, `orders`, `revenue`, `roas`). Source: `adv_daily_stats`. Cache 10 min.
3. **FCU Aggregation**: `GET /v1/shipment-cost/by-sku` — already integrated via `useFcuBySku` (`src/hooks/use-fcu-aggregation.ts`), merged via `mergeDeliveryCosts()` in `useUnitEconomicsPageState.ts:135`. Gated to `viewBy === 'sku'`. Backend asks: confirm 10th category renders; if gap, decide whether to extend gating to brand/cabinet views.

Current FE state: `DailyBreakdownChart` and `DailyBreakdownChartStates` show "0 ₽" for finance + advertising rows because API functions catch errors → return `[]`. Both endpoints now live and ready.

## Endpoint Specs

### 1. Daily Finance

**`GET /v1/analytics/daily/finance?from=YYYY-MM-DD&to=YYYY-MM-DD`**

Auth: Bearer JWT + `X-Cabinet-Id`

Response:
```json
{
  "data": [
    {
      "date": "2026-05-01",
      "revenueGross": 150000,
      "returns": 10000,
      "revenueNet": 140000,
      "cogsTotal": 60000,
      "grossProfit": 80000,
      "marginPct": 53.3,
      "logistics": 5000,
      "storage": 2000,
      "penalties": 0,
      "paidAcceptance": 1500,
      "commission": 14000,
      "operatingProfit": 57500,
      "advertisingSpend": 8000,
      "netProfit": 49500,
      "salesCount": 75,
      "returnsCount": 5
    }
  ],
  "summary": { /* aggregate totals */ }
}
```

Test examples: `test-api/06-analytics.http` entries 15, 17.

### 2. Daily Advertising

**`GET /v1/analytics/daily/advertising?from=YYYY-MM-DD&to=YYYY-MM-DD`**

Auth: Bearer JWT + `X-Cabinet-Id`

Response:
```json
{
  "data": [
    {
      "date": "2026-05-01",
      "spend": 8000,
      "views": 50000,
      "clicks": 1200,
      "ctr": 2.4,
      "cpc": 6.67,
      "orders": 45,
      "revenue": 67500,
      "roas": 8.44
    }
  ],
  "summary": { /* aggregate totals */ }
}
```

Test examples: `test-api/06-analytics.http` entries 16, 24.

Bonus: `GET /v1/analytics/advertising?include_daily=true` — daily nested in response (alternative).

### 3. FCU Aggregation (already integrated)

**`GET /v1/shipment-cost/by-sku?week=2026-W14`**

Already wired:
- API client: `src/lib/api/shipment-cost/fcu-aggregation-api.ts` (`getFcuBySku`)
- Hook: `src/hooks/use-fcu-aggregation.ts` (`useFcuBySku`)
- Consumer: `src/app/(dashboard)/analytics/unit-economics/useUnitEconomicsPageState.ts:135` (`useFcuBySku(viewBy === 'sku' ? selectedWeek : undefined)`)
- Merger: `mergeDeliveryCosts()` populates `costs_rub.delivery_to_warehouse` + `costs_pct.delivery_to_warehouse`
- Tests: API client (5), hook (7), merger (mergeDeliveryCosts.test.ts)

## Stories

### Story 104.1-FE: Daily Finance integration (~3 SP)

Integrate `/v1/analytics/daily/finance` into the Daily Breakdown view.

**Tasks**:
- Type: `DailyFinanceItem` (date + 16 numeric fields) and `DailyFinanceSummary` (aggregate) in `src/types/daily-metrics.ts` (or new module)
- Boundary normalizer `normalizeDailyFinanceResponse` per CLAUDE.md Boundary Normalizer Pattern: handle null/missing `data` (`?? []`), null-collapse for nullable numeric fields where backend may return null
- API client `getDailyFinance(from, to)` in `src/lib/api/daily-analytics/api.ts` (extend existing module)
- TanStack Query hook `useDailyFinance({ from, to })` with `cabinetId` in queryKey per Story 97.5-FE multi-tenant cabinet-isolation discipline
- Replace zero-fallback in `DailyBreakdownChart` finance rows + `DailyBreakdownChartStates` empty state
- Unit tests: normalizer (≥4 cases incl. null/missing data, field mapping, summary passthrough), hook (cabinetId scoping)

**Acceptance criteria**:
- Daily Breakdown table shows real finance values (not zeros) when endpoint returns data
- Empty state (backend returns `data: []`) renders gracefully
- Error state (backend returns 5xx) renders defensively per Defensive Frontend Principle
- All baseline gates green: lint 0e, tsc 0e, vitest baseline+N
- Story passes 2-pass adversarial review per CLAUDE.md discipline

### Story 104.2-FE: Daily Advertising integration (~2 SP)

Integrate `/v1/analytics/daily/advertising` into the Daily Breakdown view.

**Tasks**:
- Type: `DailyAdvertisingItem` (date + 8 numeric fields) and `DailyAdvertisingSummary` in `src/types/daily-metrics.ts` (or shared with 104.1)
- Boundary normalizer `normalizeDailyAdvertisingResponse` with same null-safety patterns as 104.1
- API client `getDailyAdvertising(from, to)` in `src/lib/api/daily-analytics/api.ts`
- TanStack Query hook `useDailyAdvertising({ from, to })` with `cabinetId` in queryKey
- Replace zero-fallback in `DailyBreakdownChart` advertising rows
- Unit tests: normalizer (≥3 cases), hook (cabinetId scoping)

**Acceptance criteria**:
- Daily Breakdown table shows real advertising values when endpoint returns data
- Empty/error states render gracefully
- All baseline gates green
- 2-pass adversarial review passes

### Story 104.3-FE: FCU 10th category verification (~2 SP)

Verify `delivery_to_warehouse` renders as the 10th cost category on Unit Economics SKU view, and decide policy for brand/cabinet views.

**Tasks**:
- Chrome visual verification: load `/analytics/unit-economics` on SKU view → confirm 10 categories (9 existing + `delivery_to_warehouse`). Capture state for backend-open-blockers memo.
- If 10th category missing on SKU view: debug via console + network — check whether `useFcuBySku` fires, whether `mergeDeliveryCosts` reads its output, whether config in `unit-economics-config.ts` exposes the 10th category.
- If 10th category renders on SKU view but absent on brand/cabinet views: PM/UX decision — extend `useFcuBySku` gating to all views (requires backend confirmation that endpoint aggregates by brand/cabinet) OR document as SKU-view-only by design.
- Update `docs/process/backend-open-blockers-2026-05-15.md` with verification outcome.

**Acceptance criteria**:
- Either: 10/10 categories visible on SKU view + decision documented for brand/cabinet, OR debugging report explains the gap and proposes next steps.
- No source changes unless verification surfaces a real defect.
- 2-pass adversarial review of any source/doc changes.

### Story 104.4-FE: Tests + polish + retrospective (~1 SP)

Quality-gate sweep + Epic 104-FE retrospective.

**Tasks**:
- Component tests for `DailyBreakdownChart` with real (non-zero) mock data per Story 92.6-FE precedent (chart-library testing via `vi.mock` for recharts)
- Full vitest + lint + tsc + doc-citations sweep — confirm zero regressions
- Visual reverify Daily Breakdown in Chrome (with backend returning real data)
- Polish backlog items if surfaced during 104.1/104.2 reviews
- File Epic 104-FE retrospective at `_bmad-output/implementation-artifacts/epic-104-fe-retro-{date}.md`
- Update sprint-status: epic-104-fe + 4 stories + retrospective → done

**Acceptance criteria**:
- All quality gates baseline-clean (lint 0e/112w, tsc 0e, vitest passing ≥ baseline+N, doc-citations baseline)
- Retrospective filed with action items A-1..A-N
- Epic 104-FE marked done in sprint-status

## Dependencies

- Backend 2026-05-15 follow-up audit confirmed all endpoints live
- Frontend: existing `DailyBreakdownChart` infrastructure (currently shows zero fallback)
- Frontend: existing `useFcuBySku` hook + `mergeDeliveryCosts` merger
- CLAUDE.md disciplines: Story 97.5-FE cabinetId queryKey, Boundary Normalizer Pattern, Defensive Frontend Principle, 2-pass review

## Risks / Open Questions

1. **Backend response shape verification** — spec is based on backend coordination message; will verify in 104.1 by hitting endpoint with real cabinet. If actual shape differs, normalizer absorbs the drift.
2. **Empty data on first integration** — if cabinet has no confirmed shipments, FCU returns `[]` → `delivery_to_warehouse = 0` (already handled in `mergeDeliveryCosts`).
3. **FCU view-mode policy** — brand/cabinet view 10th category requires PM/UX decision before extending gating; default disposition is SKU-view-only by design (existing behavior).
4. **Pre-existing baseline drift** — vitest count is 7243 from session-close 2026-05-15; some new tests will be added. Baseline floor in CLAUDE.md will need update once Epic 104-FE closes.
