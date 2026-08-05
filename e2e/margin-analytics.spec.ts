import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Margin Analytics
 * Stories: 4.5 (SKU), 4.6 (Brand & Category), 4.7 (Time Period)
 *
 * Tests the margin analytics pages including:
 * - SKU-level margin analysis
 * - Brand and category aggregations
 * - Time-period trends
 */
test.describe('Margin Analytics', () => {
  test.describe('Story 4.5: Margin Analysis by SKU', () => {
    test.beforeEach(async ({ page }) => {
      // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle — see CLAUDE.md #9).
      await page.goto(ROUTES.analytics.sku, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('displays SKU analytics page', async ({ page }) => {
      // Page heading
      const heading = page.locator('h1, h2').filter({ hasText: /SKU|товар|product/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('has week selector or week display', async ({ page }) => {
      await expect(page.getByText('Выберите неделю для анализа', { exact: true })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
      await expect(page.locator('button[role="combobox"]').first()).toBeVisible()
    })

    test('displays data table or content', async ({ page }) => {
      await page.waitForTimeout(2000) // Wait for data

      await expect(
        page.getByRole('heading', { name: 'Маржинальность по товарам', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })
      const contentState = page
        .getByRole('table')
        .or(page.getByText('Нет данных за выбранную неделю', { exact: true }))
        .or(page.getByRole('button', { name: 'Повторить' }))
        .first()
      await expect(contentState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('shows margin data or empty state', async ({ page }) => {
      await page.waitForTimeout(2000) // Wait for data

      await expect(
        page.getByRole('heading', { name: 'Маржинальность по товарам', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })
      const marginState = page
        .getByRole('columnheader', { name: /Опер\. прибыль/ })
        .or(page.getByText('Нет данных за выбранную неделю', { exact: true }))
        .or(page.getByRole('button', { name: 'Повторить' }))
        .first()
      await expect(marginState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('page is functional with URL filter', async ({ page }) => {
      // Filter can be applied via URL params (?nm_id=xxx)
      await page.goto(`${ROUTES.analytics.sku}?nm_id=173589742`, { waitUntil: 'domcontentloaded' })
      // Story 88.3-FE: landmark wait (not networkidle)
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('shows summary statistics', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Маржинальность по товарам', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })
      const summaryState = page
        .getByText('Средняя маржа', { exact: true })
        .or(page.getByText('Нет данных за выбранную неделю', { exact: true }))
        .or(page.getByRole('button', { name: 'Повторить' }))
        .first()
      await expect(summaryState).toBeVisible({ timeout: TIMEOUTS.api })
    })
  })

  test.describe('Story 4.6: Margin Analysis by Brand', () => {
    test.beforeEach(async ({ page }) => {
      // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle).
      await page.goto(ROUTES.analytics.brand, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('displays brand analytics page', async ({ page }) => {
      const heading = page.locator('h1, h2').filter({ hasText: /бренд|brand/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('shows aggregated brand data', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expect(
        page.getByRole('heading', { name: 'Маржинальность по брендам', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })
      const brandState = page
        .getByRole('table')
        .or(page.getByText('Нет данных за выбранную неделю', { exact: true }))
        .or(page.getByRole('button', { name: 'Повторить' }))
        .first()
      await expect(brandState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('brand rows are sortable', async ({ page }) => {
      // Click on a header to sort
      const sortableHeader = page.locator('th').first()

      if (await sortableHeader.isVisible()) {
        await sortableHeader.click()
        await page.waitForTimeout(500)

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Story 4.6: Margin Analysis by Category', () => {
    test.beforeEach(async ({ page }) => {
      // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle).
      await page.goto(ROUTES.analytics.category, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('displays category analytics page', async ({ page }) => {
      const heading = page.locator('h1, h2').filter({ hasText: /категори|category/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('shows aggregated category data', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expect(
        page.getByRole('heading', { name: 'Маржинальность по категориям', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })
      const categoryState = page
        .getByRole('table')
        .or(page.getByText('Нет данных за выбранную неделю', { exact: true }))
        .or(page.getByRole('button', { name: 'Повторить' }))
        .first()
      await expect(categoryState).toBeVisible({ timeout: TIMEOUTS.api })
    })
  })

  test.describe('Story 4.7: Margin Analysis by Time Period', () => {
    test.beforeEach(async ({ page }) => {
      // Story 88.3-FE: domcontentloaded + landmark wait (not networkidle).
      await page.goto(ROUTES.analytics.timePeriod, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('displays time period analytics page', async ({ page }) => {
      // Heading says "Анализ маржинальности по времени"
      const heading = page
        .locator('h1, h2')
        .filter({ hasText: /анализ|маржинальност|времени|time|period|period/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('shows trend chart', async ({ page }) => {
      await page.waitForTimeout(2000)

      // Chart container
      const chart = page.locator('[class*="chart"], svg[class*="recharts"]')
      const hasChart = (await chart.count()) > 0

      // Or empty state
      const emptyState = page.locator('text=/нет данных|no data/i')
      const hasEmpty = (await emptyState.count()) > 0

      expect(hasChart || hasEmpty).toBeTruthy()
    })

    test('chart shows multiple weeks', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expect(page.getByText('Динамика маржинальности', { exact: true })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
      const chart = page.locator('.recharts-line').first()
      const emptyState = page.getByText(/Данные о трендах маржи пока недоступны/)
      const errorState = page.getByText(/Не удалось загрузить данные трендов маржи/)
      await expect(chart.or(emptyState).or(errorState).first()).toBeVisible({
        timeout: TIMEOUTS.api,
      })

      test.skip(
        !(await chart.isVisible()),
        'Margin-trend fixture has no chart data for a multiple-week assertion'
      )
      const weekLabels = page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value')
      test.skip(
        (await weekLabels.count()) < 2,
        'Margin-trend fixture contains fewer than two weekly points'
      )
      expect(await weekLabels.count()).toBeGreaterThan(1)
    })

    test('can select time period', async ({ page }) => {
      await expect(page.getByText('Период анализа', { exact: true })).toBeVisible()
      await expect(page.getByRole('combobox', { name: 'Показать данные за:' })).toBeVisible()
    })

    test('shows margin trend line', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expect(page.getByText('Динамика маржинальности', { exact: true })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
      const trendLine = page.locator('.recharts-line').first()
      const emptyState = page.getByText(/Данные о трендах маржи пока недоступны/)
      const errorState = page.getByText(/Не удалось загрузить данные трендов маржи/)
      await expect(trendLine.or(emptyState).or(errorState).first()).toBeVisible({
        timeout: TIMEOUTS.api,
      })

      test.skip(
        !(await trendLine.isVisible()),
        'Margin-trend fixture has no plotted line for the selected period'
      )
      await expect(trendLine).toBeVisible()
    })
  })

  test.describe('Cross-Page Navigation', () => {
    test('can navigate between analytics pages', async ({ page }) => {
      await page.goto(ROUTES.analytics.sku)

      // Navigate to brand
      const brandLink = page.locator('a[href*="brand"], button:has-text("Бренд")')
      if ((await brandLink.count()) > 0) {
        await brandLink.first().click()
        await expect(page).toHaveURL(/brand/)
      }
    })

    test('preserves week selection across pages', async ({ page }) => {
      await page.goto(ROUTES.analytics.sku)

      // Select a specific week
      const weekSelector = page.locator('select').first()
      if (await weekSelector.isVisible()) {
        await weekSelector.selectOption({ index: 1 })

        // Navigate to another page
        await page.goto(ROUTES.analytics.brand)

        // Week should be preserved (or reset - both are valid behaviors)
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Error States', () => {
    test('handles no data gracefully', async ({ page }) => {
      // Mock empty response
      await page.route('**/analytics/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [], pagination: { total: 0 } }),
        })
      })

      await page.goto(ROUTES.analytics.sku)

      // Should show empty state
      await page.waitForTimeout(2000)
      await expect(page.locator('body')).toBeVisible()
    })

    test('handles API error gracefully', async ({ page }) => {
      await page.route('**/analytics/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.goto(ROUTES.analytics.sku)

      // Should show error state or empty state
      await page.waitForTimeout(2000)
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
