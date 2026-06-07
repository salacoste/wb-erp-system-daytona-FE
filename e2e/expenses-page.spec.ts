/**
 * E2E Tests: Operational Expenses Page
 * Covers /settings/expenses heading, month selector, add button, summary cards, table/empty state.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - Russian text assertions (locale is ru)
 *
 * Run: npx playwright test e2e/expenses-page.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('Expenses Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.settings.expenses, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders heading "Операционные расходы"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Операционные расходы' })).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('renders subtitle about managing expenses by month', async ({ page }) => {
    await expect(
      page.getByText('Учёт и управление операционными расходами по месяцам')
    ).toBeVisible()
  })

  test('shows month selector input', async ({ page }) => {
    const monthInput = page.locator('#month-selector')
    await expect(monthInput).toBeVisible({ timeout: TIMEOUTS.navigation })
    await expect(monthInput).toHaveAttribute('type', 'month')
  })

  test('shows "Добавить расход" button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Добавить расход/ })).toBeVisible()
  })

  test('renders expense summary cards area', async ({ page }) => {
    // Summary cards are always rendered (even with default month / loading state)
    const cardsArea = page.locator('.grid')
    const hasCards = (await cardsArea.count()) > 0
    const hasSkeleton = (await page.getByTestId('skeleton').count()) > 0
    expect(hasCards || hasSkeleton).toBeTruthy()
  })

  test('renders table or empty state container', async ({ page }) => {
    // Valid states: table with rows, empty-state card, or loading skeleton
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmptyText = (await page.getByText('Нет расходов за этот месяц').count()) > 0
    const hasSkeleton = (await page.getByTestId('skeleton').count()) > 0
    expect(hasTable || hasEmptyText || hasSkeleton).toBeTruthy()
  })
})
