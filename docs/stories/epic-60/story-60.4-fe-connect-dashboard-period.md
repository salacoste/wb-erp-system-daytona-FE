# Story 60.4-FE: Podkljuchit' dashbord k sostojaniju perioda

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Status**: Ready for Dev
**Story Points**: 2 SP
**Priority**: P1

---

## User Story

**As a** seller using the Wildberries dashboard
**I want** the dashboard to automatically load data for the selected period
**So that** I can see accurate financial metrics for any time period I choose

---

## Acceptance Criteria

- [x] AC1: Dashboard page wrapped with `DashboardPeriodProvider` context
- [x] AC2: `useDashboardMetrics` hook accepts optional `week` parameter from context
- [x] AC3: When period changes in selector, dashboard metrics automatically refetch
- [x] AC4: Both current and previous period data fetched in parallel for comparison
- [x] AC5: `ExpenseChart` component receives week parameter from context
- [x] AC6: Skeleton loaders displayed during period switch transition
- [x] AC7: Query keys include week parameter: `['dashboard', 'metrics', week]`
- [x] AC8: Query invalidation occurs on manual refresh button click

---

## Technical Specifications

### Hook Interface Changes

```typescript
// src/hooks/useDashboard.ts - MODIFIED

export interface UseDashboardMetricsOptions {
  /** ISO week string (e.g., "2026-W05") - defaults to latest available */
  week?: string
  /** Enable fetching previous period for comparison */
  withComparison?: boolean
}

export interface DashboardMetricsWithComparison {
  current: DashboardMetrics
  previous: DashboardMetrics | null
  isLoadingCurrent: boolean
  isLoadingPrevious: boolean
  error: Error | null
}

/**
 * Hook to get dashboard metrics with optional week parameter
 * @param options - Configuration options including week and comparison flag
 */
export function useDashboardMetrics(options?: UseDashboardMetricsOptions): {
  data: DashboardMetrics | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * New hook for parallel fetching of current + previous periods
 * Used when comparison indicators are needed
 */
export function useDashboardMetricsWithComparison(
  currentWeek: string,
  previousWeek: string
): DashboardMetricsWithComparison
```

### Dashboard Page Integration

```typescript
// src/app/(dashboard)/dashboard/page.tsx - MODIFIED

'use client'

import { DashboardPeriodProvider } from '@/contexts/dashboard-period-context'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { useDashboardMetricsWithComparison } from '@/hooks/useDashboard'

export default function DashboardPage() {
  return (
    <DashboardPeriodProvider>
      <DashboardContent />
    </DashboardPeriodProvider>
  )
}

function DashboardContent() {
  const { selectedWeek, previousWeek, periodType } = useDashboardPeriod()

  const {
    current,
    previous,
    isLoadingCurrent,
    isLoadingPrevious,
  } = useDashboardMetricsWithComparison(selectedWeek, previousWeek)

  // ... render with comparison data
}
```

### Implementation Notes

1. **Query Key Strategy**: Include week in query key for proper cache isolation
   ```typescript
   queryKey: ['dashboard', 'metrics', week]
   ```

2. **Parallel Fetching**: Use `useQueries` from TanStack Query for current + previous
   ```typescript
   const results = useQueries({
     queries: [
       { queryKey: ['dashboard', 'metrics', currentWeek], queryFn: ... },
       { queryKey: ['dashboard', 'metrics', previousWeek], queryFn: ... },
     ]
   })
   ```

3. **Stale Time Configuration**:
   - Current period: 60s (fresh data)
   - Previous period: 5min (historical, changes less)

4. **Error Boundary**: Wrap content in error boundary for graceful degradation

5. **Context Fallback**: If `DashboardPeriodContext` not available, use latest week

### Files to Modify

```
src/
├── app/(dashboard)/dashboard/
│   └── page.tsx                      # MODIFY: Add provider, use period state
├── hooks/
│   └── useDashboard.ts               # MODIFY: Add week param, comparison hook
├── components/custom/
│   ├── ExpenseChart.tsx              # MODIFY: Accept week prop
│   └── MetricCard.tsx                # Verify loading skeleton exists
```

---

## Before/After Comparison

### Before

```typescript
// page.tsx - Always fetches latest week
export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics()
  // ...
}

// useDashboard.ts - No week parameter
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'], // No week isolation
    queryFn: async () => {
      const weeksResponse = await apiClient.get(...)
      const latestWeek = weeks[0] // Always latest
      // ...
    }
  })
}
```

