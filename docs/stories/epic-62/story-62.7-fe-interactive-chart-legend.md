# Story 62.7-FE: Interactive Chart Legend

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: 📋 Ready for Dev
**Priority**: P1 (Important)
**Estimate**: 2 SP

---

## Title (RU)
Интерактивная легенда графика

---

## Description

Create an interactive legend component that allows users to toggle visibility of individual metric series on the Daily Breakdown chart. Users can click on legend items to show/hide specific metrics, making it easier to focus on metrics they care about.

The legend should:
- Display all 8 metrics with color indicators
- Support click-to-toggle functionality
- Provide "Show All" / "Hide All" bulk actions
- Persist user preferences in localStorage
- Be fully keyboard accessible

---

## Acceptance Criteria

- [ ] Display 8 metric items with colored dots matching chart series
- [ ] Click on legend item toggles series visibility on/off
- [ ] Active state: full color dot + black text
- [ ] Hidden state: gray dot (#9CA3AF) + gray text + strikethrough
- [ ] "Все" (Show All) button enables all series
- [ ] "Сбросить" (Reset/Hide All) button hides all series
- [ ] Legend preferences persist in localStorage key `dashboard-chart-legend`
- [ ] Keyboard navigation: Tab between items, Space/Enter to toggle
- [ ] Hover state: underline on legend text
- [ ] Responsive layout: wraps on mobile, horizontal scroll optional
- [ ] Synchronizes with parent chart via `onSeriesToggle` callback
- [ ] Minimum 1 series must remain visible (prevent hiding all)

---

## Design Specifications

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ● Заказы   ● COGS   ● Выкупы   ● Реклама   ● Логистика   ...   [Все] [Сбросить]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Metric Items

| Metric Key | Label (RU) | Default Color | Default Visible |
|------------|------------|---------------|-----------------|
| orders | Заказы | `#3B82F6` | true |
| ordersCogs | COGS заказов | `#F97316` | false |
| sales | Выкупы | `#22C55E` | true |
| salesCogs | COGS выкупов | `#FB923C` | false |
| advertising | Реклама | `#7C3AED` | true |
| logistics | Логистика | `#06B6D4` | false |
| storage | Хранение | `#EC4899` | false |
| profit | Теор. прибыль | `#E53935` | true |

### Visual States

**Active (Visible) State:**
```css
.legend-item-active {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.legend-dot-active {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--metric-color);
}

.legend-text-active {
  font-size: 14px;
  color: #374151; /* gray-700 */
}
```

**Hidden State:**
```css
.legend-item-hidden {
  opacity: 0.6;
}

.legend-dot-hidden {
  background: #9CA3AF; /* gray-400 */
}

.legend-text-hidden {
  color: #9CA3AF;
  text-decoration: line-through;
}
```

**Hover State:**
```css
.legend-item:hover .legend-text {
  text-decoration: underline;
}
```

**Focus State:**
```css
.legend-item:focus-visible {
  outline: 2px solid #E53935;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Action Buttons

```css
.legend-action-button {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid #EEEEEE;
  background: white;
  color: #374151;
  cursor: pointer;
}

.legend-action-button:hover {
  background: #F5F5F5;
  border-color: #E53935;
}
```

### Responsive Behavior

**Desktop (>= 1024px):**
- Horizontal layout with flex-wrap
- All items visible in single row
- Action buttons at right end

**Tablet (768-1023px):**
- Horizontal layout, may wrap to 2 rows
- Slight reduction in gap spacing

**Mobile (< 768px):**
- Horizontal scroll container
- Gradient fade on edges to indicate scroll
- Action buttons in separate row below

---

## Technical Implementation

### Component Interface

```typescript
// MetricLegend.tsx
interface MetricLegendProps {
  visibleSeries: string[]
  onSeriesToggle: (key: string) => void
  onShowAll: () => void
  onHideAll: () => void
  className?: string
}

interface LegendItem {
  key: string
  label: string
  color: string
}

// Constants
const METRIC_LEGEND_ITEMS: LegendItem[] = [
  { key: 'orders', label: 'Заказы', color: '#3B82F6' },
  { key: 'ordersCogs', label: 'COGS заказов', color: '#F97316' },
  { key: 'sales', label: 'Выкупы', color: '#22C55E' },
  { key: 'salesCogs', label: 'COGS выкупов', color: '#FB923C' },
  { key: 'advertising', label: 'Реклама', color: '#7C3AED' },
  { key: 'logistics', label: 'Логистика', color: '#06B6D4' },
  { key: 'storage', label: 'Хранение', color: '#EC4899' },
  { key: 'profit', label: 'Теор. прибыль', color: '#E53935' },
]

const DEFAULT_VISIBLE = ['orders', 'sales', 'advertising', 'profit']
const STORAGE_KEY = 'dashboard-chart-legend'
```

### State Management Hook

```typescript
// useLegendPreferences.ts
function useLegendPreferences() {
  const [visibleSeries, setVisibleSeries] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAULT_VISIBLE
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleSeries))
  }, [visibleSeries])

  const toggleSeries = useCallback((key: string) => {
    setVisibleSeries(prev => {
      const isVisible = prev.includes(key)
      // Prevent hiding all - must have at least 1
      if (isVisible && prev.length === 1) return prev
      return isVisible
        ? prev.filter(k => k !== key)
        : [...prev, key]
    })
  }, [])

  const showAll = useCallback(() => {
    setVisibleSeries(METRIC_LEGEND_ITEMS.map(item => item.key))
  }, [])

  const hideAll = useCallback(() => {
    // Keep first metric visible (orders)
    setVisibleSeries(['orders'])
  }, [])

  return { visibleSeries, toggleSeries, showAll, hideAll }
}
```

### Component Structure

```typescript
export function MetricLegend({
  visibleSeries,
  onSeriesToggle,
  onShowAll,
  onHideAll,
  className
}: MetricLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {/* Legend Items */}
      <div className="flex flex-wrap items-center gap-3">
        {METRIC_LEGEND_ITEMS.map(item => (
          <button
            key={item.key}
            role="checkbox"
            aria-checked={visibleSeries.includes(item.key)}
            aria-label={`Показать ${item.label} на графике`}
            onClick={() => onSeriesToggle(item.key)}
            className={cn(
              'flex items-center gap-1.5 cursor-pointer transition-opacity',
              !visibleSeries.includes(item.key) && 'opacity-60'
            )}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: visibleSeries.includes(item.key)
                  ? item.color
                  : '#9CA3AF'
              }}
            />
            <span
              className={cn(
                'text-sm hover:underline',
                visibleSeries.includes(item.key)
                  ? 'text-gray-700'
                  : 'text-gray-400 line-through'
              )}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={onShowAll}>
          Все
        </Button>
        <Button variant="outline" size="sm" onClick={onHideAll}>
          Сбросить
        </Button>
      </div>
    </div>
  )
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/MetricLegend.tsx` | CREATE | Legend component |
| `src/hooks/useLegendPreferences.ts` | CREATE | Legend state management hook |
| `src/components/custom/dashboard/__tests__/MetricLegend.test.tsx` | CREATE | Unit tests |
| `src/components/custom/dashboard/index.ts` | MODIFY | Add barrel export |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Component | `Button` from shadcn/ui | Available |
| Utility | `cn` from `src/lib/utils` | Available |
| Story | 62.6-FE DailyBreakdownChart | Same sprint |

---

## Testing Requirements

### Unit Tests

```typescript
describe('MetricLegend', () => {
  it('renders all 8 metric items', () => {})
  it('shows active state for visible series', () => {})
  it('shows hidden state for non-visible series', () => {})
  it('calls onSeriesToggle when item clicked', () => {})
  it('calls onShowAll when "Все" button clicked', () => {})
  it('calls onHideAll when "Сбросить" button clicked', () => {})
  it('is keyboard accessible with Tab navigation', () => {})
  it('toggles on Space/Enter key press', () => {})
  it('has correct aria-checked attribute', () => {})
})

describe('useLegendPreferences', () => {
  it('loads default visible series on first use', () => {})
  it('persists preferences to localStorage', () => {})
  it('restores preferences from localStorage', () => {})
  it('prevents hiding all series (keeps at least 1)', () => {})
  it('showAll enables all 8 series', () => {})
  it('hideAll keeps only orders visible', () => {})
})
```

---

## Accessibility Requirements

- Each legend item has `role="checkbox"` with `aria-checked` attribute
- `aria-label` describes the toggle action clearly
- Tab navigation moves between legend items
- Space/Enter keys toggle the focused item
- Focus indicators are clearly visible (2px red outline)
- Color is not the only indicator of state (strikethrough for hidden)

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Component follows 200-line file limit
- [ ] TypeScript strict mode passes
- [ ] Russian locale for all user-facing text
- [ ] Responsive design verified (mobile/tablet/desktop)
- [ ] Unit tests written and passing
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] localStorage persistence working
- [ ] No ESLint errors
- [ ] Code review approved

---

## References

- **Epic**: `docs/epics/epic-62-fe-dashboard-presentation.md`
- **Wireframe**: `docs/wireframes/dashboard-daily-breakdown.md`
- **Design System**: `docs/front-end-spec.md`
- **Related Story**: 62.6-FE (DailyBreakdownChart)

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)
