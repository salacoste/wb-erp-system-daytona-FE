# Story 51.3-FE: Extended Date Range Picker Component

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 1 (Sprint allocation per epic)
- **Priority**: P1 (Core Component)
- **Points**: 3 SP
- **Status**: Ready for Dev
- **Backend Dependency**: None (UI component only)

---

## User Story

**As a** WB seller analyzing historical FBS data,
**I want** to select date ranges up to 365 days with preset options,
**So that** I can quickly access common analysis periods and receive smart aggregation suggestions.

**Non-goals**:
- Week-based selection (existing `DateRangePicker` handles ISO weeks)
- Backend API integration (handled by parent components)

---

## Acceptance Criteria

### AC1: Date Range Selection

- [ ] Two calendar views (start date, end date) in popover
- [ ] Support date ranges from 1 to 365 days
- [ ] Date format: DD.MM.YYYY (Russian locale)
- [ ] Visual range highlighting between selected dates
- [ ] Disabled dates beyond 365 days from today
- [ ] Clear button to reset selection

### AC2: Preset Buttons

- [ ] "30 дней" - Sets range to last 30 days
- [ ] "90 дней" - Sets range to last 90 days
- [ ] "180 дней" - Sets range to last 180 days (half year)
- [ ] "365 дней" - Sets range to last 365 days (full year)
- [ ] Presets update both `from` and `to` dates simultaneously
- [ ] Active preset visually highlighted

### AC3: Max Range Validation

- [ ] Enforce maximum 365 days (configurable via `maxDays` prop)
- [ ] Show validation error when range exceeds limit
- [ ] Error message in Russian: "Диапазон не может превышать {maxDays} дней"
- [ ] Prevent form submission with invalid range

### AC4: Aggregation Suggestion

- [ ] Auto-calculate suggested aggregation based on range:
  - 1-90 days: "daily" (Ежедневно)
  - 91-180 days: "weekly" (Еженедельно)
  - 181-365 days: "monthly" (Ежемесячно)
- [ ] Display suggestion badge below picker (optional via `showAggregationSuggestion` prop)
- [ ] Suggestion format: "Рекомендуемая агрегация: {level}"

### AC5: Russian Locale

- [ ] Month names in Russian (Январь, Февраль, etc.)
- [ ] Day names in Russian (Пн, Вт, Ср, etc.)
- [ ] Date format: DD.MM.YYYY in trigger button
- [ ] Range display: "01.01.2025 — 31.03.2025"

### AC6: Keyboard & Accessibility

- [ ] Full keyboard navigation in calendar
- [ ] ARIA labels for date selection
- [ ] Screen reader announcements for selected range
- [ ] Focus management when popover opens/closes
- [ ] Tab navigation between calendar months

### AC7: Responsive Design

- [ ] Side-by-side calendars on desktop (md breakpoint+)
- [ ] Stacked calendars on mobile
- [ ] Full-width trigger button on mobile
- [ ] Popover positioned appropriately on all screen sizes

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Trigger Button (collapsed state):                                           │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ 📅 01.01.2025 — 31.03.2025                                        [X] │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Popover (expanded state):                                                   │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ Быстрый выбор:                                                         │  │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │  │
│ │ │ 30 дней  │ │ 90 дней  │ │ 180 дней │ │ 365 дней │                   │  │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │  │
│ │                                                                        │  │
│ │ ┌─────────────────────────┐ ┌─────────────────────────┐               │  │
│ │ │      Январь 2025        │ │      Февраль 2025       │               │  │
│ │ │  [<]              [>]   │ │  [<]              [>]   │               │  │
│ │ │ Пн Вт Ср Чт Пт Сб Вс    │ │ Пн Вт Ср Чт Пт Сб Вс    │               │  │
│ │ │       1  2  3  4  5     │ │                 1  2    │               │  │
│ │ │  6  7  8  9 10 11 12    │ │  3  4  5  6  7  8  9    │               │  │
│ │ │ 13 14 15 16 17 18 19    │ │ 10 11 12 13 14 15 16    │               │  │
│ │ │ 20 21 22 23 24 25 26    │ │ 17 18 19 20 21 22 23    │               │  │
│ │ │ 27 28 29 30 31          │ │ 24 25 26 27 28          │               │  │
│ │ └─────────────────────────┘ └─────────────────────────┘               │  │
│ │                                                                        │  │
│ │ ℹ️ Рекомендуемая агрегация: Ежедневно                                 │  │
│ │                                                                        │  │
│ │ Выбрано: 90 дней                              [Очистить] [Применить]  │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Validation Error (when range > maxDays):                                    │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Диапазон не может превышать 365 дней. Выбрано: 400 дней            │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Components to Create

