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

import type { Page } from '@playwright/test'

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

async function expectOwnerShellOrRedirect(page: Page): Promise<boolean> {
  const heading = page.getByRole('heading', { name: 'Управление бэкфиллом' })
  const ownerShellVisible = await heading
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
    .then(() => true)
    .catch(() => false)

  if (ownerShellVisible) {
    await expect(page).toHaveURL(/\/settings\/backfill(?:[/?#]|$)/)
    await expect(heading).toBeVisible()
    await expect(page.getByText('Загрузка исторических данных FBS за 365 дней')).toBeVisible()
    return true
  }

  await expect(page).toHaveURL(/\/(dashboard|login)(?:[/?#]|$)/)
  await expect(heading).toHaveCount(0)
  return false
}

test.describe('Backfill Admin Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.settings.backfill, { waitUntil: 'domcontentloaded' })
  })

  test('renders heading "Управление бэкфиллом" for Owner or redirects non-Owner', async ({
    page,
  }) => {
    await expectOwnerShellOrRedirect(page)
  })

  test('shows subtitle about historical data when visible', async ({ page }) => {
    const isOwner = await expectOwnerShellOrRedirect(page)

    if (isOwner) {
      await expect(page.getByText('Загрузка исторических данных FBS')).toBeVisible()
    }
  })

  test('shows table or refresh button when page is visible', async ({ page }) => {
    const isOwner = await expectOwnerShellOrRedirect(page)

    if (isOwner) {
      await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Запустить бэкфилл' })).toBeVisible()

      const table = page.getByRole('table')
      const emptyState = page.getByText('Нет кабинетов для бэкфилла')
      await expect(table.or(emptyState)).toBeVisible({ timeout: TIMEOUTS.api })
    }
  })

  test('sidebar navigation present', async ({ page }) => {
    await expectOwnerShellOrRedirect(page)
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })
})
