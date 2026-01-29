# Story 60.2-FE: Создать компонент выбора периода

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Story ID**: Story 60.2-FE
**Status**: ✅ Completed
**Story Points**: 3 SP
**Priority**: P0 (Core UI)
**Dependencies**: Story 60.1-FE (Period State Management)

---

## User Story

**As a** WB seller using the dashboard
**I want** to easily switch between weeks and months to view my financial data
**So that** I can analyze performance for different time periods without confusion

---

## Acceptance Criteria

- [x] AC1: Period type toggle (Неделя/Месяц) using shadcn/ui Tabs component
- [x] AC2: Week dropdown showing available weeks with Russian labels (e.g., "Неделя 5, 2026 (27 янв — 02 фев)")
- [x] AC3: Month dropdown derived from available weeks (e.g., "Январь 2026", "Декабрь 2025")
- [x] AC4: Refresh button with loading state and last update time ("Обновлено: 5 мин назад")
- [x] AC5: Loading skeleton while fetching available weeks
- [x] AC6: Responsive design: horizontal layout on desktop (≥768px), stacked on mobile
- [x] AC7: Disable future weeks/months in dropdown (cannot select unreported periods)
- [x] AC8: Visual feedback on selection change (brief highlight animation)
- [x] AC9: Keyboard accessible (Tab navigation, Enter to select)
- [x] AC10: ARIA labels for screen readers

---

## Technical Specifications

### Component Interface

```typescript
// src/components/custom/DashboardPeriodSelector.tsx

export interface DashboardPeriodSelectorProps {
  /** Optional className for styling overrides */
  className?: string
  /** Disable all interactions (during data loading) */
  disabled?: boolean
  /** Show compact version without refresh button */
  compact?: boolean
  /** Callback when period changes (for analytics tracking) */
  onPeriodChange?: (period: string, type: PeriodType) => void
}

/**
 * Unified period selector component for dashboard
 *
 * Features:
 * - Week/Month toggle tabs
 * - Period dropdown with Russian localized labels
 * - Refresh button with last update time
 * - Responsive design
 *
 * @example
 * <DashboardPeriodSelector
 *   onPeriodChange={(period, type) => trackEvent('period_change', { period, type })}
 * />
 */
export function DashboardPeriodSelector(props: DashboardPeriodSelectorProps): JSX.Element
```

### Internal Types

```typescript
// Week option for dropdown
interface WeekOption {
  value: string      // "2026-W05"
  label: string      // "Неделя 5, 2026 (27 янв — 02 фев)"
  disabled: boolean  // true for future weeks
}

// Month option for dropdown
interface MonthOption {
  value: string      // "2026-01"
  label: string      // "Январь 2026"
  disabled: boolean  // true for future/partial months
}
```

### Implementation Notes

- Consume `useDashboardPeriod` hook from Story 60.1-FE
- Use shadcn/ui `Tabs` for period type toggle
- Use shadcn/ui `Select` for period dropdown
- Use `RefreshCw` icon from `lucide-react` for refresh button
- Use `date-fns` `formatDistanceToNow` for relative time
- Maximum 12 weeks / 6 months shown in dropdown (recent history)
- Auto-scroll dropdown to selected item

### File Structure

```
src/
└── components/
    └── custom/
        ├── DashboardPeriodSelector.tsx      # Main component
        ├── DashboardPeriodSelector.test.tsx # Unit tests
        └── period-selector/                 # Sub-components (if needed)
            ├── WeekDropdown.tsx
            ├── MonthDropdown.tsx
            └── RefreshButton.tsx
```

---

## UI/UX Specifications

### Design Mockup (Desktop - ≥768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────────────────┐  ┌─────────────────────────────────────────┐  ┌──┐ │
│  │ [Неделя] [Месяц]   │  │ Неделя 5, 2026 (27 янв — 02 фев)    ▼ │  │⟳ │ │
│  └────────────────────┘  └─────────────────────────────────────────┘  └──┘ │
│         Tabs                        Select Dropdown               Refresh  │
│                                                                             │
│                                          Обновлено: 5 мин назад            │
│                                          └── text-muted-foreground         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Design Mockup (Mobile - <768px)

```
┌─────────────────────────────────────┐
│                                     │
│  ┌───────────────────────────────┐  │
│  │    [Неделя]  [Месяц]          │  │
│  └───────────────────────────────┘  │
│               Tabs                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Неделя 5, 2026             ▼ │  │
│  │ (27 янв — 02 фев)            │  │
│  └───────────────────────────────┘  │
│           Select (full width)       │
│                                     │
│  ┌──────┐  Обновлено: 5 мин назад   │
│  │  ⟳  │                           │
│  └──────┘                           │
│  Refresh + timestamp                │
│                                     │
└─────────────────────────────────────┘
```

### Dropdown Content (Week)

