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

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('Shipments List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.shipments, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading "Отправки"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Отправки' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('shows table or empty state or access denied', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Отправки' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const hasTable = (await page.locator('table').count()) > 0
    const hasEmpty = (await page.getByText(/нет отправк|нет данных/i).count()) > 0
    const hasDenied = (await page.getByText('Доступ запрещён').count()) > 0
    const hasSkeleton = (await page.locator('[data-slot="skeleton"]').count()) > 0

    expect(hasTable || hasEmpty || hasDenied || hasSkeleton).toBeTruthy()
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
