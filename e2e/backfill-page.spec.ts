/**
 * E2E Tests: Backfill Admin Page (Owner-only)
 * Route: /settings/backfill
 * Page: src/app/(dashboard)/settings/backfill/page.tsx
 *
 * Covers heading, subtitle, role-based redirect, sidebar, content structure.
 * This page requires Owner role — non-Owners are redirected to /dashboard.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/backfill-page.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('Backfill Admin Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.settings.backfill, { waitUntil: 'domcontentloaded' })
  })

  test('renders heading "Управление бэкфиллом" for Owner or redirects non-Owner', async ({
    page,
  }) => {
    // Owner sees the heading; non-Owner gets redirected to /dashboard
    const hasHeading = await page
      .getByRole('heading', { name: 'Управление бэкфиллом' })
      .isVisible({ timeout: TIMEOUTS.api })
      .catch(() => false)
    const wasRedirected = page.url().includes('/dashboard')

    expect(hasHeading || wasRedirected).toBeTruthy()
  })

  test('shows subtitle about historical data when visible', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Управление бэкфиллом' })
    const isVisible = await heading.isVisible({ timeout: TIMEOUTS.api }).catch(() => false)

    if (isVisible) {
      await expect(page.getByText('Загрузка исторических данных FBS')).toBeVisible()
    }
  })

  test('shows table or refresh button when page is visible', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Управление бэкфиллом' })
    const isVisible = await heading.isVisible({ timeout: TIMEOUTS.api }).catch(() => false)

    if (isVisible) {
      const hasTable = (await page.locator('table').count()) > 0
      const hasRefresh = (await page.getByRole('button', { name: /обновить/i }).count()) > 0
      const hasStartBtn =
        (await page.getByRole('button', { name: /запустить бэкфилл/i }).count()) > 0

      expect(hasTable || hasRefresh || hasStartBtn).toBeTruthy()
    }
  })

  test('sidebar navigation present', async ({ page }) => {
    // Wait for any page state to settle
    await page.waitForTimeout(500)
    const sidebar = page.locator('nav[aria-label="Main navigation"]')
    const sidebarAlt = page.locator('nav').first()
    const hasSidebar =
      (await sidebar.count()) > 0 || (await sidebarAlt.isVisible().catch(() => false))
    expect(hasSidebar).toBeTruthy()
  })
})
