/**
 * E2E Tests: Reorder Dashboard Page
 * Warehouse replenishment recommendations with fulfillment metrics.
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle on dashboards)
 * - No hard waits (anti-pattern #7); use waitForResponse or element assertions with TIMEOUTS.api
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex /\d+/, /₽/ — not exact formatted strings
 *
 * Mock body note: reorder endpoint uses skipDataUnwrap=true, so the raw response
 * shape is an array of items — NOT wrapped in { data: ... }.
 * Metrics endpoint also uses skipDataUnwrap=true, returning the metrics object directly.
 *
 * Run: npx playwright test e2e/reorder-page.spec.ts
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const REORDER_URL = '/analytics/reorder'
const REORDER_API_GLOB = '**/v1/analytics/reorder-recommendations**'

const TEST_TIMEOUT = 60_000

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function makeMockRecommendation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rec-1',
    nmId: 987654321,
    recommendedQty: 50,
    currentStock: 10,
    inTransitQty: 5,
    avgDailyDemand: 3.5,
    demandSource: 'velocity',
    leadTimeDays: 7,
    coverageDays: 3,
    orderByDate: '2026-06-10',
    stockoutDate: '2026-06-15',
    status: 'pending',
    unitCostRub: 250,
    totalReorderValue: 12500,
    computedAt: '2026-06-01T10:00:00Z',
    ...overrides,
  }
}

