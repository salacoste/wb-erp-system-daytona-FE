# Story 6.2-FE: Period Comparison Enhancement

## Story Info

- **Epic**: 6 - Advanced Analytics (Frontend)
- **Priority**: Medium
- **Points**: 3
- **Status**: ✅ Ready for Review
- **Backend Dependency**: Story 6.2 (Complete) - `compare_to` param with delta calculations

## User Story

**As a** seller comparing business performance,
**I want** to compare date ranges (not just single weeks) with delta calculations,
**So that** I can see growth trends between periods.

## Acceptance Criteria

### AC1: Enhanced Comparison Mode
- [x] Update comparison to support date ranges (not just single weeks)
- [x] Show "Период 1 vs Период 2" header
- [x] Display delta values (absolute and percentage)

### AC2: Delta Visualization
- [x] Show green arrow for positive deltas (growth)
- [x] Show red arrow for negative deltas (decline)
- [x] Show gray dash for no change
- [x] Tooltip with exact delta values

### AC3: API Integration
- [x] Use `compare_to` parameter for period comparison
- [x] Handle `delta` fields in response:
  - `revenue_delta`, `revenue_delta_pct`
  - `profit_delta`, `profit_delta_pct`
  - `margin_delta_pct`

### AC4: UI/UX
- [x] Side-by-side tables for two periods
- [x] Delta column between values
- [x] Summary row with totals comparison (ComparisonSummary component)

## Technical Details

### Backend Response (with compare_to)

```typescript
// GET /v1/analytics/weekly/by-sku?week=2025-W47&compare_to=2025-W43
interface ComparisonAnalyticsItem {
  nm_id: string
  sa_name: string

  // Current period
  revenue_net: number
  profit: number
  margin_pct: number

  // Comparison period
  compare_revenue_net: number
  compare_profit: number
  compare_margin_pct: number

  // Deltas (NEW)
  revenue_delta: number         // absolute change
  revenue_delta_pct: number     // percentage change
  profit_delta: number
  profit_delta_pct: number
  margin_delta_pct: number      // percentage points change
}
```

### Delta Display Component

```typescript
// src/components/custom/DeltaIndicator.tsx
interface DeltaIndicatorProps {
  value: number
  type: 'absolute' | 'percentage'
  inverse?: boolean  // For metrics where negative is good (e.g., costs)
}

function DeltaIndicator({ value, type, inverse = false }: DeltaIndicatorProps) {
  const isPositive = inverse ? value < 0 : value > 0
  const color = isPositive ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-400'
  const icon = isPositive ? '↑' : value < 0 ? '↓' : '—'

  return (
    <span className={cn('flex items-center gap-1', color)}>
      {icon}
      {type === 'percentage' ? `${value.toFixed(1)}%` : formatCurrency(value)}
    </span>
  )
}
```

### Comparison Table Layout

```
┌──────────────┬─────────────┬────────────┬─────────────┬──────────┐
│ Товар        │ W47         │ Δ          │ W43         │ Δ %      │
├──────────────┼─────────────┼────────────┼─────────────┼──────────┤
│ Product A    │ 125,000 ₽   │ ↑ +15,000  │ 110,000 ₽   │ +13.6%   │
│ Product B    │ 85,000 ₽    │ ↓ -5,000   │ 90,000 ₽    │ -5.6%    │
└──────────────┴─────────────┴────────────┴─────────────┴──────────┘
```

## Dependencies

- Story 6.1-fe: Date Range Support (DateRangePicker)
- Backend Story 6.2: Period Comparison (complete)
- Existing: FinancialSummaryTable comparison mode

---

## Tasks / Subtasks

### Task 1: Create DeltaIndicator Component (AC2) ✅
- [x] 1.1 Create `src/components/custom/DeltaIndicator.tsx`
- [x] 1.2 Implement color logic: green (positive), red (negative), gray (zero)
- [x] 1.3 Add `inverse` prop for metrics where negative is good (e.g., costs)
- [x] 1.4 Support both absolute and percentage display modes
- [x] 1.5 Add tooltip with exact delta values
- [x] 1.6 Export component and types

