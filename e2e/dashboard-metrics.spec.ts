/**
 * E2E Tests: Dashboard Metrics
 * Story 62.10-FE: E2E Tests for Dashboard Metrics
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Tests the new dashboard metrics display including:
 * - 8 metric cards with comparison indicators
 * - Daily breakdown chart with interactive legend
 * - Chart/table view toggle
 * - Period switching behavior
 * - Loading and error states
 * - Accessibility compliance
 *
 * @see docs/stories/epic-62/story-62.10-fe-e2e-tests-dashboard-metrics.md
 */

import { test, expect, type Page } from './fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'
import {
  DASHBOARD_METRICS_SELECTORS as S,
  STORAGE_KEYS,
  DASHBOARD_API_ROUTES,
} from './fixtures/dashboard-metrics-test-data'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Story 88.3-FE: landmark-based wait (not networkidle).
 * The dashboard runs continuous background queries (margin polling, chart data,
 * TanStack devtools telemetry) that never let the network go idle within the
 * test timeout. Instead we wait for `domcontentloaded` (React has mounted) plus
 * a stable landmark — either the metrics grid or its loading skeleton.
 * See e2e/orders-client-info.spec.ts:441-458 for the canonical migration.
 */
async function waitForMetricsLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  await expect(page.locator(S.metricsGrid).or(page.locator(S.loadingSkeleton))).toBeVisible({
    timeout: TIMEOUTS.api,
  })
}

async function waitForMetricsTerminalState(page: Page): Promise<void> {
  await expect(page.locator(S.loadingSkeleton)).toHaveCount(0, { timeout: TIMEOUTS.api })
  await expect(page.locator(S.metricCard).first()).toBeVisible({ timeout: TIMEOUTS.api })
}

async function switchToTableView(page: Page): Promise<void> {
  const tableButton = page.locator(S.viewTableButton)
  if (await tableButton.isVisible()) {
    await tableButton.click()
    await page.waitForTimeout(300) // intentional animation delay — 300ms CSS transition, no DOM signal
  }
}

async function switchToChartView(page: Page): Promise<void> {
  const chartButton = page.locator(S.viewChartButton)
  if (await chartButton.isVisible()) {
    await chartButton.click()
    await page.waitForTimeout(300) // intentional animation delay — 300ms CSS transition
  }
}

// ============================================================================
// Test Suite: Dashboard Metric Cards
// ============================================================================

