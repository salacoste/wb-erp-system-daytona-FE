# Story 60.7-FE: Добавить метку контекста периода

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Status**: ✅ Completed
**Story Points**: 1 SP
**Priority**: P2
**Depends On**: Stories 60.1, 60.2

---

## User Story

**As a** dashboard user,
**I want** to see the current period and last refresh time clearly displayed,
**So that** I always know what time period the displayed metrics represent.

---

## Acceptance Criteria

- [ ] **AC1**: Week format displays as "Обзор за: Неделя 5, 2026 (27 янв — 02 фев)"
- [ ] **AC2**: Month format displays as "Обзор за: Январь 2026"
- [ ] **AC3**: Last refresh time shows as "Обновлено: 5 мин назад" using `date-fns` `formatDistanceToNow`
- [ ] **AC4**: Refresh time updates automatically every minute without page reload
- [ ] **AC5**: Responsive layout: inline on desktop (>768px), stacked on mobile (<768px)
- [ ] **AC6**: Russian locale used for all date formatting (months, relative time)
- [ ] **AC7**: Component accepts period data from `useDashboardPeriod` context

---

## Technical Specifications

### Component Interface

```typescript
// src/components/custom/PeriodContextLabel.tsx

interface PeriodContextLabelProps {
  periodType: 'week' | 'month'
  selectedWeek: string      // "2026-W05"
  selectedMonth: string     // "2026-01"
  lastRefresh: Date
  className?: string
}
```

### Date Formatting Requirements

```typescript
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

// Week format: "Неделя 5, 2026 (27 янв — 02 фев)"
function formatWeekLabel(isoWeek: string): string {
  // Parse ISO week "2026-W05" to dates
  // Get week start (Monday) and end (Sunday)
  // Format: "Неделя {weekNum}, {year} ({startDay} {month} — {endDay} {month})"
}

// Month format: "Январь 2026"
function formatMonthLabel(isoMonth: string): string {
  // Parse "2026-01" to Date
  // Format with Russian locale: "LLLL yyyy"
}

// Relative time: "5 мин назад"
function formatLastRefresh(date: Date): string {
  return formatDistanceToNow(date, {
    locale: ru,
    addSuffix: true
  })
}
```

### Component Structure

```typescript
export function PeriodContextLabel({
  periodType,
  selectedWeek,
  selectedMonth,
  lastRefresh,
  className,
}: PeriodContextLabelProps) {
  const [refreshText, setRefreshText] = useState('')

  // Update refresh time every minute
  useEffect(() => {
    const updateRefreshText = () => {
      setRefreshText(formatLastRefresh(lastRefresh))
    }

    updateRefreshText()
    const interval = setInterval(updateRefreshText, 60_000) // Every minute

    return () => clearInterval(interval)
  }, [lastRefresh])

  const periodLabel = periodType === 'week'
    ? formatWeekLabel(selectedWeek)
    : formatMonthLabel(selectedMonth)

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2',
      'text-sm text-muted-foreground',
      className
    )}>
      <span>Обзор за: <span className="font-medium text-foreground">{periodLabel}</span></span>
      <span className="hidden sm:inline">•</span>
      <span>Обновлено: {refreshText}</span>
    </div>
  )
}
```

### File Location

```
src/components/custom/PeriodContextLabel.tsx
```

### Integration with Dashboard Page

```typescript
// src/app/(dashboard)/dashboard/page.tsx

import { PeriodContextLabel } from '@/components/custom/PeriodContextLabel'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'

export default function DashboardPage() {
  const { periodType, selectedWeek, selectedMonth, lastRefresh } = useDashboardPeriod()

  return (
    <div>
      <h1>Главная страница</h1>
      <PeriodContextLabel
        periodType={periodType}
        selectedWeek={selectedWeek}
        selectedMonth={selectedMonth}
        lastRefresh={lastRefresh}
      />
      {/* Rest of dashboard */}
    </div>
  )
}
```

---

## Visual Design

### Desktop Layout (>768px)
```
Главная страница
Обзор за: Неделя 5, 2026 (27 янв — 02 фев) • Обновлено: 5 мин назад
```

### Mobile Layout (<768px)
```
Главная страница
Обзор за: Неделя 5, 2026 (27 янв — 02 фев)
Обновлено: 5 мин назад
```

### Typography
- "Обзор за:" - `text-sm text-muted-foreground`
- Period value - `text-sm font-medium text-foreground`
- "Обновлено:" - `text-sm text-muted-foreground`
- Relative time - `text-sm text-muted-foreground`

---

## Test Scenarios

### Unit Tests

**File**: `src/components/custom/__tests__/PeriodContextLabel.test.tsx`

1. **Test: Renders week format correctly**
   - Input: `periodType='week'`, `selectedWeek='2026-W05'`
   - Expected: "Обзор за: Неделя 5, 2026 (27 янв — 02 фев)"

2. **Test: Renders month format correctly**
   - Input: `periodType='month'`, `selectedMonth='2026-01'`
   - Expected: "Обзор за: Январь 2026"

3. **Test: Formats relative time in Russian**
   - Input: `lastRefresh=new Date(Date.now() - 5 * 60 * 1000)` (5 min ago)
   - Expected: Contains "мин" (minutes in Russian)

4. **Test: Updates refresh time automatically**
   - Use fake timers to advance 60 seconds
   - Verify text updates without re-render

5. **Test: Responsive layout classes applied**
   - Verify `sm:flex-row` for desktop
   - Verify `flex-col` for mobile

6. **Test: Accepts custom className**
   - Pass `className="custom-class"`
   - Verify class is merged

### Edge Cases

1. **Test: Handles edge week (year boundary)**
   - Input: `selectedWeek='2025-W52'` or `'2026-W01'`
   - Should correctly show dates spanning December/January

2. **Test: Handles "just now" refresh**
   - Input: `lastRefresh=new Date()` (current time)
   - Expected: "менее минуты назад" or similar

3. **Test: Cleanup on unmount**
   - Verify interval is cleared when component unmounts
   - No memory leaks

---

## Accessibility Requirements

- [ ] Use semantic HTML (no need for ARIA roles for display text)
- [ ] Ensure sufficient color contrast (WCAG 2.1 AA)
- [ ] Text is readable at 200% zoom
- [ ] No time-based flashing or animation

---

## Definition of Done

- [ ] All 7 acceptance criteria met
- [ ] Component created with TypeScript strict mode
- [ ] Unit tests written and passing (6+ test cases)
- [ ] Russian locale formatting verified
- [ ] Responsive design tested (mobile/tablet/desktop)
- [ ] Code review approved
- [ ] No ESLint errors

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `date-fns` | npm package | ✅ Installed |
| `date-fns/locale/ru` | npm module | ✅ Available |
| `useDashboardPeriod` hook | Story 60.1 | 📋 Ready |
| `DashboardPeriodContext` | Story 60.1 | 📋 Ready |

---

## Non-Goals

- Complex animations or transitions
- Clickable period label (selector is separate component)
- Time zone configuration (uses Europe/Moscow)

---

**Created**: 2026-01-29
