import { test, expect } from './fixtures/network-test'

/**
 * E2E: МойСклад Сток tab (story M1) — backend #221-moysklad /stock-db.
 * Validates the Сток tab renders the stock table (Prisma-Decimal-derived
 * stockFree, «не привязан» on unmatched rows, pagination hint) against live data.
 * Read-path / non-mutating. storageState auth; run with --no-deps.
 */
const T = 20_000

test.describe('МойСклад Сток tab (M1)', () => {
  test('Сток tab renders the stock table with column headers + pagination hint', async ({
    page,
  }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })
    await page.getByRole('tab', { name: 'Сток' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })
    await expect(page.getByText('Свободный остаток')).toBeVisible() // column header
    await expect(page.getByText(/Показано .* из/)).toBeVisible({ timeout: T })
  })

  test('unmatched stock rows show «не привязан» (nmId null)', async ({ page }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await page.getByRole('tab', { name: 'Сток' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })
    await expect(page.getByText('не привязан').first()).toBeVisible({ timeout: T })
  })
})