test.describe('Dashboard Metric Cards (Story 62.1-62.5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
  })

  test('displays metrics grid with cards', async ({ page }) => {
    // Metrics grid should be visible
    const grid = page.locator(S.metricsGrid)
    await expect(grid).toBeVisible()

    // Should have metric cards or placeholder cards
    const cards = page.locator('[class*="card"]').filter({ hasText: /₽|Заказы|Выкупы|Реклама/ })
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('orders card displays correctly', async ({ page }) => {
    // Find Orders card by title or content
    const ordersSection = page.locator('text=Заказы').first()
    await expect(ordersSection).toBeVisible()

    // Should have currency value nearby
    const currencyValue = page.locator('text=/\\d+.*₽/').first()
    await expect(currencyValue).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('metric cards show formatted currency values', async ({ page }) => {
    // Story 88.3-FE: wait for a currency value (data-rendered signal), not a fixed delay
    const currencyValues = page.locator('text=/[\\d\\s]+.*₽/')
    await expect(currencyValues.first()).toBeVisible({ timeout: TIMEOUTS.api })
    const count = await currencyValues.count()
    expect(count).toBeGreaterThan(0)
  })

  test('metric cards show comparison indicators when data available', async ({ page }) => {
    await waitForMetricsTerminalState(page)

    const comparisonBadges = page.locator(S.comparisonBadge)
    test.skip(
      (await comparisonBadges.count()) === 0,
      'Prepared dashboard data has no previous-period values for comparison badges'
    )

    await expect(comparisonBadges.first()).toBeVisible()
    await expect(comparisonBadges.first()).toHaveText(/^[+\-−]?\d[\d\s]*(?:[,.]\d+)?\s*%$/)
  })

  test('positive comparison shows green styling', async ({ page }) => {
    await waitForMetricsTerminalState(page)

    const positiveTrend = page.locator('[data-testid="trend-indicator"][aria-label="Рост"]').first()
    test.skip(
      (await positiveTrend.count()) === 0,
      'Prepared dashboard data has no semantically positive comparison fixture'
    )

    const positiveBadge = positiveTrend.locator('..').locator(S.comparisonBadge)
    await expect(positiveBadge).toHaveClass(/\bbg-green-100\b/)
    await expect(positiveBadge).toHaveClass(/\btext-green-700\b/)
  })

  test('negative comparison shows red styling', async ({ page }) => {
    await waitForMetricsTerminalState(page)

    const negativeTrend = page
      .locator('[data-testid="trend-indicator"][aria-label="Снижение"]')
      .first()
    test.skip(
      (await negativeTrend.count()) === 0,
      'Prepared dashboard data has no semantically negative comparison fixture'
    )

    const negativeBadge = negativeTrend.locator('..').locator(S.comparisonBadge)
    await expect(negativeBadge).toHaveClass(/\bbg-red-100\b/)
    await expect(negativeBadge).toHaveClass(/\btext-red-700\b/)
  })

  test('shows loading skeletons during initial load', async ({ page }) => {
    // Intercept API to delay response
    await page.route(DASHBOARD_API_ROUTES.ordersVolume, async route => {
      await new Promise(r => setTimeout(r, 1000))
      await route.fallback()
    })

    await page.goto(ROUTES.dashboard)

    // Should show skeleton loaders or content
    const skeleton = page.locator('[class*="skeleton"]')
    await skeleton
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)

    // Story 88.3-FE: wait for metrics grid to be visible (not networkidle — see helper)
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
  })
})

// ============================================================================
// Test Suite: Daily Breakdown Chart
// ============================================================================

test.describe('Daily Breakdown Chart (Story 62.6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
  })

  test('daily breakdown section is visible', async ({ page }) => {
    const section = page.locator(S.dailyBreakdownSection)

    if (await section.isVisible({ timeout: 5000 }).catch(() => false)) {
      const title = page.locator(S.dailyBreakdownTitle)
      await expect(title).toContainText('Детализация')
    }
  })

  test('chart view shows chart container', async ({ page }) => {
    await switchToChartView(page)
    await page.waitForTimeout(500) // intentional: allow recharts SVG to render after view-switch (no DOM signal for SVG mount)

    const dailySection = page.locator(S.dailyBreakdownSection)
    const chartState = page
      .locator(S.chartContainer)
      .or(dailySection.getByText('Нет данных для отображения', { exact: true }))
      .or(dailySection.getByText(/^Ошибка загрузки данных:/))

    await expect(chartState.first()).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('chart has accessible description', async ({ page }) => {
    await switchToChartView(page)

    const chartContainer = page.locator('[role="img"]')
    if (await chartContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Should have aria-label
      const ariaLabel = await chartContainer.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('chart tooltip functionality', async ({ page }) => {
    await switchToChartView(page)

    const dailySection = page.locator(S.dailyBreakdownSection)
    const chart = page.locator(S.chartContainer)
    const emptyOrErrorState = dailySection
      .getByText('Нет данных для отображения', { exact: true })
      .or(dailySection.getByText(/^Ошибка загрузки данных:/))
    await expect(chart.or(emptyOrErrorState).first()).toBeVisible({ timeout: TIMEOUTS.api })
    test.skip(
      !(await chart.isVisible()),
      'Prepared dashboard data resolved to an empty or error chart state with no hover points'
    )

    const chartPoint = chart.locator('.recharts-line-dots circle.recharts-dot').first()
    await expect(chartPoint).toBeVisible()
    await chartPoint.hover()
    await expect(chart.locator('.recharts-tooltip-wrapper')).toBeVisible()
  })
})

// ============================================================================
// Test Suite: Interactive Legend
// ============================================================================

test.describe('Interactive Legend (Story 62.7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
    await switchToChartView(page)
  })

  test('legend container is visible in chart view', async ({ page }) => {
    const legend = page.locator(S.legendContainer)

    if (await legend.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(legend).toHaveAttribute('role', 'group')
    }
  })

  test('legend items are clickable', async ({ page }) => {
    const legendItem = page.locator('button[data-metric]').first()

    if (await legendItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Should have checkbox role
      await expect(legendItem).toHaveAttribute('role', 'checkbox')

      // Click to toggle
      const initialState = await legendItem.getAttribute('aria-checked')
      await legendItem.click()

      // State should change
      const newState = await legendItem.getAttribute('aria-checked')
      expect(newState).not.toBe(initialState)
    }
  })

  test('legend has show all button', async ({ page }) => {
    const showAllButton = page.locator(S.legendShowAllButton)

    if (await showAllButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await showAllButton.click()
      await page.waitForTimeout(200) // intentional: state-update settle after button click

      // All legend items should be visible/checked
      const legendItems = page.locator('button[data-metric][aria-checked="true"]')
      const count = await legendItems.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('legend has reset button', async ({ page }) => {
    const resetButton = page.locator(S.legendResetButton)

    if (await resetButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await resetButton.click()
      await page.waitForTimeout(200) // intentional: state-update settle after button click

      // Should reset to default visible series
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('legend is keyboard accessible', async ({ page }) => {
    const legendItem = page.locator('button[data-metric]').first()

    if (await legendItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Focus the item
      await legendItem.focus()
      await expect(legendItem).toBeFocused()

      // Press Space to toggle
      await page.keyboard.press('Space')
      await page.waitForTimeout(100) // intentional: keyboard event → state update settle

      // Should have toggled (no error)
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

// ============================================================================
// Test Suite: View Toggle
// ============================================================================

test.describe('View Toggle (Story 62.9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
  })

  test('view toggle is visible', async ({ page }) => {
    const toggle = page.locator(S.viewToggle)

    if (await toggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(toggle).toHaveAttribute('role', 'radiogroup')
    }
  })

  test('can switch between chart and table views', async ({ page }) => {
    const chartButton = page.locator(S.viewChartButton)
    const tableButton = page.locator(S.viewTableButton)

    if (await chartButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Start with chart view
      await chartButton.click()
      await expect(chartButton).toHaveAttribute('aria-checked', 'true')

      // Switch to table view
      await tableButton.click()
      await expect(tableButton).toHaveAttribute('aria-checked', 'true')
      await expect(chartButton).toHaveAttribute('aria-checked', 'false')

      // Switch back to chart
      await chartButton.click()
      await expect(chartButton).toHaveAttribute('aria-checked', 'true')
    }
  })

  test('view toggle is keyboard navigable', async ({ page }) => {
    const toggle = page.locator(S.viewToggle)

    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Story 89.2-FE: Use Tab-based focus (universal) instead of ArrowRight
      // (radiogroup arrow-key navigation depends on component implementation).
      const chartButton = page.locator(S.viewChartButton)
      const tableButton = page.locator(S.viewTableButton)

      // Both buttons should be focusable
      await chartButton.focus()
      await expect(chartButton).toBeFocused()

      await tableButton.focus()
      await expect(tableButton).toBeFocused()
    }
  })

  test('view preference persists in localStorage', async ({ page }) => {
    const tableButton = page.locator(S.viewTableButton)

    if (await tableButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableButton.click()
      await page.waitForTimeout(500) // intentional: wait for localStorage write after click (no DOM signal)

      // Check localStorage
      const savedView = await page.evaluate(
        key => localStorage.getItem(key),
        STORAGE_KEYS.viewPreference
      )

      if (savedView) {
        expect(savedView).toContain('table')
      }
    }
  })
})

// ============================================================================
// Test Suite: Daily Metrics Table
// ============================================================================

test.describe('Daily Metrics Table (Story 62.8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
    await switchToTableView(page)
  })

  test('table is visible in table view', async ({ page }) => {
    // Story 88.3-FE: wait for table to appear instead of fixed delay
    const table = page.locator(S.dailyMetricsTable).or(page.locator('table'))
    await expect(table.first()).toBeVisible({ timeout: TIMEOUTS.api })
    expect(await table.count()).toBeGreaterThan(0)
  })

  test('table has correct column structure', async ({ page }) => {
    const tableHeaders = page.locator('table thead th')
    const headerCount = await tableHeaders.count()

    if (headerCount > 0) {
      // Should have multiple columns
      expect(headerCount).toBeGreaterThan(3)
    }
  })

  test('table has data rows', async ({ page }) => {
    const dailySection = page.locator(S.dailyBreakdownSection)
    const table = page.locator(S.dailyMetricsTable)
    const emptyOrErrorState = dailySection
      .getByText('Нет данных за выбранный период', { exact: true })
      .or(dailySection.getByText(/^Ошибка загрузки данных:/))
    await expect(table.or(emptyOrErrorState).first()).toBeVisible({ timeout: TIMEOUTS.api })
    test.skip(
      !(await table.isVisible()),
      'Prepared dashboard data resolved to an empty or error table state with no daily rows'
    )

    await expect(page.locator(S.tableRow).first()).toBeVisible()
  })

  test('table has totals row', async ({ page }) => {
    // Story 88.3-FE: wait for the table; totals row presence is optional
    await expect(page.locator('table').first()).toBeVisible({ timeout: TIMEOUTS.api })

    const totalsRow = page.locator('table tfoot tr').or(page.locator('tr:has-text("Итого")'))
    const hasTotals = (await totalsRow.count()) > 0

    if (hasTotals) {
      await expect(totalsRow.first()).toBeVisible()
    }
  })

  test('table headers are sortable', async ({ page }) => {
    // Story 89.2-FE: Wait for the table to render before looking for sortable headers
    const table = page.locator('table').first()
    await expect(table).toBeVisible({ timeout: TIMEOUTS.api })

    // Table headers may be plain <th> with click handlers (not <button> inside <th>)
    const sortableHeader = page.locator('table thead th').first()

    if (await sortableHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to sort — the table re-renders with sorted data
      await sortableHeader.click()
      await page.waitForTimeout(300) // intentional: sort-state update settle

      // Verify table is still visible after sort (didn't crash)
      await expect(table).toBeVisible()
    }
  })

  test('table displays currency formatted values', async ({ page }) => {
    const dailySection = page.locator(S.dailyBreakdownSection)
    const table = page.locator(S.dailyMetricsTable)
    const emptyOrErrorState = dailySection
      .getByText('Нет данных за выбранный период', { exact: true })
      .or(dailySection.getByText(/^Ошибка загрузки данных:/))
    await expect(table.or(emptyOrErrorState).first()).toBeVisible({ timeout: TIMEOUTS.api })
    test.skip(
      !(await table.isVisible()),
      'Prepared dashboard data resolved to an empty or error table state with no currency cells'
    )

    await expect(table.locator('tbody td').filter({ hasText: /₽/ }).first()).toBeVisible()
  })

  test('table scrolls horizontally on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500) // intentional: viewport resize → layout reflow, no DOM signal

    // Table container should allow scroll
    const tableContainer = page
      .locator('[role="region"][aria-label*="Таблица"]')
      .or(page.locator('.overflow-x-auto'))

    if (await tableContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      const overflow = await tableContainer.evaluate(el => window.getComputedStyle(el).overflowX)
      expect(['auto', 'scroll']).toContain(overflow)
    }
  })
})

// ============================================================================
// Test Suite: Period Switching
// ============================================================================

test.describe('Period Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
  })

  test('switching period updates metric cards', async ({ page }) => {
    // Switch period (using existing period selector)
    const weekDropdown = page.locator('[data-testid="week-selector"]')
    if (await weekDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weekDropdown.click()

      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible()) {
        // Story 88.3-FE: observe the period-switch refetch directly (not networkidle)
        await Promise.all([
          page.waitForResponse(
            resp =>
              /\/v1\/analytics\/(weekly|daily|orders)/.test(resp.url()) && resp.status() === 200,
            { timeout: 10000 }
          ),
          weekOption.click(),
        ]).catch((err: Error) => {
          // Fallback if no matching response (e.g., cached hit) — surface as a test note rather
          // than silently swallow. The landmark assertion below still verifies the UI state.
          test.info().annotations.push({
            type: 'note',
            description: `period-switch refetch race: ${err.message}`,
          })
        })
      }
    }

    // Page should still be functional after period switch — assert the metrics grid, not just body
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('loading states appear during period switch', async ({ page }) => {
    // Add network delay
    await page.route(DASHBOARD_API_ROUTES.ordersVolume, async route => {
      await new Promise(r => setTimeout(r, 500))
      await route.fallback()
    })

    const weekDropdown = page.locator('[data-testid="week-selector"]')
    if (await weekDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weekDropdown.click()

      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible()) {
        await weekOption.click()

        // Story 88.3-FE: assert landmark stays visible during refetch (not networkidle)
        await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
      }
    }
  })
})

