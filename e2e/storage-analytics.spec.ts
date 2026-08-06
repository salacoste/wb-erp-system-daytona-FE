import { expect, test } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

test('storage analytics proves all three exact API families and visible fixture data', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const routes = await installStory1626AnalyticsRoutes(page, {
    storageBySku: { mode: 'data' },
    storageTopConsumers: { mode: 'data' },
    storageTrends: { mode: 'data' },
  })
  const unfiltered = routes.waitForAttempt('analytics.storageBySku', 1)
  const filtered = routes.waitForAttempt('analytics.storageBySku', 2)
  const topConsumers = routes.waitForAttempt('analytics.storageTopConsumers')
  const trends = routes.waitForAttempt('analytics.storageTrends')

  await page.goto('/analytics/storage?weekStart=2026-W02&weekEnd=2026-W05', {
    waitUntil: 'domcontentloaded',
  })
  const accepted = await Promise.all([unfiltered, filtered, topConsumers, trends])
  const urls = accepted.map(request => new URL(request.url))
  expect(urls.map(url => url.pathname)).toEqual([
    '/v1/analytics/storage/by-sku',
    '/v1/analytics/storage/by-sku',
    '/v1/analytics/storage/top-consumers',
    '/v1/analytics/storage/trends',
  ])
  for (const url of urls) {
    expect(url.searchParams.get('weekStart')).toBe('2026-W02')
    expect(url.searchParams.get('weekEnd')).toBe('2026-W05')
  }
  expect(urls[0].searchParams.get('limit')).toBe('200')
  expect(urls[1].searchParams.get('limit')).toBe('20')
  expect(urls[2].searchParams.get('include_revenue')).toBe('true')
  expect(urls[3].searchParams.get('metrics')).toBe('storage_cost')

  await expect(
    page.getByRole('heading', { name: /Аналитика расходов на хранение/i, level: 1 })
  ).toBeVisible()
  await expect(page.getByText('Товар хранения Story 162.6', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Динамика расходов на хранение', { exact: true })).toBeVisible()
  await expect(page.locator('.recharts-wrapper')).toBeVisible()
  routes.assertNoUnexpectedRequests()
})
