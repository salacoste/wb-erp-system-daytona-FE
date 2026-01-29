# Story 51.8-FE: FBS Orders Analytics Page

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 5 (Mar 31 - Apr 11)
- **Priority**: P1 (Core Feature)
- **Points**: 5 SP
- **Status**: Ready for Dev
- **Dependencies**: Stories 51.3-51.7 (All analytics components)

---

## User Story

**As a** WB seller analyzing my FBS order performance,
**I want** a unified analytics page with all FBS insights,
**So that** I can access trends, seasonal patterns, and period comparisons in one place.

---

## Background

This story implements the main FBS Orders Analytics page that integrates all previously built components into a cohesive experience. The page provides:
- Tab navigation between three analytics views (Trends, Seasonal, Comparison)
- Shared date range picker that applies to Trends and Seasonal tabs
- URL synchronization for active tab state
- Proper loading and error handling per tab

**Route**: `/analytics/orders`

---

## Acceptance Criteria

### AC1: Page Structure

- [ ] Page title: "Аналитика заказов FBS"
- [ ] Page header with shared date range picker
- [ ] Three-tab navigation below header
- [ ] Active tab content renders below tabs
- [ ] Consistent card styling across all tabs

### AC2: Tab Navigation

- [ ] Three tabs with Russian labels:
  - "Тренды" (Trends) - default active
  - "Сезонность" (Seasonal)
  - "Сравнение" (Comparison)
- [ ] Tab icons for visual distinction
- [ ] Active tab visually highlighted
- [ ] Keyboard navigation between tabs (arrow keys)
- [ ] ARIA labels for accessibility

### AC3: URL Synchronization

- [ ] URL reflects active tab: `?tab=trends|seasonal|comparison`
- [ ] Default tab (trends) doesn't require query param
- [ ] Browser back/forward navigation works
- [ ] Direct URL access works (e.g., `/analytics/orders?tab=seasonal`)
- [ ] Invalid tab values fall back to trends

### AC4: Trends Tab Content

- [ ] Integrates `FbsTrendsChart` component (Story 51.4)
- [ ] Integrates `TrendsSummaryCards` component (Story 51.5)
- [ ] Uses shared date range from header
- [ ] Chart renders above summary cards

### AC5: Seasonal Tab Content

- [ ] Integrates `SeasonalPatternsChart` component (Story 51.6)
- [ ] Uses period from shared date range
- [ ] Shows monthly/weekly/quarterly patterns
- [ ] Displays seasonality insights

### AC6: Comparison Tab Content

- [ ] Integrates `PeriodComparisonPanel` component (Story 51.7)
- [ ] Has its own period selectors (independent of header)
- [ ] Hides shared date picker when this tab active

### AC7: Date Range Picker

- [ ] Uses `DateRangePickerExtended` (Story 51.3)
- [ ] Positioned in page header, right-aligned
- [ ] Default range: last 30 days
- [ ] Updates Trends and Seasonal tabs on change
- [ ] Hidden when Comparison tab is active

### AC8: Loading States

- [ ] Page-level loading skeleton on initial load
- [ ] Tab-specific loading skeletons
- [ ] Smooth transitions between tabs
- [ ] No flash of loading state on tab switch

### AC9: Error Handling

- [ ] Per-tab error states
- [ ] Retry buttons in error states
- [ ] Error doesn't affect other tabs
- [ ] Graceful degradation

### AC10: Responsive Design

- [ ] Full-width on mobile
- [ ] Tabs stack or scroll horizontally on mobile
- [ ] Date picker adapts to screen size
- [ ] Card grid adjusts to viewport

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Аналитика заказов FBS                    📅 01.01.2026 — 28.01.2026 [▼]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐             │
│ │ 📈 Тренды        │ │ 🌡️ Сезонность    │ │ ⚖️ Сравнение     │             │
│ │    [ACTIVE]      │ │                  │ │                  │             │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │                    [Tab Content Area]                                 │ │
│  │                                                                       │ │
│  │  TRENDS TAB:                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                   FbsTrendsChart                                 │ │ │
│  │  │              (Line chart with 3 metrics)                         │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                        │ │
│  │  │ Total  │ │ Avg/day│ │ Cancel │ │ Return │  TrendsSummaryCards    │ │
│  │  │ 3,300  │ │  110   │ │  4.9%  │ │  2.8%  │                        │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘                        │ │
│  │                                                                       │ │
│  │  SEASONAL TAB (when selected):                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ [Monthly] [Weekly] [Quarterly]                                  │ │ │
│  │  │                SeasonalPatternsChart                            │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Peak: December | Low: August | Index: 0.35                      │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  COMPARISON TAB (when selected):                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                  PeriodComparisonPanel                          │ │ │
│  │  │   (Has its own period selectors, no header date picker)         │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Page Structure

