/**
 * E2E Smoke Tests: FBS Stock Breakdowns
 * Story 96.11-FE: groups / sizes / regions breakdown views
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9 — not networkidle).
 * All API responses are mocked via page.route() — no live backend dependency.
 * Russian copy assertions use regex (CLAUDE.md anti-pattern #6 — not exact strings).
 * Auth state loaded from e2e/.auth/user.json via playwright.config.ts.
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const FBS_STOCK_URL = '/analytics/fbs-stock'
const PAGE_LANDMARK = '[data-testid="fbs-stock-page"]'

// ---------------------------------------------------------------------------
// Mock response fixtures
// ---------------------------------------------------------------------------

const MOCK_GROUPS_RESPONSE = {
  data: {
    groups: [
      {
        groupName: 'Одежда',
        skuCount: 15,
        stockUnits: 120,
        stockValue: 45000,
        averageDailyOutgoing: 3,
        daysOfCover: 40.0,
      },
    ],
  },
  period: { from: '2026-04-01', to: '2026-04-30' },
  generatedAt: '2026-04-30T12:00:00Z',
}

const MOCK_SIZES_RESPONSE = {
  data: {
    sizes: [
      {
        size: 'XL',
        nmId: 987654,
        skuCount: 3,
        stockUnits: 25,
        averageDailyOutgoing: 2,
        daysOfCover: 12.5,
      },
    ],
  },
  period: { from: '2026-04-01', to: '2026-04-30' },
  generatedAt: '2026-04-30T12:00:00Z',
}

const MOCK_REGIONS_RESPONSE = {
  data: {
    regions: [
      {
        regionName: 'Центральный',
        warehouseCount: 5,
        stockUnits: 500,
        stockValue: 200000,
        shareOfTotalPct: 55.2,
      },
    ],
  },
  generatedAt: '2026-04-30T06:00:00Z',
}

// ---------------------------------------------------------------------------
// Navigation + landmark
// ---------------------------------------------------------------------------

test.describe('FBS Stock Breakdowns Page (Story 96.11-FE)', () => {
  test('navigates to /analytics/fbs-stock and shows page landmark + header', async ({ page }) => {
    // Mock all 3 endpoints so the page renders without a live backend
    await page.route('**/v1/analytics/fbs/stock/groups**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GROUPS_RESPONSE),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/sizes**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SIZES_RESPONSE),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/regions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REGIONS_RESPONSE),
      })
    )

    await page.goto(FBS_STOCK_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Russian heading — regex not exact string (anti-pattern #6)
    await expect(page.getByRole('heading', { name: /Складские остатки FBS/ })).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('sidebar contains Остатки FBS link pointing to /analytics/fbs-stock', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    const sidebarLink = page.getByRole('link', { name: /Остатки FBS/ })
    await expect(sidebarLink).toBeVisible({ timeout: TIMEOUTS.navigation })
    await sidebarLink.click()
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  // ---------------------------------------------------------------------------
  // Tab switching
  // ---------------------------------------------------------------------------

  test('tab switching: По товарным группам tab renders groups section', async ({ page }) => {
    await page.route('**/v1/analytics/fbs/stock/groups**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GROUPS_RESPONSE),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/regions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REGIONS_RESPONSE),
      })
    )
    await page.goto(FBS_STOCK_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Default tab — groups section visible
    await expect(page.getByTestId('fbs-stock-groups-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    // Russian column header — regex (anti-pattern #6)
    await expect(page.getByText(/По товарным группам/)).toBeVisible()
  })

  test('tab switching: По размерам tab renders sizes section with nm_id filter', async ({
    page,
  }) => {
    await page.route('**/v1/analytics/fbs/stock/sizes**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SIZES_RESPONSE),
      })
    )
    await page.goto(FBS_STOCK_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    await page.getByRole('tab', { name: /По размерам/ }).click()
    await expect(page.getByTestId('fbs-stock-sizes-section')).toBeVisible({ timeout: TIMEOUTS.api })
    // nm_id free-text input should be visible
    await expect(page.getByPlaceholder(/Артикул WB/)).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('tab switching: По регионам tab renders regions section with generatedAt', async ({
    page,
  }) => {
    await page.route('**/v1/analytics/fbs/stock/regions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REGIONS_RESPONSE),
      })
    )
    await page.goto(FBS_STOCK_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    await page.getByRole('tab', { name: /По регионам/ }).click()
    await expect(page.getByTestId('fbs-stock-regions-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    // generatedAt freshness indicator — regex (anti-pattern #6)
    await expect(page.getByText(/Данные актуальны на:/)).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // ---------------------------------------------------------------------------
  // Pattern 1 graceful degradation (independent state machines)
  // ---------------------------------------------------------------------------

  test('Pattern 1: groups endpoint 503 does not blank sizes or regions tabs', async ({ page }) => {
    // Groups fails, sizes + regions succeed
    await page.route('**/v1/analytics/fbs/stock/groups**', route =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Service unavailable' } }),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/sizes**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SIZES_RESPONSE),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/regions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REGIONS_RESPONSE),
      })
    )

    await page.goto(FBS_STOCK_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Groups tab should show error (independent state machine)
    await expect(page.getByTestId('fbs-stock-groups-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Не удалось загрузить данные по группам/)).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Switch to sizes tab — should render data (not blanked by groups failure)
    await page.getByRole('tab', { name: /По размерам/ }).click()
    await expect(page.getByTestId('fbs-stock-sizes-section')).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByText('XL')).toBeVisible({ timeout: TIMEOUTS.api })

    // Switch to regions tab — should render data (not blanked by groups failure)
    await page.getByRole('tab', { name: /По регионам/ }).click()
    await expect(page.getByTestId('fbs-stock-regions-section')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText(/Центральный/)).toBeVisible({ timeout: TIMEOUTS.api })
  })
})

// ---------------------------------------------------------------------------
// FBS Export smoke tests (Story 96.12-FE)
// ---------------------------------------------------------------------------

test.describe('FBS Export (Story 96.12-FE)', () => {
  const EXPORT_ID = 'e2e-test-export-id'

  test('export button visible and triggers download on ready', async ({ page }) => {
    // Mock stock endpoints so page renders
    await page.route('**/v1/analytics/fbs/stock/groups**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GROUPS_RESPONSE),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/sizes**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SIZES_RESPONSE),
      })
    )
    await page.route('**/v1/analytics/fbs/stock/regions**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REGIONS_RESPONSE),
      })
    )

    // Mock POST export trigger → 202
    await page.route('**/v1/analytics/fbs/stock/export', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ exportId: EXPORT_ID, status: 'queued' }),
        })
      } else {
        await route.continue()
      }
    })

    // Mock GET status — first call returns 'running', second returns 'ready'
    let statusCallCount = 0
    await page.route(`**/v1/analytics/fbs/stock/export/${EXPORT_ID}`, async route => {
      statusCallCount++
      const status = statusCallCount === 1 ? 'running' : 'ready'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exportId: EXPORT_ID,
          status,
          url: status === 'ready' ? 'https://example.com/signed-url.csv' : null,
          expiresAt: status === 'ready' ? '2026-05-08T20:00:00Z' : null,
        }),
      })
    })

    // H-1+H-2 fix: component now uses statusData.url (signed S3 URL) for download,
    // NOT the /download redirect endpoint. Mock the signed URL so download resolves.
    await page.route('**/signed-url.csv', route =>
      route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'nm_id,name\n123,Test',
        headers: { 'Content-Disposition': 'attachment; filename="fbs-export.csv"' },
      })
    )

    await page.goto(FBS_STOCK_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(PAGE_LANDMARK)).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Export button is visible + enabled (regex — anti-pattern #6)
    const exportBtn = page.getByTestId('fbs-export-button')
    await expect(exportBtn).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(exportBtn).not.toBeDisabled()
    await expect(exportBtn).toHaveText(/Скачать CSV/)

    // Click → button enters loading state
    const downloadPromise = page.waitForEvent('download', { timeout: TIMEOUTS.api })
    await exportBtn.click()

    // Button shows polling label (anti-pattern #6 — regex)
    await expect(exportBtn).toHaveText(/Подготовка\.\.\./, { timeout: TIMEOUTS.navigation })

    // Wait for download event (triggered when status becomes 'ready')
    const download = await downloadPromise
    // Filename matches pattern fbs-stock-export-*.csv (anti-pattern #6 — regex via includes)
    expect(download.suggestedFilename()).toMatch(/fbs-stock-export-.+\.csv/)
  })
})