```
┌─────────────────────────────────────────┐
│ Неделя 5, 2026 (27 янв — 02 фев)    ✓ │ ← Selected (highlighted)
├─────────────────────────────────────────┤
│ Неделя 4, 2026 (20 янв — 26 янв)      │
├─────────────────────────────────────────┤
│ Неделя 3, 2026 (13 янв — 19 янв)      │
├─────────────────────────────────────────┤
│ Неделя 2, 2026 (06 янв — 12 янв)      │
├─────────────────────────────────────────┤
│ Неделя 1, 2026 (30 дек — 05 янв)      │
├─────────────────────────────────────────┤
│ Неделя 52, 2025 (23 дек — 29 дек)     │
├─────────────────────────────────────────┤
│ ...                                     │
└─────────────────────────────────────────┘
```

### Dropdown Content (Month)

```
┌─────────────────────────────────────────┐
│ Январь 2026                         ✓ │ ← Selected
├─────────────────────────────────────────┤
│ Декабрь 2025                          │
├─────────────────────────────────────────┤
│ Ноябрь 2025                           │
├─────────────────────────────────────────┤
│ Октябрь 2025                          │
├─────────────────────────────────────────┤
│ ...                                     │
└─────────────────────────────────────────┘
```

### Design Tokens

| Element | Token | Value |
|---------|-------|-------|
| Tabs active indicator | `bg-primary` | #E53935 |
| Tabs inactive text | `text-muted-foreground` | #757575 |
| Select border | `border-input` | #EEEEEE |
| Select focus ring | `ring-primary` | #E53935 |
| Refresh icon | `text-muted-foreground` | #757575 |
| Refresh icon hover | `text-primary` | #E53935 |
| Last update text | `text-muted-foreground text-sm` | #757575, 14px |
| Dropdown item hover | `bg-accent` | #F5F5F5 |
| Selected item check | `text-primary` | #E53935 |

### Spacing

| Element | Spacing |
|---------|---------|
| Container padding | `p-0` (no padding, parent handles) |
| Gap between Tabs and Select | `gap-4` (16px) |
| Gap between Select and Refresh | `gap-2` (8px) |
| Refresh icon size | `h-9 w-9` (36x36px) |
| Dropdown max height | `max-h-[300px]` |

### Animation

- Tab switch: `transition-colors duration-200`
- Dropdown open: Default shadcn/ui animation
- Refresh button: Rotate 360deg during loading (`animate-spin`)
- Selection change: Brief highlight pulse on selected item

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Story 60.1-FE (Period State) | Internal | Prerequisite |
| `useDashboardPeriod` hook | Internal | From Story 60.1 |
| shadcn/ui `Tabs` | Component | ✅ Available |
| shadcn/ui `Select` | Component | ✅ Available |
| `lucide-react` RefreshCw | Icon | ✅ Available |
| `date-fns` | External | ✅ Installed |

---

## Test Scenarios (for QA)

### Unit Tests

1. **Initial Render**
   - Test: Component renders with current week selected
   - Expected: Tabs show "Неделя" active, dropdown shows current week

2. **Tab Switch**
   - Test: Click "Месяц" tab switches to month view
   - Input: Click "Месяц" tab
   - Expected: `setPeriodType('month')` called, dropdown shows months

3. **Week Selection**
   - Test: Selecting week from dropdown updates state
   - Input: Select "Неделя 4, 2026" from dropdown
   - Expected: `setWeek('2026-W04')` called

4. **Month Selection**
   - Test: Selecting month from dropdown updates state
   - Input: Select "Декабрь 2025" from dropdown
   - Expected: `setMonth('2025-12')` called

5. **Refresh Button Click**
   - Test: Clicking refresh triggers refresh action
   - Input: Click refresh button
   - Expected: `refresh()` called, button shows loading spinner

6. **Last Update Display**
   - Test: Last update time shown in relative format
   - Input: `lastRefresh` was 5 minutes ago
   - Expected: Text shows "Обновлено: 5 мин назад"

7. **Future Weeks Disabled**
   - Test: Future weeks cannot be selected
   - Input: Try to select week in future
   - Expected: Option is disabled/grayed out

8. **Loading State**
   - Test: Skeleton shown while loading available weeks
   - Input: `isLoading` is true
   - Expected: Skeleton placeholder displayed instead of selector

9. **Responsive Layout**
   - Test: Layout changes on mobile viewport
   - Input: Viewport width < 768px
   - Expected: Vertical stacked layout

10. **Keyboard Navigation**
    - Test: Can navigate with keyboard
    - Input: Tab to component, use arrow keys
    - Expected: Focus moves correctly, Enter selects

### Integration Tests

1. **End-to-End Period Change**
   - Test: Changing period updates entire dashboard
   - Input: Select different week
   - Expected: All dashboard components refresh with new data

2. **URL Sync**
   - Test: URL updates when period changes
   - Input: Select "2026-W03"
   - Expected: URL contains `?week=2026-W03`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] TypeScript strict mode passes
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Responsive design verified on mobile/tablet/desktop
- [ ] Keyboard accessible (Tab, Arrow keys, Enter)
- [ ] WCAG 2.1 AA compliant (color contrast, ARIA labels)
- [ ] Code review approved
- [ ] No ESLint errors
- [ ] File under 200 lines (split sub-components if needed)
- [ ] Russian locale for all user-facing text

