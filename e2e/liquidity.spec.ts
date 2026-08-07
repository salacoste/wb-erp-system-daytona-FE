import type { Page, Request, Response } from '@playwright/test'
import { test, expect } from './fixtures/network-test'
import { installStory1625AnalyticsRoutes } from './fixtures/story-162-5-analytics'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const LIQUIDITY_PATH = '/v1/analytics/liquidity'
const TRENDS_PATH = '/v1/analytics/liquidity/trends'
const INITIAL_QUERY = { sort_by: 'turnover_days', sort_order: 'desc', limit: '200' }

function matchesLiquidityResponse(
  response: Response,
  expectedQuery: Record<string, string>,
  status = 200
) {
  const url = new URL(response.url())
  const queryKeys = [...url.searchParams.keys()]
  return (
    response.request().method() === 'GET' &&
    url.pathname === LIQUIDITY_PATH &&
    response.status() === status &&
    queryKeys.length === Object.keys(expectedQuery).length &&
    Object.entries(expectedQuery).every(([key, value]) => url.searchParams.get(key) === value)
  )
}

function matchesLiquidityRequest(request: Request, expectedQuery: Record<string, string>) {
  const url = new URL(request.url())
  return (
    request.method() === 'GET' &&
    url.pathname === LIQUIDITY_PATH &&
    Object.entries(expectedQuery).every(([key, value]) => url.searchParams.get(key) === value)
  )
}

async function expectLiquidityShell(page: Page) {
  await expect(page.getByRole('heading', { name: 'Ликвидность товаров', level: 1 })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
  await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible()
}

async function expectLiquidityData(page: Page, marker?: RegExp) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: TIMEOUTS.api })
  await expect(page.getByText('Распределение по ликвидности', { exact: true })).toBeVisible({
    timeout: TIMEOUTS.api,
  })
  await expect(page.getByRole('table')).toBeVisible()
  if (marker) await expect(page.getByRole('table').getByText(marker).first()).toBeVisible()
}

async function expectFirstLiquiditySku(page: Page, sku: string) {
  await expect(page.getByRole('table').getByRole('row').nth(1)).toContainText(sku)
}

async function fetchRejectedRequests(
  page: Page,
  requests: Array<{ path: string; method?: string }>
) {
  return page.evaluate(async rejectedRequests => {
    const results: Array<{ status: number; code: string }> = []
    for (const request of rejectedRequests) {
      const response = await fetch(request.path, { method: request.method ?? 'GET' })
      const body = (await response.json()) as { error: { code: string } }
      results.push({ status: response.status, code: body.error.code })
    }
    return results
  }, requests)
}

