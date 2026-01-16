# Story 36.4-FE: Page Layout & Toggle UI

## Story Info

- **Epic**: 36-FE - Product Card Linking (Frontend)
- **Priority**: High
- **Points**: 5
- **Status**: ✅ APPROVED (Ready for Development)

## User Story

**As a** seller,
**I want** to toggle between individual SKUs and merged groups (склейки) on the advertising analytics page,
**So that** I can analyze advertising performance in both views.

## Background

This story integrates all Epic 36 components into the existing advertising analytics page:
- Add UI toggle for switching between "По артикулам" and "По склейкам"
- Update table to render merged groups with badges
- Preserve all existing Epic 33 functionality (filters, sorting, pagination)
- **Zero breaking changes** to existing page behavior

**Default Mode**: "По артикулам" (SKU view) - users opt-in to merged groups.

**Dependencies**: Stories 36.1, 36.2, 36.3 complete.

## Acceptance Criteria

### AC1: Toggle UI
- [ ] Toggle buttons displayed above table (or in filters panel - PO decision)
- [ ] Two buttons: "По артикулам" | "По склейкам"
- [ ] Active button uses `variant="default"` (red)
- [ ] Inactive button uses `variant="outline"` (gray border)
- [ ] Default: "По артикулам" selected

### AC2: State Management
- [ ] `groupBy` state variable: `'sku' | 'imtId'`
- [ ] State updates when toggle clicked
- [ ] API call triggered with correct `group_by` parameter
- [ ] State persisted in URL params (`?group_by=imtId`)

### AC3: Table Rendering
- [ ] Merged groups display with MergedProductBadge
- [ ] Individual products display without badge
- [ ] Table columns unchanged (spend, revenue, ROAS, ROI, etc.)
- [ ] Sorting works for both modes
- [ ] Pagination works for both modes

### AC4: Backward Compatibility
- [ ] Default behavior unchanged (SKU view)
- [ ] All Epic 33 features work: filters, sorting, date range, campaigns
- [ ] No visual regressions
- [ ] No console errors

### AC5: Mobile Responsive
- [ ] Toggle buttons stack vertically on mobile (< 768px)
- [ ] Table scrolls horizontally on mobile
- [ ] Badge tooltips work on tap (mobile)

## Tasks / Subtasks

### Phase 1: Add State Management (30 min)
- [ ] Open `src/app/(dashboard)/analytics/advertising/page.tsx`
- [ ] Add `groupBy` state variable with `'sku'` default
- [ ] Add URL param sync for `groupBy`
- [ ] Update `useAdvertisingAnalytics` call with `group_by`

### Phase 2: Create Toggle Component (40 min)
- [ ] Create `src/app/(dashboard)/analytics/advertising/components/GroupByToggle.tsx`
- [ ] Implement two-button toggle UI
- [ ] Add click handlers
- [ ] Add responsive styles (mobile stack)
- [ ] Add JSDoc comments

### Phase 3: Integrate Toggle into Page (20 min)
- [ ] Import GroupByToggle into page.tsx
- [ ] Place toggle above table (or in filters - PO decision)
- [ ] Pass `groupBy` and `onGroupByChange` props
- [ ] Verify layout

### Phase 4: Update Table Rendering (50 min)
- [ ] Open `src/app/(dashboard)/analytics/advertising/components/PerformanceMetricsTable.tsx`
- [ ] Update first column rendering logic
- [ ] Add conditional for `type==='merged_group'`
- [ ] Import and use MergedProductBadge
- [ ] Handle `type==='individual'` and undefined cases

### Phase 5: Testing & Verification (60 min)
- [ ] Test toggle switches between modes
- [ ] Test API calls with both `group_by` values
- [ ] Test table rendering for merged groups
- [ ] Test table rendering for individuals
- [ ] Test all Epic 33 features still work
- [ ] Test mobile responsive behavior

## Technical Details

### File 1: Page State Management

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx`

**Line**: After `viewBy` state (~line 76)

```typescript
// Existing state
const [viewBy, setViewBy] = useState<ViewByMode>(() =>
  (searchParams.get('view') as ViewByMode) || 'sku'
)

