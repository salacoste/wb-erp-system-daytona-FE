# Story 33.2-FE: Advertising Analytics Page Layout

## Story Info

- **Epic**: 33-FE - Advertising Analytics (Frontend)
- **Priority**: High
- **Points**: 5
- **Status**: ✅ Ready

## User Story

**As a** seller,
**I want** a dedicated page for advertising analytics,
**So that** I can see my advertising performance at a glance.

## Acceptance Criteria

### AC1: Route & Navigation
- [ ] Page accessible at `/analytics/advertising`
- [ ] Sidebar shows "Реклама" under "Аналитика" section
- [ ] Breadcrumbs: `Главная > Аналитика > Реклама`

### AC2: Page Header
- [ ] Title: "Рекламная аналитика"
- [ ] Icon: Lucide `Megaphone` or `BarChart3`
- [ ] Sync status indicator in header (from 33.6-fe)

### AC3: Date Range Filter
- [ ] From/To date pickers
- [ ] **Default: last 14 days** (PO decision: standard two-week period)
- [ ] Validation: `to` >= `from`
- [ ] Max range: 90 days (TBD: confirm with backend if API has limit)

### AC4: View Mode Toggle
- [ ] Switch between: SKU | Campaign | Brand | Category
- [ ] Default: SKU
- [ ] Persist selection in URL query params

### AC5: Summary Cards
- [ ] Card 1: Total Spend (₽)
- [ ] Card 2: Overall ROAS (x multiplier)
- [ ] Card 3: Overall ROI (%)
- [ ] Card 4: Active Campaigns (count)
- [ ] Loading skeleton state
- [ ] Error state with retry

### AC6: Page Layout
- [ ] Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Sections: Header → Filters → Summary Cards → Table
- [ ] Max width: 1400px centered

### AC7: Empty State
- [ ] When no data for selected period, show empty state
- [ ] Message: "Нет данных за выбранный период"
- [ ] Suggestion: "Попробуйте выбрать другой период или проверьте, есть ли рекламные кампании"
- [ ] Include illustration (TBD by UX)

### AC8: Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader support (aria-labels on cards and filters)

## Tasks / Subtasks

### Phase 1: Route Setup
- [ ] Create `src/app/(dashboard)/analytics/advertising/page.tsx`
- [ ] Create `src/app/(dashboard)/analytics/advertising/loading.tsx`
- [ ] Create `src/app/(dashboard)/analytics/advertising/error.tsx`
- [ ] Add route to sidebar navigation

### Phase 2: Page Components
- [ ] Create `components/AdvertisingPageHeader.tsx`
- [ ] Create `components/AdvertisingFilters.tsx`
- [ ] Create `components/AdvertisingSummaryCards.tsx`

### Phase 3: State Management
- [ ] Implement URL query param sync for filters
- [ ] Add date range state with validation
- [ ] Add view mode state

### Phase 4: Integration
- [ ] Connect to `useAdvertisingAnalytics` hook
- [ ] Handle loading states
- [ ] Handle error states

## Technical Details

### Page Component Structure

