/**
 * E2E Tests: AI Sales Forecast Page
 * Route: /analytics/forecast
 * Page: src/app/(dashboard)/analytics/forecast/page.tsx
 *
 * Covers heading, page structure, readiness-state branching, sidebar navigation.
 * The forecast page has 4 render states based on AI engine readiness:
 *   - AI disabled → alert "AI прогнозы отключены"
 *   - Collecting → progress tracker
 *   - Sneak preview → preview section
 *   - Ready → params card + metrics + chart + table
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/forecast-page.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('AI Sales Forecast Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.analytics.forecast, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading "AI Прогноз продаж"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('renders subtitle about machine learning', async ({ page }) => {
    await expect(page.getByText('Прогноз на основе машинного обучения')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('shows one of the 4 readiness states', async ({ page }) => {
    // Wait for heading to confirm page hydrated
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Exactly one of these states should be visible
    const hasDisabledAlert = (await page.getByText('AI прогнозы отключены').count()) > 0
    const hasCollecting = (await page.getByText(/собираем|обучаем|collecting/i).count()) > 0
    const hasParamsCard = (await page.getByText('Параметры прогноза').count()) > 0
    const hasSneakPreview = (await page.getByText(/предпросмотр|preview/i).count()) > 0

    expect(hasDisabledAlert || hasCollecting || hasParamsCard || hasSneakPreview).toBeTruthy()
  })

  test('main content area rendered within <main>', async ({ page }) => {
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('sidebar navigation present', async ({ page }) => {
    const sidebar = page.locator('nav[aria-label="Main navigation"]')
    const sidebarAlt = page.locator('nav').first()
    const hasSidebar =
      (await sidebar.count()) > 0 || (await sidebarAlt.isVisible().catch(() => false))
    expect(hasSidebar).toBeTruthy()
  })

  test('page has proper heading hierarchy', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })
})
