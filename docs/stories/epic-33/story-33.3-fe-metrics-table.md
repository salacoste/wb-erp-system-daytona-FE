# Story 33.3-FE: Performance Metrics Table

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: High
- **Points**: 5
- **Status**: ✅ Ready

## User Story

**As a** seller,
**I want** a detailed table of advertising performance metrics,
**So that** I can identify profitable and unprofitable SKUs/campaigns.

## Acceptance Criteria

### AC1: Table Columns (SKU View)
- [ ] SKU ID (clickable link to internal product page: `/products/:nmId`)
- [ ] Product Name (truncated 45 chars + tooltip)
- [ ] Spend (₽)
- [ ] Revenue (₽)
- [ ] Profit (₽)
- [ ] ROAS (x multiplier)
- [ ] ROI (%)
- [ ] CTR (%)
- [ ] Efficiency Status (badge)

### AC2: Dynamic Columns by View Mode
- [ ] SKU view: SKU ID, Product Name
- [ ] Campaign view: Campaign ID, Campaign Name
- [ ] Brand view: Brand
- [ ] Category view: Category

### AC3: Sorting
- [ ] Sort by: Spend, ROAS, ROI, Conversions
- [ ] Sort order: asc/desc
- [ ] Default: Spend desc (highest spenders first)
- [ ] Visual indicator on sorted column

### AC4: Filtering
- [ ] Filter by efficiency status dropdown
- [ ] Options: All, Excellent, Good, Moderate, Poor, Loss, **Unknown**
- [ ] Filter updates URL query params

### AC5: Pagination
- [ ] **Offset-based pagination** (not cursor-based, per backend API)
- [ ] 25 rows per page
- [ ] "Назад" / "Вперёд" buttons
- [ ] Page indicator: "Стр. X из Y"
- [ ] Total count display

### AC6: Empty & Error States
- [ ] Empty state: "Нет данных за выбранный период"
- [ ] Error state with retry button
- [ ] Loading skeleton (10 rows)

### AC7: 'Unknown' Status Handling
- [ ] When `efficiency_status === 'unknown'`:
  - Show "—" (dash) for ROAS, ROI, Profit columns
  - Show gray badge "Нет данных"
  - Still display: Spend, Revenue (if available), CTR, CPC
- [ ] Tooltip: "Нет данных о прибыли для расчёта эффективности"

### AC8: Accessibility
- [ ] Keyboard navigation for sorting and pagination
- [ ] Focus states visible on all interactive elements
- [ ] Table headers use `<th scope="col">`
- [ ] Screen reader announcements for sort changes

## Tasks / Subtasks

### Phase 1: Table Component
- [ ] Create `components/PerformanceMetricsTable.tsx`
- [ ] Define column configurations for each view mode
- [ ] Implement column header with sort controls
- [ ] Implement row rendering with proper formatting

### Phase 2: Efficiency Badge
- [ ] Create `components/EfficiencyBadge.tsx` (reused from 33.4-fe)
- [ ] Color-coded by efficiency_status
- [ ] Tooltip with classification criteria

### Phase 3: Sorting & Filtering
- [ ] Implement sort state management
- [ ] Implement filter dropdown
- [ ] Sync with URL query params

### Phase 4: Pagination
- [ ] Implement pagination controls
- [ ] Integrate with API offset/limit params
- [ ] Handle page navigation

## Technical Details

### Column Definitions

```typescript
// SKU View columns
const skuColumns = [
  { key: 'sku_id', label: 'Артикул', sortable: false },
  { key: 'product_name', label: 'Название', sortable: false },
  { key: 'spend', label: 'Затраты', sortable: true, format: 'currency' },
  { key: 'revenue', label: 'Выручка', sortable: false, format: 'currency' },
  { key: 'profit', label: 'Прибыль', sortable: false, format: 'currency' },
  { key: 'roas', label: 'ROAS', sortable: true, format: 'multiplier' },
  { key: 'roi', label: 'ROI', sortable: true, format: 'percent' },
  { key: 'ctr', label: 'CTR', sortable: false, format: 'percent' },
  { key: 'efficiency_status', label: 'Статус', sortable: false, format: 'badge' },
];

// Campaign View columns
const campaignColumns = [
  { key: 'campaign_id', label: 'ID', sortable: false },
  { key: 'name', label: 'Кампания', sortable: false },
  // ... same metrics columns
];
```