// Epic 36: NEW - groupBy state
const [groupBy, setGroupBy] = useState<GroupByMode>(() =>
  (searchParams.get('group_by') as GroupByMode) || 'sku'
)
```

**Update API call** (line ~140):

```typescript
const { data, isLoading, error } = useAdvertisingAnalytics({
  from: dateRange.from,
  to: dateRange.to,
  view_by: viewBy,
  group_by: groupBy, // Epic 36: NEW
  // ... existing filters
})
```

**Update URL sync** (in useEffect, line ~220):

```typescript
useEffect(() => {
  const params = new URLSearchParams()
  params.set('from', dateRange.from)
  params.set('to', dateRange.to)
  params.set('view', viewBy)
  params.set('group_by', groupBy) // Epic 36: NEW
  // ... rest of params

  router.push(`?${params.toString()}`, { scroll: false })
}, [dateRange, viewBy, groupBy, /* other deps */])
```

### File 2: GroupByToggle Component (NEW)

**File**: `src/app/(dashboard)/analytics/advertising/components/GroupByToggle.tsx` (NEW)

```typescript
/**
 * GroupByToggle Component (Epic 36)
 *
 * Toggle buttons for switching between SKU and imtId grouping modes.
 */

import { Button } from '@/components/ui/button'
import type { GroupByMode } from '@/types/advertising-analytics'

interface GroupByToggleProps {
  /** Current grouping mode */
  groupBy: GroupByMode
  /** Callback when mode changes */
  onGroupByChange: (mode: GroupByMode) => void
  /** Optional className for styling */
  className?: string
}

export function GroupByToggle({
  groupBy,
  onGroupByChange,
  className,
}: GroupByToggleProps) {
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Button
        variant={groupBy === 'sku' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGroupByChange('sku')}
        aria-pressed={groupBy === 'sku'}
        aria-label="Группировка по артикулам"
      >
        По артикулам
      </Button>
      <Button
        variant={groupBy === 'imtId' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onGroupByChange('imtId')}
        aria-pressed={groupBy === 'imtId'}
        aria-label="Группировка по склейкам"
      >
        По склейкам
      </Button>
    </div>
  )
}
```

### File 3: Table Update

**File**: `src/app/(dashboard)/analytics/advertising/components/PerformanceMetricsTable.tsx`

**Line**: First column rendering (~line 80)

**Before** (Epic 33):
```typescript
<TableCell>
  <span className="font-medium">
    {item.product_name || item.sku_id || 'N/A'}
  </span>
</TableCell>
```

**After** (Epic 36):
```typescript
<TableCell>
  {/* Epic 36: Show merged group badge or product name */}
  {item.type === 'merged_group' && item.mergedProducts ? (
    <div className="flex items-center">
      <span className="font-medium">Группа #{item.imtId}</span>
      <MergedProductBadge
        imtId={item.imtId!}
        mergedProducts={item.mergedProducts}
      />
    </div>
  ) : (
    <span className="font-medium">
      {item.product_name || item.sku_id || 'N/A'}
    </span>
  )}
</TableCell>
```

### File 4: Page Layout Integration

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx`

**Line**: Above table (~line 180)

**Option A: Separate Row** (Recommended)
```typescript
{/* Epic 36: Group By Toggle */}
<div className="flex items-center justify-between mb-4">
  <h3 className="text-sm font-medium text-muted-foreground">
    Группировка
  </h3>
  <GroupByToggle
    groupBy={groupBy}
    onGroupByChange={setGroupBy}
  />
</div>

{/* Existing table */}
<PerformanceMetricsTable ... />
```

**Option B: In Filters Panel**
```typescript
<AdvertisingFilters
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  viewBy={viewBy}
  onViewByChange={setViewBy}
  groupBy={groupBy} // Epic 36: NEW prop
  onGroupByChange={setGroupBy} // Epic 36: NEW prop
  // ... other props
/>
```

**PO Decision Required**: Choose Option A or B

## Testing Checklist

### Functional Tests
- [ ] Toggle switches between "По артикулам" and "По склейкам"
- [ ] API call includes correct `group_by` parameter
- [ ] Table renders merged groups with badges
- [ ] Table renders individual products without badges
- [ ] Badge tooltip shows on hover/tap
- [ ] All products listed in tooltip

### Epic 33 Regression Tests
- [ ] Date range picker works
- [ ] View by mode (SKU/Campaign/Brand/Category) works
- [ ] Efficiency filter works
- [ ] Campaign selector works
- [ ] Sorting works (all columns)
- [ ] Pagination works
- [ ] Summary cards display correctly
- [ ] Sync status indicator works

### URL State Tests
- [ ] `?group_by=imtId` in URL loads merged groups view
- [ ] `?group_by=sku` in URL loads SKU view
- [ ] URL updates when toggle clicked
- [ ] Page refresh preserves groupBy state

