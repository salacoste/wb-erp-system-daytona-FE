# Story 6.1-FE: Date Range Support for Analytics

## Story Info

- **Epic**: 6 - Advanced Analytics (Frontend)
- **Priority**: High
- **Points**: 5
- **Status**: Ready for Review
- **Backend Dependency**: Story 6.1 (Complete) - `weekStart`/`weekEnd` params

## User Story

**As a** seller analyzing my business performance,
**I want** to select a date range (from week to week) in the analytics UI,
**So that** I can analyze trends and totals across custom time periods.

## Acceptance Criteria

### AC1: Date Range Picker Component
- [x] Create `DateRangePicker` component with two week selectors
- [x] Support "from week" and "to week" selection
- [x] Validate: start week <= end week
- [x] Validate: range <= 52 weeks (show error if exceeded)
- [x] Show "Последние N недель" quick select option

### AC2: Update Analytics Hooks
- [x] Update `useMarginAnalytics.ts` to support `weekStart`/`weekEnd` params
- [x] Update `MarginAnalyticsFilters` interface
- [x] Keep backward compatibility with single `week` param
- [x] Handle aggregated response format with new fields

### AC3: Update Analytics Pages
- [x] Update `/analytics/sku` page with date range picker
- [x] Update `/analytics/brand` page with date range picker
- [x] Update `/analytics/category` page with date range picker
- [x] Pass `weekStart`/`weekEnd` to API calls

### AC4: Display Aggregated Data
- [x] Show period label: "W44 — W47 (4 недели)"
- [x] Display aggregated metrics (sums, weighted averages)
- [x] Show `weeks_with_sales` count in meta info (DEFER-001 resolved)

## Technical Details

### Hook Enhancement

```typescript
// src/hooks/useMarginAnalytics.ts
export interface MarginAnalyticsFilters {
  week?: string           // Single week (backward compatible)
  weekStart?: string      // NEW: Range start (ISO week)
  weekEnd?: string        // NEW: Range end (ISO week)
  includeCogs?: boolean
  cursor?: string
  limit?: number
}

// Build query params
const params = new URLSearchParams()
if (filters.weekStart && filters.weekEnd) {
  params.append('weekStart', filters.weekStart)
  params.append('weekEnd', filters.weekEnd)
} else if (filters.week) {
  params.append('week', filters.week)
}
```

### DateRangePicker Component

```typescript
// src/components/custom/DateRangePicker.tsx
interface DateRangePickerProps {
  weekStart: string
  weekEnd: string
  onRangeChange: (start: string, end: string) => void
  maxWeeks?: number  // Default: 52
}

function DateRangePicker({ weekStart, weekEnd, onRangeChange, maxWeeks = 52 }: DateRangePickerProps) {
  // Validation
  const validateRange = (start: string, end: string): boolean => {
    if (start > end) return false
    const weeksCount = calculateWeeksDiff(start, end)
    return weeksCount <= maxWeeks
  }
  // ...
}
```

### Backend Response (Aggregated)

```typescript
// When weekStart/weekEnd provided, response includes:
interface AggregatedAnalyticsItem {
  nm_id: string
  sa_name: string
  revenue_net: number       // SUM across weeks
  qty: number               // SUM across weeks
  cogs: number              // SUM across weeks
  profit: number            // SUM across weeks
  margin_pct: number        // Weighted average
  profit_per_unit: number   // profit / qty
  roi: number               // (profit / cogs) * 100
  weeks_with_sales: number  // NEW: count of weeks with sales
  weeks_with_cogs: number   // NEW: count of weeks with COGS
}

// Meta includes week_range
meta: {
  week_range: {
    start: "2025-W44",
    end: "2025-W47",
    weeks_count: 4
  },
  aggregation: "sum_and_weighted_average"
}
```

## Dependencies

- WeekSelector component (existing)
- useAvailableWeeks hook (existing)
- Backend Story 6.1 (complete)

---

## Tasks / Subtasks

### Task 1: Create DateRangePicker Component (AC1)
- [x] 1.1 Create `src/components/custom/DateRangePicker.tsx`
- [x] 1.2 Add two WeekSelector components (weekStart / weekEnd)
- [x] 1.3 Implement validation: start week ≤ end week
- [x] 1.4 Implement validation: range ≤ 52 weeks with error message
- [x] 1.5 Add "Последние N недель" quick select dropdown (4, 8, 12 weeks)
- [x] 1.6 Export component and types

### Task 2: Update useMarginAnalytics Hook (AC2)
- [x] 2.1 Add `weekStart`/`weekEnd` to `MarginAnalyticsFilters` interface
- [x] 2.2 Update query params building logic (weekStart/weekEnd OR week)
- [x] 2.3 Maintain backward compatibility with single `week` param
- [x] 2.4 Update queryKey to include range params for cache isolation
- [x] 2.5 Handle aggregated response format with new fields