### Formatting Functions

```typescript
const formatters = {
  currency: (v: number) => formatCurrency(v),           // 1 234 ₽
  multiplier: (v: number) => `${v.toFixed(1)}x`,        // 3.6x
  percent: (v: number) => `${(v * 100).toFixed(1)}%`,   // 46.0%
  percentRaw: (v: number) => `${v.toFixed(1)}%`,        // CTR is already %
  badge: (v: EfficiencyStatus) => <EfficiencyBadge status={v} />,
};
```

### Negative Value Styling

```typescript
// Red color for negative values
const getValueClassName = (value: number, type: string) => {
  if (type === 'currency' || type === 'percent') {
    return value < 0 ? 'text-red-600 font-medium' : '';
  }
  return '';
};
```

### Sort Component

```typescript
interface SortConfig {
  sort_by: 'spend' | 'roas' | 'roi' | 'conversions';
  sort_order: 'asc' | 'desc';
}

function SortableHeader({
  column,
  sortConfig,
  onSort,
}: {
  column: string;
  sortConfig: SortConfig;
  onSort: (column: string) => void;
}) {
  const isSorted = sortConfig.sort_by === column;
  return (
    <button onClick={() => onSort(column)} className="flex items-center gap-1">
      {label}
      {isSorted ? (
        sortConfig.sort_order === 'asc' ? <ChevronUp /> : <ChevronDown />
      ) : (
        <ChevronsUpDown className="opacity-50" />
      )}
    </button>
  );
}
```

## Dev Notes

### File Structure

```
src/app/(dashboard)/analytics/advertising/components/
├── PerformanceMetricsTable.tsx      # Main table component
├── PerformanceTableHeader.tsx       # Header with sort controls
├── PerformanceTableRow.tsx          # Single row component
├── PerformanceTableSkeleton.tsx     # Loading skeleton
└── EfficiencyFilterDropdown.tsx     # Filter dropdown
```

### URL Query Params

```
/analytics/advertising?view=sku&sort=spend&order=desc&status=all
```

### Mobile Responsiveness

- Horizontal scroll on mobile
- Sticky first column (identifier)
- Min-width per column to prevent squishing

## Testing

### Test Cases

- [ ] Table renders with correct columns for each view mode
- [ ] Sorting works for sortable columns
- [ ] Filter dropdown updates table
- [ ] Pagination buttons work
- [ ] Empty state shows when no data
- [ ] Negative values show in red
- [ ] Loading skeleton shows
- [ ] Row click navigates (for SKU view)

## Definition of Done

- [ ] Table component created (<200 lines)
- [ ] All column types work
- [ ] Sorting works
- [ ] Filtering works
- [ ] Pagination works
- [ ] Mobile responsive with horizontal scroll
- [ ] TypeScript passes
- [ ] ESLint passes

## Dependencies

- Story 33.1-fe: Types & API Client
- Story 33.2-fe: Page Layout (provides filters state)
- Story 33.4-fe: Efficiency Badge component

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Offset-based pagination (BLOCKER #2), AC7 unknown handling, AC8 a11y, SKU link clarified |

---

## Dev Agent Record

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. Performance metrics table with full functionality.
       ESLint and TypeScript checks pass.
       Files created:
       - components/PerformanceMetricsTable.tsx (table with sorting, pagination)
       - components/EfficiencyBadge.tsx (color-coded status badge with tooltip)
       - components/EfficiencyFilterDropdown.tsx (filter dropdown)
       Updated:
       - page.tsx (integrated table with sorting, filtering, pagination state)
```