### Main Component

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `src/components/custom/date-range-picker-extended.tsx` | ~180 | Main date range picker component |
| `src/components/custom/date-range-picker-extended.test.tsx` | ~120 | Unit tests |

---

## Technical Details

### Props Interface

```typescript
// src/components/custom/date-range-picker-extended.tsx

export interface DateRange {
  from: Date
  to: Date
}

export interface DateRangePreset {
  /** Display label (Russian) */
  label: string
  /** Number of days for this preset */
  days: number
}

export interface DateRangePickerExtendedProps {
  /** Current selected date range */
  value: DateRange | undefined
  /** Callback when range changes */
  onChange: (range: DateRange | undefined) => void
  /** Maximum allowed days in range (default: 365) */
  maxDays?: number
  /** Custom preset buttons (default: 30d, 90d, 180d, 365d) */
  presets?: DateRangePreset[]
  /** Show aggregation suggestion badge (default: true) */
  showAggregationSuggestion?: boolean
  /** Disable the picker */
  disabled?: boolean
  /** Custom className for root element */
  className?: string
  /** Placeholder text when no range selected */
  placeholder?: string
  /** ID for accessibility */
  id?: string
}
```

### Default Presets

```typescript
const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
  { label: '180 дней', days: 180 },
  { label: '365 дней', days: 365 },
]
```

### Aggregation Suggestion Logic

```typescript
/**
 * Get smart aggregation suggestion based on date range
 * Story 51.3-FE: Auto-suggest aggregation level
 *
 * @see Epic 51-FE Technical Notes
 */
export type AggregationLevel = 'day' | 'week' | 'month'

export function getSmartAggregation(daysDiff: number): AggregationLevel {
  if (daysDiff <= 90) return 'day'
  if (daysDiff <= 180) return 'week'
  return 'month'
}

export function getAggregationLabel(level: AggregationLevel): string {
  const labels: Record<AggregationLevel, string> = {
    day: 'Ежедневно',
    week: 'Еженедельно',
    month: 'Ежемесячно',
  }
  return labels[level]
}
```

### Date Formatting (Russian Locale)

```typescript
import { format, differenceInDays, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * Format date in Russian locale
 * Example: "01.01.2025"
 */
export function formatDateRu(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: ru })
}

/**
 * Format date range for display
 * Example: "01.01.2025 — 31.03.2025"
 */
export function formatDateRangeRu(from: Date, to: Date): string {
  return `${formatDateRu(from)} — ${formatDateRu(to)}`
}

/**
 * Calculate days in range (inclusive)
 */
export function calculateDaysInRange(from: Date, to: Date): number {
  return differenceInDays(to, from) + 1
}
```

### Component Structure

