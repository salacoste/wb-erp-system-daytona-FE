import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Category Analytics
 * Story: 4.6 (Margin Analysis by Category)
 *
 * Smoke tests for the category margin analytics page:
 * - Page heading renders
 * - Filter / date-range controls visible
 * - Data table or empty state present
 * - Category breakdown displayed
 */
test.describe('Category Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.analytics.category, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /категори|category/i })
    await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('has date range or week selector', async ({ page }) => {
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

  test('category breakdown rows render', async ({ page }) => {
    await page.waitForTimeout(2000)

    // Table rows with category names (each row is a category breakdown)
    const rows = page.locator('tbody tr')
    const emptyState = page.locator('text=/нет данных|no data/i')

    const hasRows = (await rows.count()) > 0
    const hasEmpty = (await emptyState.count()) > 0

    expect(hasRows || hasEmpty).toBeTruthy()
  })
})
