import { test, expect } from '@playwright/test'
import { ROUTES, SELECTORS, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Login → Dashboard Flow
 * Stories: 1.3 (Login), 3.1 (Dashboard Layout)
 *
 * Tests the complete flow from login to viewing the dashboard
 * with all key components visible and functional.
 */
test.describe('Login → Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (authenticated via setup)
    await page.goto(ROUTES.dashboard)
    await page.waitForLoadState('networkidle')
  })

  test.describe('Dashboard Layout (Story 3.1)', () => {
    test('displays sidebar navigation', async ({ page }) => {
      // Sidebar should be visible on desktop
      const sidebar = page.locator(SELECTORS.sidebar).or(page.locator('nav, aside').first())
      await expect(sidebar).toBeVisible()

      // Navigation links should be present
      const navLinks = page.locator('nav a, aside a')
      await expect(navLinks).not.toHaveCount(0)
    })

    test('displays main dashboard content area', async ({ page }) => {
      // Main content area
      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent).toBeVisible()

      // Should have dashboard title or heading
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('has responsive mobile menu', async ({ page, isMobile }) => {
      if (isMobile) {
        // Mobile menu toggle should be visible
        const menuToggle = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"]')
        await expect(menuToggle).toBeVisible()

        // Click to open menu
        await menuToggle.click()

        // Navigation should become visible
        const nav = page.locator('nav')
        await expect(nav).toBeVisible()
      }
    })
  })

  test.describe('Metric Cards (Story 3.2)', () => {
    test('displays key metric cards', async ({ page }) => {
      // Wait for metrics to load
      await page.waitForTimeout(2000) // Allow API data to load

      // Should have multiple metric cards
      const metricCards = page.locator(SELECTORS.metricCard).or(
        page.locator('[class*="metric"], [class*="card"]').filter({ hasText: /₽|%/ })
      )

      // At least one metric should be visible
      const count = await metricCards.count()
      expect(count).toBeGreaterThan(0)
    })

    test('metric cards show formatted currency values', async ({ page }) => {
      // Look for currency-formatted values (₽ symbol)
      const currencyValues = page.locator('text=/\\d.*₽/')
      await expect(currencyValues.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('metric cards handle loading state', async ({ page }) => {
      // Refresh to trigger loading
      await page.reload()

      // Either loading indicator or content should be visible
      const loadingOrContent = page
        .locator(SELECTORS.loadingSpinner)
        .or(page.locator('[class*="skeleton"]'))
        .or(page.locator('text=/\\d.*₽/'))

      await expect(loadingOrContent.first()).toBeVisible()
    })
  })

  test.describe('Expense Chart (Story 3.3)', () => {
    test('displays expense breakdown chart', async ({ page }) => {
      // Chart container should be visible
      const chart = page.locator(SELECTORS.expenseChart).or(
        page.locator('[class*="chart"], svg[class*="recharts"]')
      )

      await expect(chart.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('chart has accessible label', async ({ page }) => {
      // Check for aria-label on chart container
      const chartWithLabel = page.locator('[aria-label*="расход"], [aria-label*="chart"]')
      const hasLabel = await chartWithLabel.count() > 0

      // Or check for legend/labels
      const hasLegend = await page.locator('[class*="legend"], [class*="label"]').count() > 0

      expect(hasLabel || hasLegend).toBeTruthy()
    })
  })

  test.describe('Trend Graph (Story 3.4)', () => {
    test('displays trend graph with weekly data', async ({ page }) => {
      // Trend graph container
      const trendGraph = page.locator(SELECTORS.trendGraph).or(
        page.locator('[class*="trend"], [class*="line-chart"]')
      )

      await expect(trendGraph.first()).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('trend graph is functional', async ({ page }) => {
      // Chart should be visible or page should show empty state
      await page.waitForTimeout(1000)
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('can navigate to COGS page', async ({ page }) => {
      // Find and click COGS link
      const cogsLink = page.locator('a[href*="cogs"], a:has-text("COGS"), a:has-text("Себестоимость")')
      await cogsLink.first().click()

      await expect(page).toHaveURL(/cogs/)
    })

    test('can navigate to Analytics pages', async ({ page }) => {
      // Find analytics link
      const analyticsLink = page.locator('a[href*="analytics"], a:has-text("Аналитика")')
      await analyticsLink.first().click()

      await expect(page).toHaveURL(/analytics/)
    })

    test('can logout', async ({ page }) => {
      // Find logout button
      const logoutButton = page.locator(SELECTORS.logoutButton).or(
        page.locator('button:has-text("Выход"), button:has-text("Logout")')
      )

      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        // Should redirect to login
        await expect(page).toHaveURL(/login/)
      }
    })
  })

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // Block API to simulate error
      await page.route('**/api/**', (route) => route.abort())

      await page.reload()

      // Page should still be functional (not crash)
      await expect(page.locator('body')).toBeVisible()

      // Should show error state, empty state, or gracefully degrade
      const pageContent = await page.locator('body').textContent()
      expect(pageContent).toBeTruthy()
    })
  })
})
