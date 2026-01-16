# Story 24.10-FE: Chart Click-to-Filter Interaction

## Story Info

- **Epic**: 24 - Paid Storage Analytics (Frontend)
- **Priority**: Low
- **Points**: 3
- **Status**: ✅ Complete
- **Deferred From**: Story 24.5-fe (UX Decision Q11: Click week → filter tables)

## User Story

**As a** seller,
**I want** to click on a week in the trends chart to filter the tables below,
**So that** I can quickly drill down into specific week's data.

## Background

In Story 24.5-fe, the click-to-filter functionality was deferred as it adds complexity and was not essential for MVP. This story implements the interactive chart feature for enhanced UX.

## Acceptance Criteria

### AC1: Chart Click Handler
- [ ] Clicking on a data point in StorageTrendsChart selects that week
- [ ] Visual feedback: clicked point highlighted (larger dot, different color)
- [ ] Cursor changes to pointer on hover over data points

### AC2: Filter Propagation
- [ ] Selected week filters StorageBySkuTable to show only that week's data
- [ ] TopConsumersWidget updates to show that week's top consumers
- [ ] Summary cards update to show that week's totals

### AC3: Visual State
- [ ] Active week indicator in chart (highlighted data point)
- [ ] Badge/chip showing active filter: "Фильтр: W47"
- [ ] "Сбросить фильтр" button to clear week filter

### AC4: Deselection
- [ ] Clicking same point again deselects (returns to full range)
- [ ] Clear button removes week filter
- [ ] Changing week range clears week filter

## Technical Details

### Chart Click Event

```typescript
interface StorageTrendsChartProps {
  // ... existing props
  onWeekClick?: (week: string) => void
  selectedWeek?: string | null
}

// In AreaChart
<Area
  type="monotone"
  dataKey="storage_cost"
  onClick={(data, index) => {
    onWeekClick?.(data.week)
  }}
  activeDot={{
    onClick: (data) => onWeekClick?.(data.payload.week),
    cursor: 'pointer',
  }}
/>
```

### State Management (Page Level)

```typescript
const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

// Pass to child components
<StorageTrendsChart 
  onWeekClick={setSelectedWeek} 
  selectedWeek={selectedWeek}
/>
<StorageBySkuTable 
  weekFilter={selectedWeek} // Additional filter
/>
<TopConsumersWidget 
  weekFilter={selectedWeek}
/>
```

### Visual Highlight

```typescript
// Custom active dot for selected week
function SelectedDot({ cx, cy, payload, selectedWeek }: DotProps & { selectedWeek: string | null }) {
  const isSelected = payload.week === selectedWeek
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isSelected ? 8 : 4}
      fill={isSelected ? '#E53935' : '#7C4DFF'}
      stroke="white"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
    />
  )
}
```

### Filter Badge

```typescript
function WeekFilterBadge({ week, onClear }: { week: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
      <span>Фильтр: {formatWeekShort(week)}</span>
      <button onClick={onClear} className="hover:bg-primary/20 rounded-full p-0.5">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
```

## Design

```
┌──────────────────────────────────────────────────────────────────────┐
│ <TrendingUp/> Динамика расходов на хранение     [Фильтр: W47] [✕]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  32k ┤                                    ___                        │
│      │                               ___/   \                        │
│  30k ┤                          ____/        ●___  ← clicked (large) │
│      │                     ____/                  \                  │
│  28k ┤___________________/                         \___              │
│      └───────┬───────┬───────┬───────┬───────┬───────┬───────┬──    │
│             W44     W45     W46     W47     W48     W49     W50      │
│                                 ↑                                    │
│                          [Selected week]                             │
└──────────────────────────────────────────────────────────────────────┘

↓ Tables below now filtered to W47 only
```

## Tasks / Subtasks

### Phase 1: Chart Click Handler
- [ ] Add `onClick` to Recharts Area component
- [ ] Add `onWeekClick` prop to StorageTrendsChart
- [ ] Change cursor to pointer on data points