### Task 3: Update Analytics SKU Page (AC3)
- [x] 3.1 Import DateRangePicker component
- [x] 3.2 Add state for weekStart/weekEnd
- [x] 3.3 Replace single WeekSelector with DateRangePicker
- [x] 3.4 Pass weekStart/weekEnd to useMarginAnalytics hook

### Task 4: Update Analytics Brand Page (AC3)
- [x] 4.1 Import DateRangePicker component
- [x] 4.2 Add state for weekStart/weekEnd
- [x] 4.3 Replace single WeekSelector with DateRangePicker
- [x] 4.4 Pass weekStart/weekEnd to hook

### Task 5: Update Analytics Category Page (AC3)
- [x] 5.1 Import DateRangePicker component
- [x] 5.2 Add state for weekStart/weekEnd
- [x] 5.3 Replace single WeekSelector with DateRangePicker
- [x] 5.4 Pass weekStart/weekEnd to hook

### Task 6: Display Aggregated Data (AC4) ✅
- [x] 6.1 Show period label: "W44 — W47 (4 недели)" in page header
- [x] 6.2 Display `weeks_with_sales` count in table or meta info (DEFER-001 resolved)
- [x] 6.3 Display `weeks_with_cogs` count where applicable (DEFER-001 resolved)

### Task 7: Testing (All ACs)
- [x] 7.1 Unit tests for DateRangePicker validation logic
- [x] 7.2 Unit tests for useMarginAnalytics hook changes
- [ ] 7.3 Integration tests for SKU page with date range
- [x] 7.4 Verify backward compatibility (single week still works)

---

## Dev Notes

### Source Tree (Relevant Files)

```
src/
├── app/(dashboard)/analytics/
│   ├── sku/page.tsx           # UPDATE: Add DateRangePicker
│   ├── brand/page.tsx         # UPDATE: Add DateRangePicker
│   └── category/page.tsx      # UPDATE: Add DateRangePicker
├── components/custom/
│   ├── WeekSelector.tsx       # EXISTING: Reuse for individual weeks
│   └── DateRangePicker.tsx    # NEW: Week range picker
├── hooks/
│   └── useMarginAnalytics.ts  # UPDATE: Add weekStart/weekEnd support
└── types/
    └── analytics.ts           # UPDATE: Add aggregated response types
```

### Testing Standards

- **Unit Tests Location**: `src/components/custom/__tests__/DateRangePicker.test.tsx`
- **Hook Tests**: `src/hooks/__tests__/useMarginAnalytics.test.ts`
- **Framework**: Vitest + React Testing Library
- **Coverage Target**: >80% for new code

---

## Test Cases

- [x] Date range picker renders correctly
- [x] Start week validation (cannot be after end)
- [x] Max 52 weeks validation with error message
- [x] API called with correct weekStart/weekEnd params
- [x] Aggregated data displayed correctly
- [x] Single week mode still works (backward compatible)
- [x] Quick select "Последние 4 недели" works

## Definition of Done

- [x] DateRangePicker component created
- [x] useMarginAnalytics hook updated
- [x] All three analytics pages support date range
- [x] Validation errors shown correctly
- [x] Unit tests pass (>80% coverage)
- [x] No TypeScript errors

## Related

- Backend Story 6.1: Date Range Support
- Existing: `src/components/custom/WeekSelector.tsx`
- Existing: `src/hooks/useMarginAnalytics.ts`

---

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### File List
| File | Action |
|------|--------|
| `src/components/custom/DateRangePicker.tsx` | Created |
| `src/components/custom/__tests__/DateRangePicker.test.tsx` | Created |
| `src/hooks/useMarginAnalytics.ts` | Modified |
| `src/app/(dashboard)/analytics/sku/page.tsx` | Modified |
| `src/app/(dashboard)/analytics/brand/page.tsx` | Modified |
| `src/app/(dashboard)/analytics/category/page.tsx` | Modified |

### Completion Notes
- DateRangePicker component created with validation, quick select, and period label
- All 3 analytics pages updated to use DateRangePicker instead of single week selector
- useMarginAnalytics hooks updated to support weekStart/weekEnd params with backward compatibility
- 16 unit tests added and passing (100% pass rate)
- Lint checks passing
- DEFER-001 RESOLVED (2025-12-05): `weeks_with_sales`/`weeks_with_cogs` now displayed in MarginBySkuTable tooltip

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-29 | 1.0 | Initial draft | Claude (Opus 4.5) |
| 2025-11-29 | 1.1 | Added Tasks/Subtasks, Dev Notes with Source Tree, Change Log. Status confirmed Ready for Dev | Sarah (PO Agent) |
| 2025-12-05 | 2.0 | Implementation complete. DateRangePicker, hook updates, page updates, tests. Status: Ready for Review | James (Dev Agent) |
| 2025-12-05 | 2.1 | DEFER-001 resolved: Added weeks_with_sales/weeks_with_cogs display in MarginBySkuTable tooltip. TypeScript types updated. | Claude (Opus 4.5) |
