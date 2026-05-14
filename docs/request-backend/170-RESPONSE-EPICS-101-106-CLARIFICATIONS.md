# Response to Frontend Clarifications: Epics 101-106

**Date**: 2026-05-03
**Type**: BACKEND RESPONSE (inline replies to Q1–Q8)
**Source**: Frontend clarification request `docs/request-backend/170-FE-CLARIFICATIONS-EPICS-101-106.md`
**Responding to**: Request #170

---

## Q1 — Acquiring API: Relationship to Existing Frontend Epic 90-FE

**Answer: (b) — The endpoints were ALWAYS at `/v1/analytics/acquiring/*`. There is NO old `/v1/acquiring/*` path.**

Evidence:
- Git history shows the acquiring controller was introduced in commit `52827a8a` (Epic 92) with `@Controller('v1/analytics/acquiring')` — this route has never changed.
- `grep` for `v1/acquiring` (not `v1/analytics/acquiring`) returns **zero results** in any `.ts` source file.
- No acquiring file was ever renamed (`git log --diff-filter=R` confirms).
- The frontend's own API client at `frontend/src/lib/api/acquiring-analytics.ts` calls `/v1/analytics/acquiring/...` — matching the backend.

**Hypothesis for the confusion**: The only references to bare `/v1/acquiring` paths appear as **comments** in the controller file, documenting that our endpoints map to WB's external API at `/api/finance/v1/acquiring/...`. These are upstream WB API paths, not our application's routes.

**Impact**: No migration needed. Frontend hooks are already wired to the correct paths. No action required.

---

## Backend Team Response

**Status**: RESOLVED (clarifications answered)
**Resolution date**: 2026-05-03
**Summary**: Inline answers to all 8 frontend clarification questions about Epics 101-106. Key answers: acquiring endpoints were always at `/v1/analytics/acquiring/*`, `acquiring_total` uses different data source than reports, FBS REST API fully documented, return classification operational. No migration or breaking changes needed.
**Remaining frontend action**: Use responses to proceed with Epic 96-FE integration.

## Q2 -- `acquiring_total` Field: Consistency With Acquiring Reports

**Answer: Consistency is NOT guaranteed. The two values come from different data sources.**

| Metric | Source | Calculation |
|--------|--------|-------------|
| `acquiring_total` (finance-summary) | Live WB v1 Acquiring API (`getAcquiringReportsDetailed`) | `reduce(sum, r.acquiring_fee ?? 0)` in TypeScript |
| `acquiring_fee_sum` (per-report from list endpoint) | Live WB v1 Acquiring API (`getAcquiringReportsList`) | Pre-aggregated by WB per report |
| `acquiring_fee_total` (finance-summary) | `wb_finance_raw` DB table | `SUM(ABS(acquiring_fee))` SQL |

Discrepancy sources:
1. **Different data sources**: `acquiring_total` = live WB API call; `acquiring_fee_total` = DB aggregation of weekly report data
2. **Independent cache layers**: acquiring API (30min) + finance-summary (15min) = stale reads possible
3. **Date boundary mismatch**: ISO week bounds vs WB reporting period boundaries may differ
4. **Null handling**: acquiring API returns `null` for pending fees → treated as 0 → sum changes when fees settle

**Recommendation for FE**:
- Do NOT cross-validate `acquiring_total` against report-level sums as a hard check
- If displaying both, treat ≥5% discrepancy as advisory (amber indicator, not blocking)
- Use `acquiring_fee_total` (from `wb_finance_raw`) as the "source of truth" for weekly P&L — it's the static, auditable DB value
- Use `acquiring_total` (from WB API) as supplementary detail — more granular but less stable

---

## Q3 — `retail_price_total` Funnel Semantics + WB Discount Surfacing

### Q3.1: Formula

```
retail_price_total = SUM(retail_price)          -- seller's listed price BEFORE WB discounts
sales_gross       = SUM(retail_price_with_discount) -- price AFTER WB discounts (customer-facing)

WB_discount_total = retail_price_total - sales_gross
```

Source columns in `wb_finance_raw`:
- `retail_price` → your listed price
- `retail_price_with_discount` → what customer actually paid after SPP + other WB discounts

Both filtered to `doc_type = 'sale'`.

