import { test, expect } from './fixtures/network-test'

/**
 * E2E smoke: /analytics/finance-history (competitor-parity multi-week P&L grid).
 * Verifies the page mounts, shows its heading + period selector, and resolves to
 * either the metric×week table or the no-data state. Uses domcontentloaded (NOT
 * networkidle — the page polls finance-summary per week; anti-pattern #9).
 */
test.describe('Finance History (competitor parity)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics/finance-history', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders the page heading and period selector', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /финансовый отчёт: история/i })).toBeVisible()
    // Period selector (Radix Select trigger)
    await expect(page.locator('button[role="combobox"]').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('resolves to the P&L table or the no-data state', async ({ page }) => {
    // Give the per-week finance-summary queries time to settle, then expect either
    // the metric×week grid or the explicit empty state.
    const tableOrEmpty = page
      .locator('table')
      .or(page.getByText('Нет финансовых данных за выбранный период'))
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 20_000 })
  })
})
