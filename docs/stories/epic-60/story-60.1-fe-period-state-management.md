# Story 60.1-FE: Создать управление состоянием периода дашборда

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Story ID**: Story 60.1-FE
**Status**: ✅ Completed
**Story Points**: 3 SP
**Priority**: P0 (Foundation)
**Dependencies**: None (can start immediately)

---

## User Story

**As a** frontend developer
**I want** a centralized state management system for dashboard period selection
**So that** all dashboard components can synchronize on the selected time period with URL persistence

---

## Acceptance Criteria

- [x] AC1: Create `DashboardPeriodContext` with `periodType` (week/month), `selectedWeek`, `selectedMonth` state
- [x] AC2: Create `useDashboardPeriod` hook for consuming context in any component
- [x] AC3: Default to current completed week on initial page load (using existing `getLastCompletedWeek` logic)
- [x] AC4: Sync period state to URL params (`?week=2026-W05&type=week`) for shareable links
- [x] AC5: Persist `periodType` preference in localStorage (user preference)
- [x] AC6: Handle month-to-weeks conversion (month contains 4-5 weeks for aggregation)
- [x] AC7: Compute previous period automatically for comparison (`previousWeek`, `previousMonth`)
- [x] AC8: Track `lastRefresh` timestamp for UI display
- [x] AC9: Provide `refresh()` action to trigger data refetch

---

## Technical Specifications

### Component Interface

```typescript
// src/contexts/dashboard-period-context.tsx

/**
 * Period type enum for week/month toggle
 */
export type PeriodType = 'week' | 'month'

/**
 * Dashboard period state shape
 */
export interface DashboardPeriodState {
  /** Current period view type */
  periodType: PeriodType
  /** Selected week in ISO format: "2026-W05" */
  selectedWeek: string
  /** Selected month in ISO format: "2026-01" */
  selectedMonth: string
  /** Previous week for comparison: "2026-W04" (computed) */
  previousWeek: string
  /** Previous month for comparison: "2025-12" (computed) */
  previousMonth: string
  /** Timestamp of last data refresh */
  lastRefresh: Date
  /** Available weeks from backend */
  availableWeeks: string[]
  /** Loading state for initial data fetch */
  isLoading: boolean
}

/**
 * Dashboard period actions
 */
export interface DashboardPeriodActions {
  /** Switch between week and month view */
  setPeriodType: (type: PeriodType) => void
  /** Select specific week */
  setWeek: (week: string) => void
  /** Select specific month */
  setMonth: (month: string) => void
  /** Trigger data refresh */
  refresh: () => void
  /** Get date range for current period (for API calls) */
  getDateRange: () => { startDate: string; endDate: string }
}

/**
 * Combined context value
 */
export type DashboardPeriodContextValue = DashboardPeriodState & DashboardPeriodActions

/**
 * Context provider props
 */
export interface DashboardPeriodProviderProps {
  children: React.ReactNode
  /** Override default week (for testing) */
  initialWeek?: string
}
```

### URL Synchronization Interface

```typescript
// URL params shape
interface PeriodUrlParams {
  week?: string   // "2026-W05"
  month?: string  // "2026-01"
  type?: 'week' | 'month'
}

// Example URLs:
// /dashboard?week=2026-W05&type=week
// /dashboard?month=2026-01&type=month
```

### Helper Functions Interface

```typescript
// src/lib/period-helpers.ts

/**
 * Get weeks belonging to a month
 * @param month - Month in "YYYY-MM" format
 * @returns Array of weeks in "YYYY-Www" format
 */
export function getWeeksInMonth(month: string): string[]

/**
 * Get month containing a week
 * @param week - Week in "YYYY-Www" format
 * @returns Month in "YYYY-MM" format
 */
export function getMonthFromWeek(week: string): string

/**
 * Get previous period
 * @param period - Current period (week or month)
 * @param type - Period type
 * @returns Previous period in same format
 */
export function getPreviousPeriod(period: string, type: PeriodType): string

/**
 * Format period for display
 * @param period - Period string
 * @param type - Period type
 * @returns Russian localized string
 */
export function formatPeriodDisplay(period: string, type: PeriodType): string
// Examples:
// formatPeriodDisplay("2026-W05", "week") -> "Неделя 5, 2026 (27 янв — 02 фев)"
// formatPeriodDisplay("2026-01", "month") -> "Январь 2026"
```

