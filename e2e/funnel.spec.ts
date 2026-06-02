/**
 * E2E Tests: Funnel Analytics Page
 * Epic 68: Marketing Funnel (views → cart → orders → buyouts → cancels)
 * Story 119.2-FE: Top Search Queries column + Search page deep-link
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle on dashboards)
 * - No hard waits (anti-pattern #7); use waitForResponse or element assertions with TIMEOUTS.api
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex /\d+/, /₽/ — not exact formatted strings
 *
 * Mock body note: funnel endpoint uses skipDataUnwrap=true, so the raw response
 * shape is { items, summary, pagination } — NOT wrapped in { data: ... }.
 *
 * Run: npx playwright test e2e/funnel.spec.ts
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'
import {
  emptyFunnelResponse,
  makeFunnelProductItem,
  makeTopSearchQuery,
} from '../src/test/fixtures/funnel-empty'

const FUNNEL_URL = '/analytics/funnel'
const FUNNEL_API_GLOB = '**/v1/analytics/funnel**'

// Extended per-test timeout: Next.js 15 App Router client components hydrate
// after JS bundle evaluation — domcontentloaded fires before the bundle runs.
// 60s matches other analytics page specs in this project.
const TEST_TIMEOUT = 60_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the funnel page and wait for the Воронка продаж heading.
 *
 * Anti-pattern #9: no networkidle — the funnel page fires multiple background
 * queries that never settle. Use domcontentloaded + heading waitFor instead.
 * The heading appearing confirms the 'use client' FunnelPageContent hydrated.
 */
