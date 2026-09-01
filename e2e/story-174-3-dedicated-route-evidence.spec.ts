import { expect, test, type Locator, type Page } from './fixtures/network-test'

const SKU_ACCURACY_MODEL_ID = '1743001'
const SKU_ACCURACY_PATH =
  `/analytics/models/${SKU_ACCURACY_MODEL_ID}/evaluations/sku-accuracy` as const
const SKU_ACCURACY_FIXTURE = {
  skuAccuracies: [
    {
      nmId: 174300202,
      vendorCode: 'SKU-BETA',
      history: [],
      avgAiMape: 23.75,
      avgNaiveMape: 29.5,
      aiAccuracyPercent: 12.34,
      naiveAccuracyPercent: 70.5,
      evaluationCount: 3,
    },
    {
      nmId: 174300101,
      vendorCode: 'SKU-ALPHA',
      history: [],
      avgAiMape: 8.25,
      avgNaiveMape: 15.5,
      aiAccuracyPercent: 46.77,
      naiveAccuracyPercent: 81.25,
      evaluationCount: 12,
    },
  ],
} as const

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

async function installSkuAccuracyFixture(page: Page) {
  let attempts = 0

  await page.route(/\/v1\/ai\/evaluations\/sku-accuracy(?:\?.*)?$/, async route => {
    const request = route.request()
    const url = new URL(request.url())
    attempts += 1

    expect(request.method()).toBe('GET')
    expect(url.pathname).toBe('/v1/ai/evaluations/sku-accuracy')
    expect([...url.searchParams.entries()]).toEqual([['modelId', SKU_ACCURACY_MODEL_ID]])

    await route.fulfill({ status: 200, json: SKU_ACCURACY_FIXTURE })
  })

  return () => attempts
}

async function expectContainedByViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()

  await expect
    .poll(async () => {
      const box = await locator.boundingBox()
      if (!box) return Number.POSITIVE_INFINITY
      return Math.max(0, -box.x, box.x + box.width - viewport!.width)
    })
    .toBeLessThanOrEqual(1)

  const documentGeometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(documentGeometry.scrollWidth).toBeLessThanOrEqual(documentGeometry.clientWidth + 1)
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
    await page.setViewportSize({ width: 1280, height: 900 })
    const getFixtureAttempts = await installSkuAccuracyFixture(page)
    await assertDedicatedRoute(page, SKU_ACCURACY_PATH, SKU_ACCURACY_PATH, 'Точность по SKU')

    const table = page.getByRole('table', {
      name: `Точность по SKU — модель ${SKU_ACCURACY_MODEL_ID}`,
      exact: true,
    })
    await expect(table).toBeVisible()
    await expect(page.getByRole('caption')).toHaveText(
      `Точность по SKU — модель ${SKU_ACCURACY_MODEL_ID}`
    )
    expect(getFixtureAttempts()).toBeGreaterThanOrEqual(1)

    const rows = table.locator('tbody tr')
    await expect(rows).toHaveCount(2)
    await expect(table.locator('tr[role]:not([role="row"])')).toHaveCount(0)
    await expect(table.locator('tr[tabindex]:not([tabindex="-1"])')).toHaveCount(0)
    await expect(rows.nth(0)).toContainText('174300101')
    await expect(rows.nth(0)).toContainText('SKU-ALPHA')
    await expect(rows.nth(0)).toContainText(/8,25\s*%/)
    await expect(rows.nth(0)).toContainText(/15,5\s*%/)
    await expect(rows.nth(0)).toContainText(/46,77\s*%/)
    await expect(rows.nth(0)).toContainText(/12/)
    await expect(rows.nth(1)).toContainText('174300202')
    await expect(rows.nth(1)).toContainText('SKU-BETA')
    await expect(rows.nth(1)).toContainText(/23,75\s*%/)
    await expect(rows.nth(1)).toContainText(/29,5\s*%/)
    await expect(rows.nth(1)).toContainText(/12,34\s*%/)
    await expect(rows.nth(1)).toContainText(/3/)

    const accuracySort = table.getByRole('button', {
      name: 'Сортировать по AI accuracy %',
      exact: true,
    })
    const accuracyHead = accuracySort.locator('xpath=ancestor::th')
    await expect(accuracyHead).toHaveAttribute('aria-sort', 'none')
    await accuracySort.click()
    await expect(accuracyHead).toHaveAttribute('aria-sort', 'ascending')
    await expect(rows.nth(0)).toContainText('SKU-BETA')
    await expect(rows.nth(1)).toContainText('SKU-ALPHA')
    await accuracySort.click()
    await expect(accuracyHead).toHaveAttribute('aria-sort', 'descending')
    await expect(rows.nth(0)).toContainText('SKU-ALPHA')
    await expect(rows.nth(1)).toContainText('SKU-BETA')

    const scrollContainer = table.locator('xpath=..')
    await expectContainedByViewport(page, scrollContainer)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(table).toBeVisible()
    await expectContainedByViewport(page, scrollContainer)

    const detailButton = table.getByRole('button', {
      name: 'Перейти к детализации по артикулу 174300101',
      exact: true,
    })
    await detailButton.focus()
    await expect(detailButton).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${SKU_ACCURACY_PATH}\\?nmId=174300101$`))
    await expect(page.getByText('Артикул 174300101 — SKU-ALPHA', { exact: true })).toBeVisible()
  })
})
