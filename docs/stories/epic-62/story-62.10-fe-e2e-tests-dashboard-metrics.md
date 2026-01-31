# Story 62.10-FE: E2E Tests for Dashboard Metrics

**Epic**: 62-FE Dashboard UI/UX Presentation
**Status**: 📋 Ready for Dev
**Priority**: P2 (Nice to Have)
**Estimate**: 3 SP

---

## Title (RU)
E2E тесты метрик дашборда

---

## Description

Create comprehensive Playwright E2E tests for the new dashboard metrics display features implemented in Epic 62-FE. These tests ensure that all 8 metric cards, the daily breakdown chart/table, and the interactive legend work correctly in a real browser environment.

The test suite should cover:
- All 8 metric cards rendering with data
- Metric card comparison indicators
- Daily breakdown chart visualization
- Interactive legend toggle functionality
- Chart/table view switching
- Period switching behavior
- Loading and error states
- Accessibility compliance

---

## Acceptance Criteria

- [ ] Test file created at `e2e/dashboard-metrics.spec.ts`
- [ ] Test: All 8 metric cards render with data values
- [ ] Test: Metric cards display comparison indicators (↑/↓ with %)
- [ ] Test: Daily breakdown chart renders with correct day count
- [ ] Test: Chart tooltip appears on hover with metric values
- [ ] Test: Legend toggles hide/show chart series
- [ ] Test: "Все" button shows all legend items
- [ ] Test: "Сбросить" button resets to default visible items
- [ ] Test: View toggle switches between chart and table
- [ ] Test: Table displays correct columns and data
- [ ] Test: Table sorting works (asc/desc/clear)
- [ ] Test: Period switching (week/month) updates all components
- [ ] Test: Loading skeletons appear during data fetch
- [ ] Test: Error state displays when API fails
- [ ] Test: All metric cards are keyboard navigable
- [ ] Test: Chart has accessible description
- [ ] Test: Legend items have correct aria attributes
- [ ] Test: axe-core accessibility scan passes
- [ ] Tests use proper test selectors (data-testid)
- [ ] Tests are stable (no flaky tests)

---

## Test Scenarios

### 1. Metric Cards Display Tests

```typescript
describe('Dashboard Metric Cards', () => {
  test('displays all 8 metric cards', async ({ page }) => {
    // Navigate to dashboard
    // Verify 8 cards with data-testid="metric-card-*"
    // Assert each card has title, value, and comparison badge
  })

  test('orders card shows correct data', async ({ page }) => {
    // Verify orders card displays:
    // - Title: "Заказы"
    // - Value in currency format
    // - Order count in subtitle
    // - Comparison indicator (↑/↓ X%)
  })

  test('theoretical profit card shows breakdown on hover', async ({ page }) => {
    // Hover over profit card
    // Verify breakdown popover appears
    // Check all components listed
  })

  test('metric cards show positive/negative indicators correctly', async ({ page }) => {
    // Find card with positive comparison
    // Verify green color and ↑ arrow
    // Find card with negative comparison
    // Verify red color and ↓ arrow
  })

  test('metric cards show loading skeletons', async ({ page }) => {
    // Intercept API and delay response
    // Navigate to dashboard
    // Verify skeleton components visible
    // Wait for data to load
    // Verify real content appears
  })
})
```

### 2. Daily Breakdown Chart Tests

```typescript
describe('Daily Breakdown Chart', () => {
  test('chart renders with week data (7 days)', async ({ page }) => {
    // Ensure week period selected
    // Verify chart container visible
    // Check X-axis has 7 labels (Пн-Вс)
  })

  test('chart renders with month data (28-31 days)', async ({ page }) => {
    // Switch to month period
    // Wait for chart update
    // Verify X-axis has appropriate day count
  })

  test('chart tooltip shows metric values on hover', async ({ page }) => {
    // Hover over a data point
    // Verify tooltip appears
    // Check tooltip contains date and metric values
    // Verify currency formatting
  })

  test('chart has dual Y-axis', async ({ page }) => {
    // Verify left Y-axis exists (revenue)
    // Verify right Y-axis exists (expenses)
    // Check axis labels are formatted as compact currency
  })
})
```

