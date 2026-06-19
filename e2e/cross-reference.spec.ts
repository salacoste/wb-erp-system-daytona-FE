/**
 * E2E Tests: Cross-Reference Analytics Page
 * Story 73.7-FE: Organic vs Ad Cross-Analysis
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9)
 * - No hard waits (anti-pattern #7); use waitForResponse or element assertions
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex /\d+/, /₽/ — not exact formatted strings
 *
 * Run: npx playwright test e2e/cross-reference.spec.ts
 */

import { test, expect, type Locator, type Page } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const XREF_URL = '/analytics/cross-reference'
const SEARCH_ORDERS_API = '**/v1/analytics/search/orders**'
const AD_ANALYTICS_API = '**/v1/analytics/advertising**'

// Next.js 15 App Router client components hydrate after JS bundle evaluation.
// 60s matches other analytics page specs (funnel, monitor).
const TEST_TIMEOUT = 60_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the cross-reference page and wait for the Кросс-анализ heading.
 * Anti-pattern #9: no networkidle — the page fires background queries.
 */
async function gotoCrossRef(page: Page) {
  await page.goto(XREF_URL, { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('heading', { name: 'Кросс-анализ' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

async function waitForCrossRefState(page: Page, candidates: Locator[]) {
  const gate = page.getByRole('region', { name: 'Требуется подписка WB Джем' })
  const state = await Promise.race([
    gate.waitFor({ state: 'visible', timeout: TIMEOUTS.api }).then(() => 'gate' as const),
    ...candidates.map(candidate =>
      candidate.waitFor({ state: 'visible', timeout: TIMEOUTS.api }).then(() => 'ready' as const)
    ),
  ]).catch(() => 'timeout' as const)

  expect(state).not.toBe('timeout')
  test.skip(state === 'gate', 'Cross-reference protected analytics are hidden behind RequireJam gate')
}


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Cross-Reference Analytics Page', () => {
  // -------------------------------------------------------------------------
  // 1. Page loads with heading and description
  // -------------------------------------------------------------------------
  test('page loads with Кросс-анализ heading', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoCrossRef(page)

    await expect(page.getByRole('heading', { name: 'Кросс-анализ' })).toBeVisible()

    // Subtitle confirms client component mounted
    await expect(page.getByText('Сравнение органики и рекламы по товарам')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 2. Overlap summary cards render with channel labels
  // -------------------------------------------------------------------------
  test('overlap summary cards render channel labels when data available', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoCrossRef(page)

    // Wait for loading to resolve — either cards, empty/error state, or Jam gate appears.
    const cardLabel = page.getByText('Только органика')
    const emptyAlert = page.getByText('Нет данных за выбранный период')
    const errorAlert = page.getByText('Не удалось загрузить данные')

    await waitForCrossRefState(page, [cardLabel, emptyAlert, errorAlert])

    const hasCards = await cardLabel.isVisible().catch(() => false)
    test.skip(!hasCards, 'Summary cards not visible — empty state or no data')

    // All 3 channel labels must be present (scope to cards to avoid Recharts legend collisions).
    const summaryCards = page.locator('.grid.grid-cols-1.sm\:grid-cols-3')
    await expect(summaryCards.getByText('Только органика')).toBeVisible()
    await expect(summaryCards.getByText('Только реклама')).toBeVisible()
    await expect(summaryCards.getByText('Оба канала')).toBeVisible()

    // Each card shows a count (digits)
    const cards = page.locator('.grid.grid-cols-1.sm\\:grid-cols-3 > div')
    const count = await cards.count()
    expect(count).toBe(3)
  })

  // -------------------------------------------------------------------------
  // 3. Scatter chart renders when data available
  // -------------------------------------------------------------------------
  test('scatter chart renders when backend has data', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoCrossRef(page)

    // Wait for content resolution or Jam gate.
    const scatterHeading = page.getByRole('heading', { name: 'Органика vs Реклама' })
    const emptyAlert = page.getByText('Нет данных за выбранный период')

    await waitForCrossRefState(page, [scatterHeading, emptyAlert])

    const hasChart = await scatterHeading.isVisible().catch(() => false)
    test.skip(!hasChart, 'Scatter chart not visible — no data for period')

    // Recharts renders SVG inside a ResponsiveContainer div
    const svg = page.locator('.recharts-scatter-chart')
    await expect(svg).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 4. Empty state renders when no data
  // -------------------------------------------------------------------------
  test('empty state renders when backend returns no data', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    // Mock both API endpoints to return empty data
    await page.route(SEARCH_ORDERS_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { items: [], total: 0 } }),
      })
    )
    await page.route(AD_ANALYTICS_API, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { data: [], total: 0 } }),
      })
    )

    await gotoCrossRef(page)
    const emptyState = page.getByText('Нет данных за выбранный период')
    await waitForCrossRefState(page, [emptyState])

    await expect(emptyState).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Summary cards and chart should NOT be present
    await expect(page.getByText('Только органика')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: 'Органика vs Реклама' })).not.toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 5. Error state renders with retry button
  // -------------------------------------------------------------------------
  test('error state renders with retry button on API failure', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.route(SEARCH_ORDERS_API, route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )
    await page.route(AD_ANALYTICS_API, route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    )

    await gotoCrossRef(page)
    const errorState = page.getByText('Не удалось загрузить данные')
    await waitForCrossRefState(page, [errorState])

    await expect(errorState).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByRole('button', { name: /Повторить/ })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 6. Accessibility: heading hierarchy
  // -------------------------------------------------------------------------
  test('page has correct heading hierarchy', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoCrossRef(page)

    // H1 is the page title
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveText('Кросс-анализ')

    // No other H1 on the page
    expect(await h1.count()).toBe(1)
  })
})
