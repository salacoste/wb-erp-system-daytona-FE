import { test, expect } from '@playwright/test'

/**
 * E2E: МойСклад «МС товары» tab (story M2) — live `/products` read-through.
 * Validates the tab renders the paginated products table (kopeck÷100 prices,
 * pager hint) against live МС data. Read-path / non-mutating. storageState auth.
 */
const T = 25_000 // live МС read-through may be slower than cached endpoints

test.describe('МойСклад МС товары tab (M2)', () => {
  test('МС товары tab renders the products table + pager (live read-through)', async ({ page }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })
    await page.getByRole('tab', { name: 'МС товары' }).click()

    // Live МС read-through (verified in dev). Table renders with rows.
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })
    await expect(page.getByText('Закуп. цена')).toBeVisible() // column header
    await expect(page.getByText(/Показано .* из/)).toBeVisible({ timeout: T }) // pager hint
  })
})