### 3. Interactive Legend Tests

```typescript
describe('Interactive Legend', () => {
  test('legend displays all 8 metrics', async ({ page }) => {
    // Find legend container
    // Verify 8 legend items present
    // Check each has colored dot and label
  })

  test('clicking legend item toggles chart series', async ({ page }) => {
    // Find "Заказы" legend item
    // Click to hide
    // Verify chart series hidden (opacity or removed)
    // Click again to show
    // Verify chart series visible
  })

  test('legend shows visual state for hidden items', async ({ page }) => {
    // Click to hide a legend item
    // Verify gray dot color
    // Verify strikethrough text
    // Verify reduced opacity
  })

  test('"Все" button shows all series', async ({ page }) => {
    // Hide several series
    // Click "Все" button
    // Verify all legend items active
    // Verify all chart series visible
  })

  test('"Сбросить" button resets to default', async ({ page }) => {
    // Show all series
    // Click "Сбросить" button
    // Verify only default series visible
    // Default: orders, sales, advertising, profit
  })

  test('legend preferences persist in localStorage', async ({ page }) => {
    // Toggle some legend items
    // Reload page
    // Verify same items still hidden
    // Clear localStorage
    // Reload
    // Verify defaults restored
  })

  test('legend is keyboard accessible', async ({ page }) => {
    // Tab to first legend item
    // Verify focus indicator visible
    // Press Space to toggle
    // Verify series toggled
    // Tab to next item
    // Press Enter to toggle
    // Verify series toggled
  })
})
```

### 4. View Toggle Tests

```typescript
describe('View Toggle', () => {
  test('toggle switches between chart and table', async ({ page }) => {
    // Default view is chart
    // Verify chart visible, table not
    // Click "Таблица" toggle
    // Verify table visible, chart not
    // Click "График" toggle
    // Verify chart visible again
  })

  test('view preference persists in localStorage', async ({ page }) => {
    // Switch to table view
    // Reload page
    // Verify table view still selected
  })

  test('both views show same data', async ({ page }) => {
    // Get data from chart (first day orders)
    // Switch to table view
    // Verify first row orders matches chart
  })

  test('legend only visible in chart view', async ({ page }) => {
    // Verify legend visible with chart
    // Switch to table view
    // Verify legend hidden
    // Switch back to chart
    // Verify legend visible again
  })
})
```

### 5. Daily Metrics Table Tests

```typescript
describe('Daily Metrics Table', () => {
  test('table displays all columns', async ({ page }) => {
    // Switch to table view
    // Verify 9 columns present
    // Check column headers match spec
  })

  test('table displays correct row count', async ({ page }) => {
    // Week mode: verify 7 data rows + 1 totals
    // Switch to month
    // Verify 28-31 data rows + 1 totals
  })

  test('table totals row calculates correctly', async ({ page }) => {
    // Sum values in orders column
    // Verify totals row matches sum
  })

  test('table sorting works', async ({ page }) => {
    // Click "Заказы" header
    // Verify rows sorted ascending
    // Click again
    // Verify rows sorted descending
    // Click third time
    // Verify original order restored
  })

  test('table shows profit colors correctly', async ({ page }) => {
    // Find row with positive profit
    // Verify green text color
    // Find row with negative profit (if exists)
    // Verify red text color
  })

  test('table scrolls horizontally on mobile', async ({ page }) => {
    // Set viewport to mobile width
    // Verify horizontal scroll enabled
    // Verify Day column sticky on scroll
  })
})
```

### 6. Period Switching Tests

