# Story 87.2-FE: Daily Breakdown Table Enhancement

Status: ready-for-dev

## Story

**As a** business owner viewing the daily breakdown table on the dashboard,
**I want** to see all available finance columns (Выкупы, Логистика, Хранение, Комиссия, Теор.прибыль) and correct signage for advertising spend,
**So that** I get a complete daily P&L picture without switching to external reports.

**Epic**: 87-FE Dashboard Data Quality & Enhancement
**Priority**: High
**Estimate**: 3 story points (low risk, well-understood column architecture)

---

## Problem Statement

Three issues in the daily breakdown table:

### Issue 1: Missing Finance Columns
The table currently shows only 4 columns (Дата, Заказы шт, Сумма заказов, Реклама) despite the backend now returning real finance daily data via `GET /v1/analytics/daily/finance`. The `DailyMetrics` type already carries `sales`, `logistics`, `storage`, `commission`, `penalties`, `paidAcceptance`, and `theoreticalProfit` -- all populated by `aggregateDailyMetrics()` in `src/lib/daily/aggregation.ts:89-103`. The missing columns are purely a presentation gap in `table-columns.ts:54-66`.

### Issue 2: Advertising Negative Sign
Ad spend shows as `-1 009 ₽` instead of `1 009 ₽`. The root cause is the `negativePrefix: true` flag on the advertising column (line 64 of `table-columns.ts`). The `formatCellValue` function at line 86-88 prepends a `-` sign to any non-zero value when `negativePrefix` is true. This made sense historically when all values were positive and the prefix was used to indicate "this is a cost" semantically. However, the backend returns advertising spend as a positive number (it is a cost, not revenue), so displaying `-1 009 ₽` double-negates the meaning. The ad spend should display as a positive cost with gray styling to differentiate it from revenue columns.

### Issue 3: Orders Count Discrepancy
The daily table sums to ~6 orders while the P&L header card shows 386. This is because they use different data sources:
- **P&L header** (OrdersCard): `fulfillment/summary.total.ordersCount` -- FBO + FBS combined from `GET /v1/analytics/fulfillment/summary`
- **Daily table**: `orders/trends?aggregation=day` -- FBS-only orders from `GET /v1/analytics/orders/trends` (dataSource.primary: "orders_fbs")

This is a **documented data source limitation** (see MEMORY.md: "Fulfillment ordersRevenue != seller revenue"). The fix is to add a footnote/tooltip, not to change the data source, because `orders/trends` is the only endpoint providing per-day granularity.

---

## Acceptance Criteria

### AC-1: New Finance Columns Visible
- [ ] Table displays columns in order: Дата | Заказы, шт | Сумма заказов | Выкупы | Реклама | Логистика | Хранение | Комиссия | Теор.прибыль
- [ ] All new columns are right-aligned, sortable, and formatted as currency (Russian locale, ₽)
- [ ] Totals row correctly sums all new columns
- [ ] Выкупы column shows `sales` field from DailyMetrics
- [ ] Логистика, Хранение, Комиссия show as positive costs (gray text)
- [ ] Теор.прибыль column is colorized: green for positive, red for negative

### AC-2: Advertising Sign Fixed
- [ ] Advertising spend displays as positive cost: `1 009 ₽` not `-1 009 ₽`
- [ ] Advertising text color remains gray (expense styling via `getCellColor`)
- [ ] Totals row advertising is also positive

### AC-3: Orders Count Footnote
- [ ] Table header for "Заказы, шт" has a tooltip explaining: "Только заказы FBS. Общее количество (FBO+FBS) см. в карточке Заказы."
- [ ] Or: a small footnote below the table explaining the discrepancy

### AC-4: Horizontal Scroll & Min-Width
- [ ] Table `min-w` updated from `900px` to accommodate 9 columns (~1200px)
- [ ] Horizontal scroll works correctly on mobile viewports
- [ ] Date column remains sticky-left on scroll

### AC-5: Tests
- [ ] Unit tests for `formatCellValue` cover all new columns
- [ ] Unit test confirms advertising does NOT get negative prefix
- [ ] Unit test for `calculateTotals` includes all new fields
- [ ] Existing E2E tests still pass (`npm run test:e2e`)

---

## Tasks / Subtasks

### Task 1: Add Column Definitions to `table-columns.ts`
**File**: `src/components/custom/dashboard/table-columns.ts`
**Lines**: 53-66 (COLUMNS array)

**Current state** (4 columns):
```typescript
export const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Дата', width: '100px', align: 'left', sortable: true },
  { key: 'ordersCount', label: 'Заказы, шт', width: '110px', align: 'right', sortable: true },
  { key: 'orders', label: 'Сумма заказов', width: '140px', align: 'right', sortable: true },
  {
    key: 'advertising',
    label: 'Реклама',
    width: '120px',
    align: 'right',
    sortable: true,
    negativePrefix: true,  // <-- BUG: causes -1,009₽
  },
]
```

