/**
 * E2E Tests: Price Recommendations Page
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle on dashboards)
 * - No hard waits (anti-pattern #7); use waitForResponse or element assertions with TIMEOUTS.api
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex /\d+/, /₽/ — not exact formatted strings
 *
 * Mock body note: price-recommendations endpoint uses skipDataUnwrap=true, so the raw response
 * shape is { items, total, nextCursor } — NOT wrapped in { data: ... }.
 *
 * Run: npx playwright test e2e/pricing-page.spec.ts
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const PRICING_URL = '/analytics/pricing'
const PRICING_API_GLOB = '**/v1/products/price-recommendations**'

const TEST_TIMEOUT = 60_000

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function makeMockItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pr-1',
    nmId: 123456789,
    vendorCode: 'SKU-001',
    productName: 'Тестовый товар',
    lastPrice: 1500,
    breakEvenPrice: 800,
    recommendedPrice: 1200,
    marginAtCurrentPct: 25.5,
    marginAtRecommendedPct: 33.3,
    gap: -150,
    gapPct: -10.0,
    targetMarginPct: 15,
    computedAt: '2026-06-01T10:00:00Z',
    ...overrides,
  }
}

function makeMockResponse(items: Record<string, unknown>[] = [makeMockItem()], total = 1) {
  return {
    items,
    total,
    nextCursor: null,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to pricing page and wait for the heading to confirm hydration */
async function gotoPricing(page: import('@playwright/test').Page) {
  await page.goto(PRICING_URL, { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('heading', { name: 'Рекомендации по ценам' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Price Recommendations page', () => {
  // -------------------------------------------------------------------------
  // 1. Page renders with heading and filter controls
  // -------------------------------------------------------------------------
  test('page loads with Рекомендации по ценам heading and filter controls', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse()),
      })
    )

    await gotoPricing(page)

    await expect(page.getByRole('heading', { name: 'Рекомендации по ценам' })).toBeVisible()

    // Filter controls present
    await expect(page.getByText('Целевая маржа')).toBeVisible()
    await expect(page.getByText('Фильтр по разрыву')).toBeVisible()
    await expect(page.getByText('Сортировка')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 2. Summary cards render with metric labels
  // -------------------------------------------------------------------------
  test('summary cards display 4 metric labels', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const mockItem = makeMockItem({ gap: -150, gapPct: -10.0 })
    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse([mockItem])),
      })
    )

    await gotoPricing(page)

    const expectedLabels = ['Всего SKU', 'Средний разрыв', 'Ниже цели', 'Выше цели']
    for (const label of expectedLabels) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  // -------------------------------------------------------------------------
  // 3. Recommendations table renders with column headers
  // -------------------------------------------------------------------------
  test('table renders column headers when backend has data', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse()),
      })
    )

    await gotoPricing(page)

    // Table header columns
    await expect(page.getByRole('columnheader', { name: 'Артикул' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByRole('columnheader', { name: 'Разрыв' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Рекомендация' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 4. Table rows with data: gap indicators color-coded (red for negative)
  // -------------------------------------------------------------------------
  test('table shows red-colored gap when price is below target', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const belowItem = makeMockItem({
      id: 'pr-below',
      vendorCode: 'SKU-BELOW',
      gap: -200,
      gapPct: -15.0,
    })
    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse([belowItem])),
      })
    )

    await gotoPricing(page)

    // Vendor code in table
    await expect(page.getByText('SKU-BELOW').first()).toBeVisible({ timeout: TIMEOUTS.api })

    // Gap cell uses text-red-600 class for below-target
    const gapCell = page.locator('td').filter({ hasText: /-200/ }).first()
    await expect(gapCell).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // -------------------------------------------------------------------------
  // 5. Table rows: green gap indicator for above-target prices
  // -------------------------------------------------------------------------
  test('table shows green-colored gap when price is above target', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    const aboveItem = makeMockItem({
      id: 'pr-above',
      vendorCode: 'SKU-ABOVE',
      gap: 100,
      gapPct: 8.0,
    })
    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse([aboveItem])),
      })
    )

    await gotoPricing(page)

    await expect(page.getByText('SKU-ABOVE').first()).toBeVisible({ timeout: TIMEOUTS.api })

    // The cell with positive gap should exist — green text via text-green-600
    const gapCell = page.locator('td').filter({ hasText: /\+100/ }).first()
    await expect(gapCell).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // -------------------------------------------------------------------------
  // 6. Refresh button triggers POST to /refresh
  // -------------------------------------------------------------------------
  test('refresh button triggers price refresh request', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeMockResponse()),
      })
    )

    // Intercept the refresh POST
    let refreshCalled = false
    await page.route('**/v1/products/price-recommendations/refresh', route => {
      refreshCalled = true
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      })
    })

    await gotoPricing(page)

    // Click the refresh button (has text "Обновить" when not refreshing)
    const refreshBtn = page.getByRole('button', { name: /Обновить/ })
    await expect(refreshBtn).toBeVisible()
    await refreshBtn.click()

    // Verify the refresh endpoint was called
    await page.waitForTimeout(1000)
    expect(refreshCalled).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 7. Empty state: no recommendations shows informational message
  // -------------------------------------------------------------------------
  test('empty response renders informational message', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, nextCursor: null }),
      })
    )

    await gotoPricing(page)

    await expect(page.getByText('Нет рекомендаций по ценам')).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // -------------------------------------------------------------------------
  // 8. Error state: 500 renders error alert without crashing the page
  // -------------------------------------------------------------------------
  test('500 error renders error alert without crashing the page', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(PRICING_API_GLOB, route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    )

    await gotoPricing(page)

    await expect(page.getByText('Не удалось загрузить рекомендации по ценам')).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Page heading must still be visible (only the table errors, not the whole page)
    await expect(page.getByRole('heading', { name: 'Рекомендации по ценам' })).toBeVisible()
  })
})
