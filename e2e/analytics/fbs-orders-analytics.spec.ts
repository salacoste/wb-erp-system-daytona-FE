import { expect, test, type Page } from '../fixtures/network-test'
import { installStory1626AnalyticsRoutes } from '../fixtures/story-162-6-analytics'

const ORDERS_ROUTE = '/analytics/orders'
const FROM = '2026-01-01'
const TO = '2026-01-30'

async function prepare(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

test.describe('FBS orders analytics source-backed synchronization', () => {
  test('trends use the live date-range control and exact GET query', async ({ page }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      ordersTrends: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.ordersTrends')

    await page.goto(`${ORDERS_ROUTE}?from=${FROM}&to=${TO}&tab=trends`, {
      waitUntil: 'domcontentloaded',
    })
    const accepted = await request
    const url = new URL(accepted.url)
    expect(url.pathname).toBe('/v1/analytics/orders/trends')
    expect(url.searchParams.get('from')).toBe(FROM)
    expect(url.searchParams.get('to')).toBe(TO)
    expect(url.searchParams.get('aggregation')).toBe('day')

    await expect(page.locator('#orders-date-range')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Тренды' })).toHaveAttribute('data-state', 'active')
    await expect(page.getByText('Настройки отображения', { exact: true })).toBeVisible()
    await expect(page.locator('.recharts-wrapper')).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('seasonality uses exact months/view query and renders fixture insight', async ({ page }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      ordersSeasonal: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.ordersSeasonal')

    await page.goto(`${ORDERS_ROUTE}?tab=seasonality`, { waitUntil: 'domcontentloaded' })
    const accepted = await request
    const url = new URL(accepted.url)
    expect(url.pathname).toBe('/v1/analytics/orders/seasonal')
    expect(url.searchParams.get('months')).toBe('12')
    expect(url.searchParams.get('view')).toBe('monthly')

    await expect(page.getByRole('tab', { name: 'Сезонность' })).toHaveAttribute(
      'data-state',
      'active'
    )
    await expect(page.getByText('Январь Story 162.6', { exact: true }).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('comparison uses only the four exact period query keys', async ({ page }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      ordersCompare: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.ordersCompare')

    await page.goto(`${ORDERS_ROUTE}?tab=comparison`, { waitUntil: 'domcontentloaded' })
    const accepted = await request
    const url = new URL(accepted.url)
    expect(url.pathname).toBe('/v1/analytics/orders/compare')
    expect([...url.searchParams.keys()].sort()).toEqual([
      'period1_from',
      'period1_to',
      'period2_from',
      'period2_to',
    ])
    for (const value of url.searchParams.values()) {
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }

    await expect(page.getByRole('tab', { name: 'Сравнение' })).toHaveAttribute(
      'data-state',
      'active'
    )
    await expect(page.getByText('Сравнение периодов', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '1 626', exact: true })).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })
})
