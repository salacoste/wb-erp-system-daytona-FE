# Story 60.8-FE: Улучшить состояния загрузки и пустые состояния

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Status**: ✅ Completed
**Story Points**: 2 SP
**Priority**: P2
**Depends On**: Stories 60.1, 60.3, 60.4

---

## User Story

**As a** dashboard user,
**I want** smooth loading transitions and helpful empty states,
**So that** I understand when data is loading and why data might be missing.

---

## Acceptance Criteria

- [ ] **AC1**: MetricCardEnhanced shows skeleton loader during period switch (not spinner)
- [ ] **AC2**: Metric values animate on change (fade transition, 200ms duration)
- [ ] **AC3**: TrendGraph shows illustration + helpful message for weeks with no data
- [ ] **AC4**: ExpenseChart shows loading shimmer effect during data refetch
- [ ] **AC5**: Empty state message is "Нет данных за этот период" (not generic error)
- [ ] **AC6**: All loading states maintain layout stability (no content shift)
- [ ] **AC7**: Skeleton loaders match the exact dimensions of content they replace

---

## Technical Specifications

### 1. MetricCard Skeleton Loader

**File**: `src/components/custom/MetricCardEnhanced.tsx`

```typescript
interface MetricCardEnhancedProps {
  title: string
  value: number
  previousValue?: number
  format: 'currency' | 'percentage' | 'number'
  isLoading?: boolean
  icon?: React.ReactNode
}

export function MetricCardEnhanced({
  title,
  value,
  previousValue,
  format,
  isLoading,
  icon,
}: MetricCardEnhancedProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon && <Skeleton className="h-5 w-5 rounded" />}
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </Card>
    )
  }

  return (
    <Card className="p-4">
      {/* Animated content */}
      <motion.div
        key={value}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* ... content ... */}
      </motion.div>
    </Card>
  )
}
```

### 2. Value Transition Animation

**Option A: CSS Transition (Preferred - No additional dependency)**

```typescript
// Using CSS classes for fade transition
<div className="transition-opacity duration-200">
  <span className="text-2xl font-bold">{formattedValue}</span>
</div>
```

**Option B: Key-based re-render for fade effect**

```typescript
// Force re-mount with key change for natural fade
<div key={`${value}-${previousValue}`} className="animate-in fade-in duration-200">
  <span className="text-2xl font-bold">{formattedValue}</span>
</div>
```

### 3. TrendGraph Empty State

**File**: `src/components/custom/TrendGraph.tsx`

```typescript
interface TrendGraphProps {
  data: TrendDataPoint[]
  isLoading?: boolean
}

export function TrendGraph({ data, isLoading }: TrendGraphProps) {
  if (isLoading) {
    return <TrendGraphSkeleton />
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          {/* Empty state illustration */}
          <div className="w-24 h-24 mb-4 text-muted-foreground">
            <ChartBarIcon className="w-full h-full opacity-20" />
          </div>
          <h3 className="text-lg font-medium mb-2">Нет данных за этот период</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Выберите другой период или дождитесь обновления данных
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Chart content */}
    </Card>
  )
}
```

### 4. ExpenseChart Loading Shimmer

**File**: `src/components/custom/ExpenseChart.tsx`

```typescript
function ExpenseChartSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-5 w-32 mb-4" /> {/* Title */}
      <div className="flex items-end gap-2 h-48">
        {/* Bar skeletons with varying heights */}
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-40" />
        <Skeleton className="w-full h-20" />
        <Skeleton className="w-full h-36" />
      </div>
      <div className="flex justify-between mt-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
    </Card>
  )
}

export function ExpenseChart({ data, isLoading }: ExpenseChartProps) {
  if (isLoading) {
    return <ExpenseChartSkeleton />
  }

  // ... chart rendering
}
```

### 5. Layout Stability Requirements

**Critical**: Skeleton loaders must match content dimensions exactly

```typescript
// Skeleton dimensions should match actual content
const METRIC_CARD_HEIGHT = 120 // Match card height
const CHART_HEIGHT = 300       // Match chart container height

// Use min-height on containers
<Card className="min-h-[120px]">
  {/* Content or skeleton */}
</Card>
```

