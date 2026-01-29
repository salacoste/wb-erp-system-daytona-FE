# Story 60.5-FE: Ustranit' dublirovanie dannyh

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Status**: Ready for Dev
**Story Points**: 2 SP
**Priority**: P1

---

## User Story

**As a** seller viewing the dashboard
**I want** to see each metric displayed only once
**So that** I can quickly understand my financial status without confusion from duplicate data

---

## Acceptance Criteria

- [x] AC1: Financial metrics (K perechisleniyu, Realizovano) removed from `InitialDataSummary`
- [x] AC2: Product count moved to main metric card grid as 4th card
- [x] AC3: "Sleduyushchij shag" CTA card shown only when COGS coverage < 100%
- [x] AC4: Success notification converted from inline Alert to toast (sonner)
- [x] AC5: New COGS coverage metric card displays "X iz Y tovarov"
- [x] AC6: Main metric grid layout: 2x3 on desktop, 1 column on mobile
- [x] AC7: Advertising ROAS extracted from widget to 6th metric card (optional, linked to widget)

---

## Technical Specifications

### New Metric Grid Layout (6 cards)

```typescript
// Metric card order on dashboard
const METRIC_CARDS = [
  { id: 'payable', title: 'K perechisleniyu', icon: Wallet },
  { id: 'revenue', title: 'Realizovano', icon: TrendingUp },
  { id: 'margin', title: 'Marzha %', icon: Percent },
  { id: 'products', title: 'Tovarov', icon: Package },
  { id: 'cogs-coverage', title: 'COGS pokrytie', icon: PieChart },
  { id: 'roas', title: 'ROAS reklamy', icon: Megaphone },
]
```

### InitialDataSummary Refactor

```typescript
// src/components/custom/InitialDataSummary.tsx - MODIFIED

interface InitialDataSummaryProps {
  /** Show CTA when COGS coverage < 100% */
  cogsCoverage?: number
  /** Total products */
  totalProducts?: number
  /** Products with COGS assigned */
  productsWithCogs?: number
}

/**
 * Simplified component - NO longer displays financial metrics
 * Only shows:
 * 1. Conditional CTA for COGS assignment (if coverage < 100%)
 * 2. Success toast on first data load (not inline alert)
 */
export function InitialDataSummary({
  cogsCoverage = 0,
  totalProducts = 0,
  productsWithCogs = 0,
}: InitialDataSummaryProps) {
  const showCta = cogsCoverage < 100

  if (!showCta) {
    return null // Nothing to render if COGS fully covered
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleduyushchij shag</CardTitle>
        <CardDescription>
          Naznach'te sebestoimost' dlya {totalProducts - productsWithCogs} tovarov
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.push(ROUTES.COGS.ROOT)}>
          Naznachit' COGS
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}
```

### COGS Coverage Metric Card

```typescript
// New metric card data structure
interface CogsCoverageMetric {
  coverage: number           // 0-100 percentage
  productsWithCogs: number   // e.g., 45
  totalProducts: number      // e.g., 50
}

// Display format: "45 iz 50 (90%)"
function formatCogsCoverage(metric: CogsCoverageMetric): string {
  return `${metric.productsWithCogs} iz ${metric.totalProducts}`
}
```

### Success Notification Migration

```typescript
// BEFORE: Inline Alert in InitialDataSummary
{isNotificationVisible && (
  <Alert className="border-green-500 bg-green-50">
    <CheckCircle2 className="h-4 w-4" />
    <AlertDescription>
      Dannye uspeshno zagruzheny!
    </AlertDescription>
  </Alert>
)}

// AFTER: Toast notification via sonner
import { toast } from 'sonner'

// In useDataImportNotification hook or effect
useEffect(() => {
  if (hasData && !hasShownNotification) {
    toast.success('Dannye uspeshno zagruzheny!', {
      description: 'Vy mozhete nachat' rabotu s sistemoj.',
      duration: 5000,
    })
    setHasShownNotification(true)
  }
}, [hasData, hasShownNotification])
```

### Files to Modify

```
src/
├── app/(dashboard)/dashboard/
│   └── page.tsx                          # MODIFY: New metric grid layout
├── components/custom/
│   ├── InitialDataSummary.tsx            # MODIFY: Remove metrics, keep CTA only
│   ├── CogsCoverageMetricCard.tsx        # NEW: COGS coverage display
│   └── ProductCountMetricCard.tsx        # NEW: Product count card
├── hooks/
│   └── useDataImportNotification.ts      # MODIFY: Use toast instead of state
```

---

## Before/After Comparison

### Before: Dashboard Page Structure

```
+------------------------------------------+
|  Glavnaya stranica                       |
|  Obzor vashih dannyh...                  |
+------------------------------------------+
|  [K perechisleniyu]  [Realizovano]       |  <- MetricCards
+------------------------------------------+
|  [Reklama Widget - 7d/14d/30d selector]  |  <- AdvertisingWidget
+------------------------------------------+
|  [Expense Chart]                         |
+------------------------------------------+
|  [Trend Graph]                           |
+------------------------------------------+
|  [InitialDataSummary]                    |  <- DUPLICATE METRICS HERE
|   - Success Alert                        |
|   - Product Count Card                   |
|   - Financial Metrics Card  <-- REMOVE   |
|   - CTA Card                             |
+------------------------------------------+
```

### After: Dashboard Page Structure

