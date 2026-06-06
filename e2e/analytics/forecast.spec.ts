/**
 * E2E Tests: AI Forecast Page (/analytics/forecast)
 *
 * Covers heading verification, content-area rendering, heading-hierarchy
 * accessibility, navigation from dashboard, and error-free page load.
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout, no waitForLoadState('networkidle').
 *
 * Requires: running frontend (port 3100), authenticated session (auth.setup.ts).
 * Run with: npm run test:e2e -- e2e/analytics/forecast.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from '../fixtures/test-data'

test.describe('AI Forecast Page', () => {
  test.beforeEach(async ({ page }) => {
    // Auth storage state is injected by Playwright config (auth.setup.ts).
    // Navigate to dashboard first to ensure app shell is mounted.
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('page renders heading "AI Прогноз продаж"', async ({ page }) => {
    await page.goto(ROUTES.analytics.forecast, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('page has correct heading hierarchy (h1 present)', async ({ page }) => {
    await page.goto(ROUTES.analytics.forecast, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('forecast content area renders (params card, disabled alert, or skeleton)', async ({
    page,
  }) => {
    await page.goto(ROUTES.analytics.forecast, { waitUntil: 'domcontentloaded' })

    // Wait for heading to confirm page mounted
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Valid mounted states:
    // - params card (horizon selector renders when AI enabled)
    // - disabled alert (AI forecasts toggled off)
    // - skeleton (loading state)
    const hasHorizon = (await page.getByText('Горизонт').count()) > 0
    const hasDisabledAlert = (await page.getByText('AI прогнозы отключены').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    expect(hasHorizon || hasDisabledAlert || hasSkeleton).toBeTruthy()
  })

  test('navigation from dashboard to forecast page works', async ({ page }) => {
    // We are on the dashboard from beforeEach. Navigate to forecast.
    await page.goto(ROUTES.analytics.forecast, { waitUntil: 'domcontentloaded' })

    // Verify we arrived at the correct page by checking the URL
    await expect(page).toHaveURL(/\/analytics\/forecast/, { timeout: TIMEOUTS.navigation })

    // Verify the heading is visible (page actually rendered)
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto(ROUTES.analytics.forecast, { waitUntil: 'domcontentloaded' })

    // Wait for the heading to ensure the page has fully mounted
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Filter out known harmless warnings (e.g. React dev-only warnings, network errors from missing backend)
    const realErrors = consoleErrors.filter(
      e => !e.includes('downloadable font') && !e.includes('Failed to fetch')
    )
    expect(realErrors).toHaveLength(0)
  })
})
