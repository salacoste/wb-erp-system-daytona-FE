# 153: Return Classification — Zero Classified Despite 63 Finance Returns

## Problem

`return_classification` task completes with `classified=0, skipped=84, errors=0`. The returns page shows all zeros.

However, buyout summary (using `wb_finance_raw`) reports **63 returns** out of 5721 sales.

## Root Cause

**Two different data sources disagree on returns:**

| Source | Data Table | Returns Found |
|--------|-----------|---------------|
| Buyout Summary (Epic 69) | `wb_finance_raw` | 63 returns |
| Return Classification (Epic 71) | `orders_fbs` + `order_status_history` | 0 classified |

The return classification service (`return-classification.service.ts`) looks at FBS order statuses to classify returns into 3 categories. It found 84 orders in the date range but ALL were skipped because:

1. **No order_status_history entries** matching return status codes (`canceled`, `return_at_pvz`, `returned_to_seller`)
2. **Finance fallback** (lines 328-355) should check `wb_finance_raw` for `doc_type='return'` but either:
   - The SRID linking between `orders_fbs` and `wb_finance_raw` doesn't match
   - The finance query uses wrong join criteria
   - The 63 finance returns belong to FBO orders (not in `orders_fbs` table)

## Evidence

```
Worker log: classified=0, skipped=84, errors=0, duration=42ms
Buyout API: totalSalesCount=5721, totalReturnsCount=63, overallBuyoutRatePct=98.9%
Returns API: totalReturns=0, categories all 0
```

## Impact

- `/analytics/returns` page shows empty state
- Return reasons pie chart has no data
- Returns by-SKU table is empty
- Users see 63 returns in buyout page but 0 in returns page — confusing

## Investigation Needed

1. Are the 63 finance returns FBO or FBS? If FBO, they won't appear in `orders_fbs`
2. Does the finance fallback query (checking `wb_finance_raw.srid` against `orders_fbs.srid`) have correct join logic?
3. Check: `SELECT doc_type, COUNT(*) FROM wb_finance_raw WHERE doc_type_name LIKE '%возврат%' OR return_amount > 0 GROUP BY doc_type`

## Suggested Fix

If the 63 returns are mostly FBO:
- Add FBO return detection path (query `wb_finance_raw` directly for return doc_types)
- Don't require `orders_fbs` match for classification

If SRID linking is broken:
- Fix the JOIN between `orders_fbs.srid` and `wb_finance_raw.srid`

---

## Resolution

**Status**: CLOSED (Epic 106 + Epic 108, Story 108.3)

**Fix**: SDK v3.10.0 added the `sdk.returns` module providing direct FBO/FBS return data access. The root cause was confirmed: the 63 returns were mostly FBO, which weren't in `orders_fbs`. Epic 106 (Story 106.2) integrated FBO return classification via SDK v3.9.3 helpers. Epic 108 (Story 108.3) consolidated `fbo_return_classification_sync` + `buyout_reconciliation_sync` into a single `returns_sync` pipeline using `sdk.returns`, achieving near-complete FBO/FBS return coverage.

**Pipeline consolidation**: 18 → 17 pipelines. `returns_sync` runs daily at 06:30 MSK.