### Q3.2: Is `WB_discount_total` exposed as a separate field?

**No.** There is no standalone `wb_discount_total` field in any DTO or service. The WB discount must be computed by the frontend as:

```
WB_discount_total = retail_price_total - sales_gross
```

**Note for P&L waterfall**: This delta computation is safe because both values come from the same `wb_finance_raw` aggregation query (same SQL, same cache, same timestamp). The drift risk mentioned in the clarification document applies when mixing different data sources — not the case here.

### Q3.3: Does `retail_price_total` exist for `summary_eaeu`?

**Yes — it exists in ALL three sections**: `summary_rus`, `summary_eaeu`, and `summary_total`.

The aggregation SQL groups by `report_type` (which produces both RUS `"основной"` and EAEU `"по выкупам"`), and `retail_price_total` is computed identically for both. The same mapper function (`mapSummaryToDto`) is called for both sections.

`summary_total` gets `retail_price_total_combined` (RUS + EAEU consolidated).

---

## Q4 — `commission_other` Backfill Window for Historical Periods

**⚠️ CRITICAL CORRECTION: The #169 report's description of `commission_other` was INACCURATE.**

### What the report claimed (Section 2.3):
> `"commission_other": 872000.00 // NEW — "Dop. servisy WB" (WB.Promotion ~800K + Dzham ~72K)`
> "Previously hidden in `corrections`."

### What the code actually does:

The `commission_other` field in cabinet-summary is a **semantic alias** of `commission` — both receive the **identical value** from `weekly_margin_fact.commission_rub`:

```typescript
// src/analytics/services/trends-analytics.service.ts:614-615
commission: commission ? Math.round(commission * 100) / 100 : null,
commission_other: commission ? Math.round(commission * 100) / 100 : null,
```

`commission_rub` is computed from `wb_finance_raw.commission_other` WHERE `reason = 'Удержание'` — this is the WB API's `ppvzReward`/`additionalPayment` field, NOT the WB.Promotion + Dzham costs from `corrections`.

### The actual situation:

| Field | Source | Contains WB.Promotion+Dzham? |
|-------|--------|------------------------------|
| `commission_other` (cabinet-summary) | `weekly_margin_fact.commission_rub` | **NO** — this is ppvzReward/additionalPayment |
| `corrections` (raw data) | `wb_finance_raw.corrections` | **YES** — but lumped with other deductions |
| `other_adjustments` (cabinet-summary) | Aggregation of `corrections + other_adjustments` | **YES** — but mixed in, not separated |

**The `corrections` field is NOT zeroed out** — it still contains the original legacy data including WB.Promotion and Dzham costs.

### Backend fix needed (NEW STORY — Epic 107 candidate):

We need to properly extract WB.Promotion + Dzham from `corrections` and surface it as `commission_other` in the cabinet-summary. The work involves:
1. Update `trends-analytics.service.ts` to compute `commission_other` from `corrections` breakdown (using `bonus_type_name` pattern matching from `CabinetExpensesService`)
2. Ensure `total_commission_rub` still includes this amount (it already does via `corrections`)
3. Backfill: since this is computed at query-time from raw data, no historical migration needed — all periods with raw `wb_finance_raw` data will automatically get the correct value

### Recommended FE strategy (interim):

**Option A — Dual-lookup is the right approach** for now:
- Use `other_adjustments` (which includes WB.Promotion+Dzham) as a proxy
- When the backend fix ships, switch to `commission_other`
- Mark the PnLWaterfall row with `// PENDING BACKEND: proper commission_other extraction from corrections`

---

## Q5 — `latest_fcu` / `latest_dcu` Selector Semantics

### Q5.1: What does "latest" mean?

**Option A: `MAX(shipment.confirmed_at)` within the request's ISO week date bounds.**

The SQL query orders by `s.confirmed_at DESC` within each `nm_id` group, and the code captures only the first (most recent) row per SKU:

```sql
WHERE s.cabinet_id = ${cabinetId}
  AND s.status = 'CONFIRMED'
  AND s.confirmed_at >= ${start}  -- ISO week start
  AND s.confirmed_at < ${end}     -- ISO week end
ORDER BY sbl.nm_id, s.confirmed_at DESC
```

### Q5.2: SKUs without confirmed shipments

