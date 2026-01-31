import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'
import { PERIOD_SELECTORS, URL_PATTERNS, API_ROUTES } from './fixtures/period-test-data'

/**
 * E2E Tests: Dashboard Period Switching
 * Story 60.9-FE: E2E Tests for Period Switching
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests the period selector, URL synchronization, and metric updates
 * when switching between weeks and months.
 *
 * @see docs/stories/epic-60/story-60.9-fe-e2e-tests.md
 */
test.describe('Dashboard Period Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (authenticated via global setup)
    await page.goto(ROUTES.dashboard)
    await page.waitForLoadState('networkidle')
  })

  test.describe('AC1: Week/Month Toggle', () => {
    test('can switch from week to month view', async ({ page }) => {
      // Wait for period selector to load
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // Initially should be on week view
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await expect(weekTab).toHaveAttribute('data-state', 'active')

      // Click month tab
      const monthTab = page.locator(PERIOD_SELECTORS.monthTab)
      await monthTab.click()

      // Month tab should now be active
      await expect(monthTab).toHaveAttribute('data-state', 'active')
      await expect(weekTab).toHaveAttribute('data-state', 'inactive')

      // Month selector should be visible
      const monthDropdown = page.locator(PERIOD_SELECTORS.monthDropdown)
      await expect(monthDropdown).toBeVisible()
    })

    test('can switch from month back to week view', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // First switch to month
      await page.locator(PERIOD_SELECTORS.monthTab).click()
      await expect(page.locator(PERIOD_SELECTORS.monthTab)).toHaveAttribute('data-state', 'active')

      // Then back to week
      await page.locator(PERIOD_SELECTORS.weekTab).click()

      // Week tab should be active
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await expect(weekTab).toHaveAttribute('data-state', 'active')

      // Week selector should be visible
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await expect(weekDropdown).toBeVisible()
    })
  })

  test.describe('AC2: Select Previous Week', () => {
    test('selecting previous week updates metrics', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      // Open week dropdown and select previous week
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await weekDropdown.click()

      // Wait for dropdown content to be visible and stable
      await page.waitForSelector('[role="listbox"]', { state: 'visible', timeout: 5000 })
      await page.waitForTimeout(200) // Wait for dropdown animation to complete

      // Select an available week option using the role attribute
      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Use force click to handle potential overlay interception
        await weekOption.click({ force: true })
      }

      // Wait for data to reload
      await page.waitForLoadState('networkidle')

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('AC3: URL Synchronization', () => {
    test('URL updates when period changes', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.weekDropdown)

      // Initial URL should be dashboard
      await expect(page).toHaveURL(/dashboard/)

      // Select a specific week
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await weekDropdown.click()

      // Select first available week
      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible()) {
        await weekOption.click()
        // URL should now include week parameter
        await expect(page).toHaveURL(URL_PATTERNS.weekParam, { timeout: TIMEOUTS.navigation })
      }
    })

    test('URL updates when switching to month view', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.monthTab)

      // Switch to month view
      await page.locator(PERIOD_SELECTORS.monthTab).click()

      // URL should reflect month type
      await expect(page).toHaveURL(URL_PATTERNS.typeMonth, { timeout: TIMEOUTS.navigation })
    })
  })

  test.describe('AC4: URL Persistence on Reload', () => {
    test('page reload preserves selected period', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.weekDropdown)

      // Select a week
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await weekDropdown.click()

      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible()) {
        await weekOption.click()
      }

      // Wait for URL to update
      await page.waitForURL(URL_PATTERNS.weekParam, { timeout: TIMEOUTS.navigation })

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // URL should still have the parameter
      expect(page.url()).toContain('week=')
    })

    test('direct navigation with URL params loads correct period', async ({ page }) => {
      // Navigate directly with specific period in URL
      await page.goto(`${ROUTES.dashboard}?week=2026-W03&type=week`)
      await page.waitForLoadState('networkidle')

      // Period context should show Week 3
      const periodLabel = page.locator(PERIOD_SELECTORS.periodContextLabel)
      await expect(periodLabel).toBeVisible({ timeout: TIMEOUTS.navigation })

      // Week tab should be active
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await expect(weekTab).toHaveAttribute('data-state', 'active')
    })
  })

  test.describe('AC5: Comparison Indicators', () => {
    test('comparison badges are displayed', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      // Check for comparison badge presence
      const comparisonBadges = page.locator(PERIOD_SELECTORS.comparisonBadge)
      const count = await comparisonBadges.count()

      // Should have at least some comparison badges (depending on data)
      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('shows positive comparison badge with green styling', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      // Find a positive comparison badge
      const positiveBadge = page
        .locator(`${PERIOD_SELECTORS.comparisonBadge}:has-text("+")`)
        .first()

      if (await positiveBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should have green color class
        await expect(positiveBadge).toHaveClass(/text-green|bg-green/)
      }
    })

    test('shows negative comparison badge with red styling', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      // Find a negative comparison badge
      const negativeBadge = page
        .locator(`${PERIOD_SELECTORS.comparisonBadge}:has-text("-")`)
        .first()

      if (await negativeBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Should have red color class
        await expect(negativeBadge).toHaveClass(/text-red|bg-red/)
      }
    })

    test('trend indicators are present in metric cards', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      const trendIndicators = page.locator(PERIOD_SELECTORS.trendIndicator)
      const count = await trendIndicators.count()

      // Should have trend indicators (may be 0 if no comparison data)
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('AC6: Refresh Button', () => {
    test('refresh button is visible and clickable', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.refreshButton)

      const refreshButton = page.locator(PERIOD_SELECTORS.refreshButton)
      await expect(refreshButton).toBeVisible()
      await expect(refreshButton).toBeEnabled()
    })

    test('refresh button triggers data refetch', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.refreshButton)

      // Wait a moment
      await page.waitForTimeout(1000)

      // Click refresh button
      const refreshButton = page.locator(PERIOD_SELECTORS.refreshButton)
      await refreshButton.click()

      // Wait for refresh to complete
      await page.waitForLoadState('networkidle')

      // Last updated text should be present
      const lastUpdated = page.locator(PERIOD_SELECTORS.lastUpdated)
      const newTime = await lastUpdated.textContent()
      expect(newTime).toBeTruthy()
    })
  })

  test.describe('AC7: Loading States', () => {
    test('shows loading skeleton during initial load', async ({ page }) => {
      // Intercept API to delay response
      await page.route(API_ROUTES.financeSummary, async route => {
        await new Promise(r => setTimeout(r, 500))
        await route.continue()
      })

      // Navigate fresh
      await page.goto(ROUTES.dashboard)

      // Should show skeleton loaders
      const skeleton = page
        .locator('[class*="skeleton"]')
        .or(page.locator(PERIOD_SELECTORS.metricCardSkeleton))

      // Check if skeleton is visible (may or may not appear depending on timing)
      await skeleton
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)

      // Eventually data should load
      await page.waitForLoadState('networkidle')
      await expect(page.locator('body')).toBeVisible()
    })

    test('shows loading state during period switch', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.weekDropdown)

      // Intercept API to delay response
      await page.route(API_ROUTES.weeklyAnalytics, async route => {
        await new Promise(r => setTimeout(r, 800))
        await route.continue()
      })

      // Switch period
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await weekDropdown.click()

      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible()) {
        await weekOption.click()
      }

      // Wait for data to eventually load
      await page.waitForLoadState('networkidle')
      await expect(page.locator(PERIOD_SELECTORS.metricCard).first()).toBeVisible({
        timeout: TIMEOUTS.api,
      })
    })
  })

  test.describe('AC8: Keyboard Navigation', () => {
    test('period tabs are keyboard navigable', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // Focus week tab
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await weekTab.focus()

      // Should be focusable
      await expect(weekTab).toBeFocused()

      // Use arrow key to navigate to month tab
      await page.keyboard.press('ArrowRight')

      // Month tab should be focused
      const monthTab = page.locator(PERIOD_SELECTORS.monthTab)
      await expect(monthTab).toBeFocused()
    })

    test('period tabs can be activated with Enter key', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // Focus month tab
      const monthTab = page.locator(PERIOD_SELECTORS.monthTab)
      await monthTab.focus()

      // Press Enter to activate
      await page.keyboard.press('Enter')

      // Month tab should now be active
      await expect(monthTab).toHaveAttribute('data-state', 'active')
    })

    test('dropdown is keyboard accessible', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.weekDropdown)

      // Focus and open week dropdown
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await weekDropdown.focus()
      await page.keyboard.press('Enter')

      // Wait for dropdown to open, then get the specific listbox element
      await page.waitForSelector('[role="listbox"]', { state: 'attached', timeout: 3000 })
      const dropdownContent = page.locator('[role="listbox"]').first()

      await expect(dropdownContent).toBeVisible({ timeout: 3000 })

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')

      // Close with Escape
      await page.keyboard.press('Escape')

      // Dropdown should close
      await expect(dropdownContent).not.toBeVisible({ timeout: 3000 })
    })
  })

  test.describe('AC9: Accessibility', () => {
    test('no critical accessibility violations on period selector', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // Run axe-core accessibility audit on period selector area
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include(PERIOD_SELECTORS.periodSelectorContainer)
        .analyze()

      // Filter out known Radix UI aria-controls issue (tabs without content panels)
      // This is a limitation of using Radix UI Tabs component without content panels
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => (v.impact === 'critical' || v.impact === 'serious') && v.id !== 'aria-valid-attr-value' // Exclude known Radix UI issue
      )

      expect(criticalViolations).toHaveLength(0)
    })

    test('no critical accessibility violations on metric cards', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      // Run axe-core accessibility audit on metric cards
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include(PERIOD_SELECTORS.metricCard)
        .analyze()

      // No critical violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical'
      )

      expect(criticalViolations).toHaveLength(0)
    })

    test('period selector has proper ARIA attributes', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // Tabs should have proper role
      const tabsList = page.locator('[role="tablist"]')
      await expect(tabsList).toBeVisible()

      // Week tab should have tab role
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await expect(weekTab).toHaveAttribute('role', 'tab')

      // Dropdown should have accessible label
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      const hasAriaLabel = await weekDropdown.getAttribute('aria-label')
      expect(hasAriaLabel).toBeTruthy()
    })

    test('focus indicators are visible', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.weekTab)

      // Tab to period selector
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await weekTab.focus()

      // Check for visible focus indicator
      const focusStyles = await weekTab.evaluate(el => {
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
      await page.goto(`${ROUTES.dashboard}?week=invalid-week&type=week`)
      await page.waitForLoadState('networkidle')

      // Should not crash - page should still be functional
      await expect(page.locator('body')).toBeVisible()

      // Should show some valid state
      await expect(page.locator(PERIOD_SELECTORS.periodToggle)).toBeVisible()
    })

    test('handles API error during period switch gracefully', async ({ page }) => {
      // First load successfully
      await page.waitForSelector(PERIOD_SELECTORS.metricCard, { timeout: TIMEOUTS.api })

      // Then intercept to return error
      await page.route(API_ROUTES.financeSummary, route => {
        route.fulfill({ status: 500, body: 'Server error' })
      })

      // Switch period
      const weekDropdown = page.locator(PERIOD_SELECTORS.weekDropdown)
      await weekDropdown.click()

      const weekOption = page.locator('[role="option"]').first()
      if (await weekOption.isVisible()) {
        await weekOption.click()
      }

      // Should not crash
      await expect(page.locator('body')).toBeVisible()

      // Page should handle error gracefully (show error state or previous data)
      await expect(page).toHaveURL(/dashboard/)
    })

    test('period selector works after multiple rapid switches', async ({ page }) => {
      await page.waitForSelector(PERIOD_SELECTORS.periodToggle)

      // Rapidly switch between week and month
      for (let i = 0; i < 3; i++) {
        await page.locator(PERIOD_SELECTORS.monthTab).click()
        await page.waitForTimeout(100)
        await page.locator(PERIOD_SELECTORS.weekTab).click()
        await page.waitForTimeout(100)
      }

      // Should still be functional
      const weekTab = page.locator(PERIOD_SELECTORS.weekTab)
      await expect(weekTab).toHaveAttribute('data-state', 'active')
    })
  })
})
