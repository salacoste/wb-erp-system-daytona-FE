# Request #66: Storage Source Unification

**Date**: 2025-12-21
**Status**: COMPLETED
**Related**: Request #65 (Operating Margin Consistency), Epic 24 (Paid Storage Analytics)

## Problem

SKU page and Category/Brand pages showed different storage values:
- **SKU page**: 1,737₽ (from `wb_finance_raw` nm_id='UNKNOWN')
- **Category page**: 2,004₽ (from `paid_storage_daily`)

This caused margin discrepancy between views (~268₽ difference).

## Root Cause

Two different data sources for storage:

| Source | Used By | Value |
|--------|---------|-------|
| `wb_finance_raw.storage` (nm_id='UNKNOWN') | `getCabinetLevelExpenses` → SKU page | 1,737₽ |
| `paid_storage_daily.warehouse_price` | `margin-calculation.service` → Category/Brand pages | 2,004₽ |

The `paid_storage_daily` table (Epic 24) contains more accurate per-SKU storage data from WB Paid Storage API.

## Solution

Updated `getCabinetLevelExpenses` in `weekly-analytics.service.ts` to get storage from `paid_storage_daily`:

```typescript
// Request #65: Get storage from paid_storage_daily for consistency
const storageResult = await this.prisma.$queryRaw<
  Array<{ storage_total: Decimal }>
>`
  SELECT COALESCE(SUM(warehouse_price), 0) as storage_total
  FROM paid_storage_daily
  WHERE cabinet_id = ${cabinetId}::uuid
    AND date >= ${startBounds.start}::date
    AND date < ${endBounds.end}::date
`;

// Use storage from paid_storage_daily instead of wb_finance_raw
const storage = Number(storageRow.storage_total);
```

## Data Flow After Fix

```
┌─────────────────────────────────────────────────────────────────────┐
│                      paid_storage_daily                              │
│                (Single Source of Truth - Epic 24)                    │
└────────────────────┬────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────────┐    ┌───────────────────────────┐
│ getCabinetLevel   │    │ margin-calculation.service │
│ Expenses          │    │ getStorageFromPaidStorage  │
│ (line 4069-4079)  │    │ Daily() (line 833-867)     │
└────────┬──────────┘    └──────────┬────────────────┘
         │                          │
         ▼                          ▼
┌───────────────────┐    ┌───────────────────────────┐
│ useCabinetLevel   │    │ useMarginAnalyticsByBrand │
│ Expenses hook     │    │ useMarginAnalyticsByCategory│
└────────┬──────────┘    └──────────┬────────────────┘
         │                          │
         ▼                          ▼
┌───────────────────┐    ┌───────────────────────────┐
│    SKU Page       │    │  Category/Brand Pages     │
│ (Cashflow Card)   │    │  (Margin Tables)          │
└───────────────────┘    └───────────────────────────┘
```

## Files Changed

### Backend
- `src/analytics/weekly-analytics.service.ts`
  - `getCabinetLevelExpenses()` method (lines 4048-4193)
  - Removed `storage` from `wb_finance_raw` query
  - Added new query to `paid_storage_daily`

## Verification

After this change:
- SKU page storage = Category page storage = `paid_storage_daily` value
- Operating profit should be consistent across all views
- Net profit formula: `gross_profit_sku - total_cabinet_expenses` (where storage comes from `paid_storage_daily`)

## API Response

`GET /v1/analytics/weekly/cabinet-expenses?weekStart=2025-W50`

```json
{
  "data": {
    "sales_gross": 224252.23,
    "returns_gross": 10234.56,
    "marketplace_commission": 68587.47,
    "acquiring_fee": 1234.56,
    "cogs_total": 53626.00,
    "gross_profit_sku": 102038.76,
    "logistics": 25744.17,
    "storage": 2004.00,        // NOW from paid_storage_daily
    "other_adjustments": 38469.00,
    "wb_commission_adj": 0,
    "penalties": 0,
    "paid_acceptance": 75,
    "total": 66292.17,         // Includes updated storage
    "weeks_included": ["2025-W50"]
  }
}
```

## Related Documentation

- [Epic 24: Paid Storage Analytics](../../docs/epics/epic-24-paid-storage-by-article.md)
- [Request #65: Operating Margin Consistency](./65-operating-margin-consistency-category-brand.md)
- [Request #64: Per-SKU Margin Missing Expenses](./64-per-sku-margin-missing-expenses.md)