### Task 2: Update useMarginAnalytics Hook (AC3) ✅
- [x] 2.1 Add `compareTo` param to `MarginAnalyticsFilters` interface
- [x] 2.2 Pass `compare_to` query parameter when set
- [x] 2.3 Update response types to include delta fields
- [x] 2.4 Update queryKey to include comparison period

### Task 3: Update Analytics SKU Page for Comparison (AC1, AC4) ✅
- [x] 3.1 Add comparison period selector (ComparisonPeriodSelector component)
- [x] 3.2 Add "Сравнить с периодом" toggle/checkbox
- [x] 3.3 Update table to show comparison columns when enabled
- [x] 3.4 Add delta column between current and comparison values

### Task 4: Update Analytics Brand Page for Comparison (AC1) ✅
- [x] 4.1 Add comparison mode support
- [x] 4.2 Display delta indicators

### Task 5: Update Analytics Category Page for Comparison (AC1) ✅
- [x] 5.1 Add comparison mode support
- [x] 5.2 Display delta indicators

### Task 6: Summary Row with Totals Comparison (AC4) ✅
- [x] 6.1 Add summary/totals row at bottom of comparison tables (ComparisonSummary component)
- [x] 6.2 Show aggregated deltas for all metrics (ComparisonSummary shows revenue/profit/margin deltas)

### Task 7: Testing (All ACs) ✅
- [x] 7.1 Unit tests for DeltaIndicator component (21 tests)
- [x] 7.2 Unit tests for delta calculation edge cases (zero, null)
- [x] 7.3 Unit tests for ComparisonPeriodSelector (12 tests)
- [ ] 7.4 Visual regression test for color coding (optional)

---

## Dev Notes

### Source Tree (Relevant Files)

```
src/
├── app/(dashboard)/analytics/
│   ├── sku/page.tsx           # UPDATE: Add comparison mode
│   ├── brand/page.tsx         # UPDATE: Add comparison mode
│   └── category/page.tsx      # UPDATE: Add comparison mode
├── components/custom/
│   ├── DeltaIndicator.tsx     # NEW: Delta display component
│   └── DateRangePicker.tsx    # EXISTING: From 6.1-fe
├── hooks/
│   └── useMarginAnalytics.ts  # UPDATE: Add compare_to support
└── types/
    └── analytics.ts           # UPDATE: Add comparison response types
```

### Key Implementation Notes

1. **DeltaIndicator Props**: `{ value, type: 'absolute'|'percentage', inverse?: boolean }`
2. **Zero handling**: Show gray dash "—" for exact zero
3. **Division by zero**: Handle when comparison period has zero value
4. **Color consistency**: Match existing green/red patterns in codebase

### Testing Standards

- **Unit Tests Location**: `src/components/custom/__tests__/DeltaIndicator.test.tsx`
- **Framework**: Vitest + React Testing Library
- **Edge Cases**: Test zero values, null values, very large deltas

---

## Test Cases

- [ ] Comparison mode shows two periods
- [ ] Delta values calculated correctly
- [ ] Green/red colors applied based on delta direction
- [ ] Percentage deltas formatted correctly
- [ ] Edge case: zero values (avoid division by zero)
- [ ] Edge case: no data in comparison period

## Definition of Done

- [x] DeltaIndicator component created
- [x] Comparison tables show delta columns
- [x] API integration with `compare_to` param
- [x] Visual feedback for growth/decline
- [x] Unit tests pass (33 tests total)

## Related

- Backend Story 6.2: Period Comparison
- Existing: `src/app/(dashboard)/analytics/page.tsx` (comparison mode)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-29 | 1.0 | Initial draft | Claude (Opus 4.5) |
| 2025-11-29 | 1.1 | Added Tasks/Subtasks (7 tasks), Dev Notes with Source Tree, Change Log | Sarah (PO Agent) |
| 2025-12-05 | 1.2 | Implementation complete: DeltaIndicator (21 tests), ComparisonPeriodSelector (12 tests), SKU/Brand/Category pages updated with comparison mode. Summary row deferred. | Claude (Opus 4.5) |
| 2025-12-05 | 1.3 | DEFER-002 resolved: Added ComparisonSummary component for table summary rows with comparison deltas | Claude (Opus 4.5) |