---

## Implementation Guide

### Phase 1: Basic Structure (30min)

Create component shell with:
- Props interface
- Basic layout (Tabs + Select + Button)
- Connect to `useDashboardPeriod` hook

### Phase 2: Tabs Implementation (30min)

Implement period type toggle:
- Use shadcn/ui Tabs component
- "Неделя" and "Месяц" tabs
- Active tab indicator styling

### Phase 3: Dropdown Implementation (1h)

Implement period dropdown:
- Generate week/month options from available weeks
- Format labels with Russian locale
- Disable future periods
- Auto-scroll to selected item

### Phase 4: Refresh Button (30min)

Implement refresh functionality:
- RefreshCw icon button
- Loading spinner animation
- Last update relative time display
- Update interval (every minute)

### Phase 5: Responsive & Polish (30min)

- Add responsive layout breakpoints
- Add keyboard accessibility
- Add ARIA labels
- Test and fix edge cases

---

## Code Examples

### Component Structure Example

```typescript
// src/components/custom/DashboardPeriodSelector.tsx
'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod'
import { formatPeriodDisplay } from '@/lib/period-helpers'

import type { DashboardPeriodSelectorProps } from './types'

export function DashboardPeriodSelector({
  className,
  disabled = false,
  compact = false,
  onPeriodChange,
}: DashboardPeriodSelectorProps) {
  const {
    periodType,
    selectedWeek,
    selectedMonth,
    availableWeeks,
    lastRefresh,
    isLoading,
    setPeriodType,
    setWeek,
    setMonth,
    refresh,
  } = useDashboardPeriod()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [relativeTime, setRelativeTime] = useState('')

  // Update relative time every minute
  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(
        formatDistanceToNow(lastRefresh, { addSuffix: true, locale: ru })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [lastRefresh])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return <DashboardPeriodSelectorSkeleton />
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-center md:gap-4',
        className
      )}
    >
      {/* Period Type Tabs */}
      <Tabs
        value={periodType}
        onValueChange={(value) => setPeriodType(value as 'week' | 'month')}
      >
        <TabsList>
          <TabsTrigger value="week" disabled={disabled}>
            Неделя
          </TabsTrigger>
          <TabsTrigger value="month" disabled={disabled}>
            Месяц
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Period Dropdown */}
      <Select
        value={periodType === 'week' ? selectedWeek : selectedMonth}
        onValueChange={(value) => {
          if (periodType === 'week') {
            setWeek(value)
            onPeriodChange?.(value, 'week')
          } else {
            setMonth(value)
            onPeriodChange?.(value, 'month')
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full md:w-[320px]">
          <SelectValue placeholder="Выберите период" />
        </SelectTrigger>
        <SelectContent>
          {/* Render week or month options */}
          {periodType === 'week'
            ? renderWeekOptions(availableWeeks, selectedWeek)
            : renderMonthOptions(availableWeeks, selectedMonth)}
        </SelectContent>
      </Select>

      {/* Refresh Button + Last Update */}
      {!compact && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={disabled || isRefreshing}
            aria-label="Обновить данные"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </Button>
          <span className="text-sm text-muted-foreground">
            Обновлено: {relativeTime}
          </span>
        </div>
      )}
    </div>
  )
}

function DashboardPeriodSelectorSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
      <Skeleton className="h-10 w-[160px]" />
      <Skeleton className="h-10 w-full md:w-[320px]" />
      <Skeleton className="h-10 w-[120px]" />
    </div>
  )
}
```

### Dropdown Options Rendering

```typescript
function renderWeekOptions(
  availableWeeks: string[],
  selectedWeek: string
): JSX.Element[] {
  // Show last 12 weeks
  const recentWeeks = availableWeeks.slice(0, 12)

  return recentWeeks.map((week) => (
    <SelectItem key={week} value={week}>
      {formatPeriodDisplay(week, 'week')}
    </SelectItem>
  ))
}

function renderMonthOptions(
  availableWeeks: string[],
  selectedMonth: string
): JSX.Element[] {
  // Derive unique months from available weeks
  const months = getUniqueMonthsFromWeeks(availableWeeks)
  const recentMonths = months.slice(0, 6)

  return recentMonths.map((month) => (
    <SelectItem key={month} value={month}>
      {formatPeriodDisplay(month, 'month')}
    </SelectItem>
  ))
}
```

---

## Related Documents

- **Epic**: `docs/epics/epic-60-fe-dashboard-ux-improvements.md`
- **Story 60.1-FE**: `docs/stories/epic-60/story-60.1-fe-period-state-management.md`
- **shadcn/ui Tabs**: https://ui.shadcn.com/docs/components/tabs
- **shadcn/ui Select**: https://ui.shadcn.com/docs/components/select
- **Design System**: `docs/front-end-spec.md`

---

**Created**: 2026-01-29
**Author**: Claude Code (PM Mode)
**Prerequisite**: Story 60.1-FE
**Next Story**: Story 60.3-FE (Enhanced MetricCard with Comparison)
