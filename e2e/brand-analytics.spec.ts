import { expect, test, type Page } from './fixtures/network-test'
import { TIMEOUTS } from './fixtures/test-data'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

const BRAND_ROUTE = '/analytics/brand?weekStart=2026-W05&weekEnd=2026-W05'
const BRAND_MARKER = 'Бренд Story 162.6'
const BRAND_EMPTY_TEXT = 'Нет данных за выбранную неделю'
const BRAND_ERROR_MESSAGE = 'Story 162.6 brand fixture failure'

async function prepare(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

/** Terminal states for the brand page driven by the route controller's mode/outcome. */
function brandTerminal(page: Page) {
  return page
    .locator('main .animate-pulse')
    .or(page.getByRole('cell', { name: BRAND_MARKER, exact: true }))
    .or(page.getByText(BRAND_EMPTY_TEXT, { exact: true }))
    .or(page.getByText(BRAND_ERROR_MESSAGE, { exact: true }))
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

test.describe('Brand analytics fixture terminal modes', () => {
  test('renders the named empty terminal when the brand route resolves to an empty payload', async ({
    page,
  }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: { mode: 'empty' },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.weeklyByBrand')

    await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
    await request

    await expect(brandTerminal(page).last()).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByText(BRAND_EMPTY_TEXT, { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true })).toHaveCount(0)
    routes.assertNoUnexpectedRequests()
  })

  test('renders the named error terminal when the brand route resolves to a failure payload', async ({
    page,
  }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: {
        mode: 'error',
        error: { error: { code: 'STORY_162_6', message: BRAND_ERROR_MESSAGE } },
      },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const request = routes.waitForAttempt('analytics.weeklyByBrand')

    await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
    await request

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по брендам', level: 1 })
    ).toBeVisible()
    await expect(page.getByText(BRAND_ERROR_MESSAGE, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible()
    await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true })).toHaveCount(0)
    routes.assertNoUnexpectedRequests()
  })

  test('holds the loading terminal then resolves the empty terminal on release(name, "empty")', async ({
    page,
  }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: { mode: 'deferred' },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const intercepted = routes.waitForAttempt('analytics.weeklyByBrand')

    try {
      await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
      await intercepted
      await expect(page.locator('main .animate-pulse')).toHaveCount(2)
      await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true })).toHaveCount(0)
      await expect(page.getByText(BRAND_EMPTY_TEXT, { exact: true })).toHaveCount(0)
    } finally {
      routes.release('analytics.weeklyByBrand', 'empty')
    }

    await expect(brandTerminal(page).last()).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByText(BRAND_EMPTY_TEXT, { exact: true })).toBeVisible()
    await expect(page.locator('main .animate-pulse')).toHaveCount(0)
    await expect(page.getByRole('cell', { name: BRAND_MARKER, exact: true })).toHaveCount(0)
    routes.assertNoUnexpectedRequests()
  })

  test('holds the loading terminal then resolves the error terminal on release(name, "error")', async ({
    page,
  }) => {
    await prepare(page)
    const routes = await installStory1626AnalyticsRoutes(page, {
      weeklyByBrand: {
        mode: 'deferred',
        error: { error: { code: 'STORY_162_6', message: BRAND_ERROR_MESSAGE } },
      },
      weeklyCabinetExpenses: { mode: 'data' },
    })
    const intercepted = routes.waitForAttempt('analytics.weeklyByBrand')

    try {
      await page.goto(BRAND_ROUTE, { waitUntil: 'domcontentloaded' })
      await intercepted
      await expect(page.locator('main .animate-pulse')).toHaveCount(2)
      await expect(page.getByText(BRAND_ERROR_MESSAGE, { exact: true })).toHaveCount(0)
    } finally {
      routes.release('analytics.weeklyByBrand', 'error')
    }

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по брендам', level: 1 })
    ).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(BRAND_ERROR_MESSAGE, { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible()
    await expect(page.locator('main .animate-pulse')).toHaveCount(0)
    routes.assertNoUnexpectedRequests()
  })
})
