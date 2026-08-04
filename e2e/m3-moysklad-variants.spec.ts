import { test, expect } from './fixtures/network-test'

/**
 * E2E: МойСклад «МС модификации» tab (story M3) — live `/variants` read-through.
 * Validates the tab renders the paginated variants table (barcodes count, no
 * article column, pager) against live МС data. Read-path / non-mutating.
 */
const T = 25_000

test.describe('МойСклад МС модификации tab (M3)', () => {
  test('МС модификации tab renders the variants table + pager (live read-through)', async ({
    page,
  }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })
    await page.getByRole('tab', { name: 'МС модификации' }).click()

    await expect(page.locator('table').first()).toBeVisible({ timeout: T })
    await expect(page.getByText('Штрихкоды')).toBeVisible() // variant-specific column
    await expect(page.getByText(/Показано .* из/)).toBeVisible({ timeout: T }) // pager hint
    // Variants have no article — the «Артикул» column (present on products/mappings) is absent here.
    await expect(page.getByText('Артикул')).toHaveCount(0)
  })
})
