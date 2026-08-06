import { expect, test } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

test.describe('Merged-group accessibility source-backed checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      advertising: { mode: 'data' },
      mergedGroupSyncStatus: { mode: 'data' },
    })
    await page.goto('/analytics/advertising?group_by=imtId', {
      waitUntil: 'domcontentloaded',
    })
    await Promise.all([
      routes.waitForAttempt('analytics.advertising'),
      routes.waitForAttempt('analytics.mergedGroupSyncStatus'),
    ])
    routes.assertNoUnexpectedRequests()
  })

  test('table has a caption, semantic headers, group label, and main-product name', async ({
    page,
  }) => {
    const table = page.getByRole('table', {
      name: 'Таблица рекламной аналитики по склейкам товаров',
    })
    await expect(table).toBeVisible()
    await expect(table.getByRole('columnheader')).toHaveCount(7)
    await expect(table.getByRole('cell', { name: 'Группа склейки 1626001' })).toBeVisible()
    await expect(table.getByLabel('Главный товар')).toBeVisible()

    const rowspan = table.locator('td[rowspan="3"]')
    await expect(rowspan).toContainText('STORY-162-6-MAIN')
    await expect(rowspan).toContainText('+ 1 товаров')
  })

  test('group toggle and sync status are keyboard-focusable named controls', async ({ page }) => {
    const groupToggle = page.getByRole('button', { name: /Группировка по склейкам/ })
    await expect(groupToggle).toHaveAttribute('aria-pressed', 'true')
    await groupToggle.focus()
    await expect(groupToggle).toBeFocused()

    const syncStatus = page.getByRole('button', { name: /Статус синхронизации:/ })
    await syncStatus.focus()
    await expect(syncStatus).toBeFocused()
  })

  test('mobile table exposes observable horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const table = page.getByRole('table', {
      name: 'Таблица рекламной аналитики по склейкам товаров',
    })
    const container = table.locator('xpath=..')
    await expect(container).toBeVisible()
    await expect
      .poll(() => container.evaluate(node => getComputedStyle(node).overflowX))
      .toMatch(/^(auto|scroll)$/)
  })
})
