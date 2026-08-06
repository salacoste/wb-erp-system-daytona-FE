import AxeBuilder from '@axe-core/playwright'
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
    await expect(table.getByText('STORY-162-6-CHILD', { exact: true }).first()).toBeVisible()
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

  test('aggregate row renders fixture-backed metrics (ROAS and total sales)', async ({ page }) => {
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
    await expect(table).toBeVisible()

    // Aggregate row is the bold gray tier (bg-gray-100) carrying group-level metrics.
    const aggregateRow = table.locator('tbody tr.bg-gray-100').first()
    await expect(aggregateRow).toBeVisible()
    // formatCurrency(18260) -> "18 260 ₽" (ru-RU, NBSP thousands separator).
    await expect(aggregateRow.getByText('18 260 ₽')).toBeVisible()
    // formatROAS(10) -> "10.00" (toFixed(2), unitless multiplier).
    await expect(aggregateRow.getByText('10.00', { exact: true })).toBeVisible()
    // The group-level "ГРУППА #imtId" cell is labeled for assistive tech.
    await expect(aggregateRow.getByRole('cell', { name: 'Группа склейки 1626001' })).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('detail rows distinguish main vs child product via the crown main-product marker', async ({
    page,
  }) => {
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

    // Main product: the Crown SVG carries aria-label="Главный товар" (MergedGroupRows.tsx).
    // Exact match avoids colliding with ProductRowBadge's "Главный товар в склейке".
    const mainMarker = table.getByLabel('Главный товар', { exact: true })
    await expect(mainMarker).toBeVisible()
    // The marker shares its cell with the main product vendor code.
    const mainCell = mainMarker.locator('xpath=ancestor::td[1]')
    await expect(mainCell).toContainText('STORY-162-6-MAIN')

    // Child row carries the child vendor code and must not show a crown marker.
    const childCell = table.getByRole('cell').filter({ hasText: 'STORY-162-6-CHILD' }).first()
    await expect(childCell).toBeVisible()
    await expect(childCell.getByLabel('Главный товар')).toHaveCount(0)
    routes.assertNoUnexpectedRequests()
  })

  test('sorting by the ROAS column is synchronized to the URL and header direction', async ({
    page,
  }) => {
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
    const roasHeader = table.getByRole('columnheader').filter({ hasText: 'ROAS' })
    await expect(roasHeader).toBeVisible()
    await roasHeader.click()
    // useAdvertisingPageState mirrors sort state as sort=<field>&order=<asc|desc>.
    await expect(page).toHaveURL(/sort=roas/)
    await expect(page).toHaveURL(/order=(asc|desc)/)
    await expect(roasHeader).toContainText(/[↑↓]/)
    routes.assertNoUnexpectedRequests()
  })

  test('rowspan cell carries the group identifier across the 3-tier structure', async ({
    page,
  }) => {
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

    // productCount=2 -> totalRows=3 -> the tier-1 cell renders rowspan="3" (MergedGroupRows.tsx).
    const rowspan = table.locator('td[rowspan="3"]')
    await expect(rowspan).toHaveCount(1)
    // The cell identifies the group by its main product code + child count.
    await expect(rowspan).toContainText('STORY-162-6-MAIN')
    await expect(rowspan).toContainText('+ 1 товаров')
    routes.assertNoUnexpectedRequests()
  })

  test('sticky columns are observable at the tablet breakpoint via computed style', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626AnalyticsRoutes(page, {
      advertising: { mode: 'data' },
      mergedGroupSyncStatus: { mode: 'data' },
    })

    // md:sticky activates at >=768px; a tablet viewport surfaces the sticky positioning.
    await page.setViewportSize({ width: 820, height: 1180 })
    await page.goto('/analytics/advertising?group_by=imtId', {
      waitUntil: 'domcontentloaded',
    })
    await routes.waitForAttempt('analytics.advertising')
    const table = page.getByRole('table', {
      name: 'Таблица рекламной аналитики по склейкам товаров',
    })
    await expect(table).toBeVisible()

    // The tier-1 rowspan cell uses md:sticky md:left-0 (MergedGroupRows.tsx).
    const rowspan = table.locator('td[rowspan="3"]')
    await expect(rowspan).toBeVisible()
    await expect
      .poll(async () => rowspan.evaluate(node => getComputedStyle(node).position), {
        message: 'rowspan cell becomes position:sticky at the tablet breakpoint',
      })
      .toBe('sticky')
    routes.assertNoUnexpectedRequests()
  })

  test('WCAG 2.1 AA color-contrast passes for the merged-group table', async ({ page }) => {
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
    await expect(table).toBeVisible()

    // AxeBuilder scoped to the table; assert zero color-contrast violations.
    // On group_by=imtId the merged-group table is the only <table> rendered.
    const results = await new AxeBuilder({ page })
      .include('table')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const contrast = results.violations.filter(v => v.id === 'color-contrast')
    expect(contrast).toEqual([])
    routes.assertNoUnexpectedRequests()
  })
})
