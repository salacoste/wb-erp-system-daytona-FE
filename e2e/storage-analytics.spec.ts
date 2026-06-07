import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Storage Analytics
 * Epic 24: Paid Storage Analytics
 *
 * Smoke tests for the storage analytics page:
 * - Page heading renders (Аналитика расходов на хранение)
 * - Summary / KPI cards visible
 * - Date/period controls present
 * - Chart or table present
 */
test.describe('Storage Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.analytics.storage, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading', async ({ page }) => {
    const heading = page.locator('h1, h2').filter({ hasText: /хранени|storage/i })
    await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('KPI summary cards or empty state visible', async ({ page }) => {
    await page.waitForTimeout(2000)

    // StorageSummaryCards render as card elements with metric values
    const cards = page.locator('[class*="card"]')
    const emptyState = page.locator('text=/нет данных|no data/i')
    const skeleton = page.locator('[class*="skeleton"]')

    const hasCards = (await cards.count()) > 0
    const hasEmpty = (await emptyState.count()) > 0
    const hasSkeleton = (await skeleton.count()) > 0

    expect(hasCards || hasEmpty || hasSkeleton).toBeTruthy()
  })

  test('date/period filter controls present', async ({ page }) => {
    // StorageFilters renders week-range inputs and brand/warehouse comboboxes
    const input = page.locator('input[type="text"], input[type="date"]').first()
    const combobox = page.locator('button[role="combobox"]').first()

    const hasInput = await input.isVisible().catch(() => false)
    const hasCombobox = await combobox.isVisible().catch(() => false)

    expect(hasInput || hasCombobox).toBeTruthy()
  })

  test('trends chart or data table present', async ({ page }) => {
    await page.waitForTimeout(2000)

    // StorageTrendsChart renders a recharts SVG; StorageBySkuTable renders a table
    const chart = page.locator('svg[class*="recharts"], [class*="chart"]')
    const table = page.locator('table')
    const emptyState = page.locator('text=/нет данных|no data/i')

    const hasChart = (await chart.count()) > 0
    const hasTable = (await table.count()) > 0
    const hasEmpty = (await emptyState.count()) > 0

    expect(hasChart || hasTable || hasEmpty).toBeTruthy()
  })
})