### Implementation Notes

- Use existing `useAvailableWeeks` hook to fetch available weeks from backend
- Use `nuqs` library for URL state management (type-safe URL params)
- Use `date-fns` for date calculations (already installed)
- Zustand store optional - React Context with useReducer sufficient for this scope
- SSR compatibility: Initialize with null, hydrate on client

### File Structure

```
src/
├── contexts/
│   └── dashboard-period-context.tsx    # React context + provider
├── hooks/
│   └── useDashboardPeriod.ts           # Consumer hook (re-export from context)
├── lib/
│   └── period-helpers.ts               # Pure helper functions
└── stores/
    └── dashboardPeriodStore.ts         # Optional Zustand store (if needed)
```

---

## UI/UX Specifications

### No Direct UI (State Management Story)

This story creates the state management foundation. UI components will be built in Story 60.2.

### State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DashboardPeriodProvider                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  URL Params ←──────────────────────────────────────────────────┐    │
│  ?week=2026-W05&type=week                                      │    │
│       │                                                        │    │
│       ▼                                                        │    │
│  ┌─────────────────────┐    ┌─────────────────────┐           │    │
│  │   DashboardPeriod   │───▶│   localStorage      │           │    │
│  │      Context        │    │   (periodType pref) │           │    │
│  │                     │    └─────────────────────┘           │    │
│  │  state:             │                                      │    │
│  │  - periodType       │    ┌─────────────────────┐           │    │
│  │  - selectedWeek     │───▶│   URL Sync          │───────────┘    │
│  │  - selectedMonth    │    │   (nuqs)            │                │
│  │  - previousWeek     │    └─────────────────────┘                │
│  │  - previousMonth    │                                           │
│  │  - lastRefresh      │                                           │
│  └─────────────────────┘                                           │
│           │                                                        │
│           ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Consumer Components                       │   │
│  │  - DashboardPeriodSelector (Story 60.2)                     │   │
│  │  - MetricCardEnhanced (Story 60.3)                          │   │
│  │  - ExpenseChart                                             │   │
│  │  - AdvertisingDashboardWidget                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `useAvailableWeeks` hook | Internal | ✅ Available |
| `getLastCompletedWeek` helper | Internal | ✅ Available (`src/lib/margin-helpers.ts`) |
| `date-fns` | External | ✅ Installed |
| `nuqs` | External | ⚠️ May need install (`npm install nuqs`) |
| Next.js `useSearchParams` | Framework | ✅ Available |

---

## Test Scenarios (for QA)

### Unit Tests

1. **Context Initialization**
   - Test: Context initializes with current completed week
   - Input: Fresh page load
   - Expected: `selectedWeek` equals result of `getLastCompletedWeek()`

2. **Period Type Toggle**
   - Test: Switching from week to month updates state
   - Input: `setPeriodType('month')`
   - Expected: `periodType` is 'month', `selectedMonth` is set from `selectedWeek`

3. **Week Selection**
   - Test: Selecting a week updates URL
   - Input: `setWeek('2026-W04')`
   - Expected: URL contains `?week=2026-W04&type=week`

4. **Previous Period Calculation**
   - Test: Previous week computed correctly
   - Input: `selectedWeek` = '2026-W05'
   - Expected: `previousWeek` = '2026-W04'

5. **Previous Month Calculation (Year Boundary)**
   - Test: Previous month handles year boundary
   - Input: `selectedMonth` = '2026-01'
   - Expected: `previousMonth` = '2025-12'

6. **Month to Weeks Conversion**
   - Test: `getWeeksInMonth` returns correct weeks
   - Input: '2026-01' (January 2026)
   - Expected: Array of 4-5 weeks starting from first week of month

7. **URL Restoration on Page Load**
   - Test: Period state restored from URL params
   - Input: Navigate to `/dashboard?week=2026-W03&type=week`
   - Expected: `selectedWeek` = '2026-W03', `periodType` = 'week'

8. **localStorage Preference Persistence**
   - Test: Period type preference survives page reload
   - Input: Set `periodType` to 'month', reload page
   - Expected: `periodType` initialized to 'month'

9. **Refresh Action**
   - Test: Refresh updates `lastRefresh` timestamp
   - Input: Call `refresh()`
   - Expected: `lastRefresh` is new Date, queries invalidated

