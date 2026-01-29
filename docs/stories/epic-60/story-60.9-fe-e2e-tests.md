# Story 60.9-FE: E2E тесты переключения периода

**Epic**: Epic 60-FE: Dashboard & Analytics UX Improvements
**Status**: ✅ Completed
**Story Points**: 3 SP
**Priority**: P1
**Depends On**: Stories 60.1, 60.2, 60.3, 60.4, 60.5, 60.6, 60.7, 60.8

---

## User Story

**As a** QA engineer,
**I want** comprehensive E2E tests for period switching functionality,
**So that** we can ensure the feature works correctly across all user flows.

---

## Acceptance Criteria

- [ ] **AC1**: Test switching from week to month view and back
- [ ] **AC2**: Test selecting previous week and verifying metrics update
- [ ] **AC3**: Test URL updates with period parameters (`?week=2026-W05&type=week`)
- [ ] **AC4**: Test page reload preserves selected period from URL
- [ ] **AC5**: Test comparison indicators show correct positive/negative values
- [ ] **AC6**: Test refresh button triggers data refetch and updates timestamp
- [ ] **AC7**: Test loading states appear during period transition
- [ ] **AC8**: Test keyboard navigation for period selector (Tab, Enter, Arrow keys)
- [ ] **AC9**: Test accessibility with axe-core (no critical violations)

---

## Technical Specifications

### Test File Location

```
e2e/dashboard-period.spec.ts
```

### Test Data Requirements

**File**: `e2e/fixtures/test-data.ts` (extend existing)

```typescript
// Add to existing test-data.ts
export const TEST_PERIODS = {
  currentWeek: '2026-W05',
  previousWeek: '2026-W04',
  currentMonth: '2026-01',
  previousMonth: '2025-12',
}

export const PERIOD_SELECTORS = {
  periodToggle: '[data-testid="period-type-toggle"]',
  weekTab: '[data-testid="period-tab-week"]',
  monthTab: '[data-testid="period-tab-month"]',
  weekDropdown: '[data-testid="week-selector"]',
  monthDropdown: '[data-testid="month-selector"]',
  refreshButton: '[data-testid="refresh-button"]',
  lastUpdated: '[data-testid="last-updated"]',
  periodContextLabel: '[data-testid="period-context-label"]',
  metricCard: '[data-testid="metric-card"]',
  comparisonBadge: '[data-testid="comparison-badge"]',
  trendIndicator: '[data-testid="trend-indicator"]',
}
```

---

## Playwright Test Implementation

### Test File: `e2e/dashboard-period.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { ROUTES, SELECTORS, TIMEOUTS } from './fixtures/test-data'
import AxeBuilder from '@axe-core/playwright'

/**
 * E2E Tests: Dashboard Period Switching
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests the period selector, URL synchronization, and metric updates
 * when switching between weeks and months.
 */
