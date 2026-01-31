# Story 62.1-FE: Redesign Dashboard Metrics Grid (8 Cards)

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: Ready for Dev
**Priority**: P0 (Critical)
**Estimate**: 3 SP

---

## Title (RU)

Редизайн сетки метрик дашборда (8 карточек)

---

## Description

Redesign the dashboard layout from the current 6-card grid to an 8-card grid displaying all required business metrics. This component serves as the container for all metric cards and handles responsive grid layout, loading states, and proper card ordering based on business priority.

The grid must accommodate all 8 business metrics:
1. Заказы (Orders volume)
2. COGS по заказам (COGS for orders)
3. Выкупы (Sales/Redemptions)
4. COGS по выкупам (COGS for sales)
5. Рекламные затраты (Advertising spend)
6. Логистика (Logistics costs)
7. Хранение (Storage costs)
8. Теор. прибыль (Theoretical profit) - Highlighted card

---

## Acceptance Criteria

- [ ] Create `DashboardMetricsGrid` component with 8-card layout
- [ ] Responsive grid: 4 cols on xl (>=1280px), 2 cols on md (>=768px), 1 col on sm (<768px)
- [ ] Card order matches business priority (see Grid Layout below)
- [ ] Loading skeletons for all 8 cards with proper sizing
- [ ] Cards use consistent sizing (equal height in each row)
- [ ] Hover states for interactive cards (shadow elevation)
- [ ] "Теор. прибыль" card visually highlighted (border accent)
- [ ] Keyboard navigation support (tab order)
- [ ] ARIA labels for accessibility (Russian text)

---

## Design Specifications

### Grid Layout

**Desktop (xl: 4 columns, >=1280px)**:
```
+-------------+-------------+-------------+-------------+
|   Заказы    |COGS заказов |   Выкупы    |COGS выкупов |
+-------------+-------------+-------------+-------------+
|  Реклама    |  Логистика  |  Хранение   |Теор.прибыль*|
+-------------+-------------+-------------+-------------+
* Highlighted card
```

**Tablet (md: 2 columns, 768px-1279px)**:
```
+--------------------+--------------------+
|      Заказы        |   COGS заказов     |
+--------------------+--------------------+
|      Выкупы        |   COGS выкупов     |
+--------------------+--------------------+
|      Реклама       |    Логистика       |
+--------------------+--------------------+
|      Хранение      |   Теор.прибыль*    |
+--------------------+--------------------+
```

**Mobile (sm: 1 column, <768px)**:
```
+--------------------+
|      Заказы        |
+--------------------+
|   COGS заказов     |
+--------------------+
|      Выкупы        |
+--------------------+
|   COGS выкупов     |
+--------------------+
|      Реклама       |
+--------------------+
|    Логистика       |
+--------------------+
|      Хранение      |
+--------------------+
|   Теор.прибыль*    |
+--------------------+
```

### Spacing

| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Grid gap | 16px | `gap-4` |
| Card padding | 16px | `p-4` |
| Section margin | 24px | `mb-6` |

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Card background | White | `#FFFFFF` |
| Card border | Light gray | `#EEEEEE` |
| Card hover border | Primary | `#E53935` |
| Profit card border | Blue (positive) / Red (negative) | `#3B82F6` / `#EF4444` |
| Skeleton | Light gray | `#F5F5F5` |

### Typography

| Element | Size | Weight |
|---------|------|--------|
| Loading skeleton title | 14px | Medium |
| Loading skeleton value | 32px | Bold |

---

## Technical Implementation

### Component Structure

```
src/components/custom/dashboard/
  DashboardMetricsGrid.tsx      <- Main grid container
  DashboardMetricsGridSkeleton.tsx  <- Loading skeleton grid
  index.ts                       <- Barrel export
```

### Props Interface

```typescript
interface DashboardMetricsGridProps {
  // Data from Epic 61-FE hooks
  ordersData: OrdersVolumeData | undefined;
  ordersCogsData: number | undefined;
  salesData: FinanceSummary | undefined;
  advertisingSpend: number | undefined;
  theoreticalProfit: TheoreticalProfitResult | undefined;

  // Comparison data
  previousPeriodData: PreviousPeriodData | undefined;

  // States
  isLoading: boolean;
  error: Error | null;

  // Optional
  className?: string;
}

interface PreviousPeriodData {
  ordersAmount: number | null;
  ordersCogs: number | null;
  salesAmount: number | null;
  salesCogs: number | null;
  advertisingSpend: number | null;
  logisticsCost: number | null;
  storageCost: number | null;
  theoreticalProfit: number | null;
}
```

### Tailwind Grid Configuration

```typescript
const gridClasses = cn(
  'grid gap-4',
  'grid-cols-1',           // Mobile: 1 column
  'md:grid-cols-2',        // Tablet: 2 columns
  'xl:grid-cols-4',        // Desktop: 4 columns
);
```

