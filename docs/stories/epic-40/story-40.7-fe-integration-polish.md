# Story 40.7-FE: Integration & Polish

## Story Info

- **Epic**: 40-FE - Orders UI & WB Native Status History
- **Priority**: Medium
- **Points**: 2
- **Status**: Ready for Dev
- **Sprint**: Sprint 2 (Feb 17-28)

## User Story

**As a** developer,
**I want** comprehensive E2E tests, error handling, and documentation for the Orders module,
**So that** the Orders UI is production-ready with proper error recovery and performance optimizations.

## Acceptance Criteria

### AC1: E2E Tests (Playwright)
- [ ] Orders list page loads correctly
- [ ] Filters and sorting work end-to-end
- [ ] Order detail modal opens and displays history
- [ ] Tab switching (Full/WB/Local) works correctly
- [ ] Analytics widgets display data
- [ ] Manual sync trigger works
- [ ] Error states display appropriately
- [ ] Mobile responsive behavior tested

### AC2: Error Boundary Implementation
- [ ] ErrorBoundary wraps Orders page
- [ ] Graceful fallback UI on component crash
- [ ] Error logging to console (dev mode)
- [ ] "Retry" button functionality

### AC3: Lazy Loading
- [ ] Timeline components lazy loaded
- [ ] Modal content lazy loaded on open
- [ ] Suspense boundaries with loading skeletons
- [ ] Performance improvement measured

### AC4: Documentation Updates
- [ ] CLAUDE.md updated with Orders routes
- [ ] Component catalog updated
- [ ] API endpoints documented
- [ ] Hook catalog updated

### AC5: Epic 40-FE Completion Criteria
- [ ] All Stories 40.1-40.7 complete
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] All E2E tests pass
- [ ] Performance within budget

## Tasks / Subtasks

### Phase 1: E2E Test Suite
- [ ] Create `e2e/orders.spec.ts`
- [ ] Test: Orders page navigation and load
- [ ] Test: Date range filter selection
- [ ] Test: Status filter dropdown
- [ ] Test: Search by order ID
- [ ] Test: Table sorting (by date, status, price)
- [ ] Test: Click row opens modal
- [ ] Test: Modal tab navigation
- [ ] Test: Full history timeline rendering
- [ ] Test: WB history timeline rendering
- [ ] Test: Local history timeline rendering
- [ ] Test: Analytics widget SLA display
- [ ] Test: Analytics widget velocity metrics
- [ ] Test: Manual sync button click
- [ ] Test: Error state display (API failure)
- [ ] Test: Empty state display (no orders)
- [ ] Test: Mobile responsive layout

### Phase 2: Error Boundary
- [ ] Create `src/components/custom/OrdersErrorBoundary.tsx`
- [ ] Implement error catching logic
- [ ] Design fallback UI (Russian text)
- [ ] Add "Попробовать снова" button
- [ ] Wrap Orders page with boundary
- [ ] Test error recovery

### Phase 3: Lazy Loading & Performance
- [ ] Lazy import `OrderHistoryTimeline`
- [ ] Lazy import `WbHistoryTimeline`
- [ ] Lazy import `LocalHistoryTimeline`
- [ ] Add Suspense with `TimelineSkeleton`
- [ ] Lazy load modal content
- [ ] Measure bundle size improvement
- [ ] Verify loading UX smooth

### Phase 4: Documentation Updates
- [ ] Update `CLAUDE.md` route table
- [ ] Add `/orders` to Route Structure section
- [ ] Add Orders hooks to Hook Catalog
- [ ] Add Orders components to Component Catalog
- [ ] Add Orders API endpoints
- [ ] Update Epic Catalog with Epic 40-FE status