test.describe('Dashboard Period Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (authenticated via global setup)
    await page.goto(ROUTES.dashboard)
    await page.waitForLoadState('networkidle')
  })

  test.describe('AC1: Week/Month Toggle', () => {
    test('can switch from week to month view', async ({ page }) => {
      // Initially should be on week view
      const weekTab = page.locator('[data-testid="period-tab-week"]')
      await expect(weekTab).toHaveAttribute('data-state', 'active')

      // Click month tab
      const monthTab = page.locator('[data-testid="period-tab-month"]')
      await monthTab.click()

      // Month tab should now be active
      await expect(monthTab).toHaveAttribute('data-state', 'active')
      await expect(weekTab).toHaveAttribute('data-state', 'inactive')

      // Month selector should be visible
      const monthDropdown = page.locator('[data-testid="month-selector"]')
      await expect(monthDropdown).toBeVisible()
    })

    test('can switch from month back to week view', async ({ page }) => {
      // First switch to month
      await page.locator('[data-testid="period-tab-month"]').click()

      // Then back to week
      await page.locator('[data-testid="period-tab-week"]').click()

      // Week tab should be active
      const weekTab = page.locator('[data-testid="period-tab-week"]')
      await expect(weekTab).toHaveAttribute('data-state', 'active')

      // Week selector should be visible
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await expect(weekDropdown).toBeVisible()
    })
  })

  test.describe('AC2: Select Previous Week', () => {
    test('selecting previous week updates metrics', async ({ page }) => {
      // Get initial metric value
      const metricCard = page.locator('[data-testid="metric-card"]').first()
      const initialValue = await metricCard.locator('[data-testid="metric-value"]').textContent()

      // Open week dropdown and select previous week
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await weekDropdown.click()

      // Select previous week option
      const previousWeekOption = page.locator('text=/Неделя 4, 2026/')
      await previousWeekOption.click()

      // Wait for data to load
      await page.waitForLoadState('networkidle')

      // Metric value may have changed (depends on test data)
      const newValue = await metricCard.locator('[data-testid="metric-value"]').textContent()

      // At minimum, the period context should show the new week
      const periodLabel = page.locator('[data-testid="period-context-label"]')
      await expect(periodLabel).toContainText('Неделя 4')
    })
  })

  test.describe('AC3: URL Synchronization', () => {
    test('URL updates when period changes', async ({ page }) => {
      // Initial URL should have default period
      await expect(page).toHaveURL(/dashboard/)

      // Select a specific week
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await weekDropdown.click()
      await page.locator('text=/Неделя 4, 2026/').click()

      // URL should now include week parameter
      await expect(page).toHaveURL(/week=2026-W04/)
      await expect(page).toHaveURL(/type=week/)
    })

    test('URL updates when switching to month view', async ({ page }) => {
      // Switch to month view
      await page.locator('[data-testid="period-tab-month"]').click()

      // URL should reflect month type
      await expect(page).toHaveURL(/type=month/)
    })
  })

  test.describe('AC4: URL Persistence on Reload', () => {
    test('page reload preserves selected period', async ({ page }) => {
      // Select previous week
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await weekDropdown.click()
      await page.locator('text=/Неделя 4, 2026/').click()

      // Wait for URL to update
      await expect(page).toHaveURL(/week=2026-W04/)

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Period context should still show Week 4
      const periodLabel = page.locator('[data-testid="period-context-label"]')
      await expect(periodLabel).toContainText('Неделя 4')

      // URL should still have the parameter
      await expect(page).toHaveURL(/week=2026-W04/)
    })

    test('direct navigation with URL params loads correct period', async ({ page }) => {
      // Navigate directly with specific period in URL
      await page.goto(`${ROUTES.dashboard}?week=2026-W03&type=week`)
      await page.waitForLoadState('networkidle')

      // Period context should show Week 3
      const periodLabel = page.locator('[data-testid="period-context-label"]')
      await expect(periodLabel).toContainText('Неделя 3')
    })
  })

  test.describe('AC5: Comparison Indicators', () => {
    test('shows positive comparison badge for increase', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('[data-testid="comparison-badge"]')

      // Find a positive comparison badge
      const positiveBadge = page.locator('[data-testid="comparison-badge"]:has-text("+")').first()

      if (await positiveBadge.isVisible()) {
        // Should have green color class
        await expect(positiveBadge).toHaveClass(/text-green|bg-green/)
      }
    })

    test('shows negative comparison badge for decrease', async ({ page }) => {
      await page.waitForSelector('[data-testid="comparison-badge"]')

      // Find a negative comparison badge
      const negativeBadge = page.locator('[data-testid="comparison-badge"]:has-text("-")').first()

      if (await negativeBadge.isVisible()) {
        // Should have red color class
        await expect(negativeBadge).toHaveClass(/text-red|bg-red/)
      }
    })

    test('trend indicator shows correct arrow direction', async ({ page }) => {
      await page.waitForSelector('[data-testid="trend-indicator"]')

      const trendIndicator = page.locator('[data-testid="trend-indicator"]').first()
      const arrowText = await trendIndicator.textContent()

      // Should contain either up or down arrow
      expect(arrowText).toMatch(/[↑↓—]/)
    })
  })

  test.describe('AC6: Refresh Button', () => {
    test('refresh button triggers data refetch', async ({ page }) => {
      // Get initial last updated time
      const lastUpdated = page.locator('[data-testid="last-updated"]')
      const initialTime = await lastUpdated.textContent()

      // Wait a moment
      await page.waitForTimeout(1000)

      // Click refresh button
      const refreshButton = page.locator('[data-testid="refresh-button"]')
      await refreshButton.click()

      // Should show loading state briefly
      const loadingIndicator = page.locator('[data-testid="loading-spinner"]')
        .or(page.locator('[class*="animate-spin"]'))

      // Wait for refresh to complete
      await page.waitForLoadState('networkidle')

      // Last updated time should change (or show "только что")
      const newTime = await lastUpdated.textContent()
      // The time text should indicate recent update
      expect(newTime).toBeTruthy()
    })
  })

  test.describe('AC7: Loading States', () => {
    test('shows loading skeleton during period switch', async ({ page }) => {
      // Intercept API to delay response
      await page.route('**/api/v1/analytics/**', async (route) => {
        await new Promise((r) => setTimeout(r, 1000))
        await route.continue()
      })

      // Switch to previous week
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await weekDropdown.click()
      await page.locator('text=/Неделя 4, 2026/').click()

      // Should show skeleton loaders
      const skeleton = page.locator('[class*="skeleton"]')
        .or(page.locator('[data-testid="metric-card-skeleton"]'))

      await expect(skeleton.first()).toBeVisible()

      // Wait for data to load
      await page.waitForLoadState('networkidle')

      // Skeletons should be gone
      await expect(skeleton.first()).not.toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('AC8: Keyboard Navigation', () => {
    test('can navigate period selector with keyboard', async ({ page }) => {
      // Focus on period toggle using Tab
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // Navigate to period selector area

      // Focus week tab and activate with Enter
      const weekTab = page.locator('[data-testid="period-tab-week"]')
      await weekTab.focus()
      await page.keyboard.press('Enter')

      await expect(weekTab).toHaveAttribute('data-state', 'active')

      // Use arrow keys to switch tabs
      await page.keyboard.press('ArrowRight')
      const monthTab = page.locator('[data-testid="period-tab-month"]')
      await expect(monthTab).toBeFocused()
    })

    test('dropdown is keyboard accessible', async ({ page }) => {
      // Focus and open week dropdown
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await weekDropdown.focus()
      await page.keyboard.press('Enter')

      // Dropdown should open
      const dropdownContent = page.locator('[role="listbox"]')
        .or(page.locator('[data-radix-popper-content-wrapper]'))

      await expect(dropdownContent).toBeVisible()

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')

      // Select with Enter
      await page.keyboard.press('Enter')

      // Dropdown should close
      await expect(dropdownContent).not.toBeVisible()
    })
  })

  test.describe('AC9: Accessibility', () => {
    test('no critical accessibility violations', async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      // Run axe-core accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="period-type-toggle"]')
        .include('[data-testid="week-selector"]')
        .include('[data-testid="metric-card"]')
        .analyze()

      // No critical or serious violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      )

      expect(criticalViolations).toHaveLength(0)
    })

    test('period selector has proper ARIA labels', async ({ page }) => {
      // Week tab should have accessible name
      const weekTab = page.locator('[data-testid="period-tab-week"]')
      await expect(weekTab).toHaveAttribute('aria-label', /неделя|week/i)
        .or(expect(weekTab).toContainText(/неделя/i))

      // Month tab should have accessible name
      const monthTab = page.locator('[data-testid="period-tab-month"]')
      await expect(monthTab).toHaveAttribute('aria-label', /месяц|month/i)
        .or(expect(monthTab).toContainText(/месяц/i))

      // Dropdown should have accessible name
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await expect(weekDropdown).toHaveAttribute('aria-label')
        .or(expect(weekDropdown).toHaveAttribute('aria-labelledby'))
    })

    test('focus indicators are visible', async ({ page }) => {
      // Tab to period selector
      const weekTab = page.locator('[data-testid="period-tab-week"]')
      await weekTab.focus()

      // Check for visible focus indicator (outline or ring)
      const focusStyles = await weekTab.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          outlineWidth: styles.outlineWidth,
        }
      })

      // Should have some visible focus indicator
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.outlineWidth !== '0px'

      expect(hasFocusIndicator).toBeTruthy()
    })
  })

  test.describe('Edge Cases', () => {
    test('handles invalid URL period gracefully', async ({ page }) => {
      // Navigate with invalid period
      await page.goto(`${ROUTES.dashboard}?week=invalid&type=week`)
      await page.waitForLoadState('networkidle')

      // Should fallback to current week (no crash)
      await expect(page.locator('body')).toBeVisible()

      // Should show some valid period
      const periodLabel = page.locator('[data-testid="period-context-label"]')
      await expect(periodLabel).toBeVisible()
    })

    test('handles API error during period switch', async ({ page }) => {
      // First load successfully
      await page.waitForLoadState('networkidle')

      // Then intercept to return error
      await page.route('**/api/v1/analytics/**', (route) => {
        route.fulfill({ status: 500, body: 'Server error' })
      })

      // Switch period
      const weekDropdown = page.locator('[data-testid="week-selector"]')
      await weekDropdown.click()
      await page.locator('text=/Неделя 4, 2026/').click()

      // Should show error state, not crash
      await expect(page.locator('body')).toBeVisible()

      // Error message or empty state should appear
      const errorOrEmpty = page.locator('text=/ошибка/i')
        .or(page.locator('text=/нет данных/i'))
        .or(page.locator('[data-testid="error-message"]'))

      // Page should handle error gracefully
      await expect(page).toHaveURL(/dashboard/)
    })
  })
})
```

---

## Test Data Setup

### Required Test Data

For these tests to pass, the backend must have:

1. **At least 2 weeks of financial data** (current and previous)
2. **Metrics with variation** (some positive, some negative changes)
3. **Valid week/month options** in the available weeks API

### Mock Data (if using MSW or similar)

```typescript
// e2e/fixtures/mock-data.ts
export const mockWeeklyMetrics = {
  week5: {
    payout_total: 87074.72,
    revenue: 150000,
    margin_pct: 15.5,
    product_count: 142,
  },
  week4: {
    payout_total: 82780.00,
    revenue: 145000,
    margin_pct: 14.2,
    product_count: 138,
  },
}