```
src/app/(dashboard)/analytics/orders/
├── page.tsx                 # Main page component
├── loading.tsx              # Loading skeleton
├── error.tsx                # Error boundary
└── components/
    ├── FbsTrendsChart.tsx        # (Story 51.4)
    ├── TrendsSummaryCards.tsx    # (Story 51.5)
    ├── SeasonalPatternsChart.tsx # (Story 51.6)
    ├── PeriodComparisonPanel.tsx # (Story 51.7)
    ├── AnalyticsPageHeader.tsx   # New - Header with date picker
    ├── AnalyticsTabContent.tsx   # New - Tab content switcher
    ├── TrendsTabContent.tsx      # New - Trends tab wrapper
    ├── SeasonalTabContent.tsx    # New - Seasonal tab wrapper
    └── ...other components from previous stories
```

---

## Components to Create

| File | Lines (Est.) | Description |
|------|--------------|-------------|
| `page.tsx` | ~100 | Main page with tabs and routing |
| `loading.tsx` | ~30 | Page-level loading skeleton |
| `AnalyticsPageHeader.tsx` | ~50 | Header with title and date picker |
| `AnalyticsTabContent.tsx` | ~80 | Tab content switcher component |
| `TrendsTabContent.tsx` | ~40 | Trends tab wrapper |
| `SeasonalTabContent.tsx` | ~40 | Seasonal tab wrapper |

**Total**: ~340 lines for new components (reuses ~1000 lines from Stories 51.3-51.7)

---

## Technical Implementation

### page.tsx

