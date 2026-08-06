import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'
import { PERIOD_SELECTORS as P } from './fixtures/period-test-data'
import { installStory1626DashboardRoutes } from './fixtures/story-162-6-dashboard'

const PERIOD_STORAGE_KEY = 'dashboard-period-type'

async function openDashboard(page: Page, url = ROUTES.dashboard): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await expect(page.locator(P.periodToggle)).toBeVisible({ timeout: TIMEOUTS.api })
}

function isExactFinanceResponse(response: { url: () => string; status: () => number }): boolean {
  const url = new URL(response.url())
  return (
    url.pathname === '/v1/analytics/weekly/finance-summary' &&
    response.status() === 200 &&
    ((url.searchParams.size === 1 && /^\d{4}-W\d{2}$/.test(url.searchParams.get('week') ?? '')) ||
      (url.searchParams.size === 1 && /^\d{4}-\d{2}$/.test(url.searchParams.get('month') ?? '')))
  )
}

test.describe('Dashboard period observable state', () => {
  test.beforeEach(async ({ page }) => {
    await openDashboard(page)
  })

  test('switches month/week through data-state, URL and localStorage', async ({ page }) => {
    const week = page.locator(P.weekTab)
    const month = page.locator(P.monthTab)
    await expect(week).toHaveAttribute('data-state', 'active')

    await month.click()
    await expect(month).toHaveAttribute('data-state', 'active')
    await expect(week).toHaveAttribute('data-state', 'inactive')
    await expect(page).toHaveURL(/[?&]type=month(?:&|$)/)
    await expect(page).toHaveURL(/[?&]month=\d{4}-\d{2}(?:&|$)/)
    await expect(page.locator(P.monthDropdown)).toBeVisible()
    await expect
      .poll(() => page.evaluate(key => localStorage.getItem(key), PERIOD_STORAGE_KEY))
      .toBe('month')

    await week.click()
    await expect(week).toHaveAttribute('data-state', 'active')
    await expect(page).toHaveURL(/[?&]type=week(?:&|$)/)
    await expect(page).toHaveURL(/[?&]week=\d{4}-W\d{2}(?:&|$)/)
    await expect
      .poll(() => page.evaluate(key => localStorage.getItem(key), PERIOD_STORAGE_KEY))
      .toBe('week')
  })

  test('selects a week and proves exact finance request plus selected-period UI', async ({
    page,
  }) => {
    const selector = page.locator(P.weekDropdown)
    await expect(page).toHaveURL(/[?&]week=\d{4}-W\d{2}(?:&|$)/)
    const currentWeek = new URL(page.url()).searchParams.get('week')
    expect(currentWeek).toMatch(/^\d{4}-W\d{2}$/)
    await selector.click()
    const options = page.getByRole('option')
    const target = options.last()
    await expect(target).toBeVisible()

    const responsePromise = page.waitForResponse(response => {
      if (!isExactFinanceResponse(response)) return false
      const requestedWeek = new URL(response.url()).searchParams.get('week')
      return requestedWeek !== null && requestedWeek !== currentWeek
    })
    await target.click()
    const response = await responsePromise
    const selectedWeek = new URL(response.url()).searchParams.get('week')
    expect(selectedWeek).toMatch(/^\d{4}-W\d{2}$/)
    await expect(page).toHaveURL(new RegExp(`[?&]week=${selectedWeek}(?:&|$)`))
    await expect(page.locator(P.periodContextLabel)).toContainText(/Неделя \d+, \d{4}/)
    await expect(page.locator(P.metricCard).first()).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('direct week URL survives reload and renders the matching period context', async ({
    page,
  }) => {
    const firstResponse = page.waitForResponse(response => {
      if (!isExactFinanceResponse(response)) return false
      return new URL(response.url()).searchParams.get('week') === '2026-W03'
    })
    await openDashboard(page, `${ROUTES.dashboard}?week=2026-W03&type=week`)
    expect((await firstResponse).status()).toBe(200)
    await expect(page).toHaveURL(/[?&]week=2026-W03(?:&|$)/)
    await expect(page.locator(P.weekTab)).toHaveAttribute('data-state', 'active')
    await expect(page.locator(P.periodContextLabel)).toContainText(/Неделя 3, 2026/)
    await expect(
      page
        .locator('[role="region"][aria-label="Основные метрики P&L"]')
        .getByRole('article', { name: /Заказы, шт: 5 шт/ })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const reloadResponse = page.waitForResponse(response => {
      if (!isExactFinanceResponse(response)) return false
      return new URL(response.url()).searchParams.get('week') === '2026-W03'
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    expect((await reloadResponse).status()).toBe(200)
    await expect(page.locator(P.periodContextLabel)).toContainText(/Неделя 3, 2026/, {
      timeout: TIMEOUTS.api,
    })
    await expect(page).toHaveURL(/[?&]week=2026-W03(?:&|$)/)
  })

  test('refresh registers the exact response waiter before the action', async ({ page }) => {
    const refresh = page.locator(P.refreshButton)
    await expect(refresh).toBeEnabled()
    const responsePromise = page.waitForResponse(isExactFinanceResponse)
    await refresh.click()
    await responsePromise
    await expect(page.locator(P.refreshSpinner)).toBeVisible()
    await expect(page.locator(P.refreshSpinner)).toHaveCount(0, { timeout: TIMEOUTS.api })
    await expect(page.locator(P.lastUpdated)).toContainText(/^Обновлено:/)
  })

  test('period tabs are operable from the keyboard', async ({ page }) => {
    const month = page.locator(P.monthTab)
    await month.focus()
    await expect(month).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(month).toHaveAttribute('data-state', 'active')

    const week = page.locator(P.weekTab)
    await week.focus()
    await page.keyboard.press('Enter')
    await expect(week).toHaveAttribute('data-state', 'active')
  })

  test('rapid client-only switches settle on the asserted control and URL state', async ({
    page,
  }) => {
    const month = page.locator(P.monthTab)
    const week = page.locator(P.weekTab)
    for (let index = 0; index < 3; index += 1) {
      await month.click()
      await expect(month).toHaveAttribute('data-state', 'active')
      await week.click()
      await expect(week).toHaveAttribute('data-state', 'active')
    }
    await expect(page).toHaveURL(/[?&]type=week(?:&|$)/)
  })

  test('period selector has no critical or serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).include(P.periodSelectorContainer).analyze()
    const blocking = results.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    )
    expect(blocking).toHaveLength(0)
  })
})

test.describe('Dashboard period deterministic loading', () => {
  test('holds selected-period finance and releases it from finally', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      financeSummary: { mode: 'deferred' },
    })
    const intercepted = routes.waitForAttempt('dashboard.financeSummary')

    try {
      await page.goto(`${ROUTES.dashboard}?week=2026-W03&type=week`, {
        waitUntil: 'domcontentloaded',
      })
      const request = await intercepted
      expect(new URL(request.url).searchParams.get('week')).toBe('2026-W03')
      await expect(page.getByRole('region', { name: 'Загрузка сравнения периодов' })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
      await expect(page.locator(P.periodToggle)).toBeVisible()
    } finally {
      routes.release('dashboard.financeSummary')
    }

    await expect(page.getByRole('region', { name: 'Загрузка сравнения периодов' })).toHaveCount(0, {
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByRole('region', { name: 'Сравнение периодов' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.locator(P.metricCard).first()).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page).toHaveURL(/[?&]week=2026-W03(?:&|$)/)
    routes.assertNoUnexpectedRequests()
  })
})
