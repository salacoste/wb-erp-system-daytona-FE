# Story 60.6-FE: Sinhronizirovat' vidzhet reklamy s global'nym periodom

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Status**: Ready for Dev
**Story Points**: 2 SP
**Priority**: P1

---

## User Story

**As a** seller viewing advertising metrics on the dashboard
**I want** the advertising widget to display data for the same period as other metrics
**So that** I can see consistent, comparable data across all dashboard widgets

---

## Acceptance Criteria

- [x] AC1: Local period state (`selectedDays: 7d/14d/30d`) removed from `AdvertisingDashboardWidget`
- [x] AC2: Widget accepts `dateRange` prop from parent (dashboard context)
- [x] AC3: Week-to-date-range conversion implemented (`2026-W05` -> `from/to` dates)
- [x] AC4: Widget header no longer shows local period selector dropdown
- [x] AC5: Widget gracefully falls back to local state when used outside provider
- [x] AC6: Widget remains usable on standalone pages (e.g., `/analytics/advertising`)
- [x] AC7: Period context label matches dashboard header format

---

## Technical Specifications

### Component Interface Changes

```typescript
// src/components/custom/AdvertisingDashboardWidget.tsx - MODIFIED

interface AdvertisingDashboardWidgetProps {
  /** Additional class names */
  className?: string
  /**
   * Date range from parent context.
   * If not provided, widget uses internal state (standalone mode).
   */
  dateRange?: {
    from: string  // ISO date: "2026-01-27"
    to: string    // ISO date: "2026-02-02"
  }
  /**
   * When true, hide the local period selector.
   * Use when embedded in dashboard with global selector.
   */
  hideLocalSelector?: boolean
}

export function AdvertisingDashboardWidget({
  className,
  dateRange: externalDateRange,
  hideLocalSelector = false,
}: AdvertisingDashboardWidgetProps) {
  // Fallback to internal state when no external range provided
  const [internalPeriod, setInternalPeriod] = useState<PeriodOption>('7d')

  const dateRange = externalDateRange || calculateInternalDateRange(internalPeriod)

  // ...
}
```

### Week-to-Date-Range Conversion

```typescript
// src/lib/date-utils.ts - NEW or add to existing

import { startOfISOWeek, endOfISOWeek, parseISO, format } from 'date-fns'

/**
 * Convert ISO week string to date range for API calls.
 * @param week - ISO week format "YYYY-Www" (e.g., "2026-W05")
 * @returns Date range { from, to } in "YYYY-MM-DD" format
 *
 * @example
 * weekToDateRange('2026-W05')
 * // Returns: { from: '2026-01-27', to: '2026-02-02' }
 */
export function weekToDateRange(week: string): { from: string; to: string } {
  // Parse ISO week format: "2026-W05"
  const [year, weekPart] = week.split('-W')
  const weekNum = parseInt(weekPart, 10)

  // Get first day of year
  const jan1 = new Date(parseInt(year, 10), 0, 1)

  // Calculate first day of ISO week
  // ISO week 1 contains January 4th
  const jan4 = new Date(parseInt(year, 10), 0, 4)
  const firstMondayOfYear = startOfISOWeek(jan4)

  // Calculate target week's Monday
  const weekStart = new Date(firstMondayOfYear)
  weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7)

  const weekEnd = endOfISOWeek(weekStart)

  return {
    from: format(weekStart, 'yyyy-MM-dd'),
    to: format(weekEnd, 'yyyy-MM-dd'),
  }
}

/**
 * Convert month string to date range.
 * @param month - Month format "YYYY-MM" (e.g., "2026-01")
 * @returns Date range { from, to }
 */
export function monthToDateRange(month: string): { from: string; to: string } {
  const [year, monthNum] = month.split('-').map(Number)

  const from = new Date(year, monthNum - 1, 1)
  const to = new Date(year, monthNum, 0) // Last day of month

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}
```

### Dashboard Integration