```typescript
// src/app/(dashboard)/analytics/orders/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TrendingUp, Sun, Scale } from 'lucide-react'
import { AnalyticsPageHeader } from './components/AnalyticsPageHeader'
import { TrendsTabContent } from './components/TrendsTabContent'
import { SeasonalTabContent } from './components/SeasonalTabContent'
import { PeriodComparisonPanel } from './components/PeriodComparisonPanel'
import { subDays, format } from 'date-fns'

type TabValue = 'trends' | 'seasonal' | 'comparison'

const VALID_TABS: TabValue[] = ['trends', 'seasonal', 'comparison']

const TAB_CONFIG = [
  { value: 'trends' as const, label: 'Тренды', icon: TrendingUp },
  { value: 'seasonal' as const, label: 'Сезонность', icon: Sun },
  { value: 'comparison' as const, label: 'Сравнение', icon: Scale },
]

export default function FbsOrdersAnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse tab from URL
  const tabParam = searchParams.get('tab')
  const initialTab: TabValue = VALID_TABS.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : 'trends'

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  // Shared date range for Trends and Seasonal tabs
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 29), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  })

  // Sync URL with tab state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeTab === 'trends') {
      params.delete('tab')
    } else {
      params.set('tab', activeTab)
    }
    const newUrl = params.toString()
      ? `?${params.toString()}`
      : '/analytics/orders'
    router.replace(newUrl, { scroll: false })
  }, [activeTab, router, searchParams])

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (VALID_TABS.includes(value as TabValue)) {
      setActiveTab(value as TabValue)
    }
  }

  // Show date picker only for trends and seasonal tabs
  const showDatePicker = activeTab !== 'comparison'

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showDatePicker={showDatePicker}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <TrendsTabContent from={dateRange.from} to={dateRange.to} />
        </TabsContent>

        <TabsContent value="seasonal" className="mt-6">
          <SeasonalTabContent from={dateRange.from} to={dateRange.to} />
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <PeriodComparisonPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### loading.tsx

```typescript
// src/app/(dashboard)/analytics/orders/loading.tsx

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function FbsAnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-64" />
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full max-w-md" />

      {/* Content skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### AnalyticsPageHeader.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/AnalyticsPageHeader.tsx

import { DateRangePickerExtended } from '@/components/custom/date-range-picker-extended'

interface DateRange {
  from: string
  to: string
}

interface AnalyticsPageHeaderProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  showDatePicker: boolean
}

export function AnalyticsPageHeader({
  dateRange,
  onDateRangeChange,
  showDatePicker,
}: AnalyticsPageHeaderProps) {
  // Convert string dates to Date objects for picker
  const pickerValue = {
    from: new Date(dateRange.from),
    to: new Date(dateRange.to),
  }

  const handleDateChange = (range: { from: Date; to: Date } | undefined) => {
    if (range) {
      onDateRangeChange({
        from: range.from.toISOString().split('T')[0],
        to: range.to.toISOString().split('T')[0],
      })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Аналитика заказов FBS
        </h1>
        <p className="text-muted-foreground">
          Исторические тренды, сезонность и сравнение периодов
        </p>
      </div>

      {showDatePicker && (
        <DateRangePickerExtended
          value={pickerValue}
          onChange={handleDateChange}
          maxDays={365}
          showAggregationSuggestion={false}
        />
      )}
    </div>
  )
}
```

### TrendsTabContent.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/TrendsTabContent.tsx

import { FbsTrendsChart } from './FbsTrendsChart'
import { TrendsSummaryCards } from './TrendsSummaryCards'

interface TrendsTabContentProps {
  from: string
  to: string
}

export function TrendsTabContent({ from, to }: TrendsTabContentProps) {
  return (
    <div className="space-y-6">
      <FbsTrendsChart from={from} to={to} />
      <TrendsSummaryCards from={from} to={to} />
    </div>
  )
}
```

### SeasonalTabContent.tsx

```typescript
// src/app/(dashboard)/analytics/orders/components/SeasonalTabContent.tsx

import { SeasonalPatternsChart } from './SeasonalPatternsChart'
import { SeasonalInsightsCard } from './SeasonalInsightsCard'
import { differenceInDays } from 'date-fns'

interface SeasonalTabContentProps {
  from: string
  to: string
}

export function SeasonalTabContent({ from, to }: SeasonalTabContentProps) {
  // Calculate months for seasonal API
  const days = differenceInDays(new Date(to), new Date(from))
  const months = Math.min(12, Math.max(1, Math.ceil(days / 30)))

  return (
    <div className="space-y-6">
      <SeasonalPatternsChart months={months} />
      <SeasonalInsightsCard months={months} />
    </div>
  )
}
```

---

## Route Configuration

Add route to `src/lib/routes.ts`:

```typescript
export const ROUTES = {
  // ... existing routes
  ANALYTICS: {
    // ... existing
    ORDERS: '/analytics/orders',
  },
}
```

---

## Tasks / Subtasks

### Phase 1: Page Setup (1 SP)

- [ ] Create page directory structure
- [ ] Create `page.tsx` with basic layout
- [ ] Create `loading.tsx` skeleton
- [ ] Add route to routes config

### Phase 2: Tab Navigation (1.5 SP)

- [ ] Implement tab structure with Tabs component
- [ ] Add URL synchronization with searchParams
- [ ] Handle browser back/forward navigation
- [ ] Test invalid tab URL fallback

### Phase 3: Tab Content Integration (1.5 SP)

- [ ] Create `AnalyticsPageHeader.tsx`
- [ ] Create `TrendsTabContent.tsx` wrapper
- [ ] Create `SeasonalTabContent.tsx` wrapper
- [ ] Integrate `PeriodComparisonPanel` for comparison tab
- [ ] Connect shared date range picker

### Phase 4: Polish & Testing (1 SP)

- [ ] Responsive design adjustments
- [ ] Loading state transitions
- [ ] Error boundary setup
- [ ] Accessibility audit
- [ ] E2E tests

---

## Testing

### Unit Test Cases

```typescript
// page.test.tsx

describe('FbsOrdersAnalyticsPage', () => {
  describe('Tab Navigation', () => {
    it('renders trends tab by default')
    it('switches to seasonal tab on click')
    it('switches to comparison tab on click')
    it('updates URL when tab changes')
    it('reads initial tab from URL')
    it('falls back to trends for invalid tab param')
  })

  describe('Date Range', () => {
    it('shows date picker on trends tab')
    it('shows date picker on seasonal tab')
    it('hides date picker on comparison tab')
    it('passes date range to trends components')
    it('passes date range to seasonal components')
  })

  describe('URL Sync', () => {
    it('removes tab param for default trends tab')
    it('sets tab=seasonal in URL')
    it('sets tab=comparison in URL')
    it('handles browser back/forward')
  })
})

describe('AnalyticsPageHeader', () => {
  it('renders page title')
  it('renders date picker when showDatePicker=true')
  it('hides date picker when showDatePicker=false')
  it('calls onDateRangeChange when dates selected')
})
```

### E2E Test Cases

```typescript
// fbs-analytics.spec.ts (Playwright)

test.describe('FBS Orders Analytics Page', () => {
  test('navigates to page from analytics hub', async ({ page }) => {
    await page.goto('/analytics')
    await page.getByRole('link', { name: /заказы fbs/i }).click()
    await expect(page).toHaveURL('/analytics/orders')
  })

  test('displays trends tab by default', async ({ page }) => {
    await page.goto('/analytics/orders')
    await expect(page.getByRole('tab', { name: /тренды/i })).toHaveAttribute(
      'data-state',
      'active'
    )
  })

  test('switches between tabs', async ({ page }) => {
    await page.goto('/analytics/orders')

    // Switch to Seasonal
    await page.getByRole('tab', { name: /сезонность/i }).click()
    await expect(page).toHaveURL('/analytics/orders?tab=seasonal')

    // Switch to Comparison
    await page.getByRole('tab', { name: /сравнение/i }).click()
    await expect(page).toHaveURL('/analytics/orders?tab=comparison')

    // Back to Trends
    await page.getByRole('tab', { name: /тренды/i }).click()
    await expect(page).toHaveURL('/analytics/orders')
  })

  test('navigates directly via URL', async ({ page }) => {
    await page.goto('/analytics/orders?tab=comparison')
    await expect(page.getByRole('tab', { name: /сравнение/i })).toHaveAttribute(
      'data-state',
      'active'
    )
  })

  test('date picker visibility per tab', async ({ page }) => {
    await page.goto('/analytics/orders')

    // Visible on trends
    await expect(page.getByRole('button', { name: /выберите период/i })).toBeVisible()

    // Visible on seasonal
    await page.getByRole('tab', { name: /сезонность/i }).click()
    await expect(page.getByRole('button', { name: /выберите период/i })).toBeVisible()

    // Hidden on comparison
    await page.getByRole('tab', { name: /сравнение/i }).click()
    await expect(page.getByRole('button', { name: /выберите период/i })).not.toBeVisible()
  })
})
```

---

## Definition of Done

- [ ] Page created at `/analytics/orders`
- [ ] Three tabs render correctly (Trends, Seasonal, Comparison)
- [ ] URL synchronization works for all tabs
- [ ] Browser back/forward navigation works
- [ ] Date range picker visible on Trends and Seasonal tabs
- [ ] Date range picker hidden on Comparison tab
- [ ] Shared date range updates Trends and Seasonal content
- [ ] Loading skeleton displays on initial load
- [ ] Error states handled per tab
- [ ] Responsive layout on mobile
- [ ] Keyboard navigation between tabs
- [ ] ARIA labels present
- [ ] Unit tests passing (>80% coverage)
- [ ] E2E tests passing
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Each file under 200 lines

---

## Dependencies

### Required (Blocking)

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.3-FE | Ready | `DateRangePickerExtended` component |
| Story 51.4-FE | Ready | `FbsTrendsChart` component |
| Story 51.5-FE | Ready | `TrendsSummaryCards` component |
| Story 51.6-FE | Ready | `SeasonalPatternsChart`, `SeasonalInsightsCard` |
| Story 51.7-FE | Ready | `PeriodComparisonPanel` component |

### Non-Blocking

| Dependency | Status | Notes |
|------------|--------|-------|
| Story 51.9-FE | Pending | Analytics Hub integration |

---

## Related Files

### Components Integrated

- `src/components/custom/date-range-picker-extended.tsx` (Story 51.3)
- `src/app/(dashboard)/analytics/orders/components/FbsTrendsChart.tsx` (Story 51.4)
- `src/app/(dashboard)/analytics/orders/components/TrendsSummaryCards.tsx` (Story 51.5)
- `src/app/(dashboard)/analytics/orders/components/SeasonalPatternsChart.tsx` (Story 51.6)
- `src/app/(dashboard)/analytics/orders/components/PeriodComparisonPanel.tsx` (Story 51.7)

### shadcn/ui Components Used

- `src/components/ui/tabs.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/card.tsx`

---

## Navigation Integration

### Analytics Hub Card (Story 51.9-FE)

The page will be accessible from the Analytics Hub via a navigation card:

```typescript
{
  title: 'Заказы FBS',
  description: 'Тренды, сезонность и сравнение периодов (365 дней)',
  href: ROUTES.ANALYTICS.ORDERS,
  icon: ShoppingBag,
}
```

### Sidebar Navigation

Add to sidebar analytics section:
- Label: "Заказы FBS"
- Icon: ShoppingBag
- Route: /analytics/orders

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | Claude Code (PM Agent) | Initial story creation |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress_

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
