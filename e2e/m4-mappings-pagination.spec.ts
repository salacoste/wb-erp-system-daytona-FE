import { test, expect } from './fixtures/network-test'

/**
 * E2E: МойСклад mappings pagination (story M4).
 * Validates the pager on the «Товары и привязки» tab reaches beyond the
 * first 100 rows (422 pending): hint «Показано N–M из total», Назад disabled
 * at page 0, Вперёд advances the offset. Read-path / non-mutating.
 */
const T = 20_000

test.describe('МойСклад mappings pagination (M4)', () => {
  test('pager renders + Вперёд advances the page (offset > 0)', async ({ page }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })
    await page.getByRole('tab', { name: 'Товары и привязки' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })

    // Pager hint present.
    await expect(page.getByText(/Показано .* из/)).toBeVisible({ timeout: T })
    // Назад disabled at page 0; Вперёд enabled.
    await expect(page.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    const fwd = page.getByRole('button', { name: 'Следующая страница' })
    await expect(fwd).toBeEnabled()

    // Capture the page-1 hint, click Вперёд, assert the range advanced (offset > 0).
    const before =
      (await page
        .getByText(/Показано .* из/)
        .first()
        .textContent()) ?? ''
    await fwd.click()
    await expect(page.getByText(/Показано .* из/).first()).not.toHaveText(before, { timeout: T })
    // After advancing, Назад becomes enabled.
    await expect(page.getByRole('button', { name: 'Предыдущая страница' })).toBeEnabled()
  })
})