```
+------------------------------------------+
|  Glavnaya stranica                       |
|  Obzor za: Nedelya 5, 2026               |  <- PeriodContextLabel
+------------------------------------------+
|  [DashboardPeriodSelector]               |  <- Story 60.2
+------------------------------------------+
|  METRIC GRID (2x3)                       |
|  [K perechisleniyu]  [Realizovano]       |
|  [Marzha %]          [Tovarov]           |
|  [COGS pokrytie]     [ROAS]              |
+------------------------------------------+
|  [Reklama Widget - NO local selector]    |  <- Simplified
+------------------------------------------+
|  [Expense Chart]                         |
+------------------------------------------+
|  [Trend Graph]                           |
+------------------------------------------+
|  [CTA Card - conditional]                |  <- Only if COGS < 100%
+------------------------------------------+
```

### Before: InitialDataSummary Component (200 lines)

```typescript
// Full component with:
// - Loading skeleton
// - WB token missing alert
// - Success notification alert (dismissible)
// - Product count card
// - Financial metrics card (DUPLICATE)
// - CTA card
```

### After: InitialDataSummary Component (~50 lines)

```typescript
// Simplified component with:
// - Conditional CTA card only
// - No financial metrics
// - No product count (moved to main grid)
// - Success toast via hook
```

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Story 60.1-FE | Internal | Required - COGS coverage data from period context |
| Story 60.3-FE | Internal | Required - `MetricCardEnhanced` for new cards |
| Story 60.4-FE | Internal | Required - Dashboard data fetching with period |
| `sonner` toast | Package | Already installed |
| Backend finance-summary | API | Returns `cogs_coverage_pct`, `products_with_cogs` |

---

## Test Scenarios (for QA)

### Unit Tests

1. **InitialDataSummary renders CTA only when needed**
   ```typescript
   it('should render CTA when COGS coverage < 100%', () => {
     render(<InitialDataSummary cogsCoverage={50} totalProducts={100} />)
     expect(screen.getByText(/Naznachit' COGS/)).toBeInTheDocument()
   })

   it('should render nothing when COGS coverage = 100%', () => {
     const { container } = render(
       <InitialDataSummary cogsCoverage={100} totalProducts={50} />
     )
     expect(container.firstChild).toBeNull()
   })
   ```

2. **COGS Coverage Card formatting**
   ```typescript
   it('should display "X iz Y" format', () => {
     render(<CogsCoverageMetricCard
       productsWithCogs={45}
       totalProducts={50}
       coverage={90}
     />)
     expect(screen.getByText('45 iz 50')).toBeInTheDocument()
     expect(screen.getByText('90%')).toBeInTheDocument()
   })
   ```

3. **Product Count Card**
   ```typescript
   it('should display product count with locale formatting', () => {
     render(<ProductCountMetricCard count={1234} />)
     expect(screen.getByText('1 234')).toBeInTheDocument()
   })
   ```

4. **Toast notification triggers correctly**
   ```typescript
   it('should show success toast on first data load', async () => {
     const toastSpy = vi.spyOn(toast, 'success')
     render(<DashboardPage />) // With data

     await waitFor(() => {
       expect(toastSpy).toHaveBeenCalledWith(
         'Dannye uspeshno zagruzheny!',
         expect.any(Object)
       )
     })
   })
   ```

### Integration Tests

1. **No duplicate metrics on dashboard**
   ```typescript
   it('should display K perechisleniyu only once', async () => {
     render(<DashboardPage />)

     const payableCards = screen.getAllByText(/K perechisleniyu/)
     expect(payableCards).toHaveLength(1)
   })

   it('should not render InitialDataSummary financial cards', () => {
     render(<DashboardPage />)

     // Old duplicate card had specific test-id
     expect(screen.queryByTestId('initial-summary-financials')).not.toBeInTheDocument()
   })
   ```

2. **6-card grid layout**
   ```typescript
   it('should render 6 metric cards in grid', () => {
     render(<DashboardPage />)

     const metricCards = screen.getAllByTestId('metric-card')
     expect(metricCards).toHaveLength(6)
   })
   ```

---

## Visual Regression Checklist

- [ ] Metric grid displays 2x3 on desktop (1280px+)
- [ ] Metric grid displays 2x2+2 on tablet (768px-1279px)
- [ ] Metric grid displays 1 column on mobile (<768px)
- [ ] CTA card has correct spacing below grid
- [ ] Toast appears in top-right corner
- [ ] Toast auto-dismisses after 5 seconds

---

## Migration Notes

1. **Breaking Change**: `InitialDataSummary` props interface changes
2. **Remove**: `isNotificationVisible` state from `InitialDataSummary`
3. **Remove**: Financial metrics JSX from `InitialDataSummary`
4. **Add**: Toast call in `useDataImportNotification` hook
5. **Add**: New metric cards to dashboard grid

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Financial metrics removed from `InitialDataSummary`
- [ ] Product count displayed in main metric grid
- [ ] COGS coverage metric card implemented
- [ ] CTA card conditionally rendered (COGS < 100%)
- [ ] Success notification uses toast instead of inline alert
- [ ] No duplicate data displays on dashboard
- [ ] TypeScript strict mode passes
- [ ] Unit tests written and passing
- [ ] Visual regression verified on 3 breakpoints
- [ ] Code review approved
- [ ] No ESLint errors

---

**Created**: 2026-01-29