**Target state** (9 columns):
```typescript
export const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Дата', width: '100px', align: 'left', sortable: true },
  { key: 'ordersCount', label: 'Заказы, шт', width: '110px', align: 'right', sortable: true },
  { key: 'orders', label: 'Сумма заказов', width: '140px', align: 'right', sortable: true },
  { key: 'sales', label: 'Выкупы', width: '130px', align: 'right', sortable: true },
  {
    key: 'advertising',
    label: 'Реклама',
    width: '120px',
    align: 'right',
    sortable: true,
    isExpense: true,       // NEW: replaces negativePrefix
  },
  {
    key: 'logistics',
    label: 'Логистика',
    width: '120px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'storage',
    label: 'Хранение',
    width: '120px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'commission',
    label: 'Комиссия',
    width: '120px',
    align: 'right',
    sortable: true,
    isExpense: true,
  },
  {
    key: 'theoreticalProfit',
    label: 'Теор.прибыль',
    width: '140px',
    align: 'right',
    sortable: true,
    colorize: true,
  },
]
```

**Substeps**:
1. Add `isExpense?: boolean` to `ColumnDef` interface (line 36-51). This replaces `negativePrefix` semantically -- expense columns display as positive costs with gray text, without a `-` prefix.
2. Replace `negativePrefix: true` with `isExpense: true` on the advertising column.
3. Insert 5 new column entries after the `orders` column: `sales`, `advertising` (moved), `logistics`, `storage`, `commission`, `theoreticalProfit`.
4. Update `formatCellValue` (line 71-91): Remove the `negativePrefix` branch (lines 86-88). For `isExpense` columns, just format normally with `formatCurrency(Math.abs(value))` -- no sign prefix. Keep `Math.abs()` as a safety net in case backend ever sends negative values for costs.

**Alternative (simpler)**: Instead of adding a new `isExpense` field, simply remove `negativePrefix: true` from advertising and add the new columns without any special flag. The gray color styling can remain on `negativePrefix` for backward compat, or just be applied based on `isExpense`. Recommend the `isExpense` approach for clarity.

### Task 2: Fix `formatCellValue` for Advertising Sign
**File**: `src/components/custom/dashboard/table-columns.ts`
**Lines**: 84-88

**Root cause**:
```typescript
// Line 84-88: This prepends "-" to ALL non-zero values
const formatted = formatCurrency(Math.abs(value))
if (column.negativePrefix && value !== 0) {
  return `-${formatted}`
}
```

The backend returns `advertising` as a positive number (e.g., `1009`). The `Math.abs()` on line 84 is redundant for positive values, and then line 87 prepends `-`, turning `1 009 ₽` into `-1 009 ₽`.

**Fix**: Remove the `negativePrefix` conditional block. Replace with:
```typescript
const formatted = formatCurrency(Math.abs(value))
// No negative prefix -- costs display as positive values with gray styling
return formatted
```

### Task 3: Update `getCellColor` in `DailyMetricsTableRow.tsx`
**File**: `src/components/custom/dashboard/DailyMetricsTableRow.tsx`
**Lines**: 30-39

**Current**:
```typescript
function getCellColor(column: ColumnDef, value: number): string | undefined {
  if (column.colorize) {
    if (value > 0) return 'text-green-500'
    if (value < 0) return 'text-red-500'
  }
  if (column.negativePrefix) {
    return 'text-gray-500'
  }
  return undefined
}
```

**Target**: Replace `column.negativePrefix` with `column.isExpense`:
```typescript
function getCellColor(column: ColumnDef, value: number): string | undefined {
  if (column.colorize) {
    if (value > 0) return 'text-green-500'
    if (value < 0) return 'text-red-500'
  }
  if (column.isExpense) {
    return 'text-gray-500'
  }
  return undefined
}
```

This ensures all expense columns (Реклама, Логистика, Хранение, Комиссия) render in gray, distinguishing them from revenue columns (Выкупы, Сумма заказов) which render in default gray-800.

### Task 4: Update Table Min-Width
**File**: `src/components/custom/dashboard/DailyMetricsTable.tsx`
**Line**: 127

**Current**: `<Table className="min-w-[900px]">`
**Target**: `<Table className="min-w-[1200px]">`

Calculation: 100 + 110 + 140 + 130 + 120 + 120 + 120 + 120 + 140 = 1100px + 100px padding = 1200px

### Task 5: Add Tooltip to "Заказы, шт" Header
**File**: `src/components/custom/dashboard/table-columns.ts`

