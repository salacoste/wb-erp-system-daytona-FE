import { expect, test } from '../fixtures/network-test'

test.describe('Analytics hub observable navigation state', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Аналитика', level: 1 })).toBeVisible()
  })

  test('exposes the exact analytics destinations as named links', async ({ page }) => {
    await expect(page.locator('main a[href="/analytics/orders"]')).toHaveAttribute(
      'href',
      '/analytics/orders'
    )
    await expect(page.locator('main a[href="/analytics/sku"]')).toHaveAttribute(
      'href',
      '/analytics/sku'
    )
    await expect(page.locator('main a[href="/analytics/brand"]')).toHaveAttribute(
      'href',
      '/analytics/brand'
    )
    await expect(page.locator('main a[href="/analytics/category"]')).toHaveAttribute(
      'href',
      '/analytics/category'
    )
    await expect(page.locator('main a[href="/analytics/storage"]')).toHaveAttribute(
      'href',
      '/analytics/storage'
    )
  })

  test('FBS card click reaches the source-backed destination', async ({ page }) => {
    const card = page.locator('main a[href="/analytics/orders"]')
    await card.click()
    await expect(page).toHaveURL(/\/analytics\/orders(?:\?|$)/)
    await expect(page.getByRole('heading', { name: /Аналитика заказов FBS/i })).toBeVisible()
  })

  test('keyboard activation uses focus and URL state', async ({ page }) => {
    const card = page.locator('main a[href="/analytics/orders"]')
    await card.focus()
    await expect(card).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/analytics\/orders(?:\?|$)/)
  })

  test('desktop and mobile layouts keep the navigation grid mounted', async ({ page }) => {
    const grid = page.locator('main [class*="grid"]').first()
    await expect(grid).toBeVisible()
    await expect.poll(() => grid.evaluate(node => getComputedStyle(node).display)).toBe('grid')

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator('main a[href="/analytics/orders"]')).toBeVisible()
    await expect(page.locator('main a[href="/analytics/storage"]')).toBeVisible()
  })
})
