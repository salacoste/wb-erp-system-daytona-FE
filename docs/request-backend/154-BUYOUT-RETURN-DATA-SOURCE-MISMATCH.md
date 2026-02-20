# Request #154: Buyout Rate vs Return Breakdown Data Source Mismatch

**Date**: 2026-02-20
**Reporter**: Frontend Team
**Priority**: Medium
**Epic**: 69 (Buyout Analytics) + 71 (Return Analytics)

## Problem

The buyout table (`/analytics/buyout`) shows contradictory data for some SKUs:
- **Выкуп %**: 100.0% (from `PerSkuBuyoutService`)
- **Возвраты**: 0 (from `wb_finance_raw`, `doc_type = 'return'`)
- **Отказ ПВЗ**: 3 (from `return_classifications` table)

Example: nmId `664280874` — shows 100% buyout and 0 financial returns, but 3 PVZ refusals from FBS order status classification.

## Root Cause

Two independent data sources with different timing and semantics:

| Metric | Source | Timing |
|--------|--------|--------|
| `buyoutRatePct`, `returnsCount` | `wb_finance_raw` (`doc_type = 'sale'` vs `'return'`) | Weekly WB financial report (delayed) |
| `returnBreakdown` (Story 69.8) | `return_classifications` (FBS order statuses) | Near-realtime from order status changes |

Financial returns appear in `wb_finance_raw` only when WB processes the weekly report. Logistics returns (PVZ refusals) are classified immediately from order status changes. This creates a temporal gap where a SKU can show 0 financial returns but multiple logistics refusals.

## Impact

- **User confusion**: 100% buyout rate with visible PVZ refusals looks like a bug
- **Decision quality**: Users may not trust the data if metrics appear contradictory

## Suggested Fix (Backend)

### Option A: Unified return count (Recommended)
Compute `returnsCount` as `MAX(financial_returns, classified_returns)` to show the most up-to-date picture. Recalculate `buyoutRatePct` accordingly.

### Option B: Tooltip/label differentiation
Keep separate sources but clearly label them:
- "Финансовые возвраты" (from weekly report)
- "Логистические возвраты" (from FBS statuses, realtime)

### Option C: Cross-reference adjustment
When `return_classifications` has records but `wb_finance_raw` does not, adjust `returnsCount` and `buyoutRatePct` to include classified returns as pending financial returns.

## Reproduction

1. Navigate to `/analytics/buyout` with date range including 2026-02-19
2. Find nmId `664280874` in the table
3. Observe: Выкуп % = 100.0%, Возвраты = 0, Отказ ПВЗ = 3

## Frontend Status

Frontend displays data correctly from both APIs. No frontend changes needed — this is a backend data reconciliation issue.
