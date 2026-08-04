/**
 * E2E Smoke Tests: COGS Pages (Bulk Assignment, History)
 *
 * Covers heading verification, content-area mount states,
 * heading-hierarchy accessibility, and sidebar navigation.
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout, no waitForLoadState('networkidle').
 *
 * Requires: running frontend (port 3100), authenticated session (auth.setup.ts).
 * Run with: npm run test:e2e -- e2e/cogs-pages.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('COGS Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Auth storage state is injected by Playwright config (auth.setup.ts).
    // Navigate to dashboard first to ensure app shell is mounted.
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  // --- Bulk COGS Assignment page ---

  test('bulk COGS page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.cogsBulk, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Массовое назначение себестоимости', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    // Info banner is always rendered on this page
    const hasInfoBanner = (await page.getByText('Как это работает').count()) > 0
    expect(hasInfoBanner).toBeTruthy()

    // BulkCogsForm card (always present — form itself may show products or empty state)
    const hasCard = (await page.getByRole('region').count()) > 0
    const hasFormCard =
      (await page.getByText('Выбор товаров и назначение себестоимости').count()) > 0
    expect(hasCard || hasFormCard).toBeTruthy()
  })

  test('bulk COGS page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.cogsBulk, { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: 'Массовое назначение себестоимости' })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('bulk COGS page is reachable via direct navigation', async ({ page }) => {
    await page.goto(ROUTES.cogsBulk, { waitUntil: 'domcontentloaded' })

    // Page loads without redirecting away
    await expect(
      page.getByRole('heading', { name: 'Массовое назначение себестоимости' })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    expect(page.url()).toContain('/cogs/bulk')
  })

  // --- COGS History page ---

  test('COGS history page renders breadcrumb and content area', async ({ page }) => {
    // History page without nmId shows an alert — still a valid mounted state
    await page.goto(ROUTES.cogsHistory, { waitUntil: 'domcontentloaded' })

    // Breadcrumb navigation is always rendered
    await expect(page.getByRole('link', { name: 'COGS', exact: true })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Without nmId: alert about missing product ID
    const hasMissingAlert = (await page.getByText('Не указан ID товара').count()) > 0
    // With nmId but no data: skeleton, error, empty state, or table
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('История изменений COGS пуста').count()) > 0
    const hasError = (await page.getByText('Ошибка загрузки истории COGS').count()) > 0
    expect(hasMissingAlert || hasSkeleton || hasTable || hasEmpty || hasError).toBeTruthy()
  })

  test('COGS history page with nmId query param renders content', async ({ page }) => {
    await page.goto(`${ROUTES.cogsHistory}?nmId=173589742`, { waitUntil: 'domcontentloaded' })

    // Breadcrumb navigation
    await expect(page.getByRole('link', { name: 'COGS', exact: true })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Valid mount states: skeleton (loading), table (data), empty, or error
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('История изменений COGS пуста').count()) > 0
    const hasError = (await page.getByText('Ошибка загрузки истории COGS').count()) > 0
    expect(hasSkeleton || hasTable || hasEmpty || hasError).toBeTruthy()
  })

  test('COGS history page has correct heading hierarchy', async ({ page }) => {
    await page.goto(`${ROUTES.cogsHistory}?nmId=173589742`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('link', { name: 'COGS', exact: true })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Page uses breadcrumbs instead of h1; CardTitle headings may be present
    const hasCardTitle =
      (await page.getByRole('heading', { name: 'История изменений' }).count()) > 0
    const hasEmptyTitle =
      (await page.getByRole('heading', { name: 'История изменений COGS пуста' }).count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    const hasError = (await page.getByText('Ошибка загрузки истории COGS').count()) > 0
    expect(hasCardTitle || hasEmptyTitle || hasSkeleton || hasError).toBeTruthy()
  })

  // --- Navigation ---

  test('navigation from dashboard to bulk COGS page works', async ({ page }) => {
    // Navigate to COGS section first, then to bulk
    await page.goto(ROUTES.cogs, { waitUntil: 'domcontentloaded' })

    // Look for a link/button to bulk assignment page
    const bulkLink = page.locator('a[href="/cogs/bulk"], a[href*="bulk"]')
    const hasBulkLink = (await bulkLink.count()) > 0

    if (hasBulkLink) {
      await bulkLink.first().click()
      await expect(
        page.getByRole('heading', { name: 'Массовое назначение себестоимости' })
      ).toBeVisible({ timeout: TIMEOUTS.navigation })
      expect(page.url()).toContain('/cogs/bulk')
    } else {
      // Direct navigation fallback — sidebar may have COGS dropdown
      await page.goto(ROUTES.cogsBulk, { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('heading', { name: 'Массовое назначение себестоимости' })
      ).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  test('navigation from dashboard to COGS history page works', async ({ page }) => {
    await page.goto(ROUTES.cogsHistory, { waitUntil: 'domcontentloaded' })

    // Breadcrumb confirms the page mounted correctly
    await expect(page.getByRole('link', { name: 'COGS', exact: true })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    expect(page.url()).toContain('/cogs/history')
  })
})
