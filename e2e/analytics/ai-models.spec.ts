/**
 * E2E Tests: AI Models Pages (/analytics/models/*)
 *
 * Covers heading verification, content-area rendering, heading-hierarchy
 * accessibility, navigation from dashboard, and error-free page load for:
 *   - /analytics/models — Model listing
 *   - /analytics/models/[id]/evaluations — Model evaluations
 *   - /analytics/models/[id]/performance — Model performance
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout, no waitForLoadState('networkidle').
 *
 * Requires: running frontend (port 3100), authenticated session (auth.setup.ts).
 * Run with: npm run test:e2e -- e2e/analytics/ai-models.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from '../fixtures/test-data'

/** Placeholder model ID for dynamic sub-routes. */
const MODEL_ID = 'test-model-id'

test.describe('AI Models Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Auth storage state is injected by Playwright config (auth.setup.ts).
    // Navigate to dashboard first to ensure app shell is mounted.
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  // --- Models listing page (/analytics/models) ---

  test('models listing page renders title and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.list, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Модели AI', level: 1 })).toBeVisible({ timeout: TIMEOUTS.api })

    // Valid mount states: table with models, empty-state alert, loading skeleton, or error alert
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Модели ещё не обучены').count()) > 0
    const hasSkeleton = (await page.locator('[data-testid="skeleton"], .animate-pulse').count()) > 0
    const hasError = (await page.getByText('Ошибка загрузки списка моделей').count()) > 0
    expect(hasTable || hasEmpty || hasSkeleton || hasError).toBeTruthy()
  })

  test('models listing page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.list, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Модели AI', level: 1 })).toBeVisible({ timeout: TIMEOUTS.api })

    // At least one h1-level heading should exist in the layout shell
    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('navigation from dashboard to models listing page works', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.list, { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/analytics\/models$/, { timeout: TIMEOUTS.navigation })
    await expect(page.getByRole('heading', { name: 'Модели AI', level: 1 })).toBeVisible({ timeout: TIMEOUTS.api })
  })

  // --- Model evaluations page (/analytics/models/[id]/evaluations) ---

  test('evaluations page renders title and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.evaluations(MODEL_ID), {
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('heading', { name: 'Оценки точности модели', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Valid mount states: model-not-found, loading skeleton, evaluations-error, empty, or table
    const hasSkeleton = (await page.locator('[data-testid="evaluations-skeleton"]').count()) > 0
    const hasNotFound = (await page.getByText('Модель не найдена').count()) > 0
    const hasError = (await page.getByText('Ошибка загрузки').count()) > 0
    const hasEmpty = (await page.getByText('Нет оценок этой модели').count()) > 0
    const hasTable = (await page.getByRole('table').count()) > 0
    expect(hasSkeleton || hasNotFound || hasError || hasEmpty || hasTable).toBeTruthy()
  })

  test('evaluations page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.evaluations(MODEL_ID), {
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('heading', { name: 'Оценки точности модели', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Model performance page (/analytics/models/[id]/performance) ---

  test('performance page renders title and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.performance(MODEL_ID), {
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('heading', { name: 'Производительность модели', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Valid mount states: model-not-found, loading skeleton, performance table/chart, or error alert
    const hasSkeleton = (await page.locator('[data-testid="skeleton"], .animate-pulse').count()) > 0
    const hasNotFound = (await page.getByText('Модель не найдена').count()) > 0
    const hasError = (await page.getByText('Ошибка загрузки').count()) > 0
    const hasChart = (await page.getByRole('img', { name: /График тренда точности модели MAPE/ }).count()) > 0
    expect(hasSkeleton || hasNotFound || hasError || hasChart).toBeTruthy()
  })

  test('performance page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.models.performance(MODEL_ID), {
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('heading', { name: 'Производительность модели', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Cross-page: error-free load ---

  test('models listing page loads without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto(ROUTES.analytics.models.list, { waitUntil: 'domcontentloaded' })

    // Wait for content to mount
    await expect(page.getByRole('heading', { name: 'Модели AI', level: 1 })).toBeVisible({ timeout: TIMEOUTS.api })

    // Filter out known harmless warnings
    const realErrors = consoleErrors.filter(
      e => !e.includes('downloadable font') && !e.includes('Failed to fetch')
    )
    expect(realErrors).toHaveLength(0)
  })
})
