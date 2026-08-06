import { expect, test } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

test.describe('Merged-group table source-backed state', () => {
  test('renders the exact imtId response and sync status without false-green guards', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      advertising: { mode: 'data' },
      mergedGroupSyncStatus: { mode: 'data' },
    })
    const advertising = routes.waitForAttempt('analytics.advertising')
    const syncStatus = routes.waitForAttempt('analytics.mergedGroupSyncStatus')

    await page.goto('/analytics/advertising?group_by=imtId', {
      waitUntil: 'domcontentloaded',
    })
    const [advertisingRequest, syncRequest] = await Promise.all([advertising, syncStatus])
    const advertisingUrl = new URL(advertisingRequest.url)
    expect(advertisingUrl.pathname).toBe('/v1/analytics/advertising')
    expect(advertisingUrl.searchParams.get('group_by')).toBe('imtId')
    expect(advertisingUrl.searchParams.get('include_daily')).toBe('true')
    expect(new URL(syncRequest.url).pathname).toBe('/v1/analytics/advertising/sync-status')

    await expect(page).toHaveURL(/group_by=imtId/)
    await expect(page.getByRole('button', { name: /Группировка по склейкам/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    const table = page.getByRole('table', {
      name: 'Таблица рекламной аналитики по склейкам товаров',
    })
    await expect(table).toBeVisible()
    await expect(table.getByRole('cell', { name: 'Группа склейки 1626001' })).toBeVisible()
    await expect(table.getByText('STORY-162-6-MAIN', { exact: true }).first()).toBeVisible()
    await expect(table.getByText('STORY-162-6-CHILD', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Статус синхронизации:/ })).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('sorting is synchronized by URL and visible header direction', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      advertising: { mode: 'data' },
      mergedGroupSyncStatus: { mode: 'data' },
    })

    await page.goto('/analytics/advertising?group_by=imtId', {
      waitUntil: 'domcontentloaded',
    })
    await routes.waitForAttempt('analytics.advertising')
    const table = page.getByRole('table', {
      name: 'Таблица рекламной аналитики по склейкам товаров',
    })
    const salesHeader = table.getByRole('columnheader', { name: /Всего продаж/ })
    await expect(salesHeader).toBeVisible()
    await salesHeader.click()
    await expect(page).toHaveURL(/sort=totalSales/)
    await expect(salesHeader).toContainText(/[↑↓]/)
    routes.assertNoUnexpectedRequests()
  })
})
