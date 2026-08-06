import { expect, test, type Page } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

const BRAND_ROUTE = '/analytics/brand?weekStart=2026-W05&weekEnd=2026-W05'
const BRAND_MARKER = 'Бренд Story 162.6'

async function prepare(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

test.describe('Brand analytics exact route synchronization', () => {
  test('renders source-backed brand data for the exact week range', async ({ page }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: { mode: 'data' },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const brandRequest = routes.waitForAttempt('analytics.weeklyByBrand')
    const expensesRequest = routes.waitForAttempt('analytics.weeklyCabinetExpenses')

    await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
    const [brand, expenses] = await Promise.all([brandRequest, expensesRequest])
    const brandUrl = new URL(brand.url)
    const selectedWeek = brandUrl.searchParams.get('week')
    expect(selectedWeek).toMatch(/^\d{4}-W\d{2}$/)
    expect(brandUrl.searchParams.get('include_cogs')).toBe('true')
    expect(brandUrl.searchParams.get('include_ads')).toBe('true')
    expect(brandUrl.searchParams.get('include_stock')).toBe('true')
    expect(new URL(expenses.url).searchParams.get('weekStart')).toBe(selectedWeek)
    expect(new URL(expenses.url).searchParams.get('weekEnd')).toBe(selectedWeek)

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по брендам', level: 1 })
    ).toBeVisible()
    await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true }).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('holds loading until the deferred brand response is released', async ({ page }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: { mode: 'deferred' },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.weeklyByBrand')

    try {
      await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
      await request
      await expect(page.locator('main .animate-pulse')).toHaveCount(2)
      await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true })).toHaveCount(0)
    } finally {
      routes.release('analytics.weeklyByBrand')
    }

    await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true }).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('keeps brand failures failing until Retry is explicitly allowed', async ({ page }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: { mode: 'retry' },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const secondAttempt = routes.waitForAttempt('analytics.weeklyByBrand', 2)

    await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
    await secondAttempt
    const retry = page.getByRole('button', { name: 'Повторить' })
    await expect(retry).toBeVisible()
    expect(routes.attemptCount('analytics.weeklyByBrand')).toBeGreaterThanOrEqual(2)

    routes.allowRetrySuccess('analytics.weeklyByBrand')
    const success = routes.waitForAttempt(
      'analytics.weeklyByBrand',
      routes.attemptCount('analytics.weeklyByBrand') + 1
    )
    await retry.click()
    await success
    await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true }).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })
})
