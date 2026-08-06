import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'
import { DASHBOARD_METRICS_SELECTORS as S } from './fixtures/dashboard-metrics-test-data'
import { installStory1626DashboardRoutes } from './fixtures/story-162-6-dashboard'

async function openDashboard(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
  await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
}

function dailyTerminalState(page: Page) {
  const section = page.locator(S.dailyBreakdownSection)
  return page
    .locator(S.chartContainer)
    .or(page.locator(S.dailyMetricsTable))
    .or(section.getByText('Нет данных для отображения', { exact: true }))
    .or(section.getByText('Нет данных за выбранный период', { exact: true }))
    .or(section.getByText(/^Ошибка загрузки данных:/))
}

async function switchToTable(page: Page): Promise<void> {
  const button = page.locator(S.viewTableButton)
  await expect(button).toBeVisible()
  await button.click()
  await expect(button).toHaveAttribute('aria-checked', 'true')
  await expect(
    page
      .locator(S.dailyMetricsTable)
      .or(page.getByText('Нет данных за выбранный период', { exact: true }))
      .or(page.getByText(/^Ошибка загрузки данных:/))
      .first()
  ).toBeVisible({ timeout: TIMEOUTS.api })
}

test.describe('Dashboard metrics observable state', () => {
  test.beforeEach(async ({ page }) => {
    await openDashboard(page)
  })

  test('renders the P&L metric grid with named metric values', async ({ page }) => {
    const grid = page.locator(S.metricsGrid)
    await expect(grid).toHaveAttribute('aria-label', 'Основные метрики P&L')
    await expect(grid.getByRole('article', { name: /Заказы, шт:/ })).toBeVisible()
    await expect(grid.locator(S.metricValue).first()).toBeVisible()
  })

  test('renders a terminal daily chart state without elapsed-time guesses', async ({ page }) => {
    const chartButton = page.locator(S.viewChartButton)
    await chartButton.click()
    await expect(chartButton).toHaveAttribute('aria-checked', 'true')
    await expect(dailyTerminalState(page).first()).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('chart legend toggles expose the resulting aria state', async ({ page }) => {
    const chartButton = page.locator(S.viewChartButton)
    await chartButton.click()
    await expect(chartButton).toHaveAttribute('aria-checked', 'true')

    const legendItem = page.locator('button[data-metric]').first()
    await expect(legendItem).toBeVisible({ timeout: TIMEOUTS.api })
    const initial = await legendItem.getAttribute('aria-checked')
    expect(initial).toMatch(/^(true|false)$/)
    await legendItem.click()
    await expect(legendItem).toHaveAttribute('aria-checked', initial === 'true' ? 'false' : 'true')
  })

  test('chart/table selection persists through aria and mounted view state', async ({ page }) => {
    await switchToTable(page)
    await expect(page.locator(S.dailyMetricsTable)).toBeVisible()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator(S.viewTableButton)).toHaveAttribute('aria-checked', 'true', {
      timeout: TIMEOUTS.api,
    })
    await expect(page.locator(S.dailyMetricsTable)).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('table exposes source-backed headers and rows', async ({ page }) => {
    await switchToTable(page)
    const table = page.locator(S.dailyMetricsTable)
    await expect(table).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(table.locator('thead th').first()).toBeVisible()
    await expect(table.locator('tbody tr').first()).toBeVisible()
  })

  test('mobile table container has an observable horizontal overflow policy', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await switchToTable(page)
    const container = page.locator(S.dailyMetricsTable).locator('xpath=..')
    await expect(container).toBeVisible()
    await expect
      .poll(() => container.evaluate(node => getComputedStyle(node).overflowX))
      .toMatch(/^(auto|scroll)$/)
  })

  test('dashboard metrics have no critical accessibility violations', async ({ page }) => {
    await expect(page.locator(S.metricsGrid).locator(S.metricCard).first()).toBeVisible()
    const results = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze()
    const blocking = results.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    )
    expect(blocking).toHaveLength(0)
  })
})

test.describe('Dashboard exact route synchronization', () => {
  test('uses only the exact orders-volume route with required date query', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      ordersVolume: { mode: 'data' },
    })
    const request = routes.waitForAttempt('dashboard.ordersVolume')

    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    const accepted = await request
    const url = new URL(accepted.url)
    expect(url.pathname).toBe('/v1/analytics/orders/volume')
    expect(url.searchParams.get('from')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(url.searchParams.get('to')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(url.searchParams.get('include_cogs')).toBe('true')
    await expect(dailyTerminalState(page).first()).toBeVisible({ timeout: TIMEOUTS.api })
    routes.assertNoUnexpectedRequests()
  })

  test('holds and releases finance loading with a timer-free deferred gate', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      financeSummary: { mode: 'deferred' },
    })
    const intercepted = routes.waitForAttempt('dashboard.financeSummary')

    try {
      await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
      await intercepted
      await expect(page.getByRole('region', { name: 'Загрузка сравнения периодов' })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
    } finally {
      routes.release('dashboard.financeSummary')
    }

    await expect(page.getByRole('region', { name: 'Загрузка сравнения периодов' })).toHaveCount(0, {
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByRole('region', { name: 'Сравнение периодов' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
    routes.assertNoUnexpectedRequests()
  })

  test('keeps finance failures failing until Retry is explicitly allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      financeSummary: { mode: 'retry' },
    })
    const secondAttempt = routes.waitForAttempt('dashboard.financeSummary', 2)

    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await secondAttempt
    const retry = page.getByRole('button', { name: 'Повторить' }).first()
    await expect(retry).toBeVisible({ timeout: TIMEOUTS.api })
    expect(routes.attemptCount('dashboard.financeSummary')).toBeGreaterThanOrEqual(2)

    routes.allowRetrySuccess('dashboard.financeSummary')
    const successAttempt = routes.waitForAttempt(
      'dashboard.financeSummary',
      routes.attemptCount('dashboard.financeSummary') + 1
    )
    await retry.click()
    await successAttempt
    await expect(page.locator(S.metricsGrid)).toBeVisible({ timeout: TIMEOUTS.api })
    routes.assertNoUnexpectedRequests()
  })
})
