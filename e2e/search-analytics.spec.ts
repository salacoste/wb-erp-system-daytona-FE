/**
 * E2E Tests: Search Analytics Page
 * Epic 71-FE: Search Analytics & Jam Gating
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9)
 * - No hard waits (anti-pattern #7); use waitForResponse or element assertions
 * - Locale assertions use regex /\d+/, /₽/ — not exact formatted strings
 *
 * Run: npx playwright test e2e/search-analytics.spec.ts
 */

import { test, expect, type Page } from './fixtures/network-test'
import { TIMEOUTS } from './fixtures/test-data'

const SEARCH_URL = '/analytics/search'

// Next.js 15 client-component hydration may take time after domcontentloaded.
const TEST_TIMEOUT = 60_000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the search analytics page and wait for the heading.
 * Anti-pattern #9: no networkidle — background queries never settle.
 */
async function gotoSearch(page: Page) {
  await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('heading', { name: 'Поисковая аналитика' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

async function expectJamGateOrTabs(page: Page) {
  const gate = page.getByRole('region', { name: 'Требуется подписка WB Джем' })
  const tabs = page.locator('[role="tablist"]')
  const state = await Promise.race([
    gate.waitFor({ state: 'visible', timeout: TIMEOUTS.api }).then(() => 'gate' as const),
    tabs.waitFor({ state: 'visible', timeout: TIMEOUTS.api }).then(() => 'tabs' as const),
  ]).catch(() => 'timeout' as const)

  expect(state).not.toBe('timeout')

  if (state === 'gate') {
    await expect(page.getByRole('link', { name: /Подробнее/ })).toBeVisible()
    return false
  }

  await expect(tabs).toBeVisible()
  return true
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Search Analytics Page', () => {
  // -------------------------------------------------------------------------
  // 1. Page renders with heading
  // -------------------------------------------------------------------------
  test('page loads with Поисковая аналитика heading', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoSearch(page)

    await expect(page.getByRole('heading', { name: 'Поисковая аналитика' })).toBeVisible()

    // Subtitle is present
    await expect(page.getByText('Анализ поисковых запросов, позиций и заказов')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 2. Tab structure — all three tabs are visible
  // -------------------------------------------------------------------------
  test('renders three tab triggers with correct labels', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoSearch(page)

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    const tabLabels = ['Заказы', 'По товарам', 'По запросам', 'Позиции']
    for (const label of tabLabels) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible()
    }
  })

  // -------------------------------------------------------------------------
  // 3. Default tab (Заказы) renders orders content
  // -------------------------------------------------------------------------
  test('default tab shows orders content area', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoSearch(page)

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    // Orders tab is active by default (no initialQuery). Verify its content
    // area is present — either skeleton, data, or empty state.
    const ordersTabPanel = page.getByRole('tabpanel')
    await expect(ordersTabPanel).toBeVisible({ timeout: TIMEOUTS.api })

    // Date range picker is visible above tabs
    await expect(page.locator('#search-date-range')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 4. Product ranking tab (По товарам) — click and verify placeholder
  // -------------------------------------------------------------------------
  test('По товарам tab shows product selector placeholder', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoSearch(page)

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    await page.getByRole('tab', { name: 'По товарам' }).click()

    // Placeholder text for no product selected
    await expect(page.getByText('Выберите товар, чтобы увидеть поисковые запросы')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  // -------------------------------------------------------------------------
  // 5. Keyword explorer tab (По запросам) — click and verify search input
  // -------------------------------------------------------------------------
  test('По запросам tab shows search input and placeholder', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoSearch(page)

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    await page.getByRole('tab', { name: 'По запросам' }).click()

    // Search input is present with aria-label
    const searchInput = page.getByLabel('Поисковый запрос')
    await expect(searchInput).toBeVisible({ timeout: TIMEOUTS.api })

    // Placeholder guidance text
    await expect(
      page.getByText('Введите поисковый запрос, чтобы увидеть рейтинг товаров')
    ).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // 6. Empty / no-data state on Orders tab
  // -------------------------------------------------------------------------
  test('orders tab handles empty data gracefully', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    // Intercept search-orders API to return empty data
    await page.route('**/v1/analytics/search/orders**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    )

    await gotoSearch(page)

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    // Page should not crash — either shows a table, empty alert, or overview
    // cards. Verify the tab panel is present (no JS error crashed the page).
    const tabPanel = page.getByRole('tabpanel')
    await expect(tabPanel).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // -------------------------------------------------------------------------
  // 7. Accessibility — heading hierarchy and ARIA
  // -------------------------------------------------------------------------
  test('has correct heading hierarchy and ARIA labels', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await gotoSearch(page)

    // h1 is present and unique
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText('Поисковая аналитика')

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    // Tab list has proper ARIA role
    const tabList = page.getByRole('tablist')
    await expect(tabList).toBeVisible()

    // All four tabs have tab role
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(4)
  })

  // -------------------------------------------------------------------------
  // 8. initialQuery URL param activates by-query tab
  // -------------------------------------------------------------------------
  test('URL param ?query= activates by-query tab with input pre-filled', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)

    await page.goto('/analytics/search?query=изолента', {
      waitUntil: 'domcontentloaded',
    })
    await page
      .getByRole('heading', { name: 'Поисковая аналитика' })
      .waitFor({ state: 'visible', timeout: TIMEOUTS.api })

    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    // By-query tab should be active (defaultTab = 'by-query' when initialQuery set)
    const byQueryTab = page.getByRole('tab', { name: 'По запросам' })
    await expect(byQueryTab).toHaveAttribute('data-state', 'active')

    // Input should be pre-populated
    const searchInput = page.getByLabel('Поисковый запрос')
    await expect(searchInput).toHaveValue('изолента')
  })
})