10. **Date Range Calculation**
    - Test: `getDateRange` returns correct dates for week
    - Input: `selectedWeek` = '2026-W05'
    - Expected: `{ startDate: '2026-01-27', endDate: '2026-02-02' }`

### Integration Tests

1. **Context + useAvailableWeeks Integration**
   - Test: Context waits for available weeks before allowing selection
   - Setup: Mock `useAvailableWeeks` to return specific weeks
   - Expected: Only available weeks can be selected

2. **URL Sync Round-Trip**
   - Test: State → URL → Page Reload → State matches
   - Input: Set week, copy URL, open in new tab
   - Expected: New tab shows same period

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] TypeScript strict mode passes (zero errors)
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Helper functions have JSDoc comments
- [ ] SSR-safe implementation (no `window` access on server)
- [ ] `nuqs` or manual URL sync implemented
- [ ] Code review approved
- [ ] No ESLint errors
- [ ] File under 200 lines (split if needed)

---

## Implementation Guide

### Phase 1: Helper Functions (30min)

Create `src/lib/period-helpers.ts`:
- `getWeeksInMonth()`
- `getMonthFromWeek()`
- `getPreviousPeriod()`
- `formatPeriodDisplay()`

### Phase 2: Context + Provider (1-2h)

Create `src/contexts/dashboard-period-context.tsx`:
- Define types and interfaces
- Create context with null default
- Implement provider with useReducer
- Add URL sync logic
- Add localStorage persistence for periodType

### Phase 3: Consumer Hook (30min)

Create `src/hooks/useDashboardPeriod.ts`:
- Re-export context hook
- Add error handling for missing provider
- Add TypeScript type narrowing

### Phase 4: Tests (1h)

Create tests for:
- Helper functions (pure unit tests)
- Context provider (with React Testing Library)
- URL sync behavior

---

## Code Examples

### Period Helpers Example

```typescript
// src/lib/period-helpers.ts
import {
  startOfISOWeek,
  endOfISOWeek,
  format,
  parse,
  subWeeks,
  subMonths,
  getISOWeek,
  getYear,
  eachWeekOfInterval,
  startOfMonth,
  endOfMonth
} from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatPeriodDisplay(period: string, type: PeriodType): string {
  if (type === 'week') {
    // Parse "2026-W05" format
    const [year, weekPart] = period.split('-W')
    const weekNum = parseInt(weekPart, 10)

    // Get week start/end dates
    const date = parse(`${year}-W${weekPart}`, "RRRR-'W'II", new Date())
    const start = startOfISOWeek(date)
    const end = endOfISOWeek(date)

    const startStr = format(start, 'd MMM', { locale: ru })
    const endStr = format(end, 'd MMM', { locale: ru })

    return `Неделя ${weekNum}, ${year} (${startStr} — ${endStr})`
  }

  // Month: "2026-01" -> "Январь 2026"
  const date = parse(period, 'yyyy-MM', new Date())
  return format(date, 'LLLL yyyy', { locale: ru })
}
```

### Context Usage Example

```typescript
// In a component
function DashboardMetrics() {
  const {
    selectedWeek,
    previousWeek,
    periodType,
    setWeek,
    refresh
  } = useDashboardPeriod()

  // Fetch current period data
  const currentQuery = useQuery({
    queryKey: ['dashboard', 'metrics', selectedWeek],
    queryFn: () => getDashboardMetrics(selectedWeek),
  })

  // Fetch previous period for comparison
  const previousQuery = useQuery({
    queryKey: ['dashboard', 'metrics', previousWeek],
    queryFn: () => getDashboardMetrics(previousWeek),
  })

  return (
    <MetricCardEnhanced
      value={currentQuery.data?.payout}
      previousValue={previousQuery.data?.payout}
      format="currency"
    />
  )
}
```

---

## Related Documents

- **Epic**: `docs/epics/epic-60-fe-dashboard-ux-improvements.md`
- **UX Analysis**: `docs/ux-analysis/dashboard-improvement-plan.md`
- **Existing Helpers**: `src/lib/margin-helpers.ts` (week calculation logic)
- **Backend API**: `/v1/analytics/weekly/finance-summary?week=YYYY-Www`

---

**Created**: 2026-01-29
**Author**: Claude Code (PM Mode)
**Next Story**: Story 60.2-FE (DashboardPeriodSelector Component)