```typescript
describe('Period Switching', () => {
  test('switching period updates all components', async ({ page }) => {
    // Start with week view
    // Switch to month
    // Verify metric cards update
    // Verify chart X-axis changes
    // Verify table row count changes
  })

  test('loading states appear during period switch', async ({ page }) => {
    // Add network delay
    // Switch period
    // Verify loading indicators appear
    // Wait for load complete
    // Verify data displayed
  })
})
```

### 7. Error Handling Tests

```typescript
describe('Error Handling', () => {
  test('displays error state when API fails', async ({ page }) => {
    // Mock API to return 500
    // Navigate to dashboard
    // Verify error message displayed
    // Check retry button present
  })

  test('displays partial data warning', async ({ page }) => {
    // Mock API to return incomplete data
    // Verify warning banner shown
    // Check which days are missing noted
  })
})
```

### 8. Accessibility Tests

```typescript
describe('Accessibility', () => {
  test('dashboard passes axe-core accessibility scan', async ({ page }) => {
    // Run axe-core on dashboard
    // Verify no critical violations
    // Verify no serious violations
    // Log moderate/minor for awareness
  })

  test('metric cards are keyboard navigable', async ({ page }) => {
    // Tab through all 8 metric cards
    // Verify each receives focus
    // Verify focus indicators visible
  })

  test('chart has accessible description', async ({ page }) => {
    // Find chart container
    // Verify role="img" present
    // Verify aria-label describes chart
    // Verify aria-describedby links to description
    // Check screen reader text present
  })

  test('all interactive elements have aria attributes', async ({ page }) => {
    // Check legend items have aria-checked
    // Check toggle buttons have aria-pressed/aria-selected
    // Check table headers have aria-sort
  })
})
```

---

## Technical Implementation

### Test File Structure

```typescript
// e2e/dashboard-metrics.spec.ts
import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

// Test data selectors
const selectors = {
  metricCard: (metric: string) => `[data-testid="metric-card-${metric}"]`,
  metricValue: '[data-testid="metric-value"]',
  comparisonBadge: '[data-testid="comparison-badge"]',
  dailyChart: '[data-testid="daily-breakdown-chart"]',
  chartTooltip: '[data-testid="chart-tooltip"]',
  legendItem: (metric: string) => `[data-testid="legend-item-${metric}"]`,
  legendShowAll: '[data-testid="legend-show-all"]',
  legendReset: '[data-testid="legend-reset"]',
  viewToggle: '[data-testid="view-toggle"]',
  viewChart: '[data-testid="view-chart"]',
  viewTable: '[data-testid="view-table"]',
  metricsTable: '[data-testid="daily-metrics-table"]',
  tableHeader: (column: string) => `[data-testid="table-header-${column}"]`,
  tableRow: '[data-testid="table-row"]',
  totalsRow: '[data-testid="totals-row"]',
  periodSelector: '[data-testid="period-selector"]',
  loadingSkeleton: '[data-testid="loading-skeleton"]',
  errorState: '[data-testid="error-state"]',
}

// Helper functions
async function loginAndNavigate(page: Page) {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', process.env.E2E_TEST_EMAIL!)
  await page.fill('[data-testid="password-input"]', process.env.E2E_TEST_PASSWORD!)
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('/dashboard')
}

async function waitForDashboardLoad(page: Page) {
  await page.waitForSelector(selectors.metricCard('orders'))
  await page.waitForSelector(selectors.dailyChart)
}

// Test suites...
```

### Page Object Model (Optional)

```typescript
// e2e/pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
  }

  async waitForLoad() {
    await this.page.waitForSelector('[data-testid="metric-card-orders"]')
  }

  async getMetricCardValue(metric: string) {
    return this.page.textContent(
      `[data-testid="metric-card-${metric}"] [data-testid="metric-value"]`
    )
  }

  async toggleLegendItem(metric: string) {
    await this.page.click(`[data-testid="legend-item-${metric}"]`)
  }

  async switchToTableView() {
    await this.page.click('[data-testid="view-table"]')
  }

  async switchToChartView() {
    await this.page.click('[data-testid="view-chart"]')
  }

  // ... more methods
}
```