```tsx
// Pseudo-code structure
function DateRangePickerExtended({
  value,
  onChange,
  maxDays = 365,
  presets = DEFAULT_PRESETS,
  showAggregationSuggestion = true,
  disabled = false,
  className,
  placeholder = 'Выберите период',
  id,
}: DateRangePickerExtendedProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate days in range
  const daysInRange = value ? calculateDaysInRange(value.from, value.to) : 0

  // Validation
  const isRangeValid = daysInRange <= maxDays

  // Aggregation suggestion
  const aggregation = daysInRange > 0 ? getSmartAggregation(daysInRange) : null

  // Handle preset click
  const handlePresetClick = (days: number) => {
    const to = new Date()
    const from = subDays(to, days - 1) // -1 because range is inclusive
    onChange({ from, to })
  }

  // Determine active preset
  const activePreset = presets.find(p => p.days === daysInRange)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Calendar className="mr-2 h-4 w-4" />
          {value ? formatDateRangeRu(value.from, value.to) : placeholder}
          {value && (
            <X className="ml-2 h-4 w-4" onClick={handleClear} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        {/* Preset buttons */}
        <div className="flex gap-2 mb-4">
          {presets.map(preset => (
            <Button
              key={preset.days}
              variant={activePreset?.days === preset.days ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePresetClick(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Dual calendar */}
        <div className="flex gap-4">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={ru}
            disabled={{ after: new Date() }}
          />
        </div>

        {/* Aggregation suggestion */}
        {showAggregationSuggestion && aggregation && (
          <div className="mt-4 text-sm text-muted-foreground">
            <Info className="inline mr-1 h-4 w-4" />
            Рекомендуемая агрегация: {getAggregationLabel(aggregation)}
          </div>
        )}

        {/* Days count */}
        {daysInRange > 0 && (
          <div className="mt-2 text-sm">
            Выбрано: {daysInRange} {pluralizeDays(daysInRange)}
          </div>
        )}

        {/* Validation error */}
        {!isRangeValid && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Диапазон не может превышать {maxDays} дней. Выбрано: {daysInRange}
            </AlertDescription>
          </Alert>
        )}
      </PopoverContent>
    </Popover>
  )
}
```

### Russian Pluralization Helper

```typescript
/**
 * Pluralize "день" in Russian
 * 1 день, 2 дня, 5 дней, 21 день, 22 дня, etc.
 */
export function pluralizeDays(count: number): string {
  const abs = Math.abs(count)
  const mod10 = abs % 10
  const mod100 = abs % 100

  if (mod100 >= 11 && mod100 <= 19) {
    return 'дней'
  }
  if (mod10 === 1) {
    return 'день'
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'дня'
  }
  return 'дней'
}
```

---

## Tasks / Subtasks

### Phase 1: Utility Functions (0.5 SP)

- [ ] Create `getSmartAggregation()` function
- [ ] Create `getAggregationLabel()` function
- [ ] Create `formatDateRu()` function
- [ ] Create `formatDateRangeRu()` function
- [ ] Create `calculateDaysInRange()` function
- [ ] Create `pluralizeDays()` function
- [ ] Add unit tests for all utilities

### Phase 2: Core Component (1.5 SP)

- [ ] Create `DateRangePickerExtended` component
- [ ] Implement props interface with defaults
- [ ] Add Popover trigger with date display
- [ ] Implement preset buttons with active state
- [ ] Add dual Calendar with range selection
- [ ] Configure Russian locale for Calendar
- [ ] Add aggregation suggestion display

### Phase 3: Validation & UX (0.5 SP)

- [ ] Implement max range validation
- [ ] Add validation error alert
- [ ] Add clear button functionality
- [ ] Add days count display
- [ ] Implement disabled date logic (future dates)

### Phase 4: Accessibility (0.25 SP)

- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation
- [ ] Add focus management for popover
- [ ] Test with screen reader

### Phase 5: Testing (0.25 SP)

- [ ] Unit tests for component rendering
- [ ] Tests for preset button clicks
- [ ] Tests for range validation
- [ ] Tests for aggregation suggestion
- [ ] Tests for Russian locale formatting
- [ ] Accessibility tests

---

## Testing

### Unit Test Cases

```typescript
// date-range-picker-extended.test.tsx

describe('DateRangePickerExtended', () => {
  describe('Rendering', () => {
    it('renders with placeholder when no value', () => {})
    it('renders date range when value provided', () => {})
    it('renders preset buttons', () => {})
    it('renders disabled state correctly', () => {})
  })

  describe('Presets', () => {
    it('applies 30 days preset on click', () => {})
    it('applies 90 days preset on click', () => {})
    it('highlights active preset', () => {})
    it('uses custom presets when provided', () => {})
  })

  describe('Validation', () => {
    it('shows error when range exceeds maxDays', () => {})
    it('allows range up to maxDays', () => {})
    it('respects custom maxDays prop', () => {})
  })

  describe('Aggregation Suggestion', () => {
    it('suggests daily for <= 90 days', () => {})
    it('suggests weekly for 91-180 days', () => {})
    it('suggests monthly for > 180 days', () => {})
    it('hides suggestion when showAggregationSuggestion=false', () => {})
  })

  describe('Formatting', () => {
    it('formats dates in Russian locale (DD.MM.YYYY)', () => {})
    it('displays range with dash separator', () => {})
    it('pluralizes days correctly in Russian', () => {})
  })

  describe('Accessibility', () => {
    it('has accessible trigger button', () => {})
    it('manages focus on popover open/close', () => {})
    it('supports keyboard navigation', () => {})
  })
})

describe('Utility Functions', () => {
  describe('getSmartAggregation', () => {
    it('returns day for 1-90 days', () => {})
    it('returns week for 91-180 days', () => {})
    it('returns month for 181-365 days', () => {})
  })

  describe('pluralizeDays', () => {
    it('returns день for 1, 21, 31', () => {})
    it('returns дня for 2, 3, 4, 22, 23', () => {})
    it('returns дней for 5-20, 25-30', () => {})
    it('returns дней for 11-19 (special case)', () => {})
  })
})
```

