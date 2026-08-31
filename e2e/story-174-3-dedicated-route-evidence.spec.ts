import { expect, test, type Page } from './fixtures/network-test'

async function assertDedicatedRoute(
  page: Page,
  path: string,
  expectedPath: string,
  heading: string
) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(path, { waitUntil: 'domcontentloaded' })

  await expect(page).toHaveURL(url => url.pathname === expectedPath)
  await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible()
  await expect(page.locator('main')).toBeVisible()
}

test.describe('Story 174.3 dedicated route evidence gaps', () => {
  test('/analytics/brand-share has dedicated settled-route and heading evidence', async ({
    page,
  }) => {
    await assertDedicatedRoute(
      page,
      '/analytics/brand-share',
      '/analytics/brand-share',
      'Доля бренда в категории'
    )
  })

  test('/analytics/buyout has dedicated settled-route and heading evidence', async ({ page }) => {
    await assertDedicatedRoute(page, '/analytics/buyout', '/analytics/buyout', 'Аналитика выкупов')
  })

  test('/orders/fbo has dedicated settled-route and heading evidence', async ({ page }) => {
    await assertDedicatedRoute(page, '/orders/fbo', '/orders/fbo', 'FBO Заказы и продажи')
  })

  test('/analytics/models/[id]/evaluations/sku-accuracy has dedicated route-specific evidence', async ({
    page,
  }) => {
    await assertDedicatedRoute(
      page,
      '/analytics/models/1743001/evaluations/sku-accuracy',
      '/analytics/models/1743001/evaluations/sku-accuracy',
      'Точность по SKU'
    )
  })
})
