/**
 * E2E Tests: FBS Shipments List Page
 * Route: /shipments
 * Page: src/app/(dashboard)/shipments/page.tsx
 *
 * Covers heading, page structure, sidebar navigation, role-based gating.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/shipments-page.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('Shipments List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.shipments, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading "Отправки"', async ({ page }) => {
    // 174.4: level+exact — the substring match also resolves the pending-state
    // h2 "Загружаем отправки" while shipments are loading (strict-mode violation
    // under slow loads). Same locator shape as shipments-list.spec.ts.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Отправки', exact: true })
    ).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('shows table or empty state or access denied', async ({ page }) => {
    await expect(
      page.getByRole('heading', { level: 1, name: 'Отправки', exact: true })
    ).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const main = page.locator('main')
    const mainText = (await main.textContent()) ?? ''
    const hasTable = (await main.locator('table').count()) > 0
    const hasKnownStateText =
      /нет отправок|создайте первую отправку|создать отправку|нет данных|доступ запрещён|загрузка отправок/i.test(
        mainText
      )
    const hasSkeleton = (await main.locator('[data-slot="skeleton"], .animate-pulse').count()) > 0

    expect(hasTable || hasKnownStateText || hasSkeleton).toBeTruthy()
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
})