Add an optional `tooltip?: string` field to `ColumnDef`:
```typescript
export interface ColumnDef {
  key: string
  label: string
  width: string
  align: 'left' | 'right'
  sortable: boolean
  negativePrefix?: boolean   // deprecated, kept for compat
  isExpense?: boolean        // NEW: expense column styling (gray text, no sign prefix)
  colorize?: boolean
  tooltip?: string           // NEW: optional header tooltip text
}
```

Set tooltip on ordersCount:
```typescript
{
  key: 'ordersCount',
  label: 'Заказы, шт',
  width: '110px',
  align: 'right',
  sortable: true,
  tooltip: 'Только заказы FBS (по дням). Общее кол-во FBO+FBS см. в карточке "Заказы".',
},
```

**File**: `src/components/custom/dashboard/DailyMetricsTableHeader.tsx`
**Lines**: 88-99

Update the header cell content to conditionally render a tooltip icon when `column.tooltip` is set:
```tsx
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Inside the column header div (line 89-99):
<div className={cn('flex items-center gap-1', column.align === 'right' && 'justify-end')}>
  <span>{column.label}</span>
  {column.tooltip && (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3 w-3 text-gray-400 cursor-help" aria-label={column.tooltip} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{column.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )}
  {column.sortable && (
    <SortIndicator columnKey={column.key} sortKey={sortKey} sortDirection={sortDirection} />
  )}
</div>
```

### Task 6: Clean Up `negativePrefix` (Optional / Low Priority)
**File**: `src/components/custom/dashboard/table-columns.ts`

Remove `negativePrefix` from the `ColumnDef` interface and any references. Since this is only used in one place (advertising column) and we are replacing it with `isExpense`, this is safe. However, if other code references `negativePrefix`, do a project-wide search first:
```
grep -r "negativePrefix" src/
```
Current references (all in `src/components/custom/dashboard/`):
- `table-columns.ts:48` (interface def)
- `table-columns.ts:64` (advertising column)
- `table-columns.ts:86` (formatCellValue)
- `DailyMetricsTableRow.tsx:35` (getCellColor)

All 4 references are in the same dashboard component group. Safe to remove entirely.

### Task 7: Write Unit Tests
**File**: `src/components/custom/dashboard/__tests__/table-columns.test.ts` (NEW)

Test cases:
1. `formatCellValue` returns correct currency format for each new column key (sales, logistics, storage, commission, theoreticalProfit)
2. `formatCellValue` does NOT prepend `-` for advertising (regression test for Issue 2)
3. `formatCellValue` returns positive value for expense columns even if backend sends negative
4. `calculateTotals` correctly sums all 12 numeric fields including new ones
5. `COLUMNS` array has exactly 9 entries
6. `getColumnComparator` works for new column keys
7. `getCellColor` returns `text-green-500` for positive theoreticalProfit
8. `getCellColor` returns `text-red-500` for negative theoreticalProfit
9. `getCellColor` returns `text-gray-500` for all `isExpense` columns

Pattern: Use pure function testing (no mocking needed -- all functions are exported pure functions from `table-columns.ts`).

---

## Dev Notes

### Column Architecture

The daily breakdown table uses a data-driven column configuration pattern:

```
table-columns.ts (COLUMNS[], formatCellValue, calculateTotals, getColumnComparator)
       |
       v
DailyMetricsTableHeader.tsx  -- reads COLUMNS[] for header labels, widths, sort indicators
DailyMetricsTableRow.tsx     -- reads COLUMNS[] to iterate cells, calls formatCellValue()
DailyMetricsTable.tsx        -- orchestrator: passes COLUMNS to header/row, calls calculateTotals()
```

Adding a new column requires only:
1. Add entry to `COLUMNS[]` in `table-columns.ts`
2. Ensure the `key` matches a field on `DailyMetrics` (already defined in `src/types/daily-metrics.ts`)
3. No changes to row/header components unless new formatting behavior is needed

### Data Flow (Where Numbers Come From)

```
useDailyMetrics (hook)
  -> getAllDailyData (4 parallel API calls)
     -> getOrdersDailyData      : orders/trends?aggregation=day -> ordersCount, orders (revenue)
     -> getFinanceDailyData     : daily/finance -> sales, logistics, storage, penalties, commission
     -> getAdvertisingDailyData : daily/advertising -> advertising spend
     -> getOrdersCogsDailyData  : orders/volume?include_cogs=true -> per-day COGS
  -> aggregateDailyMetrics (merges by date)
  -> fillMissingDays (fills gaps with zeros)
  -> DailyMetrics[] (fully populated)
```

All fields on `DailyMetrics` are already populated by aggregation (`src/lib/daily/aggregation.ts:89-103`). The table just needs to display them.

### Advertising Sign Root Cause

