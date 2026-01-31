# Story 62.9-FE: Chart/Table View Toggle

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: 📋 Ready for Dev
**Priority**: P2 (Nice to Have)
**Estimate**: 2 SP

---

## Title (RU)
Переключатель график/таблица

---

## Description

Add a toggle control that allows users to switch between chart and table views of the daily breakdown data. This provides flexibility for users who prefer different data visualization styles.

The toggle should:
- Use a segmented button group pattern
- Persist user preference in localStorage
- Provide smooth transition between views
- Be accessible via keyboard navigation

This story also creates the `DailyBreakdownSection` wrapper component that orchestrates the chart, table, legend, and view toggle.

---

## Acceptance Criteria

- [ ] Toggle button group with two options: [📊 График] [📋 Таблица]
- [ ] Active state: Red background (#E53935), white text
- [ ] Inactive state: White background, gray-700 text, gray border
- [ ] Hover state: Light red background (#FEF2F2) on inactive button
- [ ] Toggle persists preference to localStorage key `dashboard-daily-view`
- [ ] Default view is "График" (chart)
- [ ] Smooth fade transition between views (150ms)
- [ ] Both views use same data source (useDailyMetrics)
- [ ] Toggle is keyboard accessible (Tab, Arrow keys, Enter/Space)
- [ ] Toggle positioned above chart/table, right-aligned
- [ ] DailyBreakdownSection component wraps all daily breakdown UI

---

## Design Specifications

### Toggle Button Group

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Детализация по дням                                     [📊 График][📋 Таблица] │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                    [ Chart or Table View Content Here ]                       │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│  ● Заказы   ● COGS   ● Выкупы   ● Реклама   ...              [Все] [Сбросить] │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Button States

**Active Button:**
```css
.toggle-button-active {
  background-color: #E53935; /* Primary Red */
  color: white;
  border: 1px solid #E53935;
  font-weight: 500;
}
```

**Inactive Button:**
```css
.toggle-button-inactive {
  background-color: white;
  color: #374151; /* gray-700 */
  border: 1px solid #E5E7EB; /* gray-200 */
  font-weight: 400;
}

.toggle-button-inactive:hover {
  background-color: #FEF2F2; /* red-50 */
  border-color: #E53935;
}
```

**Focus State:**
```css
.toggle-button:focus-visible {
  outline: 2px solid #E53935;
  outline-offset: 2px;
}
```

### Button Dimensions

| Property | Value |
|----------|-------|
| Height | 36px |
| Padding | 8px 16px |
| Font Size | 14px |
| Border Radius | First: 6px 0 0 6px, Last: 0 6px 6px 0 |
| Icon Size | 16px |
| Icon-Text Gap | 6px |

### Section Layout

```
DailyBreakdownSection
├── Header Row (flex, justify-between, items-center)
│   ├── Title: "Детализация по дням" (h3, text-lg, font-semibold)
│   └── ViewToggle (right-aligned)
├── Content Area (min-height: 300px)
│   ├── DailyBreakdownChart (when view === 'chart')
│   └── DailyMetricsTable (when view === 'table')
└── MetricLegend (only visible when view === 'chart')
```

---

## Technical Implementation

### Component Interface

```typescript
// ViewToggle.tsx
interface ViewToggleProps {
  value: 'chart' | 'table'
  onChange: (value: 'chart' | 'table') => void
  className?: string
}

// DailyBreakdownSection.tsx
interface DailyBreakdownSectionProps {
  className?: string
}
```

### ViewToggle Component

```typescript
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BarChart3, Table2 } from 'lucide-react'

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onChange(val as 'chart' | 'table')}
      className={className}
    >
      <ToggleGroupItem
        value="chart"
        aria-label="Показать график"
        className={cn(
          'px-4 py-2 text-sm gap-1.5',
          value === 'chart'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-white text-gray-700 hover:bg-red-50'
        )}
      >
        <BarChart3 className="h-4 w-4" />
        График
      </ToggleGroupItem>
      <ToggleGroupItem
        value="table"
        aria-label="Показать таблицу"
        className={cn(
          'px-4 py-2 text-sm gap-1.5',
          value === 'table'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-white text-gray-700 hover:bg-red-50'
        )}
      >
        <Table2 className="h-4 w-4" />
        Таблица
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
```

### View Preference Hook

```typescript
// useViewPreference.ts
const STORAGE_KEY = 'dashboard-daily-view'
const DEFAULT_VIEW = 'chart'

export function useViewPreference() {
  const [view, setView] = useState<'chart' | 'table'>(() => {
    if (typeof window === 'undefined') return DEFAULT_VIEW
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'table' ? 'table' : 'chart'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, view)
  }, [view])

  return [view, setView] as const
}
```

### DailyBreakdownSection Component

```typescript
// DailyBreakdownSection.tsx
export function DailyBreakdownSection({ className }: DailyBreakdownSectionProps) {
  const { period, periodType } = useDashboardPeriod()
  const { data, isLoading, error } = useDailyMetrics(period)

  const [view, setView] = useViewPreference()
  const {
    visibleSeries,
    toggleSeries,
    showAll,
    hideAll
  } = useLegendPreferences()

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Детализация по дням
        </h3>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Content with transition */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {view === 'chart' ? (
            <motion.div
              key="chart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DailyBreakdownChart
                data={data ?? []}
                periodType={periodType}
                visibleSeries={visibleSeries}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DailyMetricsTable
                data={data ?? []}
                periodType={periodType}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend (chart view only) */}
      {view === 'chart' && (
        <MetricLegend
          visibleSeries={visibleSeries}
          onSeriesToggle={toggleSeries}
          onShowAll={showAll}
          onHideAll={hideAll}
        />
      )}
    </section>
  )
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/ViewToggle.tsx` | CREATE | Toggle button group component |
| `src/components/custom/dashboard/DailyBreakdownSection.tsx` | CREATE | Section wrapper component |
| `src/hooks/useViewPreference.ts` | CREATE | View preference hook |
| `src/components/custom/dashboard/__tests__/ViewToggle.test.tsx` | CREATE | Unit tests |
| `src/components/custom/dashboard/__tests__/DailyBreakdownSection.test.tsx` | CREATE | Integration tests |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add barrel exports |
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | MODIFY | Add DailyBreakdownSection |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Component | `ToggleGroup` from shadcn/ui | Available |
| Icons | `BarChart3`, `Table2` from lucide-react | Available |
| Animation | `framer-motion` (AnimatePresence) | Optional |
| Story | 62.6-FE DailyBreakdownChart | Same sprint |
| Story | 62.7-FE MetricLegend | Same sprint |
| Story | 62.8-FE DailyMetricsTable | Same sprint |

**Note**: If framer-motion is not installed, use CSS transitions instead.

---

## Testing Requirements

### Unit Tests

```typescript
describe('ViewToggle', () => {
  it('renders chart and table options', () => {})
  it('shows active state for selected value', () => {})
  it('calls onChange when option clicked', () => {})
  it('is keyboard navigable with Tab', () => {})
  it('switches with Arrow keys', () => {})
  it('activates with Enter/Space', () => {})
  it('has correct aria-label attributes', () => {})
})

describe('useViewPreference', () => {
  it('defaults to chart view', () => {})
  it('persists preference to localStorage', () => {})
  it('restores preference from localStorage', () => {})
})

describe('DailyBreakdownSection', () => {
  it('renders chart view by default', () => {})
  it('switches to table view on toggle', () => {})
  it('shows legend only in chart view', () => {})
  it('passes correct props to chart/table', () => {})
  it('handles loading state', () => {})
  it('handles error state', () => {})
})
```

---

## Accessibility Requirements

- Toggle group uses `role="radiogroup"` with `aria-label`
- Each toggle item has `role="radio"` with `aria-checked`
- Keyboard navigation follows WAI-ARIA ToggleButton pattern
- Tab moves focus to group, Arrow keys move between options
- Enter/Space activates the focused option
- Clear visual focus indicators (2px red outline)
- Screen reader announces current selection

```html
<div role="radiogroup" aria-label="Выбор представления данных">
  <button
    role="radio"
    aria-checked="true"
    aria-label="График"
  >
    📊 График
  </button>
  <button
    role="radio"
    aria-checked="false"
    aria-label="Таблица"
  >
    📋 Таблица
  </button>
</div>
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] ViewToggle component follows 200-line limit
- [ ] DailyBreakdownSection properly orchestrates child components
- [ ] TypeScript strict mode passes
- [ ] Russian locale for all user-facing text
- [ ] Responsive design (toggle position adapts to mobile)
- [ ] Unit tests written and passing
- [ ] Integration tests for section component
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] localStorage persistence working
- [ ] Smooth transition animation
- [ ] No ESLint errors
- [ ] Code review approved

---

## References

- **Epic**: `docs/epics/epic-62-fe-dashboard-presentation.md`
- **shadcn/ui ToggleGroup**: https://ui.shadcn.com/docs/components/toggle-group
- **WAI-ARIA Radio Group**: https://www.w3.org/WAI/ARIA/apg/patterns/radiobutton/
- **Related Stories**: 62.6, 62.7, 62.8

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)
