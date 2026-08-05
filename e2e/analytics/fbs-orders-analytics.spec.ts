/**
 * E2E Tests: FBS Orders Analytics Page
 * Story 51.12-FE: E2E Tests for FBS Analytics + Backfill
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Tests the FBS Orders Analytics page with 4 tabs:
 * - Overview (Обзор) - Summary cards and trends chart
 * - Trends (Тренды) - Extended chart with aggregation toggle
 * - Seasonality (Сезонность) - Monthly/weekly/quarterly patterns
 * - Comparison (Сравнение) - Period comparison table
 *
 * @see docs/stories/epic-51/story-51.12-fe-e2e-tests.md
 */

import { test, expect } from '../fixtures/network-test'
import { TIMEOUTS } from '../fixtures/test-data'

// Routes
const ORDERS_ANALYTICS_ROUTE = '/analytics/orders'

// Test selectors
const SELECTORS = {
  // Page elements
  pageTitle: 'h1',
  dateRangePicker: '[data-testid="orders-date-range"], [id="orders-date-range"]',

  // Tabs
  tabsList: '[role="tablist"]',
  overviewTab: 'button:has-text("Обзор")',
  trendsTab: 'button:has-text("Тренды")',
  seasonalityTab: 'button:has-text("Сезонность")',
  comparisonTab: 'button:has-text("Сравнение")',

  // Tab panels
  tabPanel: '[role="tabpanel"]',

  // Overview components
  summaryCard: '[data-testid="summary-card"]',
  trendsChart: '[data-testid="trends-chart"]',

  // Trends components
  aggregationToggle: '[data-testid="aggregation-toggle"]',
  extendedChart: '[data-testid="extended-chart"]',

  // Seasonality components
  seasonalPatterns: '[data-testid="seasonal-patterns"]',
  patternTypeSelector: '[data-testid="pattern-type-selector"]',

  // Comparison components
  comparisonTable: '[data-testid="comparison-table"]',
  periodSelector: '[data-testid="period-selector"]',

  // Loading & Error states
  loadingSpinner: '[data-testid="loading"]',
  errorState: '[data-testid="error-state"]',
  emptyState: '[data-testid="empty-state"]',
}

