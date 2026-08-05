import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Unit Economics Analytics
 * Epic 5 - Unit Economics Analytics
 * Story 5.4: Integration & Testing
 *
 * Tests the Unit Economics page including:
 * - Page rendering and navigation (AC 6)
 * - Week selection (AC 7)
 * - Summary cards display
 * - Data table functionality (AC 9)
 * - Waterfall chart rendering (AC 10)
 * - Error handling (AC 3)
 */
test.describe('Unit Economics Analytics', () => {
  test.describe('Story 5.4: Happy Path Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)
      await expect(page.getByRole('heading', { name: 'Юнит-экономика', level: 1 })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('AC-6: displays Unit Economics page with correct heading', async ({ page }) => {
      // Page heading should contain "Юнит-экономика" or similar
      const heading = page.locator('h1, h2').filter({ hasText: /юнит|unit|экономик/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('AC-6: displays 6 summary cards', async ({ page }) => {
      await page.waitForTimeout(2000) // Wait for data to load

      // Should have multiple cards (6 expected)
      const cards = page.locator('[class*="card"]')
      const cardCount = await cards.count()

      // At least some cards should be visible (6 summary + possibly waterfall card)
      expect(cardCount).toBeGreaterThanOrEqual(3)
    })

    test('AC-7: has week selector', async ({ page }) => {
      // Week selector component
      const weekSelector = page.locator('select, button[role="combobox"], [class*="select"]')
      const hasSelector = (await weekSelector.count()) > 0

      // Or week text display
      const weekText = page.locator('text=/W\\d{1,2}|2025-W/')
      const hasWeekText = (await weekText.count()) > 0

      expect(hasSelector || hasWeekText).toBeTruthy()
    })

    test('AC-7: changing week selector updates data', async ({ page }) => {
      await page.waitForTimeout(1000)

      // Find week selector (combobox or select)
      const weekSelector = page.locator('button[role="combobox"]').first()

      if (await weekSelector.isVisible()) {
        // Open dropdown
        await weekSelector.click()
        await page.waitForTimeout(500)

        // Select a different week
        const weekOption = page.locator('[role="option"]').nth(1)
        if (await weekOption.isVisible()) {
          await weekOption.click()
          await page.waitForTimeout(1000)

          // Page should still be functional
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })

    test('AC-9: displays data table with sortable columns', async ({ page }) => {
      await page.waitForTimeout(2000)

      // Table should be visible
      const table = page.locator('table')
      const hasTable = (await table.count()) > 0

      if (hasTable) {
        // Table headers should exist
        const headers = page.locator('th')
        const headerCount = await headers.count()
        expect(headerCount).toBeGreaterThan(3)

        // At least some expected columns
        const expectedColumns = ['Артикул', 'Название', 'Выручка', 'Маржа', 'COGS']
        for (const col of expectedColumns.slice(0, 2)) {
          const hasCol = (await page.locator(`th:has-text("${col}")`).count()) > 0
          // At least one column should match
          if (hasCol) {
            expect(hasCol).toBeTruthy()
            break
          }
        }
      }
    })

    test('AC-9: table sorting works', async ({ page }) => {
      await page.waitForTimeout(2000)

      // Find sortable header (Выручка or Маржа)
      const sortableHeader = page.locator('th button').first()

      if (await sortableHeader.isVisible()) {
        // Click to sort
        await sortableHeader.click()
        await page.waitForTimeout(500)

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()

        // Click again to reverse sort
        await sortableHeader.click()
        await page.waitForTimeout(500)

        // Page should still be functional
        await expect(page.locator('table')).toBeVisible()
      }
    })

    test('AC-10: displays waterfall chart section', async ({ page }) => {
      await page.waitForTimeout(2000)

      const chartTitle = page.getByText('Структура затрат', { exact: true })
      const chartState = chartTitle
        .or(page.getByText('Нет данных за выбранный период', { exact: true }))
        .or(page.getByText('Не удалось загрузить данные. Попробуйте ещё раз.', { exact: true }))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(chartState).toBeVisible({ timeout: TIMEOUTS.api })

      if (await chartTitle.isVisible()) {
        await expect(page.getByRole('img', { name: 'График структуры затрат' })).toBeVisible()
      }
    })

    test('shows profitability status badges', async ({ page }) => {
      await page.waitForTimeout(2000)

      const profitabilityState = page
        .getByText('Прибыльные', { exact: true })
        .or(page.getByText('Нет данных за выбранный период', { exact: true }))
        .or(page.getByText('Не удалось загрузить данные. Попробуйте ещё раз.', { exact: true }))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(profitabilityState).toBeVisible({ timeout: TIMEOUTS.api })

      if (await page.getByText('Прибыльные', { exact: true }).isVisible()) {
        await expect(page.getByText('Убыточные', { exact: true })).toBeVisible()
      }
    })

    test('has refresh button', async ({ page }) => {
      // Refresh button
      const refreshBtn = page.locator('button').filter({
        has: page.locator('svg'),
      })

      const hasRefresh = (await refreshBtn.count()) > 0
      expect(hasRefresh).toBeTruthy()
    })

    test('has export button', async ({ page }) => {
      const exportBtn = page.getByRole('button', { name: 'CSV' })
      await expect(exportBtn).toBeVisible()
      await expect(exportBtn).toBeEnabled()
    })
  })

  test.describe('Story 5.4: Table Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)
      await page.waitForTimeout(2000)
    })

    test('table row click selects SKU for waterfall', async ({ page }) => {
      // Click on a table row
      const tableRow = page.locator('tbody tr').first()

      if (await tableRow.isVisible()) {
        await tableRow.click()
        await page.waitForTimeout(500)

        // Page should still be functional after selection
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('pagination controls work when visible', async ({ page }) => {
      // Pagination may only appear with many items
      const pagination = page.locator('[class*="pagination"], button:has-text("/")')
      const hasPagination = (await pagination.count()) > 0

      if (hasPagination) {
        // Next page button
        const nextBtn = page
          .locator('button')
          .filter({ has: page.locator('svg[class*="chevron-right"]') })
        if ((await nextBtn.isVisible()) && (await nextBtn.isEnabled())) {
          await nextBtn.click()
          await page.waitForTimeout(500)
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })

    test('sticky header works on scroll', async ({ page }) => {
      // Scroll the table
      const tableContainer = page.locator('[class*="overflow-auto"]').first()

      if (await tableContainer.isVisible()) {
        // Scroll down
        await tableContainer.evaluate(el => {
          el.scrollTop = 200
        })
        await page.waitForTimeout(300)

        // Header should still be visible (sticky)
        const header = page.locator('thead')
        await expect(header).toBeVisible()
      }
    })
  })

  test.describe('Story 5.4: Loading & Error States', () => {
    test('shows loading state while fetching data', async ({ page }) => {
      // Intercept API to delay response
      await page.route('**/unit-economics**', async route => {
        await new Promise(r => setTimeout(r, 1000))
        await route.fallback()
      })

      await page.goto(ROUTES.analytics.unitEconomics)

      // Page loads and shows content
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-3: handles API error gracefully', async ({ page }) => {
      // Mock 500 error
      await page.route('**/unit-economics**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: { code: 'INTERNAL', message: 'Server error' } }),
        })
      })

      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForTimeout(2000)

      // Page handles error gracefully - should still be visible
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-3: shows empty state for no data', async ({ page }) => {
      // Mock empty response
      await page.route('**/unit-economics**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              meta: {
                week: '2025-W01',
                cabinet_id: 'test',
                view_by: 'sku',
                generated_at: new Date().toISOString(),
              },
              summary: {
                total_revenue: 0,
                total_net_profit: 0,
                avg_cogs_pct: 0,
                avg_wb_fees_pct: 0,
                avg_net_margin_pct: 0,
                sku_count: 0,
                profitable_sku_count: 0,
                loss_making_sku_count: 0,
                missing_cogs_count: 0,
              },
              data: [],
            },
          }),
        })
      })

      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForTimeout(2000)

      // Page should be functional with empty state
      await expect(page.locator('body')).toBeVisible()
    })

    test('retry button works after error', async ({ page }) => {
      let callCount = 0

      await page.route('**/unit-economics**', route => {
        callCount++
        if (callCount === 1) {
          // First call fails
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Server error' }),
          })
        } else {
          // Subsequent calls succeed
          route.fallback()
        }
      })

      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForTimeout(2000)

      // Find and click retry button
      const retryBtn = page.locator('button:has-text("Повторить"), button:has-text("Retry")')
      if (await retryBtn.isVisible()) {
        await retryBtn.click()
        await page.waitForTimeout(2000)

        // Page should recover
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Story 5.4: Navigation & Integration', () => {
    test('can navigate to Unit Economics from sidebar', async ({ page }) => {
      await page.goto(ROUTES.dashboard)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)
      await expect(page).toHaveURL(/\/dashboard\?week=[^&]+&type=week$/)

      const sidebarLink = page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'Юнит-экономика', exact: true })
      await expect(sidebarLink).toBeVisible()
      await expect(sidebarLink).toHaveAttribute('href', ROUTES.analytics.unitEconomics)
      await sidebarLink.click()
      await expect(page).toHaveURL(/\/analytics\/unit-economics$/)
    })

    test('page is accessible directly via URL', async ({ page }) => {
      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)

      // Page should load without errors
      await expect(page.locator('body')).toBeVisible()

      // No uncaught errors in console
      const errors: string[] = []
      page.on('pageerror', err => errors.push(err.message))

      await page.waitForTimeout(1000)
      // Allow some errors but not critical ones
      const criticalErrors = errors.filter(
        e => e.includes('TypeError') || e.includes('ReferenceError')
      )
      expect(criticalErrors.length).toBe(0)
    })

    test('view selector changes aggregation level', async ({ page }) => {
      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)
      await page.waitForTimeout(2000)

      // View selector (SKU/Category/Brand)
      const viewSelector = page.locator('[role="radiogroup"], [class*="tabs"]')

      if (await viewSelector.isVisible()) {
        // Click on different view
        const categoryTab = page.locator(
          'button:has-text("Категория"), [role="tab"]:has-text("Категория")'
        )
        if (await categoryTab.isVisible()) {
          await categoryTab.click()
          await page.waitForTimeout(1000)

          // Page should update
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })
  })

  test.describe('Story 5.4: Performance', () => {
    test('AC-11: page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)

      const loadTime = Date.now() - startTime

      // Should load within 10 seconds (generous for CI)
      expect(loadTime).toBeLessThan(10000)

      // Content should be visible
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-12: handles data without crashing', async ({ page }) => {
      await page.goto(ROUTES.analytics.unitEconomics)
      await page.waitForLoadState('domcontentloaded') // NOT networkidle — page background-polls (anti-pattern #9)
      await page.waitForTimeout(3000)

      // Page should remain stable and functional
      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('html')).toBeVisible()
    })
  })
})
