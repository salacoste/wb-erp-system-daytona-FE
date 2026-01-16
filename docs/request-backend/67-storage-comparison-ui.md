# Request #67: Storage Source Comparison UI

**Date**: 2025-12-21
**Status**: Completed
**Related**: Request #66 (Storage Source Unification)

## Problem

User wants to see storage data from BOTH sources side-by-side:
1. **Primary**: `paid_storage_daily` (Storage API)
2. **Secondary**: `wb_finance_raw` (Weekly Report)

And highlight when values don't match.

## Solution

### Backend Changes

**File**: `src/analytics/weekly-analytics.service.ts`

Added two new fields to `getCabinetLevelExpenses` response:

```typescript
// Request #67: Storage from both sources for comparison
storage: number;                  // From paid_storage_daily (primary)
storage_weekly_report: number;    // From wb_finance_raw (for comparison)
storage_difference: number;       // storage - storage_weekly_report
```

SQL queries:
```sql
-- Primary: paid_storage_daily
SELECT COALESCE(SUM(warehouse_price), 0) as storage_total
FROM paid_storage_daily
WHERE cabinet_id = ? AND date >= ? AND date < ?

-- Secondary: wb_finance_raw
SELECT COALESCE(SUM(ABS(storage)), 0) as storage_total
FROM wb_finance_raw
WHERE cabinet_id = ? AND sale_dt >= ? AND sale_dt < ?
  AND nm_id = 'UNKNOWN'
```

### Frontend Changes

#### 1. Type Updates

**File**: `frontend/src/hooks/useMarginAnalytics.ts`

```typescript
export interface CabinetLevelExpenses {
  // ... existing fields ...
  storage: number;
  storage_weekly_report: number;  // NEW
  storage_difference: number;     // NEW
}
```

#### 2. SKU Page

**File**: `frontend/src/app/(dashboard)/analytics/sku/page.tsx`

Updated storage card in cabinet expenses section:
- Shows "Хранение (API)" as primary value
- Below shows "Отчёт: X ₽" with difference in parentheses
- Yellow background if difference > 1 ₽
- Red color for positive difference, green for negative

#### 3. Category & Brand Pages

**Files**:
- `frontend/src/app/(dashboard)/analytics/category/page.tsx`
- `frontend/src/app/(dashboard)/analytics/brand/page.tsx`

Added storage comparison card between summary stats and table:

```
┌─────────────────────────────────────────────────────┐
│ 📦 Сравнение источников хранения   [Расхождение]   │
├─────────────────────────────────────────────────────┤
│ Storage API (paid_storage)  │  Еженедельный отчёт  │  Разница  │
│     2,004 ₽                 │     1,737 ₽          │  +267 ₽   │
└─────────────────────────────────────────────────────┘
```

Card styling:
- Normal: `border-gray-200`
- Discrepancy (>1₽): `border-yellow-400 bg-yellow-50` + badge

## UI Behavior

| Condition | Styling |
|-----------|---------|
| Difference ≤ 1₽ | Normal card, green difference text |
| Difference > 1₽ | Yellow card, red/orange difference text, badge |

## Why Differences Occur

1. **Different data sources**: paid_storage_daily comes from WB Storage API, wb_finance_raw comes from weekly Excel report
2. **Timing**: Storage API updates daily, weekly report aggregates differently
3. **Rounding**: Different rounding in WB systems
4. **Data availability**: Storage API has ~2-3 weeks history, weekly report has longer history

## Expected Behavior

- Small differences (< 1%) are normal
- Large differences may indicate:
  - Missing Storage API data (not imported)
  - Different date ranges being compared
  - WB API data inconsistencies

## API Response Example

```json
{
  "data": {
    "storage": 2004.50,
    "storage_weekly_report": 1737.22,
    "storage_difference": 267.28,
    // ... other fields
  }
}
```

## Related Documentation

- [Request #66: Storage Source Unification](./66-storage-source-unification.md)
- [Epic 24: Paid Storage API](/docs/epics/epic-24-paid-storage-by-article.md)
- [Storage API Guide](/docs/STORAGE-API-GUIDE.md)