function makeMockMetrics(overrides: Record<string, unknown> = {}) {
  return {
    totalPending: 5,
    totalOrdered: 3,
    totalReceived: 8,
    totalExpired: 1,
    avgHoursToOrder: 12.5,
    avgHoursToReceive: 48.0,
    reorderCoveragePct: 72.0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to reorder dashboard and wait for heading to confirm hydration */
async function gotoReorder(page: import('@playwright/test').Page) {
  await page.goto(REORDER_URL, { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('heading', { name: 'Дашборд пополнения' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

/**
 * Route all reorder API endpoints to mock data.
 * Avoids duplicating route setup in every test.
 */
async function routeWithMocks(
  page: import('@playwright/test').Page,
  options: {
    recommendations?: Record<string, unknown>[]
    metrics?: Record<string, unknown>
  } = {}
) {
  const recs = options.recommendations ?? [makeMockRecommendation()]
  const metrics = options.metrics ?? makeMockMetrics()

  await page.route(REORDER_API_GLOB, (route, request) => {
    // Refresh endpoint
    if (request.url().endsWith('/refresh') && request.method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    }
    // Metrics endpoint
    if (request.url().endsWith('/metrics')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(metrics),
      })
    }
    // List endpoint (may have query params)
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(recs),
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Reorder Dashboard page', () => {
  // -------------------------------------------------------------------------
  // 1. Page renders with heading and filter controls
  // -------------------------------------------------------------------------
  test('page loads with Дашборд пополнения heading and status filter', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await routeWithMocks(page)
    await gotoReorder(page)

    await expect(page.getByRole('heading', { name: 'Дашборд пополнения' })).toBeVisible()

    // Status filter label
    await expect(page.getByText('Статус:')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 2. Fulfillment metrics cards render with labels
  // -------------------------------------------------------------------------
  test('summary cards display 4 fulfillment metric labels', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await routeWithMocks(page)
    await gotoReorder(page)

    const expectedLabels = ['Ожидают', 'Заказано', 'Получено', 'Покрытие']
    for (const label of expectedLabels) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  // -------------------------------------------------------------------------
  // 3. Recommendations table renders with column headers
  // -------------------------------------------------------------------------
  test('table renders column headers when backend has data', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await routeWithMocks(page)
    await gotoReorder(page)

    const columns = ['Артикул', 'Кол-во', 'Остаток', 'Статус', 'Действия']
    for (const col of columns) {
      await expect(page.getByRole('columnheader', { name: col })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
    }
  })

  // -------------------------------------------------------------------------
  // 4. Table rows: pending item shows "Заказано" action button
  // -------------------------------------------------------------------------
  test('pending recommendation shows Заказано action button', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const pendingItem = makeMockRecommendation({
      id: 'rec-pending',
      status: 'pending',
      nmId: 111222333,
    })
    await routeWithMocks(page, { recommendations: [pendingItem] })
    await gotoReorder(page)

    // Table with the pending item renders
    await expect(page.getByText('111222333').first()).toBeVisible({ timeout: TIMEOUTS.api })

    // Status badge "Ожидает"
    await expect(page.getByText('Ожидает').first()).toBeVisible()

    // Action button "Заказано"
    const orderBtn = page.getByRole('button', { name: /Заказано/ })
    await expect(orderBtn).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 5. Status filter: selecting a different status re-fetches data
  // -------------------------------------------------------------------------
  test('status filter changes trigger re-fetch with status parameter', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await routeWithMocks(page, {
      recommendations: [makeMockRecommendation({ status: 'pending' })],
    })
    await gotoReorder(page)

    // Open the status select
    const selectTrigger = page.locator('button[role="combobox"]').first()
    await expect(selectTrigger).toBeVisible({ timeout: TIMEOUTS.api })
    await selectTrigger.click()

    // Select "Заказано" option
    const orderedOption = page.getByRole('option', { name: 'Заказано' })
    await expect(orderedOption).toBeVisible({ timeout: TIMEOUTS.api })
    // After selecting "ordered" filter, a new request with status=ordered should fire.
    // Start waiting before the click so the assertion cannot miss a fast mocked response.
    const [filteredResponse] = await Promise.all([
      page.waitForResponse(
        resp =>
          resp.url().includes('reorder-recommendations') && resp.url().includes('status=ordered'),
        { timeout: TIMEOUTS.api }
      ),
      orderedOption.click(),
    ])
    expect(filteredResponse.status()).toBe(200)
  })

  // -------------------------------------------------------------------------
  // 6. Mark as ordered: clicking action button fires PATCH
  // -------------------------------------------------------------------------
  test('clicking Заказано button fires PATCH to update status', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const pendingItem = makeMockRecommendation({ id: 'rec-patch', status: 'pending' })
    await routeWithMocks(page, { recommendations: [pendingItem] })

    // Intercept PATCH for the specific recommendation
    let patchBody: unknown = null
    await page.route('**/v1/analytics/reorder-recommendations/rec-patch', (route, request) => {
      if (request.method() === 'PATCH') {
        patchBody = JSON.parse(request.postData() ?? '{}')
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...pendingItem, status: 'ordered' }),
      })
    })

    await gotoReorder(page)

    const orderBtn = page.getByRole('button', { name: /Заказано/ })
    await expect(orderBtn).toBeVisible({ timeout: TIMEOUTS.api })
    await orderBtn.click()

    // Wait for the PATCH to be sent
    await page
      .waitForResponse(
        resp =>
          resp.url().includes('/reorder-recommendations/rec-patch') &&
          resp.request().method() === 'PATCH',
        { timeout: TIMEOUTS.api }
      )
      .catch(() => {
        /* may have completed already */
      })

    expect(patchBody).toEqual({ status: 'ordered' })
  })

  // -------------------------------------------------------------------------
  // 7. Empty state: no recommendations
  // -------------------------------------------------------------------------
  test('empty response renders no-recommendations message', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await routeWithMocks(page, { recommendations: [], metrics: makeMockMetrics() })
    await gotoReorder(page)

    await expect(page.getByText('Нет рекомендаций по пополнению')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  // -------------------------------------------------------------------------
  // 8. Error state: 500 from recommendations endpoint
  // -------------------------------------------------------------------------
  test('API error renders error alert without crashing page', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(REORDER_API_GLOB, route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    )

    await gotoReorder(page)

    await expect(page.getByText('Не удалось загрузить рекомендации по пополнению')).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Page heading must still be visible
    await expect(page.getByRole('heading', { name: 'Дашборд пополнения' })).toBeVisible()
  })
})