### Accessibility Tests

- [ ] Color contrast meets WCAG 2.1 AA (4.5:1)
- [ ] All buttons have accessible names
- [ ] Calendar navigation works with arrow keys
- [ ] Focus visible indicator present
- [ ] Screen reader announces selected range

---

## Definition of Done

- [ ] Component created at `src/components/custom/date-range-picker-extended.tsx`
- [ ] All props implemented per interface
- [ ] Default presets (30d, 90d, 180d, 365d) working
- [ ] Max range validation with Russian error message
- [ ] Aggregation suggestion displays correctly
- [ ] Russian locale for all dates
- [ ] Clear button resets selection
- [ ] Keyboard navigation working
- [ ] ARIA labels present
- [ ] Unit tests passing (>80% coverage)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] File under 200 lines
- [ ] Exported from component index

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| `src/components/ui/calendar.tsx` | Exists | shadcn/ui Calendar (react-day-picker) |
| `src/components/ui/popover.tsx` | Exists | shadcn/ui Popover |
| `src/components/ui/button.tsx` | Exists | shadcn/ui Button |
| `date-fns` | Exists | Date manipulation library |
| `date-fns/locale/ru` | Exists | Russian locale for date-fns |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.8-FE | Pending | FBS Orders Analytics Page (consumes this component) |
| Story 51.7-FE | Pending | Period Comparison UI (may reuse) |

---

## Related Files

### Existing Similar Components

- `src/components/custom/DateRangePicker.tsx` - Week-based range picker (reference for patterns)
- `src/components/custom/WeekSelector.tsx` - Single week selector
- `src/components/custom/MultiWeekSelector.tsx` - Multi-week selection

### Base Components (shadcn/ui)

- `src/components/ui/calendar.tsx` - Base Calendar component
- `src/components/ui/popover.tsx` - Popover component
- `src/components/ui/button.tsx` - Button component
- `src/components/ui/alert.tsx` - Alert for validation errors

### Epic Documentation

- `docs/epics/epic-51-fe-fbs-historical-analytics.md` - Epic specification

---

## Dev Notes

### Calendar Configuration

The shadcn/ui Calendar uses `react-day-picker` v9. Key configurations:

```tsx
<Calendar
  mode="range"
  selected={value}
  onSelect={handleSelect}
  numberOfMonths={2}  // Dual calendar view
  locale={ru}         // Russian locale
  disabled={{
    after: new Date(), // Disable future dates
    before: subDays(new Date(), 365) // Disable dates > 365 days ago
  }}
  defaultMonth={value?.from ?? subMonths(new Date(), 1)}
/>
```

### Reusability

This component is designed to be reusable across:
- Epic 51-FE: FBS Historical Analytics
- Future analytics features requiring date range selection
- Any feature needing 365-day date selection

### Mobile Considerations

On mobile (< md breakpoint):
- Stack calendars vertically
- Use full-width trigger button
- Consider Sheet instead of Popover for better UX

```tsx
// Responsive calendar layout
<div className="flex flex-col md:flex-row gap-4">
  <Calendar ... />
  <Calendar ... />
</div>
```

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | Claude Code (PM Agent) | Initial story creation |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

---

## QA Results

_Section for QA review_

```
Reviewer:
Date:
Gate Decision:
Quality Score:
```