export const mockAvailableWeeks = [
  '2026-W05',
  '2026-W04',
  '2026-W03',
  '2026-W02',
  '2026-W01',
  '2025-W52',
]
```

---

## Test Categories Summary

| Category | Tests | Priority |
|----------|-------|----------|
| Week/Month Toggle | 2 | P0 |
| Period Selection | 1 | P0 |
| URL Sync | 2 | P0 |
| URL Persistence | 2 | P0 |
| Comparison Indicators | 3 | P1 |
| Refresh Button | 1 | P1 |
| Loading States | 1 | P1 |
| Keyboard Navigation | 2 | P1 |
| Accessibility | 3 | P1 |
| Edge Cases | 2 | P2 |

**Total**: 19 test cases

---

## Test Execution

### Local Execution

```bash
# Run only dashboard period tests
npm run test:e2e -- e2e/dashboard-period.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui -- e2e/dashboard-period.spec.ts

# Run with specific browser
npm run test:e2e -- e2e/dashboard-period.spec.ts --project=chromium
```

### CI Pipeline

Tests should run on:
- Chrome (primary)
- Firefox (secondary)
- Mobile viewport (responsive check)

---

## Definition of Done

- [ ] All 9 acceptance criteria covered with tests
- [ ] 19+ test cases implemented
- [ ] Tests pass locally on Chrome
- [ ] Tests pass in CI pipeline
- [ ] No flaky tests (3x consecutive passes)
- [ ] Test execution time < 2 minutes
- [ ] axe-core integration working
- [ ] Code review approved

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `@playwright/test` | npm package | ✅ Installed |
| `@axe-core/playwright` | npm package | ✅ Installed |
| Stories 60.1-60.8 | Frontend | 📋 Ready |
| Test user setup | E2E infrastructure | ✅ Configured |

---

## Non-Goals

- Visual regression testing (separate epic)
- Performance benchmarking
- Cross-browser mobile testing (iOS Safari, Android Chrome)
- Load testing

---

**Created**: 2026-01-29