The `negativePrefix` flag was introduced in Story 62.8-FE when the backend had no daily finance/advertising endpoints (Request #157). At that time, the table only showed 4 columns and advertising was the only "cost" column. The `-` prefix was a UX signal meaning "this is money going out." Now that we have multiple expense columns (logistics, storage, commission), a consistent pattern is needed: expense columns show positive values in gray text. The `-` prefix is misleading because the backend value is already positive.

### Orders Count Discrepancy (Not a Bug)

| Source | Endpoint | Scope | Value |
|--------|----------|-------|-------|
| P&L header card | `fulfillment/summary.total.ordersCount` | FBO + FBS combined | 386 |
| Daily table | `orders/trends?aggregation=day` | FBS-only | ~6 per day |

The `orders/trends` endpoint is sourced from `orders_fbs` table (see `OrdersTrendsResponse.dataSource.primary: "orders_fbs"`). The `fulfillment/summary` endpoint aggregates both FBO and FBS. There is no endpoint that provides FBO+FBS orders broken down by day. A backend enhancement would be needed to unify this. For now, a tooltip on the column header is the appropriate fix.

See also: MEMORY.md entry "Fulfillment ordersRevenue != seller revenue (Critical)" for broader context on this data source mismatch.

### Theoretical Profit Formula

Already implemented in `src/lib/daily/aggregation.ts:30-42`:
```
theoreticalProfit = sales - salesCogs - advertising - logistics - storage - penalties - paidAcceptance - commission
```

This uses `sales` (Выкупы from finance daily, = `wb_sales_gross`) as the base, NOT `orders` (order volume). This is correct because sales reflect actual settled revenue from the WB weekly report.

### File Size Compliance

Current file sizes (must stay under 200 lines per project rules):
- `table-columns.ts`: 147 lines -> adding 5 column entries (~30 lines) + minor edits -> ~170 lines. OK.
- `DailyMetricsTableRow.tsx`: 80 lines -> ~2 line change. OK.
- `DailyMetricsTableHeader.tsx`: 107 lines -> adding tooltip (~15 lines) -> ~120 lines. OK.
- `DailyMetricsTable.tsx`: 147 lines -> 1 line change. OK.

If `table-columns.ts` approaches 200 lines, consider extracting `formatCellValue` and `calculateTotals` into a separate `table-format.ts` file.

---

## References

| Resource | Path |
|----------|------|
| **Column config** | `src/components/custom/dashboard/table-columns.ts` |
| **Table component** | `src/components/custom/dashboard/DailyMetricsTable.tsx` |
| **Row component** | `src/components/custom/dashboard/DailyMetricsTableRow.tsx` |
| **Header component** | `src/components/custom/dashboard/DailyMetricsTableHeader.tsx` |
| **DailyMetrics type** | `src/types/daily-metrics.ts` |
| **Aggregation logic** | `src/lib/daily/aggregation.ts` |
| **API layer** | `src/lib/api/daily-analytics/api.ts` |
| **Hook** | `src/hooks/useDailyMetrics.ts` |
| **Section wrapper** | `src/components/custom/dashboard/DailyBreakdownSection.tsx` |
| **Chart config** | `src/components/custom/dashboard/daily-chart-config.ts` |
| **Backend request** | `docs/request-backend/157-DAILY-BREAKDOWN-BACKEND-REQUIREMENTS.md` |
| **Existing tests** | `src/lib/__tests__/daily-helpers.test.ts` |
| **Data sources doc** | `docs/DATA-SOURCES-REFERENCE.md` |

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Story file created 2026-04-13 by analysis agent
- All source files read and cross-referenced
- Root cause for advertising sign confirmed: `negativePrefix: true` in table-columns.ts:64 + formatCellValue logic at line 86-88
- Orders count discrepancy documented as data source limitation, not a bug
- All DailyMetrics fields already populated by aggregation -- purely a presentation layer change
- No backend changes required -- all data already flows through from daily/finance and daily/advertising endpoints

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2026-04-13 | Story created | Claude Opus 4.6 |

### File List
Files to modify:
- `src/components/custom/dashboard/table-columns.ts` -- add columns, fix negativePrefix, add tooltip field
- `src/components/custom/dashboard/DailyMetricsTableRow.tsx` -- update getCellColor for isExpense
- `src/components/custom/dashboard/DailyMetricsTableHeader.tsx` -- add tooltip rendering
- `src/components/custom/dashboard/DailyMetricsTable.tsx` -- update min-w

Files to create:
- `src/components/custom/dashboard/__tests__/table-columns.test.ts` -- unit tests for column formatting

Files for reference only (no changes):
- `src/types/daily-metrics.ts` -- DailyMetrics interface (already has all fields)
- `src/lib/daily/aggregation.ts` -- aggregation logic (already populates all fields)
- `src/lib/api/daily-analytics/api.ts` -- API layer (already fetches finance daily)
- `src/hooks/useDailyMetrics.ts` -- hook (no changes needed)
- `src/components/custom/dashboard/DailyBreakdownSection.tsx` -- section wrapper (no changes needed)