```typescript
// src/app/(dashboard)/dashboard/page.tsx - MODIFIED

function DashboardContent() {
  const { selectedWeek, periodType, selectedMonth } = useDashboardPeriod()

  // Convert period to date range for advertising widget
  const advertisingDateRange = useMemo(() => {
    if (periodType === 'week') {
      return weekToDateRange(selectedWeek)
    }
    return monthToDateRange(selectedMonth)
  }, [periodType, selectedWeek, selectedMonth])

  return (
    <>
      {/* ... other components ... */}

      <AdvertisingDashboardWidget
        dateRange={advertisingDateRange}
        hideLocalSelector={true}
      />
    </>
  )
}
```

### Standalone Mode (Other Pages)

```typescript
// src/app/(dashboard)/analytics/advertising/page.tsx - NO CHANGE
// Widget used without dateRange prop, uses internal state

export default function AdvertisingAnalyticsPage() {
  return (
    <div>
      <AdvertisingDashboardWidget />
      {/* Has own period selector */}
    </div>
  )
}
```

### Files to Modify

```
src/
├── app/(dashboard)/dashboard/
│   └── page.tsx                            # MODIFY: Pass dateRange to widget
├── components/custom/
│   └── AdvertisingDashboardWidget.tsx      # MODIFY: Accept external dateRange
├── lib/
│   └── date-utils.ts                       # ADD: weekToDateRange helper
```

---

## Before/After Comparison

### Before: Widget with Local Period Selector

```
+------------------------------------------+
|  [Megaphone]  Reklama    [7 dnej  v]     |  <- Local selector
+------------------------------------------+
|  Prodazhi         Organika      ROAS     |
|  125.3K rub       72%           2.4x     |
+------------------------------------------+
|  Vklyuchaet tekushchuyu nedelyu...       |
+------------------------------------------+
|  Podrobnaya analitika ->                 |
+------------------------------------------+
```

### After: Widget Synced with Dashboard Period

```
+------------------------------------------+
|  [Megaphone]  Reklama                    |  <- No local selector
+------------------------------------------+
|  Prodazhi         Organika      ROAS     |
|  125.3K rub       72%           2.4x     |
+------------------------------------------+
|  Period: Nedelya 5, 2026                 |  <- Matches dashboard
+------------------------------------------+
|  Podrobnaya analitika ->                 |
+------------------------------------------+
```

### Before: Component Code

```typescript
export function AdvertisingDashboardWidget({ className }) {
  // Local state - independent of dashboard
  const [period, setPeriod] = useState<PeriodOption>('7d')

  const dateRange = useMemo(() => {
    const to = subDays(new Date(), 1)
    const days = parseInt(period)
    const from = subDays(to, days)
    return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }
  }, [period])

  return (
    <Card>
      <div className="flex justify-between">
        <h3>Reklama</h3>
        {/* Local selector always shown */}
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-24">
            <SelectValue>{getPeriodLabel(period)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dnej</SelectItem>
            <SelectItem value="14d">14 dnej</SelectItem>
            <SelectItem value="30d">30 dnej</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* ... metrics ... */}
    </Card>
  )
}
```

### After: Component Code

```typescript
export function AdvertisingDashboardWidget({
  className,
  dateRange: externalDateRange,
  hideLocalSelector = false,
}) {
  // Internal state as fallback
  const [period, setPeriod] = useState<PeriodOption>('7d')

  // Use external range if provided, otherwise calculate from internal state
  const dateRange = externalDateRange || useMemo(() => {
    const to = subDays(new Date(), 1)
    const days = parseInt(period)
    const from = subDays(to, days)
    return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') }
  }, [period])

  // Check if controlled externally
  const isControlled = !!externalDateRange

  return (
    <Card>
      <div className="flex justify-between">
        <h3>Reklama</h3>
        {/* Selector only shown in standalone mode */}
        {!hideLocalSelector && !isControlled && (
          <Select value={period} onValueChange={setPeriod}>
            {/* ... options ... */}
          </Select>
        )}
      </div>
      {/* ... metrics ... */}
    </Card>
  )
}
```

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Story 60.1-FE | Internal | Required - Provides `useDashboardPeriod` hook |
| Story 60.4-FE | Internal | Required - Dashboard integration pattern |
| `date-fns` | Package | Already installed |
| Backend `/v1/analytics/advertising` | API | Accepts `from` and `to` params |

---

