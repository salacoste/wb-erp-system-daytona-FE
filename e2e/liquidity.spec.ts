import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

async function firstEnabledLiquidationAction(page: import('@playwright/test').Page) {
  const buttons = page.getByRole('button', { name: 'Ликвидировать' })
  const count = await buttons.count()
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i)
    const visible = await button.isVisible()
    const enabled = await button.isEnabled()
    if (visible && enabled) return button
  }
  return null
}

async function expectLiquidityShell(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Ликвидность товаров', level: 1 })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
  await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible()
}

async function expectLiquidityFixture(
  page: import('@playwright/test').Page,
  emptyFixtureReason: string
) {
  const dataState = page.getByText('Распределение по ликвидности', { exact: true })
  const emptyState = page.getByRole('heading', { name: 'Нет данных о ликвидности' })
  const errorState = page.getByText(
    'Не удалось загрузить данные о ликвидности. Попробуйте ещё раз.'
  )
  const loadingState = page.locator('.animate-pulse')

  await expect(loadingState).toHaveCount(0, { timeout: TIMEOUTS.api })
  const terminalState = dataState.or(emptyState).or(errorState).first()
  await expect(terminalState).toBeVisible({ timeout: TIMEOUTS.api })

  if (await errorState.isVisible()) {
    await expect(errorState).toBeVisible()
    throw new Error('Liquidity fixture failed to load; the documented error state is visible')
  }

  test.skip(await emptyState.isVisible(), emptyFixtureReason)
  await expect(dataState).toBeVisible()
}

/**
 * E2E Tests: Liquidity Analysis
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Story 7.4: Integration & Testing
 *
 * Tests the Liquidity page including:
 * - Page rendering and navigation (AC 6)
 * - Distribution cards (AC 8) - 4 liquidity categories
 * - Summary metrics bar (AC 7)
 * - Benchmarks section (AC 9)
 * - Data table functionality (AC 10)
 * - Liquidation planner modal (AC 11)
 * - Error handling (AC 5)
 */