### Phase 5: Final Validation
- [ ] Run full test suite: `npm test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run type check: `npm run type-check`
- [ ] Run lint: `npm run lint`
- [ ] Verify bundle size
- [ ] Manual smoke test

## Technical Details

### E2E Test Structure

```typescript
// e2e/orders.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to orders
    await page.goto('/login')
    await page.fill('[name="email"]', process.env.E2E_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.E2E_TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/orders')
  })

  test('should display orders list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Заказы' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should filter by date range', async ({ page }) => {
    await page.click('[data-testid="date-range-picker"]')
    await page.click('text=Последние 7 дней')
    await expect(page.locator('table tbody tr')).toHaveCount.greaterThan(0)
  })

  test('should open order detail modal', async ({ page }) => {
    await page.click('table tbody tr:first-child')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Полная история')).toBeVisible()
  })

  test('should switch history tabs', async ({ page }) => {
    await page.click('table tbody tr:first-child')
    await page.click('text=WB История')
    await expect(page.getByTestId('wb-history-timeline')).toBeVisible()
    await page.click('text=Локальная')
    await expect(page.getByTestId('local-history-timeline')).toBeVisible()
  })

  test('should display SLA metrics', async ({ page }) => {
    await expect(page.getByTestId('sla-widget')).toBeVisible()
    await expect(page.getByText(/SLA|%/)).toBeVisible()
  })

  test('should handle empty state', async ({ page }) => {
    // Apply filter that returns no results
    await page.fill('[data-testid="search-input"]', 'nonexistent-order-12345')
    await expect(page.getByText('Заказы не найдены')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('table')).toBeVisible()
    // Verify horizontal scroll or card layout
  })
})
```

### Error Boundary Component

```typescript
// src/components/custom/OrdersErrorBoundary.tsx

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class OrdersErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Orders] Error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="mx-auto mt-8 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="mb-2 text-lg font-semibold">
              Произошла ошибка
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Не удалось загрузить страницу заказов. Попробуйте обновить страницу.
            </p>
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
```

### Lazy Loading Pattern

```typescript
// src/app/(dashboard)/orders/page.tsx

'use client'

import { Suspense, lazy } from 'react'
import { OrdersErrorBoundary } from '@/components/custom/OrdersErrorBoundary'
import { OrdersListContainer } from './components/OrdersListContainer'
import { OrdersAnalyticsDashboard } from './components/OrdersAnalyticsDashboard'
import { TimelineSkeleton } from './components/TimelineSkeleton'

// Lazy load heavy timeline components
const OrderHistoryTimeline = lazy(
  () => import('./components/OrderHistoryTimeline')
)
const WbHistoryTimeline = lazy(
  () => import('./components/WbHistoryTimeline')
)
const LocalHistoryTimeline = lazy(
  () => import('./components/LocalHistoryTimeline')
)

export default function OrdersPage() {
  return (
    <OrdersErrorBoundary>
      <div className="container mx-auto py-6">
        <h1 className="mb-6 text-2xl font-bold">Заказы</h1>

        {/* Analytics Dashboard - eagerly loaded */}
        <OrdersAnalyticsDashboard />

        {/* Orders List with Modal - modal content lazy loaded */}
        <OrdersListContainer
          timelineComponents={{
            full: (props) => (
              <Suspense fallback={<TimelineSkeleton />}>
                <OrderHistoryTimeline {...props} />
              </Suspense>
            ),
            wb: (props) => (
              <Suspense fallback={<TimelineSkeleton />}>
                <WbHistoryTimeline {...props} />
              </Suspense>
            ),
            local: (props) => (
              <Suspense fallback={<TimelineSkeleton />}>
                <LocalHistoryTimeline {...props} />
              </Suspense>
            ),
          }}
        />
      </div>
    </OrdersErrorBoundary>
  )
}
```

### Timeline Skeleton Component

```typescript
// src/app/(dashboard)/orders/components/TimelineSkeleton.tsx

import { Skeleton } from '@/components/ui/skeleton'