### Test Data Requirements

Tests should use seeded test data or mock API responses:

```typescript
// e2e/fixtures/dashboard-metrics.json
{
  "weeklyMetrics": {
    "orders": { "total": 1290000, "previousTotal": 1150000 },
    "ordersCogs": { "total": 645000 },
    "sales": { "total": 1032000, "previousTotal": 980000 },
    // ...
  },
  "dailyMetrics": [
    { "date": "2026-01-27", "dayOfWeek": "Пн", "orders": 175000, ... },
    // ... 7 days
  ]
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `e2e/dashboard-metrics.spec.ts` | CREATE | Main E2E test file |
| `e2e/pages/DashboardPage.ts` | CREATE | Page object model (optional) |
| `e2e/fixtures/dashboard-metrics.json` | CREATE | Test data fixtures |
| `src/components/custom/dashboard/*.tsx` | MODIFY | Add data-testid attributes |

---

## Data-TestID Attributes Required

Components must include these test selectors:

| Component | Selector |
|-----------|----------|
| Metric cards | `data-testid="metric-card-{metric}"` |
| Metric value | `data-testid="metric-value"` |
| Comparison badge | `data-testid="comparison-badge"` |
| Daily chart | `data-testid="daily-breakdown-chart"` |
| Chart tooltip | `data-testid="chart-tooltip"` |
| Legend items | `data-testid="legend-item-{metric}"` |
| Legend buttons | `data-testid="legend-show-all"`, `legend-reset` |
| View toggle | `data-testid="view-toggle"` |
| View buttons | `data-testid="view-chart"`, `view-table` |
| Metrics table | `data-testid="daily-metrics-table"` |
| Table headers | `data-testid="table-header-{column}"` |
| Table rows | `data-testid="table-row"` |
| Totals row | `data-testid="totals-row"` |
| Loading skeleton | `data-testid="loading-skeleton"` |
| Error state | `data-testid="error-state"` |

---

## Dependencies

| Type | Dependency | Status |
|------|------------|--------|
| Library | `@playwright/test` | Installed |
| Library | `@axe-core/playwright` | Install if missing |
| Stories | 62.1-62.9 | Must be completed first |
| Environment | `.env.e2e` | Test credentials |

---

## Testing Configuration

### Playwright Config

```typescript
// playwright.config.ts additions
{
  projects: [
    {
      name: 'dashboard-metrics',
      testMatch: 'dashboard-metrics.spec.ts',
      use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3100',
      },
    },
  ],
  expect: {
    timeout: 10000,
  },
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
}
```

### CI Integration

```yaml
# .github/workflows/e2e.yml
- name: Run Dashboard Metrics E2E Tests
  run: npx playwright test dashboard-metrics.spec.ts
  env:
    E2E_BASE_URL: http://localhost:3100
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

---

## Definition of Done

- [ ] All test scenarios implemented
- [ ] Tests pass on local environment
- [ ] Tests use proper data-testid selectors
- [ ] No flaky tests (run 3x with 100% pass rate)
- [ ] axe-core accessibility tests pass
- [ ] Tests work with mocked API responses
- [ ] Tests work with live backend (staging)
- [ ] Screenshot on failure configured
- [ ] Test report generated
- [ ] CI pipeline integration ready
- [ ] Code review approved

---

## References

- **Epic**: `docs/epics/epic-62-fe-dashboard-presentation.md`
- **Playwright Config**: `_bmad/bmm/testarch/knowledge/playwright-config.md`
- **E2E Environment**: `.env.e2e`
- **axe-core Docs**: https://www.deque.com/axe/
- **Playwright Docs**: https://playwright.dev/docs/intro

---

**Created**: 2026-01-31
**Author**: Product Manager (Claude)
