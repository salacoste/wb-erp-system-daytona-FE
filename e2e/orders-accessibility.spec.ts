/**
 * E2E accessibility smoke tests: Orders page.
 *
 * Keeps coverage active and non-mutating. Deep modal/row keyboard flows require
 * deterministic backend fixtures before they can be reliable E2E checks.
 */

import { expect, test } from './fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'

const ORDERS_ROUTE = '/orders'

async function openOrdersPage(page: import('@playwright/test').Page) {
  await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
  await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 })
  await expect(page.getByRole('heading', { name: /Заказы FBS/i })).toBeVisible({
    timeout: 15_000,
  })
}

test.describe('Orders page accessibility smoke', () => {
  test.beforeEach(async ({ page }) => {
    await openOrdersPage(page)
  })

  test('has no critical axe violations on the stable page shell', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-radix-popper-content-wrapper]')
      .analyze()

    const seriousViolations = results.violations.filter(violation =>
      ['critical', 'serious'].includes(violation.impact ?? '')
    )

    expect(seriousViolations).toEqual([])
  })

  test('exposes semantic heading, main landmark, and keyboard-reachable controls', async ({
    page,
  }) => {
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Заказы FBS/i })).toBeVisible()

    await page.keyboard.press('Tab')
    const activeElementTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(activeElementTag).toMatch(/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/)
  })
})
