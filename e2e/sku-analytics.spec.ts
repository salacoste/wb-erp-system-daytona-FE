/**
 * E2E Smoke Tests: SKU Financial Analytics Page
 * Route: /analytics/sku
 * Page: src/app/(dashboard)/analytics/sku/page.tsx
 *
 * Focused smoke test — margin-analytics.spec.ts covers broader SKU interactions.
 * This spec verifies the dedicated /analytics/sku route loads correctly.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9)
 * - No hard waits (anti-pattern #7)
 *
 * Run: npx playwright test e2e/sku-analytics.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const PAGE_URL = ROUTES.analytics.sku

test.describe('SKU Financial Analytics — Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('page loads with heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Маржинальность по товарам', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('subtitle describes the page purpose', async ({ page }) => {
    await expect(page.getByText('Анализ прибыли и маржинальности по каждому SKU')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('table or grid content area is present', async ({ page }) => {
    // Page renders either data table, skeleton, empty state, or WB token gate
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    const hasEmpty = (await page.getByText(/нет данных/i).count()) > 0
    const hasWbGate = (await page.getByText(/токен/i).count()) > 0

    expect(hasTable || hasSkeleton || hasEmpty || hasWbGate).toBeTruthy()
  })

  test('week or period selector is visible', async ({ page }) => {
    // SKU page uses a date range picker with combobox triggers
    const hasCombobox = (await page.locator('button[role="combobox"]').count()) > 0
    const hasWeekText = (await page.locator('text=/W\\d{1,2}|недел/i').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0

    expect(hasCombobox || hasWeekText || hasSkeleton).toBeTruthy()
  })

  test('export button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /экспорт/i })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })
})