### Dependencies

| Hook | Source | Purpose |
|------|--------|---------|
| `useOrdersVolume` | Story 61.3-FE | Orders volume data |
| `useOrdersCogs` | Story 61.4-FE | COGS for orders |
| `useFinancialSummary` | Existing (modified 61.2) | Sales, expenses |
| `useAdvertisingAnalytics` | Existing (modified 61.8) | Ad spend |
| `calculateTheoreticalProfit` | Story 61.10-FE | Profit calculation |
| `useAnalyticsComparison` | Story 61.5-FE | Period comparison |

### Skeleton Component

```typescript
function DashboardMetricsGridSkeleton() {
  return (
    <div className={gridClasses}>
      {Array.from({ length: 8 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/custom/dashboard/DashboardMetricsGrid.tsx` | CREATE | Main grid container component |
| `src/components/custom/dashboard/DashboardMetricsGridSkeleton.tsx` | CREATE | Loading skeleton for grid |
| `src/components/custom/dashboard/index.ts` | CREATE | Barrel export for dashboard components |
| `src/app/(dashboard)/dashboard/components/DashboardContent.tsx` | MODIFY | Replace 6-card grid with DashboardMetricsGrid |

---

## Component Usage Example

```tsx
// In DashboardContent.tsx
import { DashboardMetricsGrid } from '@/components/custom/dashboard';

function DashboardContent() {
  const { periodRange } = useDashboardPeriod();

  const { data: ordersData, isLoading: ordersLoading } = useOrdersVolume(periodRange);
  const { data: ordersCogsData, isLoading: cogsLoading } = useOrdersCogs(periodRange);
  const { data: salesData, isLoading: salesLoading } = useFinancialSummary(periodRange);
  const { data: advertisingData } = useAdvertisingAnalytics(periodRange);
  const { data: comparisonData } = useAnalyticsComparison(periodRange);

  const theoreticalProfit = useMemo(() =>
    calculateTheoreticalProfit({
      ordersAmount: ordersData?.total_amount ?? 0,
      cogs: ordersCogsData ?? 0,
      advertisingSpend: advertisingData?.total_spend ?? 0,
      logisticsCost: salesData?.logistics_cost ?? 0,
      storageCost: salesData?.storage_cost ?? 0,
    }),
    [ordersData, ordersCogsData, advertisingData, salesData]
  );

  const isLoading = ordersLoading || cogsLoading || salesLoading;

  return (
    <DashboardMetricsGrid
      ordersData={ordersData}
      ordersCogsData={ordersCogsData}
      salesData={salesData}
      advertisingSpend={advertisingData?.total_spend}
      theoreticalProfit={theoreticalProfit}
      previousPeriodData={comparisonData?.period2}
      isLoading={isLoading}
      error={null}
    />
  );
}
```

---

## Accessibility Requirements

- Grid container: `role="region"` with `aria-label="Ключевые показатели"`
- Each card: `role="article"` with descriptive `aria-label`
- Loading state: `aria-busy="true"` on container
- Tab navigation: Natural DOM order follows visual order
- Focus indicators: 2px ring with primary color on focus

---

## Testing Checklist

- [ ] Grid displays 8 cards in correct order
- [ ] Responsive layout works at all breakpoints (sm, md, xl)
- [ ] Loading skeletons display correctly
- [ ] Error state displays message
- [ ] Keyboard navigation works
- [ ] Screen reader announces grid purpose
- [ ] Cards have equal height in same row
- [ ] Hover states work on desktop

---

## Definition of Done

- [ ] Component renders correctly with all 8 cards
- [ ] Responsive on all breakpoints (mobile/tablet/desktop)
- [ ] Loading/error states handled
- [ ] WCAG 2.1 AA compliant
- [ ] TypeScript strict mode passes
- [ ] File under 200 lines
- [ ] No ESLint errors
- [ ] Code review approved

---

## Dependencies (Blocking)

This story can start immediately as it focuses on layout structure. However, full functionality requires:

- Story 61.3-FE (useOrdersVolume) - for orders data
- Story 61.4-FE (useOrdersCogs) - for COGS data
- Story 61.5-FE (useAnalyticsComparison) - for comparison data
- Story 61.10-FE (calculateTheoreticalProfit) - for profit calculation

**Recommendation**: Implement with mock data initially, then integrate real hooks as they become available.

---

## References

- Epic 62-FE: `docs/epics/epic-62-fe-dashboard-presentation.md`
- Wireframe: `docs/wireframes/dashboard-kpi-cards.md`
- Design System: `docs/front-end-spec.md`
- Epic 61-FE (Data Layer): `docs/epics/epic-61-fe-dashboard-data-integration.md`

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)