async function openLiquidity(page: Page) {
  const controller = await installStory1625AnalyticsRoutes(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const response = page.waitForResponse(candidate =>
    matchesLiquidityResponse(candidate, INITIAL_QUERY)
  )
  await page.goto(ROUTES.analytics.liquidity)
  await response
  await expectLiquidityShell(page)
  await expectLiquidityData(page, /LQ all turnover_days desc/)
  await expectFirstLiquiditySku(page, 'LQ-008')
  controller.assertNoUnexpectedRequests()
  return controller
}

test.describe('Liquidity Analysis — Story 162.5 deterministic synchronization', () => {
  test('renders the analytics shell, chart, summary, benchmarks, and deterministic table', async ({
    page,
  }) => {
    await openLiquidity(page)

    await expect(page.getByText('Высоколиквидный', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Средняя ликвидность', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Низкая ликвидность', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Неликвид', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Всего на складе', { exact: true })).toBeVisible()
    await expect(page.getByText('Замороженный капитал', { exact: true })).toBeVisible()
    await expect(page.getByText('Сравнение с целями', { exact: true })).toBeVisible()
    await expect(page.getByText('Всего артикулов: 8', { exact: true })).toBeVisible()
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible()
  })

  test('filters and clears a category using exact requests and visible table state', async ({
    page,
  }) => {
    const controller = await openLiquidity(page)
    const illiquidCardLabel = page.getByText('Неликвид', { exact: true }).first()
    const illiquidCard = illiquidCardLabel.locator(
      'xpath=ancestor::div[contains(@class, "cursor-pointer")][1]'
    )
    await expect(illiquidCardLabel).toBeVisible()

    const filteredRequest = page.waitForRequest(request =>
      matchesLiquidityRequest(request, { ...INITIAL_QUERY, category_filter: 'illiquid' })
    )
    await illiquidCard.click()
    await filteredRequest
    await expectLiquidityData(page, /LQ illiquid turnover_days desc/)
    await expect(page.getByText('2 товаров', { exact: true })).toBeVisible()
    await expect(page.getByRole('table').getByRole('cell', { name: /Неликвид$/ })).toHaveCount(2)

    await illiquidCard.click()
    await expectLiquidityData(page, /LQ all turnover_days desc/)
    await expect(page.getByText('8 товаров', { exact: true })).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('sorts from the clickable column header with exact query and row evidence', async ({
    page,
  }) => {
    await page.clock.install()
    const controller = await openLiquidity(page)
    const turnoverHeader = page.getByRole('columnheader', { name: /Оборот/ })
    await expect(turnoverHeader).toBeVisible()

    const ascendingResponse = page.waitForResponse(response =>
      matchesLiquidityResponse(response, { ...INITIAL_QUERY, sort_order: 'asc' })
    )
    await turnoverHeader.click()
    await ascendingResponse
    await expect(turnoverHeader).toHaveAttribute('class', /cursor-pointer/)
    await expectLiquidityData(page, /LQ all turnover_days asc/)
    await expect(
      page.getByRole('table').getByText('LQ all turnover_days asc · товар 01')
    ).toBeVisible()
    await expectFirstLiquiditySku(page, 'LQ-001')

    const stockValueHeader = page.getByRole('columnheader', { name: /Стоимость/ })
    const stockValueResponse = page.waitForResponse(response =>
      matchesLiquidityResponse(response, {
        sort_by: 'frozen_capital',
        sort_order: 'desc',
        limit: '200',
      })
    )
    await stockValueHeader.click()
    await stockValueResponse
    await expectLiquidityData(page, /LQ all frozen_capital desc/)
    await expectFirstLiquiditySku(page, 'LQ-008')

    const velocityHeader = page.getByRole('columnheader', { name: /Скорость/ })
    await page.clock.setSystemTime(Date.now() + 300_001)
    const velocityResponse = page.waitForResponse(response =>
      matchesLiquidityResponse(response, INITIAL_QUERY)
    )
    await velocityHeader.click()
    await velocityResponse
    await expectLiquidityData(page, /LQ all turnover_days desc/)
    await expectFirstLiquiditySku(page, 'LQ-001')
    controller.assertNoUnexpectedRequests()
  })

  test('rejects sibling paths, methods, and query drift across the liquidity family', async ({
    page,
  }) => {
    const controller = await openLiquidity(page)
    const results = await fetchRejectedRequests(page, [
      {
        // Story 165.4-FE: /trends is now a first-class endpoint (accepts
        // period only). Sending the list endpoint's sort_by/limit query is a
        // contract violation and must be rejected.
        path: '/v1/analytics/liquidity/trends?sort_by=turnover_days&sort_order=desc&limit=200',
      },
      {
        path: '/v1/analytics/liquidity?sort_by=turnover_days&sort_order=desc&limit=200',
        method: 'POST',
      },
      {
        path: '/v1/analytics/liquidity?sort_by=turnover_days&sort_order=desc&limit=200&unexpected=1',
      },
    ])

    expect(results).toEqual([
      { status: 400, code: 'STORY_162_5_REJECTED' },
      { status: 400, code: 'STORY_162_5_REJECTED' },
      { status: 400, code: 'STORY_162_5_REJECTED' },
    ])
    expect(controller.rejectedRequests()).toEqual([
      'Story 162.5 fixture rejected query key sort_by',
      'Story 162.5 fixture rejected POST /v1/analytics/liquidity',
      'Story 162.5 fixture rejected query key unexpected',
    ])
  })

  test('refreshes through an exact successful analytics request', async ({ page }) => {
    const controller = await openLiquidity(page)
    const refreshed = page.waitForResponse(response =>
      matchesLiquidityResponse(response, INITIAL_QUERY)
    )
    await page.getByRole('button', { name: 'Обновить' }).click()
    await refreshed
    await expectLiquidityData(page, /LQ all turnover_days desc/)
    await expect(page.getByText(/^Обновлено:/)).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('expands a row and opens and closes the liquidation planner through semantic state', async ({
    page,
  }) => {
    await openLiquidity(page)
    const table = page.getByRole('table')
    const firstDataRow = table.getByRole('row').nth(1)
    await firstDataRow.click()
    await expect(table.getByRole('heading', { name: 'Рекомендация' })).toBeVisible()
    await expect(table.getByText(/SKU: LQ-/)).toBeVisible()

    await page.getByRole('button', { name: 'Ликвидировать' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Планировщик ликвидации' })).toBeVisible()
    await expect(dialog.getByText('Сценарии ликвидации', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Выручка', { exact: true }).first()).toBeVisible()
    await dialog.getByRole('button', { name: 'Закрыть' }).click()
    await expect(dialog).toBeHidden()
  })

  test('holds loading state behind a timer-free deferred release', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { liquidity: 'deferred' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.liquidity)
    await expectLiquidityShell(page)

    try {
      await expect(page.locator('.animate-pulse').first()).toBeVisible({ timeout: TIMEOUTS.api })
    } finally {
      controller.releaseLiquidity()
    }

    await expectLiquidityData(page, /LQ all turnover_days desc/)
    controller.assertNoUnexpectedRequests()
  })

  test('renders the exact error terminal state after retry exhaustion', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { liquidity: 'error' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.liquidity)

    await expect(
      page.getByText('Не удалось загрузить данные о ликвидности. Попробуйте ещё раз.')
    ).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('renders the exact empty terminal state', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { liquidity: 'empty' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const response = page.waitForResponse(candidate =>
      matchesLiquidityResponse(candidate, INITIAL_QUERY)
    )
    await page.goto(ROUTES.analytics.liquidity)
    await response

    await expect(page.getByRole('heading', { name: 'Нет данных о ликвидности' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.locator('.animate-pulse')).toHaveCount(0)
    controller.assertNoUnexpectedRequests()
  })

  test('recovers only after the handler-local retry success gate is opened', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { liquidity: 'retry' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.liquidity)
    await expect(
      page.getByText('Не удалось загрузить данные о ликвидности. Попробуйте ещё раз.')
    ).toBeVisible({ timeout: TIMEOUTS.api })

    controller.allowLiquidityRetrySuccess()
    const recovered = page.waitForResponse(response =>
      matchesLiquidityResponse(response, INITIAL_QUERY)
    )
    await page.getByRole('button', { name: 'Повторить' }).click()
    await recovered
    await expectLiquidityData(page, /LQ all turnover_days desc/)
    controller.assertNoUnexpectedRequests()
  })
})

test.describe('Liquidity Trends — Story 165.4-FE (independent section states)', () => {
  test('renders the trends section populated without blocking the surrounding page', async ({
    page,
  }) => {
    await openLiquidity(page)
    // Section heading present (period selector group).
    await expect(page.getByRole('group', { name: 'Период динамики' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    // The composed (main) chart rendered as SVG.
    await expect(page.locator('svg.recharts-surface').first()).toBeVisible()
    // Surrounding sections still usable.
    await expect(page.getByText('Сравнение с целями', { exact: true })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('period selector issues an exact trends request', async ({ page }) => {
    await openLiquidity(page)
    const trendsResponse = page.waitForResponse(
      response =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname === TRENDS_PATH &&
        new URL(response.url()).searchParams.get('period') === '30'
    )
    await page.getByRole('button', { name: '30 дн.' }).click()
    await trendsResponse
    await expect(page.getByRole('button', { name: '30 дн.' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  test('renders the deferred empty message when trends:[] and keeps the page usable', async ({
    page,
  }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { liquidityTrends: 'empty' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.liquidity)
    await expectLiquidityShell(page)
    await expectLiquidityData(page, /LQ all turnover_days desc/)

    // Trends section shows the deferred empty message (AC2: no synthesized points).
    await expect(page.getByText('Исторические снимки ликвидности пока не собраны')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    controller.assertNoUnexpectedRequests()
  })

  test('renders trends error + retry on malformed/unavailable response without blanking the page', async ({
    page,
  }) => {
    const controller = await installStory1625AnalyticsRoutes(page, {
      liquidityTrends: 'malformed',
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.liquidity)
    await expectLiquidityShell(page)
    await expectLiquidityData(page, /LQ all turnover_days desc/)

    // B2/M4: malformed body ({unexpected:true}) -> getLiquidityTrends THROWS ->
    // TanStack isError -> canonical RU error string + retry control.
    await expect(
      page.getByText('Не удалось загрузить динамику ликвидности. Попробуйте ещё раз.')
    ).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible()

    // AC4 independence: a sibling section + table stay visible despite the
    // trends failure (the surrounding page is NOT blanked).
    await expect(page.getByText('Сравнение с целями', { exact: true })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })
})
