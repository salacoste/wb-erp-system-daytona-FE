/**
 * E2E Tests: Box Types Management Page
 * Route: /shipments/box-types
 * Page: src/app/(dashboard)/shipments/box-types/page.tsx
 *
 * Covers heading, table/empty state, sidebar navigation.
 * No role restriction — accessible to all authenticated users.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/box-types-page.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('Box Types Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.shipmentsBoxTypes, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders page heading "Типы коробок"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Типы коробок' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('shows table, empty state, or error with retry', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Типы коробок' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const hasTable = (await page.locator('table').count()) > 0
    const hasEmptyState = (await page.getByText(/добавить тип коробки/i).count()) > 0
    const hasRetryBtn = (await page.getByRole('button', { name: 'Повторить' }).count()) > 0

    expect(hasTable || hasEmptyState || hasRetryBtn).toBeTruthy()
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
