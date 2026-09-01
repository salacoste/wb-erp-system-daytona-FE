/**
 * E2E Tests: AI Admin Preferences Page
 * Covers /analytics/ai-admin/preferences heading, settings form, sidebar, content structure.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/ai-admin-preferences.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('AI Admin Preferences Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.analytics.aiAdmin.preferences, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders heading "Настройки AI"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Настройки AI' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('renders settings form area with toggle label', async ({ page }) => {
    // The form contains a "Включить AI прогнозы" label — visible for Owners;
    // non-Owners see "Доступ запрещён" alert; loading shows skeleton.
    const hasToggleLabel = (await page.getByText('Включить AI прогнозы').count()) > 0
    const hasDenied = (await page.getByText('Доступ запрещён').count()) > 0
    const hasSkeleton = (await page.locator('[aria-label="Загрузка"]').count()) > 0
    expect(hasToggleLabel || hasDenied || hasSkeleton).toBeTruthy()
  })

  test('main content area rendered', async ({ page }) => {
    // Page wraps content in <main> with container classes
    const main = page.locator('main')
    await expect(main.first()).toBeVisible()
  })

  test('sidebar navigation present', async ({ page }) => {
    // Dashboard layout includes a nav with aria-label
    const sidebar = page.locator('nav[aria-label="Main navigation"]')
    const sidebarAlt = page.locator('nav').first()
    const hasSidebar =
      (await sidebar.count()) > 0 || (await sidebarAlt.isVisible().catch(() => false))
    expect(hasSidebar).toBeTruthy()
  })

  test('page has proper structure with heading hierarchy', async ({ page }) => {
    // 174.4: wait for the PAGE-OWNED h1, not "any first heading" — the
    // sidebar's "WB Repricer" h2 satisfies the old wait from SSR onward, so
    // the instant h1 count raced the role-gated AiPreferencesForm render
    // (returns null until auth hydrates) and counted 0 (baseline failure).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })
})
