import { expect, test } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

test.describe('Margin analytics exact route synchronization', () => {
  test('SKU parity and cabinet expenses use the selected exact week', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyBySku: { mode: 'data' },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const skuRequest = routes.waitForAttempt('analytics.weeklyBySku')
    const expensesRequest = routes.waitForAttempt('analytics.weeklyCabinetExpenses')

    await page.goto('/analytics/sku?weekStart=2026-W05&weekEnd=2026-W05', {
      waitUntil: 'domcontentloaded',
    })
    const [sku, expenses] = await Promise.all([skuRequest, expensesRequest])
    const skuUrl = new URL(sku.url)
    expect(skuUrl.pathname).toBe('/v1/analytics/weekly/by-sku')
    expect(skuUrl.searchParams.get('week')).toBe('2026-W05')
    expect(skuUrl.searchParams.get('include_ads')).toBe('true')
    expect(skuUrl.searchParams.get('include_stock')).toBe('true')
    expect(new URL(expenses.url).searchParams.get('weekStart')).toBe('2026-W05')
    expect(new URL(expenses.url).searchParams.get('weekEnd')).toBe('2026-W05')

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по товарам', level: 1 })
    ).toBeVisible()
    await expect(page.getByText('Выберите неделю для анализа', { exact: true })).toBeVisible()
    await expect(page.getByRole('combobox').filter({ hasText: /Неделя 5/ })).toHaveCount(2)
    await expect(page.getByText('1 626 ₽', { exact: true }).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('time-period chart renders two fixture weeks from the exact trends query', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyMarginTrends: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.weeklyMarginTrends')

    await page.goto('/analytics/time-period', { waitUntil: 'domcontentloaded' })
    const accepted = await request
    const url = new URL(accepted.url)
    expect(url.pathname).toBe('/v1/analytics/weekly/margin-trends')
    expect([...url.searchParams.entries()]).toEqual([['weeks', '12']])

    await expect(page.getByText('Динамика маржинальности', { exact: true })).toBeVisible()
    await expect(page.locator('.recharts-line').first()).toBeVisible()
    await expect(
      page.locator('.recharts-cartesian-axis-tick-value').filter({ hasText: /^W04$/ })
    ).toHaveCount(1)
    await expect(
      page.locator('.recharts-cartesian-axis-tick-value').filter({ hasText: /^W05$/ })
    ).toHaveCount(1)
    routes.assertNoUnexpectedRequests()
  })
})
