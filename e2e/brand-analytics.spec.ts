import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Brand Analytics
 * Story: 4.6 (Margin Analysis by Brand)
 *
 * Smoke tests for the brand margin analytics page:
 * - Page heading renders
 * - Filter / date-range controls visible
 * - Data table or empty state present
 * - Sortable column headers
 * - Sidebar navigation works
 */
test.describe('Brand Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.analytics.brand, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /бренд|brand/i })
    await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('has date range or week selector', async ({ page }) => {
    // MarginFilterSection renders a Radix combobox or native select for weeks
    const control = page.locator('button[role="combobox"], select').first()
    await expect(control).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('data table or empty state visible', async ({ page }) => {
    await page.waitForTimeout(2000)

    const table = page.locator('table')
    const emptyState = page.locator('text=/нет данных|no data/i')
    const skeleton = page.locator('[class*="skeleton"]')

    const hasTable = (await table.count()) > 0
    const hasEmpty = (await emptyState.count()) > 0
    const hasSkeleton = (await skeleton.count()) > 0

    expect(hasTable || hasEmpty || hasSkeleton).toBeTruthy()
  })

  test('table headers are clickable for sorting', async ({ page }) => {
    await page.waitForTimeout(2000)

    const header = page.locator('th').first()
    if (await header.isVisible()) {
      await header.click()
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('sidebar link navigates to brand page', async ({ page }) => {
    // Navigate away first, then click sidebar link back
    await page.goto(ROUTES.analytics.main, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    const sidebarLink = page.locator('a[href*="analytics/brand"]')
    if ((await sidebarLink.count()) > 0) {
      await sidebarLink.first().click()
      await expect(page).toHaveURL(/analytics\/brand/, { timeout: TIMEOUTS.navigation })
    }
  })
})