export function TimelineSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}
```

### CLAUDE.md Updates Required

Add to Route Structure:
```markdown
| `/orders` | Orders list with analytics |
```

Add to Hook Catalog:
```markdown
**Orders**: `useOrders`, `useOrderDetails`, `useLocalHistory`, `useWbHistory`, `useFullHistory`, `useSlaMetrics`, `useVelocityMetrics`
```

Add to Component Catalog:
```markdown
**Orders (Epic 40)**: OrdersListContainer, OrdersTable, OrdersFilters, OrdersPagination, OrderStatusBadge, OrderDetailsModal, OrderHistoryTimeline, WbHistoryTimeline, LocalHistoryTimeline, HistoryEntryCard, HistorySourceBadge, DurationDisplay, SlaComplianceWidget, VelocityMetricsWidget, AtRiskOrdersCard, OrderSyncStatus
```

Add to API Endpoint Catalog:
```markdown
#### Orders (8)
- `GET /v1/orders` - List orders with filters
- `GET /v1/orders/:id` - Order details
- `GET /v1/orders/:id/history` - Local status history
- `GET /v1/orders/:id/wb-history` - WB native history (40+ statuses)
- `GET /v1/orders/:id/full-history` - Merged timeline
- `GET /v1/analytics/orders/velocity` - Processing metrics
- `GET /v1/analytics/orders/sla` - SLA compliance
- `POST /v1/orders/sync` - Manual sync trigger
```

## Performance Optimization Checklist

| Optimization | Target | Verification |
|--------------|--------|--------------|
| Initial page load | < 2s | Lighthouse audit |
| Orders list render | < 500ms | React DevTools |
| Modal open time | < 300ms | Manual timing |
| History tab switch | < 200ms | Manual timing |
| Timeline bundle | < 50KB | Bundle analyzer |
| Analytics widgets | < 1s | Network panel |

## Dev Notes

### Test Data Requirements

E2E tests require:
- At least 10 orders in test cabinet
- Orders with various statuses (pending, confirmed, delivered, cancelled)
- Orders with WB history data populated
- Test user with Manager+ role for sync button

### Bundle Size Targets

Before lazy loading:
- Orders page chunk: ~150KB (estimated)

After lazy loading:
- Orders page chunk: ~80KB
- Timeline chunk: ~50KB (loaded on demand)
- Modal chunk: ~20KB (loaded on demand)

### Accessibility Requirements

- All interactive elements keyboard accessible
- Focus trap in modal
- Screen reader announcements for tab changes
- Color contrast WCAG 2.1 AA compliant

## Testing

### E2E Test Cases

| Test | Priority | Automated |
|------|----------|-----------|
| Orders page loads | Critical | Yes |
| Date filter works | High | Yes |
| Status filter works | High | Yes |
| Search works | High | Yes |
| Sorting works | Medium | Yes |
| Modal opens | Critical | Yes |
| Tab switching | High | Yes |
| SLA widget displays | Medium | Yes |
| Velocity widget displays | Medium | Yes |
| Sync button works | Medium | Yes |
| Error state | High | Yes |
| Empty state | Medium | Yes |
| Mobile layout | Medium | Yes |

### Manual Testing Checklist

- [ ] Verify all Russian text is correct
- [ ] Verify date/time formats (Moscow timezone)
- [ ] Verify currency formatting (1 234,56 RUB)
- [ ] Verify duration formatting (30 мин, 2 ч 15 мин)
- [ ] Verify unknown WB status codes show raw code
- [ ] Verify error boundary recovery works
- [ ] Verify lazy loading doesn't cause flicker

## Definition of Done

- [ ] All E2E tests written and passing
- [ ] Error boundary implemented and tested
- [ ] Lazy loading implemented with Suspense
- [ ] CLAUDE.md updated with all new routes, hooks, components
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Performance targets met
- [ ] Code review approved
- [ ] Epic 40-FE marked as complete

## Epic 40-FE Completion Criteria

| Story | Status | Points |
|-------|--------|--------|
| 40.1-FE: Types & API Client | - | 3 |
| 40.2-FE: React Query Hooks | - | 3 |
| 40.3-FE: Orders List Page | - | 5 |
| 40.4-FE: Order Details Modal | - | 3 |
| 40.5-FE: History Timeline Components | - | 5 |
| 40.6-FE: Orders Analytics Dashboard | - | 5 |
| 40.7-FE: Integration & Polish | - | 2 |
| **Total** | - | **26** |

## Dependencies

- Stories 40.1-40.6-FE must be complete
- Backend Epic 40 complete (Stories 40.1-40.9)
- Playwright configured in project
- Test user with orders data in test cabinet

## Related

- Epic spec: `docs/epics/epic-40-fe-orders-wb-history.md`
- Backend API: `test-api/orders.http` (to be created)
- Similar testing: `docs/stories/epic-33/story-33.8-fe-integration-testing.md`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-29 | PM Agent | Initial draft |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Not Started
Agent: -
Started: -
Completed: -
Notes: -
```