```typescript
// src/app/(dashboard)/analytics/advertising/page.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdvertisingPageHeader } from './components/AdvertisingPageHeader';
import { AdvertisingFilters } from './components/AdvertisingFilters';
import { AdvertisingSummaryCards } from './components/AdvertisingSummaryCards';
import { PerformanceMetricsTable } from './components/PerformanceMetricsTable';
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics';

export default function AdvertisingAnalyticsPage() {
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState({
    from: getDefaultFromDate(),
    to: getDefaultToDate(),
  });

  const [viewBy, setViewBy] = useState<ViewByMode>(
    (searchParams.get('view') as ViewByMode) || 'sku'
  );

  const { data, isLoading, error } = useAdvertisingAnalytics({
    from: dateRange.from,
    to: dateRange.to,
    view_by: viewBy,
  });

  return (
    <div className="space-y-6">
      <AdvertisingPageHeader />
      <AdvertisingFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        viewBy={viewBy}
        onViewByChange={setViewBy}
      />
      <AdvertisingSummaryCards
        summary={data?.summary}
        isLoading={isLoading}
      />
      <PerformanceMetricsTable
        data={data?.data}
        viewBy={viewBy}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Summary Cards Layout

```typescript
// 4 cards: Spend, ROAS, ROI, Active Campaigns
const summaryCards = [
  {
    label: 'Затраты на рекламу',
    value: formatCurrency(summary.total_spend),
    icon: Wallet,
    color: 'text-blue-600',
  },
  {
    label: 'Общий ROAS',
    value: `${summary.overall_roas.toFixed(1)}x`,
    icon: TrendingUp,
    color: getRoasColor(summary.overall_roas),
  },
  {
    label: 'Общий ROI',
    value: formatPercent(summary.overall_roi),
    icon: Percent,
    color: getRoiColor(summary.overall_roi),
  },
  {
    label: 'Активных кампаний',
    value: summary.active_campaigns.toString(),
    icon: Target,
    subtext: `из ${summary.campaign_count}`,
  },
];
```

### View Mode Toggle

```typescript
<Tabs value={viewBy} onValueChange={(v) => setViewBy(v as ViewByMode)}>
  <TabsList>
    <TabsTrigger value="sku">По товарам</TabsTrigger>
    <TabsTrigger value="campaign">По кампаниям</TabsTrigger>
    <TabsTrigger value="brand">По брендам</TabsTrigger>
    <TabsTrigger value="category">По категориям</TabsTrigger>
  </TabsList>
</Tabs>
```

## Dev Notes

### File Structure

```
src/app/(dashboard)/analytics/advertising/
├── page.tsx                        # Main page
├── loading.tsx                     # Skeleton loader
├── error.tsx                       # Error boundary
└── components/
    ├── AdvertisingPageHeader.tsx   # Title + breadcrumbs
    ├── AdvertisingFilters.tsx      # Date range + view toggle
    └── AdvertisingSummaryCards.tsx # 4 metric cards
```

### Sidebar Update

Add to `src/components/layout/Sidebar.tsx`:

```typescript
{
  label: 'Реклама',
  href: '/analytics/advertising',
  icon: Megaphone,  // or BarChart3
}
```

### Default Date Range (PO Decision: 14 days)

```typescript
function getDefaultFromDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 14);  // 14 days ago (PO decision)
  return format(date, 'yyyy-MM-dd');
}

function getDefaultToDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);  // Yesterday (sync delay)
  return format(date, 'yyyy-MM-dd');
}
```

## Testing

### Test Cases

- [ ] Page renders without errors
- [ ] Route `/analytics/advertising` is accessible
- [ ] Sidebar link works
- [ ] Date range picker works
- [ ] View mode toggle works
- [ ] Summary cards show loading state
- [ ] Summary cards show data
- [ ] Error state renders with retry button
- [ ] Mobile responsive layout

## Definition of Done

- [ ] Page accessible at `/analytics/advertising`
- [ ] Sidebar navigation updated
- [ ] All components created (<200 lines each)
- [ ] Loading and error states work
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Mobile responsive

## Dependencies

- Story 33.1-fe: Types & API Client (for hooks)
- Existing components: DatePicker, Tabs, Card

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft |
| 2025-12-22 | James (Dev Agent) | PO Review: Changed default to 14 days, added AC7 (empty state), AC8 (a11y) |

---

## Dev Agent Record

```
Status: ✅ Complete
Agent: James (Dev)
Started: 2025-12-22
Completed: 2025-12-22
Notes: All phases complete. Page layout implemented with all components.
       ESLint and TypeScript checks pass.
       Files created:
       - src/app/(dashboard)/analytics/advertising/page.tsx
       - src/app/(dashboard)/analytics/advertising/loading.tsx
       - src/app/(dashboard)/analytics/advertising/error.tsx
       - src/app/(dashboard)/analytics/advertising/components/AdvertisingPageHeader.tsx
       - src/app/(dashboard)/analytics/advertising/components/AdvertisingFilters.tsx
       - src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx
       Updated:
       - src/lib/routes.ts (added ADVERTISING route)
       - src/components/custom/Sidebar.tsx (added Реклама nav item)
```
