/**
 * E2E Tests: Time Period Analytics Page
 * Route: /analytics/time-period
 * Page: src/app/(dashboard)/analytics/time-period/page.tsx
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9)
 * - No hard waits (anti-pattern #7); use element assertions
 * - Russian text for assertions (UI is in Russian)
 *
 * Run: npx playwright test e2e/time-period-analytics.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const PAGE_URL = ROUTES.analytics.timePeriod

test.describe('Time Period Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Анализ маржинальности по времени', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('period selector controls are visible', async ({ page }) => {
    // Period selector card heading
    await expect(page.getByText('Период анализа')).toBeVisible({ timeout: TIMEOUTS.navigation })

    // Select trigger for choosing weeks
    const selectTrigger = page.locator('#time-period')
    await expect(selectTrigger).toBeVisible({ timeout: TIMEOUTS.navigation })
  })

  test('chart container or empty state is present', async ({ page }) => {
    // MarginTrendChart renders either a recharts area or an empty state
    const hasChart = (await page.locator('.recharts-wrapper').count()) > 0
    const hasEmpty = (await page.getByText(/нет данных|no data/i).count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0

    expect(hasChart || hasEmpty || hasSkeleton).toBeTruthy()
  })

  test('info alert explains margin formula', async ({ page }) => {
    // The info alert describing COGS-based margin calculation
    await expect(page.getByText(/маржа.*рассчитывается/i)).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('help card explains how to read the chart', async ({ page }) => {
    await expect(page.getByText('Как читать график')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })

    // Color legend inside the help card
    await expect(page.getByText('Зелёные точки')).toBeVisible()
  })

  test('navigation links to SKU, brand, category pages', async ({ page }) => {
    const skuLink = page.locator('a[href="/analytics/sku"]')
    await expect(skuLink).toBeVisible({ timeout: TIMEOUTS.navigation })

    const brandLink = page.locator('a[href="/analytics/brand"]')
    await expect(brandLink).toBeVisible()

    const categoryLink = page.locator('a[href="/analytics/category"]')
    await expect(categoryLink).toBeVisible()
  })

  test('selecting a different period keeps page stable', async ({ page }) => {
    const selectTrigger = page.locator('#time-period')
    await selectTrigger.click()

    // Pick "4 недели" option
    const option = page.getByRole('option', { name: /4 недели/ })
    if (await option.isVisible()) {
      await option.click()
      // Page should remain functional — no crash
      await expect(
        page.getByRole('heading', { name: 'Анализ маржинальности по времени' })
      ).toBeVisible()
    }
  })
})