---

## Component Files to Modify

| File | Change | Lines Est. |
|------|--------|------------|
| `src/components/custom/MetricCardEnhanced.tsx` | Add skeleton + animation | +40 |
| `src/components/custom/TrendGraph.tsx` | Add empty state illustration | +30 |
| `src/components/custom/ExpenseChart.tsx` | Add shimmer skeleton | +35 |

---

## Visual Design

### Skeleton Loader Style
- Background: `bg-muted` (gray-100)
- Animation: `animate-pulse` (subtle pulse, not shimmer)
- Border radius: Match content (rounded for cards, rounded-full for avatars)

### Empty State Style
- Icon: Muted color (`text-muted-foreground`, 20% opacity)
- Title: `text-lg font-medium`
- Description: `text-sm text-muted-foreground`
- Max width: `max-w-xs` for readable text

### Animation Timing
- Fade duration: 200ms
- Easing: `ease-out`
- No jarring transitions

---

## Test Scenarios

### Unit Tests

**File**: `src/components/custom/__tests__/MetricCardEnhanced.loading.test.tsx`

1. **Test: Shows skeleton when isLoading=true**
   - Render with `isLoading={true}`
   - Verify Skeleton components are present
   - Verify actual content is NOT rendered

2. **Test: Shows content when isLoading=false**
   - Render with `isLoading={false}` and data
   - Verify content is displayed
   - Verify Skeleton components are NOT present

3. **Test: Transition animation on value change**
   - Render with initial value
   - Re-render with new value
   - Verify animation class is applied

4. **Test: Layout stability during loading**
   - Measure skeleton container dimensions
   - Measure content container dimensions
   - Verify they match (within 2px tolerance)

**File**: `src/components/custom/__tests__/TrendGraph.empty.test.tsx`

5. **Test: Shows empty state for empty data array**
   - Render with `data={[]}`
   - Verify empty state message: "Нет данных за этот период"
   - Verify illustration icon is present

6. **Test: Shows empty state for null/undefined data**
   - Render with `data={null}`
   - Verify empty state is shown

7. **Test: Shows chart for valid data**
   - Render with valid data array
   - Verify chart is rendered
   - Verify empty state is NOT shown

**File**: `src/components/custom/__tests__/ExpenseChart.loading.test.tsx`

8. **Test: Shows shimmer skeleton when loading**
   - Render with `isLoading={true}`
   - Verify multiple Skeleton elements present
   - Verify varying heights (bar chart visual)

9. **Test: Transitions smoothly from loading to content**
   - Start with loading state
   - Update to loaded state
   - Verify no layout shift (CLS = 0)

---

## Accessibility Requirements

- [ ] Skeleton loaders have `aria-hidden="true"` (decorative)
- [ ] Loading state announced with `aria-busy="true"` on container
- [ ] Empty state icon has `aria-hidden="true"`
- [ ] Empty state text is readable by screen readers
- [ ] Animations respect `prefers-reduced-motion`

### Reduced Motion Support

```typescript
const shouldReduceMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
>
```

---

## Definition of Done

- [ ] All 7 acceptance criteria met
- [ ] MetricCardEnhanced shows skeleton on loading
- [ ] TrendGraph shows empty state with illustration
- [ ] ExpenseChart shows shimmer skeleton
- [ ] Value animations implemented
- [ ] Layout stability verified (no content shift)
- [ ] Reduced motion support added
- [ ] Unit tests written and passing (9+ test cases)
- [ ] TypeScript strict mode passes
- [ ] Code review approved

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `shadcn/ui Skeleton` | Component | ✅ Available |
| `framer-motion` (optional) | npm package | Optional |
| `lucide-react` icons | npm package | ✅ Installed |
| `MetricCardEnhanced` | Story 60.3 | 📋 Ready |
| `useDashboardPeriod` | Story 60.1 | 📋 Ready |

---

## Non-Goals

- Complex animation sequences
- Loading progress percentage
- Retry buttons (handled at page level)
- Custom skeleton shapes beyond rectangles

---

**Created**: 2026-01-29