### After

```typescript
// page.tsx - Uses period context
export default function DashboardPage() {
  return (
    <DashboardPeriodProvider>
      <DashboardContent />
    </DashboardPeriodProvider>
  )
}

function DashboardContent() {
  const { selectedWeek, previousWeek } = useDashboardPeriod()
  const { current, previous, isLoadingCurrent } = useDashboardMetricsWithComparison(
    selectedWeek,
    previousWeek
  )

  return (
    <>
      <MetricCardEnhanced
        value={current.totalPayable}
        previousValue={previous?.totalPayable}
        isLoading={isLoadingCurrent}
      />
    </>
  )
}

// useDashboard.ts - Week-aware fetching
export function useDashboardMetrics(options?: UseDashboardMetricsOptions) {
  const { week } = options || {}

  return useQuery({
    queryKey: ['dashboard', 'metrics', week], // Week-isolated cache
    queryFn: async () => {
      const targetWeek = week || (await getLatestAvailableWeek())
      return fetchFinanceSummary(targetWeek)
    }
  })
}
```

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Story 60.1-FE | Internal | Required - Provides `DashboardPeriodProvider` and `useDashboardPeriod` |
| Story 60.2-FE | Internal | Required - Provides `DashboardPeriodSelector` component |
| Story 60.3-FE | Internal | Required - Provides `MetricCardEnhanced` with comparison display |
| `useAvailableWeeks` hook | Existing | Available |
| Backend `/v1/analytics/weekly/finance-summary?week=` | API | Supports week param |

---

## Test Scenarios (for QA)

### Unit Tests

1. **`useDashboardMetrics` with week param**
   ```typescript
   it('should include week in query key', () => {
     const { result } = renderHook(() =>
       useDashboardMetrics({ week: '2026-W05' })
     )
     // Verify query key contains week
   })

   it('should fetch for specific week when provided', () => {
     // Mock API, verify correct week passed to endpoint
   })

   it('should fallback to latest week when no param', () => {
     // Verify default behavior preserved
   })
   ```

2. **`useDashboardMetricsWithComparison` parallel fetching**
   ```typescript
   it('should fetch both current and previous periods', () => {
     const { result } = renderHook(() =>
       useDashboardMetricsWithComparison('2026-W05', '2026-W04')
     )
     // Verify both queries initiated
   })

   it('should handle previous period unavailable gracefully', () => {
     // When previousWeek data not available, previous should be null
   })
   ```

3. **Dashboard page context integration**
   ```typescript
   it('should render with DashboardPeriodProvider', () => {
     render(<DashboardPage />)
     // Verify provider present, no context errors
   })
   ```

### Integration Tests

1. **Period switch triggers refetch**
   ```typescript
   it('should refetch metrics when period changes', async () => {
     render(<DashboardPage />)

     // Change period in selector
     await userEvent.click(screen.getByRole('combobox'))
     await userEvent.click(screen.getByText('2026-W04'))

     // Verify loading state shown
     expect(screen.getByTestId('metric-skeleton')).toBeInTheDocument()

     // Wait for refetch
     await waitFor(() => {
       expect(screen.queryByTestId('metric-skeleton')).not.toBeInTheDocument()
     })
   })
   ```

2. **Skeleton display during transition**
   ```typescript
   it('should show skeletons while fetching new period', async () => {
     // Start with loaded state
     // Trigger period change
     // Assert skeletons visible
     // Wait for load complete
     // Assert skeletons gone
   })
   ```

---

## Edge Cases to Handle

1. **No available weeks**: Show appropriate empty state
2. **Network error during refetch**: Preserve previous data, show error toast
3. **Previous week data unavailable**: Render cards without comparison badges
4. **Rapid period switching**: Cancel previous requests, show latest only

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Dashboard page uses `DashboardPeriodProvider` wrapper
- [ ] `useDashboardMetrics` hook accepts `week` parameter
- [ ] `useDashboardMetricsWithComparison` hook implemented for parallel fetching
- [ ] Query keys include week for proper cache isolation
- [ ] Skeleton loaders display during period transitions
- [ ] TypeScript strict mode passes
- [ ] Unit tests written and passing (>80% coverage for modified files)
- [ ] Integration test for period switching
- [ ] Code review approved
- [ ] No ESLint errors

---

**Created**: 2026-01-29
