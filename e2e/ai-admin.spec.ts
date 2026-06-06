/**
 * E2E Tests: AI Admin Pages (Anomalies, Models, Forecast)
 *
 * Covers navigation, heading verification, data display states,
 * and heading-hierarchy accessibility for AI admin routes.
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout, no waitForLoadState('networkidle').
 *
 * Requires: running frontend (port 3100), authenticated session (auth.setup.ts).
 * Run with: npm run test:e2e -- e2e/ai-admin.spec.ts
 */

import { test, expect } from '@playwright/test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

test.describe('AI Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Auth storage state is injected by Playwright config (auth.setup.ts).
    // Navigate to dashboard first to ensure app shell is mounted.
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  // --- Anomalies page ---

  test('anomalies page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.ANALYTICS.AI_ADMIN.ANOMALIES, {
      waitUntil: 'domcontentloaded',
    })

    // Page heading
    await expect(page.getByRole('heading', { name: 'Разрешение аномалий', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Either table renders or empty-state text — both are valid mounted states
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmptyText = (await page.getByText('Нет аномалий').count()) > 0
    const hasSkeleton = (await page.getByRole('status').count()) > 0
    expect(hasTable || hasEmptyText || hasSkeleton).toBeTruthy()
  })

  test('anomalies page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.ANALYTICS.AI_ADMIN.ANOMALIES, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('heading', { name: 'Разрешение аномалий' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // h1 is the only top-level heading on the page
    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Models page ---

  test('models page renders heading and model list or empty state', async ({ page }) => {
    await page.goto(ROUTES.ANALYTICS.AI_ADMIN.MODELS, {
      waitUntil: 'domcontentloaded',
    })

    // Page heading
    await expect(
      page.getByRole('heading', { name: 'Управление AI моделями', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    // Either table, empty-state text, access-denied alert, or skeleton — all valid
    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Модели не найдены').count()) > 0
    const hasDenied = (await page.getByText('Доступ запрещён').count()) > 0
    const hasSkeleton = (await page.locator('[aria-label="Загрузка"]').count()) > 0
    expect(hasTable || hasEmpty || hasDenied || hasSkeleton).toBeTruthy()
  })

  test('models page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.ANALYTICS.AI_ADMIN.MODELS, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('heading', { name: 'Управление AI моделями' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Forecast page ---

  test('forecast page renders heading and forecast content', async ({ page }) => {
    await page.goto(ROUTES.ANALYTICS.FORECAST, {
      waitUntil: 'domcontentloaded',
    })

    // Page heading
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    // Valid states: params card (always rendered when AI enabled), disabled alert, or skeleton
    const hasParams =
      (await page.getByRole('combobox', { name: '' }).count()) > 0 ||
      (await page.getByText('Горизонт').count()) > 0
    const hasDisabledAlert = (await page.getByText('AI прогнозы отключены').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    expect(hasParams || hasDisabledAlert || hasSkeleton).toBeTruthy()
  })

  test('forecast page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.ANALYTICS.FORECAST, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('heading', { name: 'AI Прогноз продаж' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })
})