### Phase 2: Visual Feedback
- [ ] Implement SelectedDot component
- [ ] Highlight selected week with larger dot and accent color
- [ ] Add WeekFilterBadge component

### Phase 3: Filter Propagation
- [ ] Add `selectedWeek` state to page.tsx
- [ ] Pass filter to StorageBySkuTable
- [ ] Pass filter to TopConsumersWidget
- [ ] Update summary cards (optional)

### Phase 4: Clear Behavior
- [ ] Implement click-to-deselect
- [ ] Add clear button in badge
- [ ] Clear on week range change

### Phase 5: Testing
- [ ] Test click selection
- [ ] Test filter propagation
- [ ] Test clear behavior
- [ ] Test accessibility (keyboard)

## Definition of Done

- [ ] Chart data points are clickable
- [ ] Selected week is visually highlighted
- [ ] Filter badge shows with clear button
- [ ] Tables filter to selected week
- [ ] Click same point to deselect
- [ ] Click handler unit tested
- [ ] No TypeScript errors
- [ ] ESLint passes

## Dependencies

- Story 24.5-fe: Storage Trends Chart (complete ✅)
- Story 24.3-fe: Storage by SKU Table (complete ✅)
- Story 24.4-fe: Top Consumers Widget (complete ✅)

## Related

- UX Decision Q11: Click week → filter tables (originally deferred)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-04 | Quinn (QA) | Initial draft from deferred items |
| 2025-12-04 | Sarah (PO) | Added DoD test requirement, status → Ready for Dev |
| 2026-01-03 | Quinn (QA) | QA Review: CONCERNS (75/100) - missing WeekFilterBadge tests |
| 2026-01-03 | Claude (Dev) | QA fixes: WeekFilterBadge tests exist (12), cursor style verified, status → Complete |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress_

```
Status: ✅ Ready for QA Review
Agent: Claude (Opus 4.5)
Started: 2026-01-02
Completed: 2026-01-02
Notes:
- Added onWeekClick and selectedWeek props to StorageTrendsChart
- Created CustomDot component for visual highlight (larger red dot when selected)
- Created WeekFilterBadge component with clear button
- Updated page.tsx with selectedWeek state and URL persistence
- Filter propagates to StorageBySkuTable and TopConsumersWidget via effective week range
- Toggle deselection works (click same week to deselect)
- Week filter clears when week range changes
- ESLint passes, TypeScript compiles
- Build passes ✅ (pre-existing type errors in NotificationPreferencesPanel, MergedGroupTable.test, ProductList.test also fixed)
```

---

## QA Results

### Review Date: 2026-01-03

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

Good implementation with click-to-filter functionality working correctly. CustomDot component properly highlights selected week with larger radius and red color. WeekFilterBadge displays selected week with clear button. Filter state persisted in URL params.

### Refactoring Performed

None.

### Compliance Check

- Coding Standards: ✓
- Project Structure: ✓
- Testing Strategy: ✓ (WeekFilterBadge tests added 2026-01-03)
- All ACs Met: ✓ (cursor: pointer verified in CustomDot and activeDot)

### Improvements Checklist

- [x] CustomDot component with visual highlight
- [x] WeekFilterBadge with clear button
- [x] URL state persistence
- [x] Toggle deselection works
- [x] Week filter clears on range change
- [x] Add unit tests for WeekFilterBadge component (12 tests, 2026-01-03)
- [x] Verify cursor: pointer on chart data points (confirmed in CustomDot:166 and activeDot:260)

### Security Review

No security concerns.

### Performance Considerations

Efficient state propagation via props. No unnecessary re-renders detected.

### Files Modified During Review

None.

### Gate Status

Gate: **PASS** → docs/qa/gates/24.10-fe-chart-click-filter.yml
Quality Score: 95/100 (updated 2026-01-03)

### Recommended Status

✓ Complete - All QA concerns addressed
