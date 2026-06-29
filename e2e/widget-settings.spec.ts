import { test, expect } from '@playwright/test'

/**
 * E2E regression: dashboard widget-settings toggles reflect clicks AND persist
 * across reload. Guards the multi-layer bug fixed in e0d43f23 (store snapshot
 * stability) + a8392eb8 (hydration guard) + 5b61a046 (visible thumb).
 *
 * Not tagged @mutating — this only touches client-side localStorage (widget
 * visibility) and resets to the all-visible default in afterEach, so it does
 * not mutate backend/WB-cabinet data (the concern of the mutation-guard).
 */
test.describe('Dashboard widget settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  // Restore the all-visible default after each test so the cabinet isn't left
  // with a toggled-off widget from this suite.
  test.afterEach(async ({ page }) => {
    // Open settings + click "Сбросить" if the sheet is reachable.
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const btn = page.getByRole('button', { name: /настройка виджетов/i })
    if (await btn.isVisible().catch(() => false)) {
      await btn.click()
      const reset = page.getByRole('button', { name: /сбросить/i })
      if (await reset.isVisible().catch(() => false)) await reset.click()
    }
  })

  test('toggling a widget reflects immediately and persists after reload', async ({ page }) => {
    await page.getByRole('button', { name: /настройка виджетов/i }).click()

    const switches = page.getByRole('switch')
    await expect(switches.first()).toBeVisible({ timeout: 10_000 })

    const first = switches.first()
    const before = (await first.getAttribute('aria-checked')) === 'true'
    const expectedAfter = before ? 'false' : 'true'

    // 1. Click reflects immediately (snapshot-stability fix).
    await first.click()
    await expect(first).toHaveAttribute('aria-checked', expectedAfter)

    // 2. The change persists across a full reload (localStorage + hydration guard).
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /настройка виджетов/i }).click()
    await expect(page.getByRole('switch').first()).toHaveAttribute('aria-checked', expectedAfter)
  })
})