Returns **`null`** for both `latest_fcu` and `latest_dcu`. No fallback to historical average/median.

### Q5.3: Date range scoping

**Scoped to the request's ISO week** — NOT all-time latest. The `start`/`end` bounds come from `IsoWeekService.getWeekBounds(week)`.

This means: if a SKU's most recent confirmed shipment was in a prior week, `latest_fcu`/`latest_dcu` for the current week will be `null`.

### Additional note for aggregated views:

When `viewBy` is `'brand'`, `'category'`, or `'total'` (not `'sku'`), both fields are **hardcoded to `null`**. Only SKU-level views carry values.

---

## Q6 — FBS Analytics REST API: Wiring vs Migration

### Q6.1: Are these 7 endpoints genuinely NEW?

**Yes — genuinely NEW. The services pre-existed with 60+ tests but had ZERO REST exposure before Epic 105 (Story 57.5).**

Chronology:
- 2026-01-29: `FbsDataAggregationService` created (reads from DB table) → exposed via `HistoricalAnalyticsController`
- 2026-01-30: `FbsAnalyticsAggregationService`, `RegionalStockService`, `WarehouseRemainsService` created (call WB SDK directly) → NO controller
- 2026-01-31: `FbsAnalyticsController` created with all 7 endpoints

### Q6.2: Are the old endpoints deprecated?

**No — they are different endpoints on a different controller.**

| Controller | Route Prefix | Data Source | Created By |
|------------|-------------|-------------|------------|
| `HistoricalAnalyticsController` | `/v1/analytics/orders/*` | DB table `FbsAnalyticsAggregate` | Epic 51 (Story 51.4) |
| `FbsAnalyticsController` | `/v1/analytics/fbs/*` | Live WB SDK API calls | Epic 57 (Story 57.5) |

Both controllers remain active and serve different purposes.

### Q6.3: Frontend hook → endpoint mapping

**The hooks `useFbsAnalyticsByGroup` and `useFbsAnalyticsBySize` do NOT exist in the frontend codebase.** Our search of the entire `frontend/src/` directory found zero matches.

The actual frontend hooks consume the `HistoricalAnalyticsController` endpoints:

| Frontend Hook | Backend Endpoint | Controller |
|---------------|-----------------|------------|
| `useFbsTrends` | `GET /v1/analytics/orders/trends` | HistoricalAnalyticsController |
| `useFbsSeasonal` | `GET /v1/analytics/orders/seasonal` | HistoricalAnalyticsController |
| `useFbsCompare` | `GET /v1/analytics/orders/compare` | HistoricalAnalyticsController |

**No frontend code currently consumes any of the 7 new FBS analytics controller endpoints.**

---

## Q7 — Test Seeding Endpoints: Security Gating

### Q7.1: How is NODE_ENV=development enforced?

**Runtime module-level conditional registration** (closest to Option A):

```typescript
// src/app.module.ts:34-76
if (process.env.NODE_ENV === 'development') {
  imports.push(TestUtilsModule);
}
```

If `NODE_ENV !== 'development'`, the entire `TestUtilsModule` (and therefore `TestController`) is **never registered** with NestJS DI. Routes do not exist — requests get 404, not 403.

### Q7.2: Secondary guard if NODE_ENV=development is accidentally set in production?

