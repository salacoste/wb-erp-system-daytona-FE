import { test, expect } from './fixtures/network-test'

/**
 * E2E smoke: FR-1 competitor-parity share-% columns on /analytics/sku
 * (Доля выручки / Доля прибыли / Доля логистики). The columns are responsive
 * (hidden lg:table-cell) and only render when the SKU table has data for the
 * week, so the test verifies the headers IF the table mounts; otherwise it
 * accepts the explicit no-data state (the page still works).
 */
test.describe('FR-1: share-% columns on SKU table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics/sku', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders the share-% column headers when the SKU table has data', async ({ page }) => {
    // Desktop Chrome (1280px) ≥ lg, so the hidden-lg:table-cell headers show.
    const table = page.locator('table').first()
    const noData = page.getByText('Нет данных за выбранную неделю')

    // Wait for the page to resolve to either a table or the empty state.
    await expect(table.or(noData).first()).toBeVisible({ timeout: 20_000 })

    // If the empty state won, there's no table to assert headers on — accept it.
    if (await noData.isVisible().catch(() => false)) {
      test.skip(true, 'no SKU data for the current week — headers not rendered')
    }

    await expect(page.getByText('Доля выручки').first()).toBeVisible()
    await expect(page.getByText('Доля прибыли').first()).toBeVisible()
    await expect(page.getByText('Доля логистики').first()).toBeVisible()
  })
})