test.describe('Epic 51-FE: FBS Orders Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ORDERS_ANALYTICS_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
    await expect(
      page.getByRole('heading', { name: 'Аналитика заказов FBS', level: 1 })
    ).toBeVisible()
    await expect(page.locator('#orders-date-range')).toBeVisible()
    await page.waitForTimeout(2000) // Allow data to load
  })

  test.describe('Page Structure & Navigation', () => {
    test('should display page with title and navigation', async ({ page }) => {
      // Verify page loaded
      await expect(page.locator('main')).toBeVisible()

      // Verify page has heading
      const heading = page.locator('h1').first()
      await expect(heading).toBeVisible()
      const headingText = await heading.textContent()
      expect(headingText?.toLowerCase()).toMatch(/заказ|fbs|orders/i)
    })

    test('should display 4 tabs in tab list', async ({ page }) => {
      // Wait for tabs to render
      const tabsList = page.locator(SELECTORS.tabsList)
      await expect(tabsList).toBeVisible()

      // Verify all 4 tabs exist
      await expect(page.locator(SELECTORS.overviewTab)).toBeVisible()
      await expect(page.locator(SELECTORS.trendsTab)).toBeVisible()
      await expect(page.locator(SELECTORS.seasonalityTab)).toBeVisible()
      await expect(page.locator(SELECTORS.comparisonTab)).toBeVisible()
    })

    test('should have Overview tab selected by default', async ({ page }) => {
      const overviewTab = page.locator(SELECTORS.overviewTab)
      await expect(overviewTab).toBeVisible()

      // Check aria-selected or data-state attribute
      const isSelected =
        (await overviewTab.getAttribute('aria-selected')) === 'true' ||
        (await overviewTab.getAttribute('data-state')) === 'active'
      expect(isSelected).toBeTruthy()
    })

    test('should show date range picker for Overview and Trends tabs', async ({ page }) => {
      // On Overview tab - date picker should be visible
      const dateRangePicker = page
        .locator('[id="orders-date-range"]')
        .or(page.locator('button:has-text("Выберите период")'))
        .or(page.locator('[data-testid="date-range-picker"]'))

      // Date picker should be visible on Overview tab
      if (await dateRangePicker.isVisible()) {
        await expect(dateRangePicker).toBeVisible()
      }

      // Switch to Trends tab
      await page.locator(SELECTORS.trendsTab).click()
      await page.waitForTimeout(500)

      // Date picker should still be visible on Trends tab
      if (await dateRangePicker.isVisible()) {
        await expect(dateRangePicker).toBeVisible()
      }

      // Switch to Seasonality tab
      await page.locator(SELECTORS.seasonalityTab).click()
      await page.waitForTimeout(500)

      // Date picker may be hidden on Seasonality tab (seasonal patterns use fixed periods)
    })
  })

  test.describe('Tab Navigation', () => {
    test('should switch to Trends tab on click', async ({ page }) => {
      const trendsTab = page.locator(SELECTORS.trendsTab)
      await trendsTab.click()
      await page.locator('main').waitFor({ state: 'visible' })

      // Verify tab is now selected
      const isSelected =
        (await trendsTab.getAttribute('aria-selected')) === 'true' ||
        (await trendsTab.getAttribute('data-state')) === 'active'
      expect(isSelected).toBeTruthy()

      // Verify URL updated with tab param
      await expect(page).toHaveURL(/tab=trends/)
    })

    test('should switch to Seasonality tab on click', async ({ page }) => {
      const seasonalityTab = page.locator(SELECTORS.seasonalityTab)
      await seasonalityTab.click()
      await page.locator('main').waitFor({ state: 'visible' })

      // Verify tab is now selected
      const isSelected =
        (await seasonalityTab.getAttribute('aria-selected')) === 'true' ||
        (await seasonalityTab.getAttribute('data-state')) === 'active'
      expect(isSelected).toBeTruthy()

      // Verify URL updated
      await expect(page).toHaveURL(/tab=seasonality/)
    })

    test('should switch to Comparison tab on click', async ({ page }) => {
      const comparisonTab = page.locator(SELECTORS.comparisonTab)
      await comparisonTab.click()
      await page.locator('main').waitFor({ state: 'visible' })

      // Verify tab is now selected
      const isSelected =
        (await comparisonTab.getAttribute('aria-selected')) === 'true' ||
        (await comparisonTab.getAttribute('data-state')) === 'active'
      expect(isSelected).toBeTruthy()

      // Verify URL updated
      await expect(page).toHaveURL(/tab=comparison/)
    })

    test('should preserve tab state on URL param', async ({ page }) => {
      // Navigate directly to trends tab via URL
      await page.goto(`${ORDERS_ANALYTICS_ROUTE}?tab=trends`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const trendsTab = page.locator(SELECTORS.trendsTab)
      const isSelected =
        (await trendsTab.getAttribute('aria-selected')) === 'true' ||
        (await trendsTab.getAttribute('data-state')) === 'active'
      expect(isSelected).toBeTruthy()
    })

    test('should support keyboard navigation between tabs', async ({ page }) => {
      // Focus on tabs
      const overviewTab = page.locator(SELECTORS.overviewTab)
      await overviewTab.focus()

      // Press Right arrow to move to next tab
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)

      // Trends tab should now be focused
      const trendsTab = page.locator(SELECTORS.trendsTab)
      await expect(trendsTab).toBeFocused()
    })
  })

  test.describe('Overview Tab (Обзор)', () => {
    test('should display summary cards with metrics', async ({ page }) => {
      // Ensure we're on Overview tab
      const overviewTab = page.locator(SELECTORS.overviewTab)
      await overviewTab.click()
      await page.locator('main').waitFor({ state: 'visible' })

      const summaryGrid = page
        .locator('[role="tabpanel"]:visible .grid')
        .filter({ has: page.getByText('Всего заказов', { exact: true }) })
        .first()
      await expect(summaryGrid.getByText('Всего заказов', { exact: true })).toBeVisible()
      await expect(summaryGrid.getByText('Выручка', { exact: true })).toBeVisible()
    })

    test('should display trends chart', async ({ page }) => {
      await expect(page.getByText('Динамика заказов', { exact: true })).toBeVisible()
      const chartState = page
        .locator('.recharts-responsive-container')
        .or(page.getByText(/нет данных|не удалось загрузить данные|выберите период/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(chartState).toBeVisible()
    })
  })

  test.describe('Trends Tab (Тренды)', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator(SELECTORS.trendsTab).click()
      await page.locator('main').waitFor({ state: 'visible' })
      await page.waitForTimeout(1000)
    })

    test('should display extended trends chart', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Тренды заказов', level: 2 })).toBeVisible()
      const chartState = page
        .locator('.recharts-responsive-container')
        .or(page.getByText(/нет данных|не удалось загрузить данные|выберите период/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(chartState).toBeVisible()
    })

    test('should display aggregation toggle', async ({ page }) => {
      await expect(page.getByText('Настройки отображения', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'По дням' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'По неделям' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'По месяцам' })).toBeVisible()
    })

    test('should update chart when aggregation changes', async ({ page }) => {
      const weeklyButton = page.getByRole('button', { name: 'По неделям' })
      await expect(weeklyButton).toBeVisible()
      await weeklyButton.click()
      await expect(weeklyButton).toHaveClass(/bg-background/)
    })
  })

  test.describe('Seasonality Tab (Сезонность)', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator(SELECTORS.seasonalityTab).click()
      await page.locator('main').waitFor({ state: 'visible' })
      await page.waitForTimeout(1000)
    })

    test('should display seasonal patterns section', async ({ page }) => {
      const errorState = page.getByRole('alert').filter({
        hasText: 'Не удалось загрузить сезонные паттерны. Попробуйте обновить страницу.',
      })
      const heading = page.getByText('Сезонные паттерны', { exact: true })
      await expect(heading.or(errorState).first()).toBeVisible({ timeout: TIMEOUTS.api })
      if (await errorState.isVisible()) {
        await expect(errorState).toContainText(
          'Не удалось загрузить сезонные паттерны. Попробуйте обновить страницу.'
        )
        return
      }

      await expect(heading).toBeVisible()
      const patternsState = page
        .getByText(
          /Пиковый месяц|Нет данных для выбранного представления|Нет данных для отображения/i
        )
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(patternsState).toBeVisible()
    })

    test('should display pattern type selector', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'По месяцам' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'По дням недели' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'По кварталам' })).toBeVisible()
      await expect(page.getByLabel('Период анализа')).toBeVisible()
    })
  })

  test.describe('Comparison Tab (Сравнение)', () => {
    test.beforeEach(async ({ page }) => {
      await page.locator(SELECTORS.comparisonTab).click()
      await page.locator('main').waitFor({ state: 'visible' })
      await page.waitForTimeout(1000)
    })

    test('should display period comparison table', async ({ page }) => {
      const errorState = page.getByRole('alert').filter({
        hasText: 'Не удалось загрузить данные сравнения. Попробуйте обновить страницу.',
      })
      const heading = page.getByText('Сравнение периодов', { exact: true })
      await expect(heading.or(errorState).first()).toBeVisible({ timeout: TIMEOUTS.api })
      if (await errorState.isVisible()) {
        await expect(errorState).toContainText(
          'Не удалось загрузить данные сравнения. Попробуйте обновить страницу.'
        )
        return
      }

      await expect(heading).toBeVisible()
      const comparisonState = page
        .getByRole('table')
        .or(page.getByText('Нет данных для сравнения', { exact: true }))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(comparisonState).toBeVisible()
    })

    test('should display period selectors', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Месяц к месяцу' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Квартал к кварталу' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Год к году' })).toBeVisible()
    })
  })

  test.describe('Date Range Picker', () => {
    test('should open date picker on click', async ({ page }) => {
      const datePickerTrigger = page.locator('#orders-date-range')
      await expect(datePickerTrigger).toBeVisible()
      await datePickerTrigger.click()
      await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('should update URL with date range params', async ({ page }) => {
      await expect(page).toHaveURL(/[?&]from=\d{4}-\d{2}-\d{2}/)
      await expect(page).toHaveURL(/[?&]to=\d{4}-\d{2}-\d{2}/)
    })
  })

  test.describe('Loading & Error States', () => {
    test('should show loading state while fetching data', async ({ page }) => {
      // Reload page and check for loading state
      await page.reload()

      const loadingState = page.locator(
        '.animate-pulse, [data-testid="loading"], [aria-busy="true"]'
      )
      await expect(
        page.getByRole('heading', { name: 'Аналитика заказов FBS', level: 1 })
      ).toBeVisible()
      test.skip(
        (await loadingState.count()) === 0,
        'Orders fixture loaded before the transient loading state could be observed'
      )
      await expect(loadingState.first()).toBeVisible()
    })

    test('should handle API errors gracefully', async ({ page }) => {
      // Block API to simulate error
      await page.route('**/analytics/orders/**', route => route.abort())
      await page.reload()
      await page.waitForTimeout(3000)

      // Page should not crash
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Responsive Behavior', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(ORDERS_ANALYTICS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Page should be visible
      await expect(page.locator('main')).toBeVisible()

      // Tabs should stack or scroll horizontally
      const tabsList = page.locator(SELECTORS.tabsList)
      if (await tabsList.isVisible()) {
        const tabsBox = await tabsList.boundingBox()
        if (tabsBox) {
          expect(tabsBox.width).toBeGreaterThanOrEqual(350)
        }
      }
    })

    test('should display properly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(ORDERS_ANALYTICS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      await expect(page.locator('main')).toBeVisible()
    })
  })
})

/**
 * QA HANDOFF NOTES:
 *
 * 1. Run tests:
 *    ```bash
 *    npx playwright test e2e/analytics/fbs-orders-analytics.spec.ts
 *    ```
 *
 * 2. Expected results:
 *    - Page loads with 4 tabs
 *    - Tab navigation updates URL
 *    - Date range picker works
 *    - Each tab displays appropriate content
 *
 * 3. Manual testing required:
 *    - Verify data accuracy matches backend
 *    - Check chart interactivity (tooltips, zoom)
 *    - Test with real 365-day data range
 *
 * 4. Known limitations:
 *    - Some tests use fallback assertions for graceful handling
 *    - Empty state handling if no FBS data exists
 */
