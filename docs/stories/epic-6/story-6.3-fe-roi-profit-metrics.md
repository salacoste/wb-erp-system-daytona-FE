# Story 6.3-FE: ROI & Profit Metrics Display

## Story Info

- **Epic**: 6 - Advanced Analytics (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Done
- **Completed**: 2025-12-05
- **Backend Dependency**: Story 6.3 (Complete) - `profit_per_unit`, `roi` fields

## User Story

**As a** seller analyzing profitability,
**I want** to see ROI and profit per unit metrics in analytics tables,
**So that** I can evaluate product efficiency beyond just margin percentage.

## Acceptance Criteria

### AC1: Display ROI Column
- [x] Add "ROI" column to analytics tables (SKU, Brand, Category)
- [x] Show ROI as percentage: `(profit / cogs) × 100%`
- [x] Handle null ROI (when cogs = 0)
- [x] Tooltip explaining ROI calculation

### AC2: Display Profit per Unit Column
- [x] Add "Прибыль/ед." column to analytics tables
- [x] Show as currency: `profit / qty`
- [x] Handle null (when qty = 0)
- [x] Format: "125.50 ₽/ед."

### AC3: Column Visibility Toggle
- [x] Allow users to show/hide ROI column
- [x] Allow users to show/hide Profit per Unit column
- [x] Remember preference in localStorage
- [x] Default: both visible

### AC4: Sorting Support
- [x] Enable sorting by ROI (ascending/descending)
- [x] Enable sorting by Profit per Unit
- [x] Update sort indicators

## Technical Details

### New Columns Configuration

```typescript
// src/app/(dashboard)/analytics/sku/page.tsx
const columns = [
  // ... existing columns
  {
    key: 'profit_per_unit',
    header: 'Прибыль/ед.',
    format: (value: number | null) =>
      value !== null ? `${formatCurrency(value)}/ед.` : '—',
    sortable: true,
    tooltip: 'Прибыль на единицу товара = Прибыль ÷ Количество',
    visible: true,  // Default visible
  },
  {
    key: 'roi',
    header: 'ROI',
    format: (value: number | null) =>
      value !== null ? `${value.toFixed(1)}%` : '—',
    sortable: true,
    tooltip: 'Рентабельность инвестиций = (Прибыль ÷ COGS) × 100%',
    visible: true,  // Default visible
  },
]
```

### Column Visibility Hook

```typescript
// src/hooks/useColumnVisibility.ts
interface ColumnVisibility {
  profit_per_unit: boolean
  roi: boolean
}

function useColumnVisibility(storageKey: string) {
  const [visibility, setVisibility] = useState<ColumnVisibility>(() => {
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : { profit_per_unit: true, roi: true }
  })

  const toggleColumn = (column: keyof ColumnVisibility) => {
    const newVisibility = { ...visibility, [column]: !visibility[column] }
    setVisibility(newVisibility)
    localStorage.setItem(storageKey, JSON.stringify(newVisibility))
  }

  return { visibility, toggleColumn }
}
```

### ROI Color Coding

```typescript
// ROI thresholds for color coding
function getROIColor(roi: number | null): string {
  if (roi === null) return 'text-gray-400'
  if (roi >= 100) return 'text-green-600'   // Excellent: >100%
  if (roi >= 50) return 'text-green-500'    // Good: 50-100%
  if (roi >= 20) return 'text-yellow-600'   // Average: 20-50%
  if (roi >= 0) return 'text-orange-500'    // Low: 0-20%
  return 'text-red-600'                      // Negative ROI
}
```

### Types Update

```typescript
// src/types/cogs.ts - Update MarginAnalyticsSku
export interface MarginAnalyticsSku {
  nm_id: string
  sa_name: string
  revenue_net: number
  qty: number
  cogs?: number
  profit?: number
  margin_pct?: number
  markup_percent?: number
  missing_cogs_flag: boolean

  // NEW fields (Story 6.3)
  profit_per_unit?: number | null  // profit / qty
  roi?: number | null              // (profit / cogs) * 100
}
```

## Dependencies

- Backend Story 6.3: ROI & Profit Metrics (complete)
- Existing analytics tables (SKU, Brand, Category)

---

## Tasks / Subtasks

### Task 1: Update Types for New Fields (AC1, AC2)
- [x] 1.1 Add `profit_per_unit?: number | null` to `MarginAnalyticsSku` interface
- [x] 1.2 Add `roi?: number | null` to `MarginAnalyticsSku` interface
- [x] 1.3 Add same fields to Brand and Category types

### Task 2: Create useColumnVisibility Hook (AC3)
- [x] 2.1 Create `src/hooks/useColumnVisibility.ts`
- [x] 2.2 Implement localStorage persistence with storage key param
- [x] 2.3 Add `toggleColumn` function
- [x] 2.4 Default visibility: `{ profit_per_unit: true, roi: true }`
- [x] 2.5 Export hook and types

### Task 3: Add ROI Column to SKU Table (AC1, AC4)
- [x] 3.1 Add ROI column configuration to columns array
- [x] 3.2 Implement ROI color coding function (`getROIColor`)
- [x] 3.3 Add tooltip explaining ROI calculation
- [x] 3.4 Enable sorting by ROI
- [x] 3.5 Handle null ROI display ("—")

### Task 4: Add Profit per Unit Column to SKU Table (AC2, AC4)
- [x] 4.1 Add Profit per Unit column configuration
- [x] 4.2 Format as currency with "/ед." suffix
- [x] 4.3 Add tooltip explaining calculation
- [x] 4.4 Enable sorting by Profit per Unit
- [x] 4.5 Handle null display ("—")

### Task 5: Add Column Visibility Toggle UI (AC3)
- [x] 5.1 Add dropdown/popover for column visibility settings
- [x] 5.2 Place toggle button near table header (e.g., "⚙️ Колонки")
- [x] 5.3 Wire up useColumnVisibility hook
- [x] 5.4 Show/hide columns based on visibility state

### Task 6: Update Brand Analytics Table (AC1, AC2)
- [x] 6.1 Add ROI column to brand table
- [x] 6.2 Add Profit per Unit column to brand table
- [x] 6.3 Apply same visibility toggle

### Task 7: Update Category Analytics Table (AC1, AC2)
- [x] 7.1 Add ROI column to category table
- [x] 7.2 Add Profit per Unit column to category table
- [x] 7.3 Apply same visibility toggle

### Task 8: Testing (All ACs)
- [x] 8.1 Unit tests for useColumnVisibility hook
- [x] 8.2 Unit tests for ROI color coding function
- [x] 8.3 Unit tests for column formatting
- [x] 8.4 Verify localStorage persistence
- [x] 8.5 Verify sorting functionality

---

## Dev Notes

### Source Tree (Implemented Files)

```
src/
├── components/custom/
│   ├── MarginBySkuTable.tsx       # UPDATED: ROI & Profit/Unit columns with sorting
│   ├── MarginByBrandTable.tsx     # UPDATED: ROI & Profit/Unit columns with sorting
│   ├── MarginByCategoryTable.tsx  # UPDATED: ROI & Profit/Unit columns with sorting
│   └── ColumnVisibilityToggle.tsx # NEW: Column toggle dropdown component
├── hooks/
│   └── useColumnVisibility.ts     # NEW: localStorage-persisted visibility hook
├── lib/
│   └── analytics-utils.ts         # NEW: getROIColor, formatROI, formatProfitPerUnit
└── types/
    └── cogs.ts                    # UPDATED: profit_per_unit, roi fields added
```

### ROI Color Thresholds

| ROI Range | Color | Meaning |
|-----------|-------|---------|
| ≥100% | Green-600 | Excellent |
| 50-99% | Green-500 | Good |
| 20-49% | Yellow-600 | Average |
| 0-19% | Orange-500 | Low |
| <0% | Red-600 | Negative (losing money) |

### Testing Standards

- **Unit Tests Location**: `src/hooks/__tests__/useColumnVisibility.test.ts`
- **Framework**: Vitest + React Testing Library
- **localStorage Mock**: Use `vi.spyOn(Storage.prototype, 'setItem')`

---

## Test Cases

- [x] ROI column displays correctly
- [x] Profit per unit formats with currency
- [x] Null handling (shows "—")
- [x] Sorting by ROI works
- [x] Sorting by Profit per Unit works
- [x] Column visibility toggle persists
- [x] Color coding applied correctly

## Definition of Done

- [x] ROI column added to all analytics tables
- [x] Profit per Unit column added
- [x] Column visibility toggle implemented
- [x] Sorting enabled for new columns
- [x] Types updated in cogs.ts
- [x] Unit tests pass

## Related

- Backend Story 6.3: ROI & Profit Metrics
- Existing: `src/app/(dashboard)/analytics/sku/page.tsx`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-29 | 1.0 | Initial draft | Claude (Opus 4.5) |
| 2025-11-29 | 1.1 | Added Tasks/Subtasks (8 tasks), Dev Notes with Source Tree and ROI thresholds, Change Log | Sarah (PO Agent) |
| 2025-12-05 | 1.2 | Story completed: All ACs implemented, all tasks done, all tests passing. Created useColumnVisibility hook, ColumnVisibilityToggle component, analytics-utils.ts with ROI/Profit formatters. Updated all 3 margin tables (SKU, Brand, Category) with ROI and Profit per Unit columns, tooltips, sorting, and color coding. | Claude (Opus 4.5) |