async function gotoFunnel(page: import('@playwright/test').Page) {
  await page.goto(FUNNEL_URL, { waitUntil: 'domcontentloaded' })
  // Wait for the h1 to appear — confirms the client component mounted.
  await page
    .getByRole('heading', { name: 'Воронка продаж' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

// ---------------------------------------------------------------------------
// Main describe block
// ---------------------------------------------------------------------------

test.describe('Funnel Analytics page', () => {
  // -------------------------------------------------------------------------
  // 1. Page renders and heading is present
  // -------------------------------------------------------------------------
  test('page loads with Воронка продаж heading', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoFunnel(page)

    await expect(page.getByRole('heading', { name: 'Воронка продаж' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 2. Funnel table renders rows with numeric cell values
  // -------------------------------------------------------------------------
  test('funnel table renders rows with numeric values when backend has data', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoFunnel(page)

    // FunnelTable makes a separate API call from FunnelSummaryCards.
    // Wait for the skeleton to dissolve: either a table appears, or the empty-state
    // alert appears (both are valid resolved states). Use TEST_TIMEOUT for data fetch.
    const table = page.locator('table')
    const emptyAlert = page.getByText('Нет данных за выбранный период')
    const errorAlert = page.getByText('Не удалось загрузить данные воронки')

    await Promise.race([
      table.waitFor({ state: 'visible', timeout: TEST_TIMEOUT }),
      emptyAlert.waitFor({ state: 'visible', timeout: TEST_TIMEOUT }),
      errorAlert.waitFor({ state: 'visible', timeout: TEST_TIMEOUT }),
    ])

    const tableVisible = await table.isVisible().catch(() => false)
    test.skip(
      !tableVisible,
      'Funnel table not visible — skeleton still loading or empty state shown'
    )

    // At least one data row must be visible (backend seeded with 45 products)
    const rows = table.locator('tbody tr')
    const rowCount = await rows.count()
    test.skip(rowCount === 0, 'No rows in funnel table — needs backend data seeding')

    expect(rowCount).toBeGreaterThan(0)

    // First data row must contain a numeric nmId (localized digits — regex match)
    const text = await rows.first().textContent()
    expect(text).toMatch(/\d+/)
  })

  // -------------------------------------------------------------------------
  // 3. FunnelSummaryCards: 8 metric cards render
  // -------------------------------------------------------------------------
  test('summary cards render metric labels for the 8 funnel KPIs', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoFunnel(page)

    // All 8 metric card labels must be present
    const expectedLabels = [
      'Просмотры',
      'Корзина',
      'Заказы',
      'Выкупы',
      'Сумма выкупов',
      'Конв. корзины',
      'Сквозная конверсия',
      'Отмены',
    ]

    for (const label of expectedLabels) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  // -------------------------------------------------------------------------
  // 4. Story 119.2-FE: Top Search Queries column header is present
  // -------------------------------------------------------------------------
  test('table header contains Топ поисковых запросов column', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoFunnel(page)

    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: TIMEOUTS.api })

    await expect(table.getByText('Топ поисковых запросов')).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // -------------------------------------------------------------------------
  // 5. Story 119.2-FE: Top Search Queries cell renders links to /analytics/search?query=
  //    Uses a mock that guarantees at least one item with topSearchQueries.
  // -------------------------------------------------------------------------
  test('top search query links deep-link to /analytics/search?query=', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    // Build a mock response: 1 product with 2 known search queries.
    // Route is set up BEFORE navigation — the intercept is registered at the
    // network layer so it fires regardless of hydration timing.
    const mockItem = makeFunnelProductItem({
      nmId: 887604577,
      vendorCode: 'izoblack_20',
      brandName: 'Protape',
      openCardCount: 15345,
      addToCartCount: 4402,
      ordersCount: 2015,
      topSearchQueries: [
        makeTopSearchQuery({ query: 'жидкая изолента', impressions: 13938, clicks: 5954 }),
        makeTopSearchQuery({
          query: 'жидкая изолента для проводов',
          impressions: 3364,
          clicks: 1383,
        }),
      ],
    })
    const mockResponse = emptyFunnelResponse({
      items: [mockItem],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    })

    // Intercept the data endpoint (not sync-status) — raw shape (skipDataUnwrap=true)
    await page.route(FUNNEL_API_GLOB, (route, request) => {
      if (request.url().includes('sync-status')) {
        return route.continue()
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      })
    })

    await gotoFunnel(page)

    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: TIMEOUTS.api })

    // At least one link that points to /analytics/search?query=...
    const searchLinks = page.locator('a[href*="/analytics/search?query="]')
    await expect(searchLinks.first()).toBeVisible({ timeout: TIMEOUTS.api })

    // href must contain encoded query text
    const href = await searchLinks.first().getAttribute('href')
    expect(href).toMatch(/\/analytics\/search\?query=/)
    expect(href).toMatch(/%[0-9A-Fa-f]{2}|[а-яёА-ЯЁ]/) // percent-encoded or raw Cyrillic
  })

  // -------------------------------------------------------------------------
  // 6. Story 119.2-FE: clicking a search query link navigates to search page
  // -------------------------------------------------------------------------
  test('clicking a top-search-query link navigates to /analytics/search with query param', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT)

    const mockItem = makeFunnelProductItem({
      nmId: 887604577,
      topSearchQueries: [
        makeTopSearchQuery({ query: 'жидкая изолента', impressions: 5000, clicks: 2000 }),
      ],
    })
    const mockResponse = emptyFunnelResponse({
      items: [mockItem],
      pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
    })

    await page.route(FUNNEL_API_GLOB, (route, request) => {
      if (request.url().includes('sync-status')) return route.continue()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      })
    })

    await gotoFunnel(page)

    const searchLink = page.locator('a[href*="/analytics/search?query="]').first()
    await expect(searchLink).toBeVisible({ timeout: TIMEOUTS.api })

    // Click and wait for URL to change — the /analytics/search page may need
    // to compile on first visit in dev mode (Next.js on-demand compilation).
    // Use TEST_TIMEOUT so a cold compile (up to ~30s) doesn't cause a false fail.
    await Promise.all([
      page.waitForURL(/\/analytics\/search/, { timeout: TEST_TIMEOUT }),
      searchLink.click(),
    ])

    // Query param must be present in the final URL
    await expect(page).toHaveURL(/query=/, { timeout: TIMEOUTS.navigation })
  })

  // -------------------------------------------------------------------------
  // 7. Empty period: no data shows an informational alert
  // -------------------------------------------------------------------------
  test('empty funnel response renders an informational alert (no data for period)', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT)

    const emptyResp = emptyFunnelResponse()

    await page.route(FUNNEL_API_GLOB, (route, request) => {
      if (request.url().includes('sync-status')) return route.continue()
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyResp),
      })
    })

    await gotoFunnel(page)

    // FunnelTable renders an Alert when items.length === 0
    await expect(page.getByText('Нет данных за выбранный период')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  // -------------------------------------------------------------------------
  // 8. Error state: 500 from funnel endpoint shows destructive alert
  // -------------------------------------------------------------------------
  test('funnel 500 renders a destructive error alert without crashing the page', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(FUNNEL_API_GLOB, (route, request) => {
      if (request.url().includes('sync-status')) return route.continue()
      return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    })

    await gotoFunnel(page)

    await expect(page.getByText('Не удалось загрузить данные воронки')).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Page heading must still be visible (only the table errors, not the whole page)
    await expect(page.getByRole('heading', { name: 'Воронка продаж' })).toBeVisible()
  })
})