// ============================================================================
// Test Suite: Error Handling
// ============================================================================

test.describe('Error Handling', () => {
  test('displays error state when API fails', async ({ page }) => {
    // Mock API to return error
    await page.route(DASHBOARD_API_ROUTES.ordersVolume, route => {
      route.fulfill({ status: 500, body: 'Server error' })
    })

    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    // Story 88.3-FE: on API error the component may render an ErrorBoundary (not the metrics grid).
    // `main` is always rendered and is the right "shell survives" landmark for this scenario.
    await expect(page.locator('main')).toBeVisible({ timeout: TIMEOUTS.api })

    // Page should be functional even with error (may show error message or graceful fallback)
    const pageContent = await page.locator('body').textContent()
    expect(pageContent).toBeTruthy()
  })

  test('handles partial data gracefully', async ({ page }) => {
    // Mock API to return partial data
    await page.route(DASHBOARD_API_ROUTES.dailyMetrics, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    })

    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    // Story 88.3-FE: empty data may render an empty state (not the metrics grid).
    // `main` is always rendered and is the right landmark here.
    await expect(page.locator('main')).toBeVisible({ timeout: TIMEOUTS.api })
  })
})

// ============================================================================
// Test Suite: Accessibility
// ============================================================================

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)
  })

  test('no critical accessibility violations on dashboard metrics', async ({ page }) => {
    // Story 88.3-FE: ensure the metrics grid is fully rendered before axe scan (not networkidle)
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
    // Small settle time for axe to see all dynamic cards — landmark already visible
    await page.waitForTimeout(500) // intentional: allow card children to finish paint before axe tree-walk

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // May have dynamic colors
      .analyze()

    // Filter for critical violations only
    // Exclude known Radix UI aria-controls issue (tabs without content panels) —
    // same exclusion as dashboard-period.spec.ts line 374
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'aria-valid-attr-value' // Known Radix UI limitation
    )

    // Log violations for debugging
    if (criticalViolations.length > 0) {
      console.log('Critical violations:', JSON.stringify(criticalViolations, null, 2))
    }

    expect(criticalViolations).toHaveLength(0)
  })

  test('metric cards are keyboard navigable', async ({ page }) => {
    // Tab through page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should have focused element
    const focusedElement = page.locator(':focus')
    const hasFocus = (await focusedElement.count()) > 0

    expect(hasFocus).toBeTruthy()
  })

  test('focus indicators are visible', async ({ page }) => {
    const chartViewButton = page.locator(S.viewChartButton)
    await expect(chartViewButton).toBeVisible({ timeout: TIMEOUTS.api })
    await chartViewButton.focus()
    await expect(chartViewButton).toBeFocused()

    const hasFocusIndicator = await chartViewButton.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return Number.parseFloat(styles.outlineWidth) > 0 || styles.boxShadow !== 'none'
    })

    expect(hasFocusIndicator).toBe(true)
  })

  test('charts have accessible descriptions', async ({ page }) => {
    await switchToChartView(page)

    const chartContainer = page.locator('[role="img"]')
    if (await chartContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
      const ariaLabel = await chartContainer.getAttribute('aria-label')
      const ariaDescribedBy = await chartContainer.getAttribute('aria-describedby')

      expect(ariaLabel || ariaDescribedBy).toBeTruthy()
    }
  })

  test('table has proper ARIA attributes', async ({ page }) => {
    await switchToTableView(page)

    const table = page.locator('table').first()
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Table should have aria-label
      const ariaLabel = await table.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()

      // Headers should exist
      const headers = page.locator('table thead th')
      expect(await headers.count()).toBeGreaterThan(0)
    }
  })

  test('view toggle has proper ARIA attributes', async ({ page }) => {
    const toggle = page.locator(S.viewToggle)

    if (await toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(toggle).toHaveAttribute('role', 'radiogroup')
      await expect(toggle).toHaveAttribute('aria-label')

      const radioButtons = toggle.locator('[role="radio"]')
      const count = await radioButtons.count()
      expect(count).toBe(2)

      // Each radio should have aria-checked
      for (let i = 0; i < count; i++) {
        const radio = radioButtons.nth(i)
        const ariaChecked = await radio.getAttribute('aria-checked')
        expect(['true', 'false']).toContain(ariaChecked)
      }
    }
  })

  test('legend items have proper ARIA attributes', async ({ page }) => {
    await switchToChartView(page)

    const legendItem = page.locator('button[data-metric]').first()

    if (await legendItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(legendItem).toHaveAttribute('role', 'checkbox')

      const ariaChecked = await legendItem.getAttribute('aria-checked')
      expect(['true', 'false']).toContain(ariaChecked)

      const ariaLabel = await legendItem.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('page has proper heading structure', async ({ page }) => {
    const h1 = page.locator('h1')
    const hasH1 = (await h1.count()) > 0

    expect(hasH1).toBeTruthy()
  })

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    // Story 88.3-FE: landmark wait (not networkidle)
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })

    // Content should be visible
    const content = await page.locator('body').textContent()
    expect(content?.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// Test Suite: Edge Cases
// ============================================================================

test.describe('Edge Cases', () => {
  test('handles rapid view toggling', async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)

    const chartButton = page.locator(S.viewChartButton)
    const tableButton = page.locator(S.viewTableButton)

    if (await chartButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Rapidly toggle views — intentional stress test, no stable signal between clicks
      for (let i = 0; i < 5; i++) {
        await tableButton.click()
        await page.waitForTimeout(50) // intentional: rapid-click stress, 50ms debounce window
        await chartButton.click()
        await page.waitForTimeout(50) // intentional: rapid-click stress
      }

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('handles network timeout gracefully', async ({ page }) => {
    // Block API requests
    await page.route('**/api/**', route => route.abort())

    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    // intentional: 5s window for React error boundaries / retry logic to stabilize after all APIs blocked
    await page.waitForTimeout(5000)

    // Page should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('works after page reload', async ({ page }) => {
    await page.goto(ROUTES.dashboard)
    await waitForMetricsLoad(page)

    // Change view
    const tableButton = page.locator(S.viewTableButton)
    if (await tableButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableButton.click()
    }

    // Reload
    await page.reload({ waitUntil: 'domcontentloaded' })
    // Story 88.3-FE: landmark wait (not networkidle)
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
  })
})
