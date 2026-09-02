# 148 - Fulfillment returnsCount Always Returns 0

## Problem

The `/v1/analytics/fulfillment/summary` endpoint returns `returnsCount: 0` and `returnsRevenue: 0` for both FBO and FBS, even when the `finance-summary` endpoint reports significant returns in rubles for the same period.

## Evidence

**January 2026 data comparison:**

| Source | Returns (RUB) | Returns (units) |
|--------|--------------|-----------------|
| finance-summary (5 weeks summed) | 20 229 ₽ | N/A |
| fulfillment/summary FBO | 0 | 0 |
| fulfillment/summary FBS | 0 | 0 |

**Per-week finance-summary wb_returns_gross_total:**
- W01: 5 234 ₽
- W02: 10 544 ₽
- W03: 958 ₽
- W04: 877 ₽
- W05: 2 616 ₽

Returns clearly exist in financial data but the fulfillment endpoint does not track them.

## Root Cause

The fulfillment summary aggregation service likely does not query or aggregate return records. The `returnsCount` and `returnsRevenue` fields are defined in the response schema but never populated with actual data.

## Impact

- Dashboard "Возвраты, шт" card always shows **0 шт** regardless of actual returns
- `returnRate` is always 0%, misleading users about return rates
- Frontend type `FulfillmentMetrics.returnsCount` exists but is always 0

## Frontend Workaround

Currently the frontend computes: `returnsCount = fbo.returnsCount + fbs.returnsCount` which always equals 0.

No frontend workaround is possible without a backend fix, since returns count data is not available from any other API endpoint (finance-summary only has monetary values, not unit counts).

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-05-06 (confirmed in #170 backend update)
**Summary**: Fixed in Epic 106 + Story 107.8. The fulfillment summary now returns correct return counts. The `returnsCount` and `returnsRevenue` fields are properly populated from return data aggregation. Pipeline `return_classification_sync` runs daily at 06:30 MSK.
**Remaining frontend action**: None - fulfillment returns count now shows correct values.

## Requested Fix

Populate `returnsCount`, `returnsRevenue`, and `returnRate` fields in the fulfillment summary response by querying return records from the same data source used by finance-summary.

**Expected behavior:**
```json
{
  "fbo": {
    "returnsCount": 45,
    "returnsRevenue": 18500,
    "returnRate": 5.4
  },
  "fbs": {
    "returnsCount": 2,
    "returnsRevenue": 1729,
    "returnRate": 16.7
  }
}
```

## Additional Issue: W02 cogs_coverage_pct = 105.26%

During investigation, found that week 2026-W02 has `products_with_cogs: 20` but `products_total: 19`, resulting in `cogs_coverage_pct: 105.26%`. This causes `gross_profit: null` for that week since the backend skips profit calculation when coverage > 100%.

This is a data integrity issue — products_with_cogs should never exceed products_total.

## Reproduction

```bash
# Login
TOKEN=$(curl -s http://localhost:3000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"<E2E_TEST_PASSWORD>"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

CABINET="f75836f7-c0bc-4b2c-823c-a1f3508cce8e"

# Fulfillment summary — returnsCount always 0
curl -s 'http://localhost:3000/v1/analytics/fulfillment/summary?from=2026-01-01&to=2026-01-31' \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET" | python3 -m json.tool

# Finance summary — returns exist in monetary form
curl -s 'http://localhost:3000/v1/analytics/weekly/finance-summary?week=2026-W02' \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'wb_returns_gross_total: {d[\"summary_total\"][\"wb_returns_gross_total\"]}')"
```

## Resolution

**Status**: Fixed
**Priority**: Medium (affects dashboard accuracy for returns metrics)
**Scope**: fulfillment summary aggregation service + weekly analytics COGS coverage

### Fix 1: Returns data source (fulfillment-analytics.service.ts)

**Root cause**: `reports_sales.is_storno` had **0 storno records** — WB daily sales API does not return storno for this seller. Returns only exist in `wb_finance_raw` (weekly financial reports) as `doc_type='return'`.

**Fix**: Changed `getReturnMetrics()` and trends SQL to query `wb_finance_raw` as primary source:
- `doc_type = 'return'` for return records
- `paid_delivery_flag = false` → FBO, `paid_delivery_flag = true` → FBS
- Falls back to `reports_sales.isStorno` if wb_finance_raw has no data
- Also fixed `getSaleMetrics()` to filter `isStorno: false` (consistency with trends SQL)

**Result**: FBO returnsCount=15, returnsRevenue=15010 ₽, returnRate=2.05% for Jan 2026.

### Fix 2: COGS coverage > 100% (weekly-analytics.service.ts)

**Root cause**: SQL query counted `products_with_cogs` as `COUNT(DISTINCT nm_id) FILTER (WHERE cogs_unit_cost_rub IS NOT NULL)` without requiring `quantity_sold > 0`. Product nm_id=173588306 had COGS assigned but zero sales in W02.

**Fix**: Added `AND quantity_sold > 0` to the `products_with_cogs` filter in all 3 queries (total, RUS, EAEU).

**Result**: W02 now shows `cogs_coverage_pct=100%`, `products_with_cogs=19`, `products_total=19`, `gross_profit=-7490.67`. Also fixed W52 (was 18/17=105.88%, now 17/17=100%).