## Test Scenarios (for QA)

### Unit Tests

1. **weekToDateRange conversion**
   ```typescript
   describe('weekToDateRange', () => {
     it('should convert 2026-W05 to correct date range', () => {
       const result = weekToDateRange('2026-W05')
       expect(result.from).toBe('2026-01-27') // Monday
       expect(result.to).toBe('2026-02-02')   // Sunday
     })

     it('should handle week 1 correctly', () => {
       const result = weekToDateRange('2026-W01')
       expect(result.from).toBe('2025-12-29') // Week 1 can start in prev year
       expect(result.to).toBe('2026-01-04')
     })

     it('should handle week 52/53 correctly', () => {
       const result = weekToDateRange('2026-W53')
       // Verify last week of year
     })
   })
   ```

2. **Widget with external dateRange**
   ```typescript
   it('should use provided dateRange instead of internal state', () => {
     const mockFetch = vi.fn()
     render(
       <AdvertisingDashboardWidget
         dateRange={{ from: '2026-01-27', to: '2026-02-02' }}
       />
     )

     // Verify API called with provided range, not default 7d
     expect(mockFetch).toHaveBeenCalledWith(
       expect.objectContaining({
         from: '2026-01-27',
         to: '2026-02-02',
       })
     )
   })
   ```

3. **Widget hides selector when controlled**
   ```typescript
   it('should not show period selector when hideLocalSelector=true', () => {
     render(
       <AdvertisingDashboardWidget
         dateRange={{ from: '2026-01-27', to: '2026-02-02' }}
         hideLocalSelector={true}
       />
     )

     expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
   })
   ```

4. **Widget fallback to internal state**
   ```typescript
   it('should use internal state when no dateRange provided', () => {
     render(<AdvertisingDashboardWidget />)

     // Should show selector
     expect(screen.getByRole('combobox')).toBeInTheDocument()

     // Default should be 7d
     expect(screen.getByText('7 dnej')).toBeInTheDocument()
   })
   ```

### Integration Tests

1. **Dashboard period sync**
   ```typescript
   it('should sync advertising widget with dashboard period', async () => {
     render(<DashboardPage />)

     // Change period in dashboard selector
     await userEvent.click(screen.getByTestId('period-selector'))
     await userEvent.click(screen.getByText('2026-W04'))

     // Verify advertising widget refetches with new range
     await waitFor(() => {
       expect(screen.getByTestId('advertising-widget'))
         .toHaveAttribute('data-period', '2026-W04')
     })
   })
   ```

2. **Standalone page retains local selector**
   ```typescript
   it('should have independent selector on analytics page', () => {
     render(<AdvertisingAnalyticsPage />)

     // Widget should have its own selector
     const selector = screen.getByRole('combobox', { name: /period/i })
     expect(selector).toBeInTheDocument()
   })
   ```

---

## Breaking Change Considerations

### Impact Analysis

| Use Case | Impact | Mitigation |
|----------|--------|------------|
| Dashboard widget | Local selector removed | Uses global selector |
| Analytics page | No change | Widget uses fallback mode |
| Future embedding | No change | Props provide flexibility |

### Migration Checklist

- [ ] Verify `/analytics/advertising` page still works independently
- [ ] Verify widget loads correctly without props (fallback mode)
- [ ] Document new props in component JSDoc

---

## Edge Cases to Handle

1. **External range spans multiple months**: API handles correctly
2. **External range in future**: Show empty state with message
3. **Context not available (SSR)**: Use fallback internal state
4. **Month period selected**: Convert month to date range correctly

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Widget accepts `dateRange` prop from parent
- [ ] Widget hides local selector when `hideLocalSelector=true`
- [ ] `weekToDateRange` helper function implemented
- [ ] Widget works in standalone mode (no props)
- [ ] Dashboard passes correct date range to widget
- [ ] TypeScript strict mode passes
- [ ] Unit tests for date conversion functions
- [ ] Unit tests for widget prop behavior
- [ ] Integration test for dashboard sync
- [ ] Code review approved
- [ ] No ESLint errors
- [ ] Verified on `/analytics/advertising` page (no regression)

---

**Created**: 2026-01-29
