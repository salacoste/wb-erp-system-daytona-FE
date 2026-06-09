/**
 * E2E Tests: Financial Gaps Analysis Page
 * Route: /analytics/gaps
 *
 * Smoke tests for the Financial Gaps page — page load, key UI elements,
 * and graceful handling of empty/error states.
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForLoadState('networkidle') — no background polling on this page,
 * but the pattern is kept consistent with the rest of the E2E suite.
 *
 * NOTE: These tests require a running frontend (port 3100) and authenticated session.
 * Run with: npm run test:e2e -- e2e/financial-gaps.spec.ts
 */

import { test, expect } from '@playwright/test'
import { TIMEOUTS } from './fixtures/test-data'

const GAPS_ROUTE = '/analytics/gaps'
const DASHBOARD_ROUTE = '/dashboard'

test.describe('Financial Gaps Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // domcontentloaded + sidebar landmark wait (not networkidle — CLAUDE.md #9)
    await page.goto(DASHBOARD_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  test('navigates directly to /analytics/gaps and renders page heading', async ({ page }) => {
    await page.goto(GAPS_ROUTE, { waitUntil: 'domcontentloaded' })

    // Page heading must be present
    await expect(page.getByRole('heading', { name: 'Пропуски в данных' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Subtitle text should also be visible
    await expect(
      page.getByText('Анализ и исправление пропущенных дней в финансовых данных')
    ).toBeVisible()
  })

  test('renders date range inputs with default values', async ({ page }) => {
    await page.goto(GAPS_ROUTE, { waitUntil: 'domcontentloaded' })

    // Both date inputs should be present with labels
    const dateFromInput = page.locator('input[type="date"]').first()
    const dateToInput = page.locator('input[type="date"]').nth(1)

    await expect(dateFromInput).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(dateToInput).toBeVisible()

    // Labels for "С" and "По" should be visible
    await expect(page.getByText('С', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('По', { exact: false }).first()).toBeVisible()

    // Inputs should have default date values (not empty)
    const fromValue = await dateFromInput.inputValue()
    const toValue = await dateToInput.inputValue()
    expect(fromValue).not.toBe('')
    expect(toValue).not.toBe('')
  })

  test('renders summary cards area (loading or populated)', async ({ page }) => {
    await page.goto(GAPS_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Пропуски в данных' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Summary cards should render — either skeleton (loading) or populated cards.
    // Check for the grid container that holds the 4 metric cards.
    // GapsSummaryCards renders inside a grid with class "grid-cols-4".
    const cardsGrid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4')
    const hasCardsGrid = (await cardsGrid.count()) > 0

    // Alternatively check for skeleton or metric labels
    const hasSkeleton = (await page.locator('[aria-busy="true"]').count()) > 0
    const hasMetricLabels =
      (await page.getByText('Покрытие').count()) > 0 ||
      (await page.getByText('Всего дней').count()) > 0

    expect(hasCardsGrid || hasSkeleton || hasMetricLabels).toBeTruthy()
  })

  test('renders gaps table area (loading, empty, or populated)', async ({ page }) => {
    await page.goto(GAPS_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Пропуски в данных' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // GapsTable renders one of three states: skeleton (loading), empty message, or table rows.
    // Check for any of: table headers (Дата, День недели), empty-state text, or skeleton.
    const hasTableHeaders = (await page.getByText('Дата', { exact: true }).count()) > 0
    const hasEmptyState = (await page.getByText('Пропуски не обнаружены').count()) > 0
    const hasSkeleton = (await page.locator('.space-y-3 > [data-slot="skeleton"]').count()) > 0

    expect(hasTableHeaders || hasEmptyState || hasSkeleton).toBeTruthy()
  })

  test('shows empty-state message when API returns no gaps', async ({ page }) => {
    // Mock the gaps endpoint to return an empty gaps response
    await page.route('**/v1/imports/gaps**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_days: 30,
            existing_days: 30,
            missing_days: 0,
            coverage_percent: 100,
            missing_dates: [],
          },
        }),
      })
    )

    await page.goto(GAPS_ROUTE, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Пропуски в данных' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Summary cards should show 100% coverage
    await expect(page.getByText('100')).toBeVisible({ timeout: TIMEOUTS.api })

    // Table area should show empty-state message
    await expect(page.getByText('Пропуски не обнаружены')).toBeVisible({ timeout: TIMEOUTS.api })

    // No analyze buttons should be present when there are no gaps
    await expect(page.getByRole('button', { name: /Анализ/ })).not.toBeVisible()
  })
})

test.describe('Financial Gaps — Error state', () => {
  test('shows graceful state when API returns 500', async ({ page }) => {
    // Mock the gaps endpoint to return a server error
    await page.route('**/v1/imports/gaps**', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      })
    )

    await page.goto(GAPS_ROUTE, { waitUntil: 'domcontentloaded' })

    // Page heading should still render (layout is resilient)
    await expect(page.getByRole('heading', { name: 'Пропуски в данных' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Date inputs should still be interactive
    const dateInputs = page.locator('input[type="date"]')
    await expect(dateInputs.first()).toBeVisible({ timeout: TIMEOUTS.api })
  })
})
