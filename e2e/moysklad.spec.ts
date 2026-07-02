import { test, expect } from '@playwright/test'

/**
 * E2E: МойСклад read-only UI (Phase 1) — backend contract #221-moysklad.
 *
 * Validates the /moysklad page end-to-end against live data (frontend :3100 ↔
 * backend :3000): health badge, bootstrap-cabinet note, mappings table with
 * backend-filtered counts, and the manual-link dialog opening. Non-mutating
 * (the link POST is unit-tested + endpoint-smoke-tested; this spec stops at
 * dialog-open to avoid churning the bootstrap cabinet's mappings on every run).
 *
 * Auth: project storageState (e2e/.auth/user.json). Run with --no-deps:
 *   npx playwright test e2e/moysklad.spec.ts --project=chromium --no-deps
 */

const T = 20_000

test.describe('МойСклад read-only UI (Phase 1)', () => {
  test('renders /moysklad with the health badge + bootstrap-cabinet note', async ({ page }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })

    await expect(page.locator('main').getByRole('heading', { level: 1 })).toHaveText('МойСклад')
    // Bootstrap-cabinet caveat (D43/D44 context): МС data is for the connected cabinet.
    await expect(page.getByText(/Данные МойСклад для подключённого кабинета/)).toBeVisible()
    // Health badge: tokenConfigured → «Подключён».
    await expect(page.getByText('Подключён').first()).toBeVisible({ timeout: T })
  })

  test('mappings table: filter counts + «Привязать» on pending rows + pagination hint', async ({
    page,
  }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: T })

    await page.getByRole('tab', { name: 'Товары и привязки' }).click()
    // Filter buttons (counts from backend filtered .total — pending=422, matched=13, all=435).
    await expect(page.getByRole('button', { name: /Не привязаны/ })).toBeVisible({ timeout: T })
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })
    // Pagination hint (visible/total) — the table caps at 100 rows; the hint makes truncation visible.
    await expect(page.getByText(/Показано .* из/)).toBeVisible({ timeout: T })
    // A pending row carries the «Привязать» action (default filter = pending).
    await expect(page.getByRole('button', { name: /Привязать/ }).first()).toBeVisible({
      timeout: T,
    })
  })

  test('manual-link: «Привязать» opens the WB product-picker dialog', async ({ page }) => {
    await page.goto('/moysklad', { waitUntil: 'domcontentloaded' })
    await page.getByRole('tab', { name: 'Товары и привязки' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: T })

    await page
      .getByRole('button', { name: /Привязать/ })
      .first()
      .click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
    // The link dialog opens with its title (the ProductCombobox search input appears
    // only once its popover opens, so assert the title rather than the input).
    await expect(page.getByRole('heading', { name: 'Привязать товар WB' })).toBeVisible()
  })
})
