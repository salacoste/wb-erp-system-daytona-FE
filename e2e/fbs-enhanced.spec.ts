/**
 * E2E Smoke Tests: FBS Enhanced Analytics
 * Story 96.13-FE: aggregated view (5 sections)
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9 — not networkidle).
 * All API responses are mocked via page.route() — no live backend dependency.
 * Russian copy assertions use regex (CLAUDE.md anti-pattern #6 — not exact strings).
 * Auth state loaded from e2e/.auth/user.json via playwright.config.ts.
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const FBS_ENHANCED_URL = '/analytics/fbs-enhanced'
const PAGE_LANDMARK = '[data-testid="fbs-enhanced-page"]'

// ---------------------------------------------------------------------------
// Mock response fixture
// ---------------------------------------------------------------------------

const MOCK_ENHANCED_RESPONSE = {
  orderStats: {
    totalOrders: 150,
    deliveredOrders: 120,
    returnedOrders: 15,
    buyoutRate: 80.0,
    returnRate: 10.0,
    averageOrderValue: 2500.0,
  },
  stockAnalytics: {
    totalSkus: 45,
    totalUnits: 450,
    lowStockSkus: 5,
    outOfStockSkus: 2,
    avgDaysOfCover: 25.5,
  },
  regionalData: [
    { regionName: 'Центральный', orderShare: 45.0, stockShare: 40.0 },
    { regionName: 'Сибирь', orderShare: 20.0, stockShare: 25.0 },
  ],
  calculatedMetrics: {
    turnoverRate: 2.5,
    stockCoverageDays: 25.0,
    ordersPerProduct: 1.8,
  },
  funnelData: {
    productViews: 10000,
    cartAdds: 2000,
    orders: 150,
    deliveries: 120,
  },
  period: { from: '2026-04-01', to: '2026-04-30' },
  generatedAt: '2026-04-30T12:00:00Z',
}

// ---------------------------------------------------------------------------
// Navigation + landmark
// ---------------------------------------------------------------------------

test.describe('FBS Enhanced Analytics Page (Story 96.13-FE)', () => {
  test('navigates to /analytics/fbs-enhanced and shows page landmark + header', async ({
    page,
  }) => {
    await page.route('**/v1/analytics/fbs/enhanced**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ENHANCED_RESPONSE),
      })
    )

    await page.goto(FBS_ENHANCED_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Russian heading — regex not exact string (anti-pattern #6)
    await expect(page.getByRole('heading', { name: /Расширенная аналитика FBS/ })).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('sidebar contains Расширенная аналитика FBS link', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const sidebarLink = page.getByRole('link', { name: /Расширенная аналитика FBS/ })
    await expect(sidebarLink).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  // ---------------------------------------------------------------------------
  // All 5 sections render
  // ---------------------------------------------------------------------------

  test('all 5 sections render with populated mock data', async ({ page }) => {
    await page.route('**/v1/analytics/fbs/enhanced**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ENHANCED_RESPONSE),
      })
    )

    await page.goto(FBS_ENHANCED_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Section 1: Order Stats
    await expect(page.getByTestId('fbs-order-stats-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Статистика заказов/)).toBeVisible()

    // Section 2: Stock Analytics
    await expect(page.getByTestId('fbs-stock-analytics-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Аналитика остатков/)).toBeVisible()

    // Section 3: Regional Data
    await expect(page.getByTestId('fbs-regional-data-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Региональное распределение/)).toBeVisible()

    // Section 4: Calculated Metrics
    await expect(page.getByTestId('fbs-calculated-metrics-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Расчётные метрики/)).toBeVisible()

    // Section 5: Funnel
    await expect(page.getByTestId('fbs-funnel-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Воронка конверсии/)).toBeVisible()
    // SVG funnel present
    await expect(page.getByTestId('fbs-funnel-svg')).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // Pattern 1 graceful degradation — partial null response
  // ---------------------------------------------------------------------------

  test('Pattern 1: other sections still render when regionalData is empty', async ({ page }) => {
    const partialResponse = {
      ...MOCK_ENHANCED_RESPONSE,
      regionalData: [], // empty — should show "Нет данных по регионам"
    }

    await page.route('**/v1/analytics/fbs/enhanced**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(partialResponse),
      })
    )

    await page.goto(FBS_ENHANCED_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Other sections still render (Pattern 1 isolation)
    await expect(page.getByTestId('fbs-order-stats-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByTestId('fbs-stock-analytics-section')).toBeVisible()
    await expect(page.getByTestId('fbs-calculated-metrics-section')).toBeVisible()
    await expect(page.getByTestId('fbs-funnel-section')).toBeVisible()

    // Regional section shows empty state — regex assertion (anti-pattern #6)
    await expect(page.getByText(/Нет данных по регионам/)).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  test('shows error alert when API returns 500', async ({ page }) => {
    await page.route('**/v1/analytics/fbs/enhanced**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )

    await page.goto(FBS_ENHANCED_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Error alert — regex assertion (anti-pattern #6)
    await expect(page.getByText(/Не удалось загрузить данные расширенной аналитики/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })
})