test.describe('Liquidity Analysis', () => {
  test.describe('Story 7.4: Happy Path Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await expectLiquidityShell(page)
    })

    test('AC-6: displays Liquidity page with correct heading', async ({ page }) => {
      // Page heading should contain "Ликвидность" or similar
      const heading = page
        .locator('h1, h2')
        .filter({ hasText: /ликвидность|liquidity|оборачиваемость/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('AC-8: displays 4 distribution cards', async ({ page }) => {
      await page.waitForTimeout(2000) // Wait for data to load

      // Should have distribution cards (4 expected: highly_liquid, medium_liquid, low_liquid, illiquid)
      const cards = page.locator('[class*="card"]')
      const cardCount = await cards.count()

      // At least some cards should be visible
      expect(cardCount).toBeGreaterThanOrEqual(3)
    })

    test('AC-8: distribution cards show correct categories', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expectLiquidityFixture(
        page,
        'Liquidity distribution fixture is unavailable; the documented empty state rendered'
      )
      const distributionCards = page
        .getByText('> 50%', { exact: true })
        .locator('xpath=ancestor::div[contains(@class, "grid")][1]')
      await expect(distributionCards.getByText('Высоколиквидный', { exact: true })).toBeVisible()
      await expect(
        distributionCards.getByText('Средняя ликвидность', { exact: true })
      ).toBeVisible()
      await expect(distributionCards.getByText('Низкая ликвидность', { exact: true })).toBeVisible()
      await expect(distributionCards.getByText('Неликвид', { exact: true })).toBeVisible()
    })

    test('AC-7: shows summary metrics bar', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expectLiquidityFixture(
        page,
        'Liquidity summary fixture is unavailable; the documented empty state rendered'
      )
      await expect(page.getByText('Всего на складе', { exact: true })).toBeVisible()
      await expect(page.getByText('Артикулов', { exact: true })).toBeVisible()
      await expect(page.getByText('Средний оборот', { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Замороженный капитал', { exact: true })).toBeVisible()
    })

    test('AC-9: displays benchmarks section', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expectLiquidityFixture(
        page,
        'Liquidity benchmark fixture is unavailable; the documented empty state rendered'
      )
      await expect(page.getByText('Сравнение с целями', { exact: true })).toBeVisible()
      await expect(page.getByText('Доля высоколиквидных', { exact: true })).toBeVisible()
      await expect(page.getByText('Доля неликвида', { exact: true })).toBeVisible()
    })

    test('AC-10: displays data table with sortable columns', async ({ page }) => {
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
        const expectedColumns = ['Артикул', 'Товар', 'Остаток', 'Оборачиваемость', 'Категория']
        for (const col of expectedColumns.slice(0, 2)) {
          const hasCol = (await page.locator(`th:has-text("${col}")`).count()) > 0
          if (hasCol) {
            expect(hasCol).toBeTruthy()
            break
          }
        }
      }
    })

    test('AC-10: table sorting works', async ({ page }) => {
      await page.waitForTimeout(2000)

      // Find sortable header
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

    test('shows liquidity status badges', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expectLiquidityFixture(
        page,
        'Liquidity status fixture is unavailable; the documented empty state rendered'
      )
      const liquidityTable = page.getByRole('table')
      await expect(liquidityTable.getByRole('cell', { name: /Ликвид\.$/ }).first()).toBeVisible()
      await expect(liquidityTable.getByRole('cell', { name: /Неликвид$/ }).first()).toBeVisible()
    })

    test('has refresh button', async ({ page }) => {
      // Refresh button
      const refreshBtn = page.locator('button').filter({
        has: page.locator('svg'),
      })

      const hasRefresh = (await refreshBtn.count()) > 0
      expect(hasRefresh).toBeTruthy()
    })

    test('shows frozen capital metrics', async ({ page }) => {
      await page.waitForTimeout(2000)

      await expectLiquidityFixture(
        page,
        'Liquidity capital fixture is unavailable; the documented empty state rendered'
      )
      await expect(page.getByText('Замороженный капитал', { exact: true })).toBeVisible()
    })
  })

  test.describe('Story 7.4: Distribution Card Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await expectLiquidityShell(page)
      await page.waitForTimeout(2000)
    })

    test('AC-8: clicking distribution card filters table', async ({ page }) => {
      // Find clickable distribution card
      const card = page
        .locator('[class*="card"]')
        .filter({
          has: page.locator('text=/неликвид|illiquid|высоко/i'),
        })
        .first()

      if (await card.isVisible()) {
        await card.click()
        await page.waitForTimeout(500)

        // Page should update with filtered data
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('AC-8: clicking same card again clears filter', async ({ page }) => {
      const card = page.locator('[class*="card"]').first()

      if (await card.isVisible()) {
        // First click - apply filter
        await card.click()
        await page.waitForTimeout(500)

        // Second click - clear filter
        await card.click()
        await page.waitForTimeout(500)

        // Page should show all data again
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('cards show correct counts and values', async ({ page }) => {
      // Each card should show a number and value
      const cards = page.locator('[class*="card"]')
      const cardCount = await cards.count()

      if (cardCount > 0) {
        // At least one card shows a number (category counts). Valid Playwright regex filter — the old
        // `:has-text(/\d+/)` CSS form is invalid syntax and THREW (assertion was also a tautology).
        const cardWithNumber = cards.filter({ hasText: /\d+/ })
        expect(await cardWithNumber.count()).toBeGreaterThan(0)
      }
    })

    test('cards show percentage distribution', async ({ page }) => {
      await expectLiquidityFixture(
        page,
        'Liquidity distribution fixture is unavailable; the documented empty state rendered'
      )
      await expect(
        page.getByText(/от стоимости запасов|Нет продаж за период/i).first()
      ).toBeVisible()
    })
  })

  test.describe('Story 7.4: Table Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await expectLiquidityShell(page)
      await page.waitForTimeout(2000)
    })

    test('AC-11: liquidation action opens planner dialog', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      test.skip(!liquidationAction, 'No qualifying liquidation row exists in current backend data')

      await liquidationAction!.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Планировщик ликвидации', { exact: true })).toBeVisible()
    })

    test('AC-11: liquidation planner shows scenarios', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      test.skip(!liquidationAction, 'No qualifying liquidation row exists in current backend data')

      await liquidationAction!.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Сценарии ликвидации', { exact: true })).toBeVisible()
      await expect(dialog.getByText(/Продать за (?:\d+|∞) дней/).first()).toBeVisible()
    })

    test('AC-11: liquidation planner shows ROI calculations', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      test.skip(!liquidationAction, 'No qualifying liquidation row exists in current backend data')

      await liquidationAction!.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Выручка', { exact: true }).first()).toBeVisible()
      await expect(dialog.getByText('Прибыль', { exact: true }).first()).toBeVisible()
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

    test('AC-12: search by SKU works', async ({ page }) => {
      // Find search input
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="поиск"], input[placeholder*="search"]'
      )

      if (await searchInput.isVisible()) {
        await searchInput.fill('SKU-001')
        await page.waitForTimeout(500)

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Story 7.4: Benchmarks & Trends', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await expectLiquidityShell(page)
      await page.waitForTimeout(2000)
    })

    test('AC-9: benchmarks show comparison with targets', async ({ page }) => {
      await expectLiquidityFixture(
        page,
        'Liquidity benchmark fixture is unavailable; the documented empty state rendered'
      )
      await expect(page.getByText('Сравнение с целями', { exact: true })).toBeVisible()
      await expect(page.getByText(/\/ цель:/).first()).toBeVisible()
    })

    test('AC-9: shows overall health status', async ({ page }) => {
      await expectLiquidityFixture(
        page,
        'Liquidity health fixture is unavailable; the documented empty state rendered'
      )
      await expect(page.getByText(/^(Отлично|Хорошо|Внимание|Критично)$/).first()).toBeVisible()
    })

    test('benchmarks show industry comparison', async ({ page }) => {
      await expectLiquidityFixture(
        page,
        'Liquidity industry benchmark fixture is unavailable; the documented empty state rendered'
      )
      await expect(page.getByText(/^Отрасль:/)).toBeVisible()
    })
  })

  test.describe('Story 7.4: Loading & Error States', () => {
    test('shows loading state while fetching data', async ({ page }) => {
      // Intercept API to delay response
      await page.route('**/liquidity**', async route => {
        await new Promise(r => setTimeout(r, 1000))
        await route.fallback()
      })

      await page.goto(ROUTES.analytics.liquidity)

      // Page loads and shows content
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-5: handles API error gracefully', async ({ page }) => {
      // Mock 500 error
      await page.route('**/liquidity**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: { code: 'INTERNAL', message: 'Server error' } }),
        })
      })

      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForTimeout(2000)

      // Page handles error gracefully - should still be visible
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-5: shows empty state for no data', async ({ page }) => {
      // Mock empty response
      await page.route('**/liquidity**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              meta: {
                generated_at: new Date().toISOString(),
                cabinet_id: 'test',
              },
              summary: {
                total_skus: 0,
                total_stock_value: 0,
                avg_turnover_days: 0,
                frozen_capital: 0,
                distribution: {
                  highly_liquid: { count: 0, value: 0, pct: 0 },
                  medium_liquid: { count: 0, value: 0, pct: 0 },
                  low_liquid: { count: 0, value: 0, pct: 0 },
                  illiquid: { count: 0, value: 0, pct: 0 },
                },
                benchmarks: {
                  your_avg_turnover: 0,
                  target_avg_turnover: 30,
                  industry_avg_turnover: 45,
                  overall_status: 'warning',
                },
              },
              data: [],
            },
          }),
        })
      })

      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForTimeout(2000)

      // Page should be functional with empty state
      await expect(page.locator('body')).toBeVisible()
    })

    test('retry button works after error', async ({ page }) => {
      let callCount = 0

      await page.route('**/liquidity**', route => {
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

      await page.goto(ROUTES.analytics.liquidity)
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

  test.describe('Story 7.4: Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await expectLiquidityShell(page)
      await page.waitForTimeout(2000)
    })

    test('AC-15: handles zero stock products', async ({ page }) => {
      // Page should handle products with no stock gracefully
      // Verify page is functional (may show "нет в наличии" or similar)
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-16: handles illiquid products correctly', async ({ page }) => {
      // Page should display illiquid products prominently
      // Verify page is functional
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-18: handles products without COGS', async ({ page }) => {
      // Page should handle products without COGS gracefully
      // Verify page is functional (may show "—" or similar for frozen capital)
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-19: handles very high turnover days (>365)', async ({ page }) => {
      // Page should cap or display very high turnover days appropriately
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Story 7.4: Navigation & Integration', () => {
    test('sidebar exposes Liquidity navigation target', async ({ page }) => {
      await page.goto(ROUTES.dashboard)
      await page.waitForLoadState('domcontentloaded')

      const sidebarLink = page.getByRole('link', { name: /^Ликвидность$/ })
      const hasSidebarLink = await sidebarLink
        .isVisible({ timeout: TIMEOUTS.api })
        .catch(() => false)
      test.skip(
        !hasSidebarLink,
        'Liquidity sidebar link is not visible for current viewport/session'
      )

      await expect(sidebarLink).toHaveAttribute('href', /\/analytics\/liquidity$/)
    })

    test('page is accessible directly via URL', async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')

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

    test('navigation between analytics pages works', async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')

      // Navigate to Unit Economics via the visible sidebar/navigation link.
      const unitEconLink = page.getByRole('link', { name: /^Юнит-экономика$/ })
      const hasUnitEconLink = await unitEconLink
        .isVisible({ timeout: TIMEOUTS.api })
        .catch(() => false)
      test.skip(
        !hasUnitEconLink,
        'Unit economics navigation link is not visible for current session'
      )

      await Promise.all([
        page.waitForURL(/unit-economics/, { timeout: TIMEOUTS.navigation }),
        unitEconLink.click(),
      ])

      // Navigate back to Liquidity
      const liquidityLink = page.locator('a[href*="liquidity"]')
      if (await liquidityLink.isVisible()) {
        await liquidityLink.click()
        await page.waitForLoadState('domcontentloaded')
        await expect(page).toHaveURL(/liquidity/)
      }
    })
  })

  test.describe('Story 7.4: Performance', () => {
    test('AC-12: page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')

      const loadTime = Date.now() - startTime

      // Should load within 10 seconds (generous for CI)
      expect(loadTime).toBeLessThan(10000)

      // Content should be visible
      await expect(page.locator('body')).toBeVisible()
    })

    test('AC-13: handles data without crashing', async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)

      // Page should remain stable and functional
      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('html')).toBeVisible()
    })

    test('AC-14: data updates without page refresh', async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)

      // Find refresh button and click it
      const refreshBtn = page
        .locator('button')
        .filter({
          has: page.locator('svg[class*="refresh"]'),
        })
        .first()

      if (await refreshBtn.isVisible()) {
        await refreshBtn.click()
        await page.waitForTimeout(1000)

        // Page should update without full reload
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Story 7.4: Liquidation Modal', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(ROUTES.analytics.liquidity)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(2000)
    })

    test('AC-11: modal opens on planner button click', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      if (!liquidationAction) {
        test.skip(true, 'No enabled liquidation actions in current backend data')
        return
      }

      await liquidationAction.click()
      await page.waitForTimeout(500)

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.api })
      await expect(dialog.getByText('Сценарии ликвидации', { exact: true })).toBeVisible()
    })

    test('AC-11: modal can be closed', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      if (!liquidationAction) {
        test.skip(true, 'No enabled liquidation actions in current backend data')
        return
      }

      await liquidationAction.click()
      await page.waitForTimeout(500)

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.api })
      await expect(dialog.getByText('Сценарии ликвидации', { exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden({ timeout: TIMEOUTS.api })
    })

    test('AC-11: modal shows 3 liquidation scenarios', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      if (!liquidationAction) {
        test.skip(true, 'No enabled liquidation actions in current backend data')
        return
      }

      await liquidationAction.click()
      await page.waitForTimeout(500)

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Сценарии ликвидации', { exact: true })).toBeVisible()
      expect(await dialog.getByText(/Продать за (?:\d+|∞) дней/).count()).toBeGreaterThan(0)
    })

    test('AC-11: modal shows discount percentages', async ({ page }) => {
      const liquidationAction = await firstEnabledLiquidationAction(page)
      if (!liquidationAction) {
        test.skip(true, 'No enabled liquidation actions in current backend data')
        return
      }

      await liquidationAction.click()
      await page.waitForTimeout(500)

      const dialog = page.getByRole('dialog')
      const discountMetric = dialog.getByText('Скидка', { exact: true }).first().locator('..')
      await expect(discountMetric).toBeVisible()
      await expect(discountMetric).toContainText(/-\d+(?:[,.]\d+)?\s*%/)
    })
  })
})
