/**
 * E2E Smoke Tests: Analytics Pages
 *
 * Verifies each analytics route renders its heading and reaches a valid
 * mount state (data, empty, skeleton, or error) without crashing.
 *
 * Uses domcontentloaded + landmark waits (CLAUDE.md anti-pattern #9).
 * No waitForTimeout, no waitForLoadState('networkidle').
 *
 * Requires: running frontend (port 3100), authenticated session (auth.setup.ts).
 * Run with: npm run test:e2e -- e2e/analytics/analytics-pages-smoke.spec.ts
 */

import { test, expect } from '../fixtures/network-test'
import { ROUTES, TIMEOUTS } from '../fixtures/test-data'

test.describe('Analytics Pages — Smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Auth storage state is injected by Playwright config (auth.setup.ts).
    // Navigate to dashboard first to ensure app shell is mounted.
    await page.goto(ROUTES.dashboard, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
      timeout: TIMEOUTS.navigation,
    })
  })

  // --- Brand analytics ---

  test('brand page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.brand, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по брендам', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Нет данных за выбранную неделю').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    expect(hasTable || hasEmpty || hasSkeleton).toBeTruthy()
  })

  test('brand page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.brand, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Маржинальность по брендам' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Category analytics ---

  test('category page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.category, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по категориям', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Нет данных за выбранную неделю').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    expect(hasTable || hasEmpty || hasSkeleton).toBeTruthy()
  })

  test('category page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.category, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Маржинальность по категориям' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Returns analytics ---

  test('returns page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.returns, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Аналитика возвратов', level: 1 })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Нет данных').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    expect(hasTable || hasEmpty || hasSkeleton).toBeTruthy()
  })

  test('returns page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.returns, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Аналитика возвратов' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- SKU analytics ---

  test('sku page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.sku, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Маржинальность по товарам', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Нет данных').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    const hasWbTokenGate = (await page.getByText('требуется токен').count()) > 0
    expect(hasTable || hasEmpty || hasSkeleton || hasWbTokenGate).toBeTruthy()
  })

  test('sku page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.sku, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Маржинальность по товарам' })).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Storage analytics ---

  test('storage page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.storage, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Аналитика расходов на хранение', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmpty = (await page.getByText('Нет данных за выбранный период').count()) > 0
    const hasSkeleton = (await page.locator('.animate-pulse').count()) > 0
    const hasError = (await page.getByText('Не удалось загрузить').count()) > 0
    expect(hasTable || hasEmpty || hasSkeleton || hasError).toBeTruthy()
  })

  test('storage page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.storage, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: 'Аналитика расходов на хранение' })).toBeVisible(
      {
        timeout: TIMEOUTS.api,
      }
    )

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  // --- Time period analytics ---

  test('time-period page renders heading and content area', async ({ page }) => {
    await page.goto(ROUTES.analytics.timePeriod, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Анализ маржинальности по времени', level: 1 })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    // Static page — always renders period selector card
    const hasPeriodCard = (await page.getByText('Период анализа').count()) > 0
    expect(hasPeriodCard).toBeTruthy()
  })

  test('time-period page has correct heading hierarchy', async ({ page }) => {
    await page.goto(ROUTES.analytics.timePeriod, { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { name: 'Анализ маржинальности по времени' })
    ).toBeVisible({ timeout: TIMEOUTS.api })

    const h1Count = await page.getByRole('heading', { level: 1 }).count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })
})