**No effective secondary guard.** Full inventory:
1. Constructor warning log — only fires when controller loads in non-dev mode (which can't happen due to the module guard). **It never warns when NODE_ENV=development is set incorrectly in production.**
2. No IP allowlist
3. No environment validation middleware
4. No build-time stripping — code is included in compiled output

**This is a security gap that needs fixing** (see improvement plan below).

### Q7.3: Auth requirements

Endpoints require `JwtAuthGuard` + `RolesGuard` but **NOT `CabinetGuard`**.

| Endpoint | Required Role | CabinetGuard? |
|----------|--------------|---------------|
| `POST /v1/test/seed/dbw-order` | `Owner` | **No** |
| `DELETE /v1/test/seed/dbw-order/:orderId` | `Owner` | **No** |

**Gap**: The `x-cabinet-id` header is read as an untrusted parameter. Any authenticated `Owner` can seed/delete orders for **any** cabinet, not just cabinets they own.

---

## Q8 — Open Items Priority + ETA

### Q8.1: #157 (Daily finance breakdown endpoint) — HIGH

**ETA: Already implemented in Epic 88 (Story 88.1).** The endpoint `GET /v1/analytics/daily/finance` exists and returns daily breakdown.

The `#169` report omitted this because Epic 88 shipped before the reporting window. Frontend can proceed with integration immediately.

### Q8.2: #148 (Fulfillment returns count always 0) — MEDIUM

**Root cause**: `returnsCount`/`returnsRevenue` in `/v1/analytics/fulfillment/summary` rely on `wb_finance_raw` rows with specific `doc_type` patterns for returns. The fulfillment summary service queries for return-related doc types, but the actual return data may be classified under different `doc_type`/`reason` combinations in `wb_finance_raw`.

**Status**: Needs fresh investigation. The recent Epic 106 (FBO return classification + buyout reconciliation) may have changed the data landscape. We should verify whether the fulfillment returns are now properly classified.

### Q8.3: #150 (Monitoring false alarms) — LOW

The 3/4 pipelines showing false `critical`/`no_data` are **separate from** the 2 new pipelines from Epic 106. The new pipelines (`fbo_return_classification_sync` and `buyout_reconciliation_sync`) were registered after the false alarm issue was reported.

The false alarms are likely caused by:
1. Pipeline registry entries without matching `SCHEDULED_TASKS` entries (or vice versa)
2. Cron schedule parsing issues with `calculateExpectedExecutions()` for certain schedule formats
3. Stale data in the monitoring tables from before the completeness fixes

**Status**: LOW priority — no ETA yet. The data backfill completed in Epic 103 should have reduced false alarms. Will reassess after monitoring the new pipelines for a week.

---

## Improvement Plan — Backend Action Items

Based on the findings above, the following backend work is needed:

### CRITICAL (blocks frontend Story 96.4)

| # | Story | Description | Effort |
|---|-------|-------------|--------|
| 1 | **107.1** | Fix `commission_other` in cabinet-summary to properly extract WB.Promotion + Dzham from `corrections` breakdown | M |
| 2 | **107.2** | Verify historical data coverage — confirm extraction works for W01-W17 (query-time, no migration) | S |

### HIGH (security + developer experience)

| # | Story | Description | Effort |
|---|-------|-------------|--------|
| 3 | **107.3** | Add `CabinetGuard` to test controller endpoints | S |
| 4 | **107.4** | Fix constructor warning logic (currently backwards) | XS |
| 5 | **107.5** | Consider adding `wb_discount_total` as explicit field to reduce frontend delta-computation risk | S |

### MEDIUM (documentation + minor improvements)

| # | Story | Description | Effort |
|---|-------|-------------|--------|
| 6 | **107.6** | Document `latest_fcu`/`latest_dcu` scoping semantics in Swagger/OpenAPI | S |
| 7 | **107.7** | Add secondary security guard for test endpoints (e.g., API key or startup validation) | S |
| 8 | **107.8** | Investigate #148 fulfillment returns with fresh data from Epic 106 | M |

### LOW (informational)

| # | Story | Description | Effort |
|---|-------|-------------|--------|
| 9 | **107.9** | Reassess #150 monitoring false alarms after 1 week of new pipeline data | S |
| 10 | — | Correct #169 report section 2.3 (commission_other description) in documentation | XS |

---

## Summary for Frontend

**Can proceed immediately (no blockers)**:
- Q1: Acquiring endpoints — already at correct paths, no migration
- Q3: retail_price_total — formula clear, eaeu covered, compute WB discount as delta
- Q5: latest_fcu/dcu — scoped to request week, null for missing shipments
- Q6: FBS endpoints — genuinely new, wire fresh (no migration)
- Q8.1: Daily finance endpoint (#157) — already implemented in Epic 88

**Blocked pending backend fix**:
- Q4: commission_other — **backend must fix first** (Story 107.1). Use `other_adjustments` as interim proxy

**Advisory (no blocker, but be aware)**:
- Q2: acquiring consistency — not guaranteed, use `acquiring_fee_total` as P&L source of truth
- Q7: test endpoint security — safe for E2E in dev, but add to security review backlog
- Q8.2: fulfillment returns — still investigating, no ETA
