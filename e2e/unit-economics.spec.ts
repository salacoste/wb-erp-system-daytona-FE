import type { Page, Response } from '@playwright/test'
import { test, expect } from './fixtures/network-test'
import { installStory1625AnalyticsRoutes } from './fixtures/story-162-5-analytics'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const UNIT_ECONOMICS_PATH = '/v1/analytics/unit-economics'

function matchesUnitEconomicsResponse(
  response: Response,
  expectedQuery: Record<string, string>,
  status = 200
) {
  const url = new URL(response.url())
  const queryKeys = [...url.searchParams.keys()]
  return (
    response.request().method() === 'GET' &&
    url.pathname === UNIT_ECONOMICS_PATH &&
    response.status() === status &&
    queryKeys.length === Object.keys(expectedQuery).length &&
    Object.entries(expectedQuery).every(([key, value]) => url.searchParams.get(key) === value)
  )
}

function queryFor(week: string, overrides: Record<string, string> = {}) {
  return {
    week,
    view_by: 'sku',
    sort_by: 'revenue',
    sort_order: 'desc',
    limit: '200',
    ...overrides,
  }
}

async function expectUnitEconomicsShell(page: Page) {
  await expect(page.getByRole('heading', { name: 'Юнит-экономика', level: 1 })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
  await expect(page.getByRole('combobox', { name: 'Выбор недели' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible()
}

async function expectUnitEconomicsData(page: Page, marker?: RegExp) {
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: TIMEOUTS.api })
  await expect(page.getByText('Структура затрат', { exact: true })).toBeVisible({
    timeout: TIMEOUTS.api,
  })
  await expect(page.getByRole('img', { name: 'График структуры затрат' })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Юнит-экономика по товарам' })).toBeVisible()
  if (marker) {
    await expect(
      page.getByRole('table', { name: 'Юнит-экономика по товарам' }).getByText(marker).first()
    ).toBeVisible()
  }
}

function unitEconomicsTable(page: Page) {
  return page.getByRole('table', { name: 'Юнит-экономика по товарам' })
}

async function expectFirstUnitEconomicsSku(page: Page, sku: string) {
  await expect(
    unitEconomicsTable(page).getByRole('row').nth(1).getByRole('cell').first()
  ).toHaveText(sku)
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

async function openUnitEconomics(page: Page) {
  const controller = await installStory1625AnalyticsRoutes(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const initialResponse = page.waitForResponse(response => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'GET' &&
      url.pathname === UNIT_ECONOMICS_PATH &&
      response.status() === 200 &&
      url.searchParams.get('view_by') === 'sku' &&
      url.searchParams.get('sort_by') === 'revenue' &&
      url.searchParams.get('sort_order') === 'desc'
    )
  })
  await page.goto(ROUTES.analytics.unitEconomics)
  const response = await initialResponse
  const week = new URL(response.url()).searchParams.get('week')
  if (!week) throw new Error('Initial Unit Economics request did not include a week')
  await expectUnitEconomicsShell(page)
  await expectUnitEconomicsData(page, new RegExp(`UE ${week} sku revenue desc`))
  await expectFirstUnitEconomicsSku(page, '700052')
  controller.assertNoUnexpectedRequests()
  return { controller, week }
}

test.describe('Unit Economics — Story 162.5 deterministic synchronization', () => {
  test('renders deterministic summary, waterfall, statuses, and 52-row pagination state', async ({
    page,
  }) => {
    const { week } = await openUnitEconomics(page)

    await expect(page.getByText('Ваша цена', { exact: true })).toBeVisible()
    await expect(page.getByText('Выручка', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Прибыльные', { exact: true })).toBeVisible()
    await expect(page.getByText('Убыточные', { exact: true })).toBeVisible()
    await expect(page.getByText('Показано 1–50 из 52 записей', { exact: true })).toBeVisible()
    await expect(page.locator('svg.recharts-surface')).toBeVisible()
    await expect(page.getByText(new RegExp(`UE ${week} sku revenue desc`)).first()).toBeVisible()
  })

  test('changes week through an exact request and visible marker', async ({ page }) => {
    const { controller, week: initialWeek } = await openUnitEconomics(page)
    const selector = page.getByRole('combobox', { name: 'Выбор недели' })
    await selector.click()
    const alternateOption = page.getByRole('option').filter({ hasNotText: initialWeek }).first()
    const optionText = (await alternateOption.textContent()) ?? ''
    const selectedWeek = optionText.match(/\d{4}-W\d{2}/)?.[0]
    if (!selectedWeek) throw new Error(`Could not derive ISO week from option: ${optionText}`)

    const changed = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(response, queryFor(selectedWeek))
    )
    await alternateOption.click()
    await changed
    await expectUnitEconomicsData(page, new RegExp(`UE ${selectedWeek} sku revenue desc`))
    await expect(selector).toContainText(selectedWeek)
    controller.assertNoUnexpectedRequests()
  })

  test('changes aggregation view through an exact request and visible marker', async ({ page }) => {
    const { controller, week } = await openUnitEconomics(page)
    const categoryTab = page.getByRole('tab', { name: 'Категория' })
    const changed = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(response, queryFor(week, { view_by: 'category' }))
    )
    await categoryTab.click()
    await changed

    await expect(categoryTab).toHaveAttribute('data-state', 'active')
    await expectUnitEconomicsData(page, new RegExp(`UE ${week} category revenue desc`))
    await expect(page.getByText('Показано 1–4 из 4 записей', { exact: true })).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('sorts revenue and margin through exact requests and visible row markers', async ({
    page,
  }) => {
    const { controller, week } = await openUnitEconomics(page)
    const revenueSort = page.getByRole('button', { name: 'Сортировать по выручке' })
    const revenueAscending = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(response, queryFor(week, { sort_order: 'asc' }))
    )
    await revenueSort.click()
    await revenueAscending
    await expectUnitEconomicsData(page, new RegExp(`UE ${week} sku revenue asc`))
    await expect(revenueSort.locator('xpath=ancestor::th')).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    await expectFirstUnitEconomicsSku(page, '700001')

    const marginSort = page.getByRole('button', { name: 'Сортировать по марже' })
    const marginDescending = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(
        response,
        queryFor(week, { sort_by: 'net_margin_pct', sort_order: 'desc' })
      )
    )
    await marginSort.click()
    await marginDescending
    await expectUnitEconomicsData(page, new RegExp(`UE ${week} sku net_margin_pct desc`))
    await expect(marginSort.locator('xpath=ancestor::th')).toHaveAttribute(
      'aria-sort',
      'descending'
    )
    await expectFirstUnitEconomicsSku(page, '700037')

    const marginAscending = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(
        response,
        queryFor(week, { sort_by: 'net_margin_pct', sort_order: 'asc' })
      )
    )
    await marginSort.click()
    await marginAscending
    await expectUnitEconomicsData(page, new RegExp(`UE ${week} sku net_margin_pct asc`))
    await expect(marginSort.locator('xpath=ancestor::th')).toHaveAttribute('aria-sort', 'ascending')
    await expectFirstUnitEconomicsSku(page, '700001')
    controller.assertNoUnexpectedRequests()
  })

  test('sorts delivery client-side with nulls last and no invented API request', async ({
    page,
  }) => {
    const { controller } = await openUnitEconomics(page)
    const table = unitEconomicsTable(page)
    const beforeSku = await table.getByRole('row').nth(1).getByRole('cell').first().textContent()
    const deliverySort = page.getByRole('button', { name: 'Сортировать по доставке' })

    await deliverySort.click()
    await expect(deliverySort.locator('xpath=ancestor::th')).toHaveAttribute(
      'aria-sort',
      'descending'
    )
    await expect(table.getByRole('row').nth(1).getByRole('cell').first()).not.toHaveText(
      beforeSku ?? ''
    )
    await expect(table.getByRole('row').nth(1)).toContainText('700051')
    await expectFirstUnitEconomicsSku(page, '700051')
    controller.assertNoUnexpectedRequests()
  })

  test('rejects sibling paths, methods, and query drift across UE and FCU families', async ({
    page,
  }) => {
    const { controller, week } = await openUnitEconomics(page)
    const query = `week=${week}&view_by=sku&sort_by=revenue&sort_order=desc&limit=200`
    const results = await fetchRejectedRequests(page, [
      { path: `/v1/analytics/unit-economics/export?${query}` },
      { path: `/v1/analytics/unit-economics?${query}`, method: 'POST' },
      { path: `/v1/analytics/unit-economics?${query}&unexpected=1` },
      { path: `/v1/shipment-cost/by-sku/export?week=${week}` },
      { path: `/v1/shipment-cost/by-sku?week=${week}`, method: 'PUT' },
      { path: `/v1/shipment-cost/by-sku?week=${week}&unexpected=1` },
    ])

    expect(results).toEqual(
      Array.from({ length: 6 }, () => ({ status: 400, code: 'STORY_162_5_REJECTED' }))
    )
    expect(controller.rejectedRequests()).toEqual([
      'Story 162.5 fixture rejected pathname /v1/analytics/unit-economics/export',
      'Story 162.5 fixture rejected POST /v1/analytics/unit-economics',
      'Story 162.5 fixture rejected query key unexpected',
      'Story 162.5 fixture rejected pathname /v1/shipment-cost/by-sku/export',
      'Story 162.5 fixture rejected PUT /v1/shipment-cost/by-sku',
      'Story 162.5 fixture rejected query key unexpected',
    ])
  })

  test('filters profitability through URL and table state without an API request', async ({
    page,
  }) => {
    const { controller } = await openUnitEconomics(page)
    await page.getByRole('button', { name: 'Фильтр по рентабельности' }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Убыток' }).click()

    await expect(page).toHaveURL(/(?:\?|&)status=loss(?:&|$)/)
    const table = page.getByRole('table', { name: 'Юнит-экономика по товарам' })
    await expect(table.getByRole('row')).toHaveCount(2)
    await expect(table.getByText('Убыток', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Сбросить фильтр' })).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('selects a row for the waterfall and resets selection semantically', async ({ page }) => {
    const { controller } = await openUnitEconomics(page)
    const table = page.getByRole('table', { name: 'Юнит-экономика по товарам' })
    const firstRow = table.getByRole('row').nth(1)
    const productName = (await firstRow
      .getByRole('cell')
      .nth(1)
      .locator('div')
      .first()
      .textContent())!

    await firstRow.click()
    // 168.11: selected-row migrated bg-blue-50 -> status-information/10 (token pin updated)
    await expect(firstRow).toHaveClass(/bg-status-information\/10/)
    await expect(page.getByText(productName, { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Сбросить' })).toBeVisible()
    await page.getByRole('button', { name: 'Сбросить' }).click()
    await expect(page.getByText('Все товары (портфель)', { exact: true })).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('paginates, preserves sticky header state, and exports CSV through browser state', async ({
    page,
  }) => {
    const { controller, week } = await openUnitEconomics(page)
    const table = page.getByRole('table', { name: 'Юнит-экономика по товарам' })
    const scrollContainer = table.locator(
      'xpath=ancestor::div[contains(@class, "max-h-[600px]")][1]'
    )
    await scrollContainer.evaluate(element => {
      element.scrollTop = 240
    })
    await expect
      .poll(() => scrollContainer.evaluate(element => element.scrollTop))
      .toBeGreaterThan(0)
    await expect(table.locator('thead')).toHaveClass(/sticky top-0/)

    const pager = page.getByText('1 / 2', { exact: true }).locator('..')
    await pager.getByRole('button').last().click()
    await expect(page.getByText('2 / 2', { exact: true })).toBeVisible()
    await expect(page.getByText('Показано 51–52 из 52 записей', { exact: true })).toBeVisible()

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSV' }).click()
    expect((await download).suggestedFilename()).toBe(`unit-economics-${week}.csv`)
    controller.assertNoUnexpectedRequests()
  })

  test('refreshes through an exact successful analytics request', async ({ page }) => {
    const { controller, week } = await openUnitEconomics(page)
    const refreshed = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(response, queryFor(week))
    )
    await page.getByRole('button', { name: 'Обновить' }).click()
    await refreshed
    await expectUnitEconomicsData(page, new RegExp(`UE ${week} sku revenue desc`))
    await expect(page.getByText(/^Обновлено /)).toBeVisible()
    controller.assertNoUnexpectedRequests()
  })

  test('holds loading state behind a timer-free deferred release', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { unitEconomics: 'deferred' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.unitEconomics)
    await expectUnitEconomicsShell(page)

    try {
      await expect(page.locator('.animate-pulse').first()).toBeVisible({ timeout: TIMEOUTS.api })
    } finally {
      controller.releaseUnitEconomics()
    }

    await expectUnitEconomicsData(page, /UE \d{4}-W\d{2} sku revenue desc/)
    controller.assertNoUnexpectedRequests()
  })

  test('renders exact error and retry terminal states with a handler-local gate', async ({
    page,
  }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { unitEconomics: 'retry' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const originalFailure = page.waitForResponse(response => {
      const week = new URL(response.url()).searchParams.get('week')
      return (
        week !== null &&
        /^\d{4}-W\d{2}$/.test(week) &&
        matchesUnitEconomicsResponse(response, queryFor(week), 500)
      )
    })
    await page.goto(ROUTES.analytics.unitEconomics)
    const failedResponse = await originalFailure
    const expectedWeek = new URL(failedResponse.url()).searchParams.get('week')
    if (!expectedWeek) throw new Error('Original failed Unit Economics request omitted its week')

    await expect(page.getByText('Не удалось загрузить данные. Попробуйте ещё раз.')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    const selector = page.getByRole('combobox', { name: 'Выбор недели' })
    await expect(selector).toContainText(expectedWeek)

    const recovered = page.waitForResponse(response =>
      matchesUnitEconomicsResponse(response, queryFor(expectedWeek))
    )
    controller.allowUnitEconomicsRetrySuccess()
    await page.getByRole('button', { name: 'Повторить' }).click()
    await recovered
    await expectUnitEconomicsData(page, new RegExp(`UE ${expectedWeek} sku revenue desc`))
    await expect(selector).toContainText(expectedWeek)
    controller.assertNoUnexpectedRequests()
  })

  test('renders the exact empty terminal state', async ({ page }) => {
    const controller = await installStory1625AnalyticsRoutes(page, { unitEconomics: 'empty' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(ROUTES.analytics.unitEconomics)

    await expect(page.getByRole('heading', { name: 'Нет данных за выбранный период' })).toBeVisible(
      {
        timeout: TIMEOUTS.api,
      }
    )
    await expect(page.locator('.animate-pulse')).toHaveCount(0)
    controller.assertNoUnexpectedRequests()
  })

  test('keeps terminal controls and table usable at a compact viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    await openUnitEconomics(page)

    await expect(page.getByRole('heading', { name: 'Юнит-экономика' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible()
    await expect(page.getByRole('table', { name: 'Юнит-экономика по товарам' })).toBeVisible()
  })
})