### Mobile Tests
- [ ] Toggle buttons stack vertically (< 768px)
- [ ] Table scrolls horizontally
- [ ] Badge tooltips work on tap
- [ ] No layout overflow

### Edge Cases
- [ ] No merged groups (all imtId=null) displays normally
- [ ] Single product with imtId displays without badge
- [ ] Empty data state works for both modes
- [ ] Loading state works for both modes
- [ ] Error state works for both modes

## Dependencies

- **Prerequisites**: Stories 36.1, 36.2, 36.3 complete
- **UI Components**: Button (shadcn/ui) - already available
- **Existing Page**: `src/app/(dashboard)/analytics/advertising/page.tsx`

## Definition of Done

- [ ] GroupByToggle component created
- [ ] Page state management updated
- [ ] Table rendering logic updated
- [ ] All acceptance criteria met
- [ ] Epic 33 functionality unchanged (zero regressions)
- [ ] `npm run test` passes
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] Manual testing complete (all scenarios)
- [ ] Mobile responsive verified
- [ ] Code review approved
- [ ] Story marked DONE

## Notes for PO Review

### Questions for PO

**Q1: Toggle Placement** (CRITICAL - affects UI layout)
Where should the "По артикулам" / "По склейкам" toggle be placed?

- **Option A**: Separate row above table (clearer separation)
  ```
  Группировка: [По артикулам] [По склейкам]
  ─────────────────────────────────────────
  | Table starts here...
  ```

- **Option B**: Inside AdvertisingFilters panel (more compact)
  ```
  [Filters Panel]
    Период: [...] - [...]
    Группировка: [По артикулам] [По склейкам]
  ```

- **Option C**: Page header (next to title)
  ```
  Рекламная аналитика    [По артикулам] [По склейкам]
  ```

**Recommendation**: Option A - clearer visual hierarchy, doesn't overload filters

**PO DECISION**: ✅ **APPROVED - Option A (Separate row above table)** | Date: 2025-12-28 | PO: Sarah

**Q2: Default Mode**
Should default be:
- **Option A**: "По артикулам" (current behavior, less disruptive)
- **Option B**: "По склейкам" (show merged groups by default)

**Recommendation**: Option A (SKU) - users opt-in to new feature, familiar default

**PO DECISION**: ✅ **APPROVED - Option A ("По артикулам" default)** | Date: 2025-12-28 | PO: Sarah

**Q3: Label Text**
Button labels:
- **Option A**: "По артикулам" / "По склейкам" (proposed)
- **Option B**: "SKU" / "Группы" (shorter)
- **Option C**: "Отдельно" / "Вместе" (conceptual)

**Recommendation**: Option A - clear, matches WB terminology

**PO DECISION**: ✅ **APPROVED - Option A ("По артикулам" / "По склейкам")** | Date: 2025-12-28 | PO: Sarah

**Q4: URL Parameter Name**
URL parameter:
- **Option A**: `?group_by=imtId` (matches backend)
- **Option B**: `?groupBy=imtId` (camelCase)
- **Option C**: `?mode=merged` (different naming)

**Recommendation**: Option A - consistent with backend API

**PO DECISION**: ✅ **APPROVED - Option A (?group_by=imtId snake_case)** | Date: 2025-12-28 | PO: Sarah

**Q5: Mobile Behavior**
On mobile (< 768px):
- **Option A**: Buttons stack vertically (full width each)
- **Option B**: Buttons stay side-by-side (smaller text)
- **Option C**: Dropdown select instead of buttons

**Recommendation**: Option A - touch-friendly, clear labels

**PO DECISION**: ✅ **APPROVED - Option A (Stack vertically, full width)** | Date: 2025-12-28 | PO: Sarah

### Estimated Time

**Total**: 200 minutes (3.3 hours)
- Phase 1: 30 min (state)
- Phase 2: 40 min (toggle component)
- Phase 3: 20 min (integrate toggle)
- Phase 4: 50 min (table update)
- Phase 5: 60 min (testing)

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Epic 33 regression | Medium | High | Comprehensive regression testing |
| State management bugs | Low | Medium | URL params persist state |
| Mobile layout issues | Low | Low | Responsive testing on 3 devices |
| Performance degradation | Low | Low | React Query caching handles this |

---

**Document Version**: 1.1
**Created**: 2025-12-28
**Status**: ✅ **APPROVED - Ready for Development**
**PO Approval**: Sarah | 2025-12-28 22:45 MSK
**Dependencies**: Stories 36.1, 36.2, 36.3
**Next Action**: Developer begins implementation after Stories 36.1-36.3 complete
