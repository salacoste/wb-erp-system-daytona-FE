# Story 62.8-FE: Daily Metrics Table View

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: 📋 Ready for Dev
**Priority**: P1 (Important)
**Estimate**: 3 SP

---

## Title (RU)
Табличное представление метрик по дням

---

## Description

Create a tabular view of daily metrics as an alternative to the chart visualization. This table provides a structured, sortable view of all 8 metrics for each day in the selected period.

Business users often prefer table views for:
- Precise value comparison across days
- Quick scanning of specific metrics
- Data export needs (future feature)
- Accessibility (screen reader friendly)

The table should:
- Display one row per day with all 8 metrics as columns
- Include a totals row at the bottom
- Support column sorting
- Use color coding for positive/negative values
- Be responsive with horizontal scroll on smaller screens

---

## Acceptance Criteria

- [ ] Table displays columns: День, Заказы, COGS заказов, Выкупы, COGS выкупов, Реклама, Логистика, Хранение, Теор.прибыль
- [ ] Row count matches period: 7 rows for week, 28-31 rows for month
- [ ] Day column shows formatted date: "Пн 27.01", "Вт 28.01", etc.
- [ ] All numeric columns display formatted currency (Russian locale)
- [ ] Totals row at bottom shows sum of all days
- [ ] All columns (except День) are sortable (ascending/descending)
- [ ] Positive profit values: green text (#22C55E)
- [ ] Negative profit values: red text (#EF4444)
- [ ] Expense columns (Реклама, Логистика, Хранение) shown with minus prefix
- [ ] Header row is sticky on scroll
- [ ] Zebra striping for readability (alternating row backgrounds)
- [ ] Horizontal scroll on mobile/tablet with fixed Day column
- [ ] Loading skeleton shown while data is fetching
- [ ] Empty state when no data available
- [ ] Export to CSV button (disabled for MVP - shows "Скоро" tooltip)

---

## Design Specifications

### Table Layout

```
┌────────────┬───────────┬────────────┬───────────┬────────────┬──────────┬───────────┬──────────┬────────────┐
│ День ▲     │ Заказы ▼  │ COGS заказ │ Выкупы    │ COGS выкуп │ Реклама  │ Логистика │ Хранение │ Теор.приб. │
├────────────┼───────────┼────────────┼───────────┼────────────┼──────────┼───────────┼──────────┼────────────┤
│ Пн 27.01   │ 175 000 ₽ │  87 500 ₽  │ 140 000 ₽ │  70 000 ₽  │ -6 500 ₽ │ -12 800 ₽ │ -4 600 ₽ │  32 100 ₽  │
│ Вт 28.01   │ 192 000 ₽ │  96 000 ₽  │ 153 600 ₽ │  76 800 ₽  │ -7 200 ₽ │ -14 100 ₽ │ -4 600 ₽ │  35 100 ₽  │
│ Ср 29.01   │ 187 000 ₽ │  93 500 ₽  │ 149 600 ₽ │  74 800 ₽  │ -6 800 ₽ │ -13 700 ₽ │ -4 600 ₽ │  34 200 ₽  │
│ Чт 30.01   │ 201 000 ₽ │ 100 500 ₽  │ 160 800 ₽ │  80 400 ₽  │ -7 500 ₽ │ -14 700 ₽ │ -4 600 ₽ │  37 600 ₽  │
│ Пт 31.01   │ 245 000 ₽ │ 122 500 ₽  │ 196 000 ₽ │  98 000 ₽  │ -8 900 ₽ │ -17 900 ₽ │ -4 600 ₽ │  44 600 ₽  │
│ Сб 01.02   │ 156 000 ₽ │  78 000 ₽  │ 124 800 ₽ │  62 400 ₽  │ -5 800 ₽ │ -11 400 ₽ │ -4 600 ₽ │  28 600 ₽  │
│ Вс 02.02   │ 134 000 ₽ │  67 000 ₽  │ 107 200 ₽ │  53 600 ₽  │ -5 000 ₽ │  -9 800 ₽ │ -4 600 ₽ │  24 600 ₽  │
├────────────┼───────────┼────────────┼───────────┼────────────┼──────────┼───────────┼──────────┼────────────┤
│ Итого      │1 290 000₽ │ 645 000 ₽  │1 032 000₽ │ 516 000 ₽  │-47 700 ₽ │ -94 400 ₽ │-32 200 ₽ │ 236 800 ₽  │
└────────────┴───────────┴────────────┴───────────┴────────────┴──────────┴───────────┴──────────┴────────────┘
```

### Column Configuration

| Column | Key | Width | Align | Sortable | Format |
|--------|-----|-------|-------|----------|--------|
| День | date | 100px | left | yes | "Пн DD.MM" |
| Заказы | orders | 110px | right | yes | currency |
| COGS заказов | ordersCogs | 110px | right | yes | currency |
| Выкупы | sales | 110px | right | yes | currency |
| COGS выкупов | salesCogs | 110px | right | yes | currency |
| Реклама | advertising | 100px | right | yes | -currency |
| Логистика | logistics | 100px | right | yes | -currency |
| Хранение | storage | 100px | right | yes | -currency |
| Теор. прибыль | profit | 110px | right | yes | currency (color) |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header | 13px | 600 | `#374151` (gray-700) |
| Cell | 14px | 400 | `#1F2937` (gray-800) |
| Totals Row | 14px | 600 | `#1F2937` (gray-800) |
| Positive Profit | 14px | 500 | `#22C55E` (green) |
| Negative Profit | 14px | 500 | `#EF4444` (red) |
| Expense (negative) | 14px | 400 | `#6B7280` (gray-500) |

### Styling

```css
/* Table container */
.metrics-table-container {
  overflow-x: auto;
  border: 1px solid #EEEEEE;
  border-radius: 8px;
}

/* Table */
.metrics-table {
  width: 100%;
  min-width: 900px; /* Force horizontal scroll on small screens */
  border-collapse: collapse;
}

/* Header */
.metrics-table th {
  position: sticky;
  top: 0;
  background: #F9FAFB;
  border-bottom: 2px solid #EEEEEE;
  padding: 12px 16px;
  font-weight: 600;
  white-space: nowrap;
}

/* Sortable header */
.metrics-table th.sortable {
  cursor: pointer;
}

.metrics-table th.sortable:hover {
  background: #F3F4F6;
}

/* Cells */
.metrics-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #F3F4F6;
}

/* Zebra striping */
.metrics-table tr:nth-child(even) {
  background: #FAFAFA;
}

/* Totals row */
.metrics-table tr.totals-row {
  background: #F3F4F6;
  font-weight: 600;
  border-top: 2px solid #EEEEEE;
}

/* Day column (sticky on mobile) */
.metrics-table td.day-column {
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 1;
}
```

---

## Technical Implementation

### Component Interface

```typescript
// DailyMetricsTable.tsx
interface DailyMetricsTableProps {
  data: DailyMetrics[]
  periodType: 'week' | 'month'
  isLoading: boolean
  error?: Error | null
}

interface TableColumn {
  key: string
  label: string
  width: string
  align: 'left' | 'right'
  sortable: boolean
  format: (value: number) => string
  colorize?: boolean
  negativePrefix?: boolean
}

type SortDirection = 'asc' | 'desc' | null
```

### Columns Definition

```typescript
const COLUMNS: TableColumn[] = [
  {
    key: 'date',
    label: 'День',
    width: '100px',
    align: 'left',
    sortable: true,
    format: (date: string) => formatDayWithDate(date)
  },
  {
    key: 'orders',
    label: 'Заказы',
    width: '110px',
    align: 'right',
    sortable: true,
    format: formatCurrency
  },
  {
    key: 'ordersCogs',
    label: 'COGS заказов',
    width: '110px',
    align: 'right',
    sortable: true,
    format: formatCurrency
  },
  // ... remaining columns
  {
    key: 'advertising',
    label: 'Реклама',
    width: '100px',
    align: 'right',
    sortable: true,
    format: formatCurrency,
    negativePrefix: true
  },
  {
    key: 'profit',
    label: 'Теор. прибыль',
    width: '110px',
    align: 'right',
    sortable: true,
    format: formatCurrency,
    colorize: true // Apply green/red based on value
  }
]
```

### Sorting Logic

```typescript
function useSortableTable(data: DailyMetrics[]) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof DailyMetrics]
      const bVal = b[sortKey as keyof DailyMetrics]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [data, sortKey, sortDirection])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      )
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return { sortedData, sortKey, sortDirection, toggleSort }
}
```

### Totals Calculation

```typescript
function calculateTotals(data: DailyMetrics[]): DailyMetrics {
  return data.reduce(
    (acc, day) => ({
      date: 'Итого',
      dayOfWeek: '',
      orders: acc.orders + day.orders,
      ordersCogs: acc.ordersCogs + day.ordersCogs,
      sales: acc.sales + day.sales,
      salesCogs: acc.salesCogs + day.salesCogs,
      advertising: acc.advertising + day.advertising,
      logistics: acc.logistics + day.logistics,
      storage: acc.storage + day.storage,
      profit: acc.profit + day.profit,
    }),
    {
      date: 'Итого',
      dayOfWeek: '',
      orders: 0,
      ordersCogs: 0,
      sales: 0,
      salesCogs: 0,
      advertising: 0,
      logistics: 0,
      storage: 0,
      profit: 0,
    }
  )
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/DailyMetricsTable.tsx` | CREATE | Table component |
| `src/components/custom/dashboard/DailyMetricsTableHeader.tsx` | CREATE | Sortable header component |
| `src/components/custom/dashboard/DailyMetricsTableRow.tsx` | CREATE | Table row component |
| `src/hooks/useSortableTable.ts` | CREATE | Sorting hook |
| `src/components/custom/dashboard/__tests__/DailyMetricsTable.test.tsx` | CREATE | Unit tests |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add barrel export |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Component | `Table` from shadcn/ui | Available |
| Hook | `useDailyMetrics` | From Story 61.9-FE |
| Utility | `formatCurrency` | Available |
| Story | 62.6-FE DailyBreakdownChart | Same sprint |

---

## Testing Requirements

### Unit Tests

```typescript
describe('DailyMetricsTable', () => {
  it('renders loading skeleton when isLoading=true', () => {})
  it('renders empty state when data is empty', () => {})
  it('renders correct number of rows for week data (7)', () => {})
  it('renders correct number of rows for month data (28-31)', () => {})
  it('formats day column as "Пн DD.MM"', () => {})
  it('formats currency values correctly', () => {})
  it('shows expense columns with minus prefix', () => {})
  it('applies green color to positive profit', () => {})
  it('applies red color to negative profit', () => {})
  it('calculates and displays correct totals', () => {})
  it('sorts ascending on first click', () => {})
  it('sorts descending on second click', () => {})
  it('clears sort on third click', () => {})
  it('shows sort indicator in header', () => {})
  it('has sticky header on scroll', () => {})
})

describe('useSortableTable', () => {
  it('returns unsorted data initially', () => {})
  it('sorts by string column correctly', () => {})
  it('sorts by numeric column correctly', () => {})
  it('toggles sort direction', () => {})
})
```

---

## Accessibility Requirements

- Table uses semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements
- Sort buttons have `aria-sort` attribute indicating current sort state
- Screen reader announces sort direction changes
- All currency values have `aria-label` with full amount
- Sticky header maintains context when scrolling
- Sufficient color contrast for all text (4.5:1 minimum)

```html
<th
  role="columnheader"
  aria-sort="ascending"
  aria-label="Заказы, сортировка по возрастанию"
>
  Заказы
  <span aria-hidden="true">▲</span>
</th>
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Component follows 200-line file limit (split into sub-components)
- [ ] TypeScript strict mode passes
- [ ] Russian locale for all user-facing text
- [ ] Responsive design with horizontal scroll
- [ ] Unit tests written and passing
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Sticky header working on vertical scroll
- [ ] Day column sticky on horizontal scroll (mobile)
- [ ] No ESLint errors
- [ ] Code review approved

---

## References

- **Epic**: `docs/epics/epic-62-fe-dashboard-presentation.md`
- **Wireframe**: `docs/wireframes/dashboard-daily-breakdown.md`
- **shadcn/ui Table**: https://ui.shadcn.com/docs/components/table
- **Related Story**: 62.6-FE (DailyBreakdownChart), 62.9-FE (ViewToggle)

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)
