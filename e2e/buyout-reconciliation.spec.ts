/**
 * E2E Tests: Buyout Reconciliation
 * Story 96.14-FE: per-SKU anomaly audit table with Defensive Frontend indicators
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9 — not networkidle).
 * Auth state loaded from e2e/.auth/user.json via playwright.config.ts.
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const RECONCILIATION_URL = '/analytics/buyout-reconciliation'
const PAGE_LANDMARK = '[data-testid="buyout-reconciliation-page"]'
const TABLE_LANDMARK = '[data-testid="reconciliation-table"]'
const API_PATTERN = '**/v1/analytics/buyout/reconciliation**'

/** One anomalous row — triggers AlertTriangle indicators in all 3 anomaly columns. */
const ANOMALY_RESPONSE = {
  data: [
    {
      nmId: 12345,
      productName: 'Тест товар с аномалиями',
      brand: 'Test Brand',
      buyoutQuantity: 80,
      returnQuantity: 10,
      returnWithoutBuyout: 3,
      orphanBuyout: 2,
      returnQuantityMismatch: 1,
      source: 'sdk_reconciliation',
    },
  ],
  period: { from: '2026-04-01', to: '2026-04-30' },
  generatedAt: '2026-05-01T06:30:00.000Z',
}

/** One clean row — all anomaly counts = 0; triggers no-anomalies success state. */
const NO_ANOMALY_RESPONSE = {
  data: [
    {
      nmId: 99999,
      productName: 'Чистый товар',
      brand: 'Clean Brand',
      buyoutQuantity: 50,
      returnQuantity: 5,
      returnWithoutBuyout: 0,
      orphanBuyout: 0,
      returnQuantityMismatch: 0,
      source: 'weekly',
    },
  ],
  period: { from: '2026-04-01', to: '2026-04-30' },
  generatedAt: '2026-05-01T06:30:00.000Z',
}

/** Empty data — triggers "no data" empty state. */
const EMPTY_RESPONSE = {
  data: [],
  period: { from: '2026-04-01', to: '2026-04-30' },
  generatedAt: '2026-05-01T06:30:00.000Z',
}

test.describe('Buyout Reconciliation Page (Story 96.14-FE)', () => {
  test('navigates to /analytics/buyout-reconciliation and shows page landmark + header', async ({
    page,
  }) => {
    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(page.getByRole('heading', { name: /Сверка выкупов и возвратов/ })).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('renders anomaly table with AlertTriangle indicators when API returns anomalous rows', async ({
    page,
  }) => {
    await page.route(API_PATTERN, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ANOMALY_RESPONSE),
      })
    )

    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(page.locator(TABLE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.api })

    // AlertTriangle tooltip triggers are focusable spans, not buttons:
    // accessibility is provided by aria-label + tabIndex (see AnomalyIndicator).
    const anomalyIndicators = page.getByLabel(/Аномалия/)
    await expect(anomalyIndicators.first()).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(anomalyIndicators).toHaveCount(3, { timeout: TIMEOUTS.api })
  })

  test('renders no-anomalies success state when all anomaly counts are 0', async ({ page }) => {
    await page.route(API_PATTERN, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(NO_ANOMALY_RESPONSE),
      })
    )

    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(page.getByText(/Аномалий не найдено за выбранный период/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.locator(TABLE_LANDMARK)).not.toBeVisible()
  })

  test('renders no-data empty state when API returns empty data array', async ({ page }) => {
    await page.route(API_PATTERN, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_RESPONSE),
      })
    )

    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(page.getByText(/Данных по выкупам за выбранный период нет/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('nmId filter sends nmId query param to API', async ({ page }) => {
    const capturedUrls: string[] = []
    await page.route(API_PATTERN, route => {
      capturedUrls.push(route.request().url())
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_RESPONSE),
      })
    })

    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Type a valid nmId into the filter input
    const nmIdInput = page.getByLabel('Фильтр по артикулу WB')
    await nmIdInput.fill('12345')

    // Wait for the debounce / query re-fire — the latest captured route should include nmId=12345.
    // Do not use page.waitForFunction with a Node-side string: it serializes the initial value only.
    await expect
      .poll(() => capturedUrls.some(url => url.includes('nmId=12345')), { timeout: TIMEOUTS.api })
      .toBe(true)

    // Assert the filter input accepted the value and the API contract was exercised.
    await expect(nmIdInput).toHaveValue('12345')
    expect(capturedUrls.at(-1)).toContain('nmId=12345')
  })

  test('refresh schedule note is visible on page', async ({ page }) => {
    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(page.getByText(/Данные обновляются ежедневно в 06:30 МСК/)).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  // Story 96.15-FE: SourceBadge E2E smoke test
  test('Story 96.15-FE: renders SourceBadge for sdk_reconciliation source rows', async ({
    page,
  }) => {
    await page.route(API_PATTERN, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ANOMALY_RESPONSE), // has source: 'sdk_reconciliation'
      })
    )

    await page.goto(RECONCILIATION_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(page.locator(TABLE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.api })

    // SourceBadge renders 'SDK' label for sdk_reconciliation source
    // L-1 fix: testid scoped to source-badge-sdk_reconciliation (no multi-row collision)
    const sourceBadge = page.locator('[data-testid="source-badge-sdk_reconciliation"]').first()
    await expect(sourceBadge).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(sourceBadge).toHaveText('SDK')
  })
})
