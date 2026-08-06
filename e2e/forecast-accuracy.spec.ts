import { expect, test } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

const FORECAST_ROUTE = '/analytics/forecast-accuracy'

test.describe('Forecast accuracy exact route synchronization', () => {
  test('renders fixture-backed metrics from the exact endpoint', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      forecastAccuracy: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.forecastAccuracy')

    await page.goto(FORECAST_ROUTE, { waitUntil: 'domcontentloaded' })
    const accepted = await request
    expect(new URL(accepted.url).pathname).toBe('/v1/ai/forecast-accuracy')
    expect(new URL(accepted.url).search).toBe('')

    await expect(page.getByRole('heading', { name: 'Точность прогнозов', level: 1 })).toBeVisible()
    await expect(page.getByText('По горизонту прогноза', { exact: true })).toBeVisible()
    await expect(page.getByText('По SKU (топ-20)', { exact: true })).toBeVisible()
    await expect(page.getByText(/1.?626/).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('keeps forecast loading visible until its deferred response is released', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      forecastAccuracy: { mode: 'deferred' },
    })
    const request = routes.waitForAttempt('analytics.forecastAccuracy')

    try {
      await page.goto(FORECAST_ROUTE, { waitUntil: 'domcontentloaded' })
      await request
      await expect(page.locator('main .animate-pulse').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Точность прогнозов' })).toHaveCount(0)
    } finally {
      routes.release('analytics.forecastAccuracy')
    }

    await expect(page.getByRole('heading', { name: 'Точность прогнозов', level: 1 })).toBeVisible()
    await expect(page.getByText(/1.?626/).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })
})
