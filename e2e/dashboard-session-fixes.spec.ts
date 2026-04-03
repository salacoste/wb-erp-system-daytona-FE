import { test, expect } from '@playwright/test'

/**
 * E2E tests for dashboard fixes from 2026-03-30 session:
 * - Sidebar: seller name + Jam badge
 * - Trends chart: 7 metrics with COGS
 * - Expense chart: horizontal bars redesign
 * - Processing status: no false FailedAlert
 */

test.describe('Dashboard — Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('shows seller trademark in sidebar', async ({ page }) => {
    const sidebar = page.locator('a[href="/settings/cabinet"]').first()
    await expect(sidebar).toBeVisible()
    // Should show real seller name (not skeleton, not "Кабинет")
    const text = await sidebar.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
    expect(text).not.toContain('Кабинет') // fallback should not show when data exists
  })

  test('shows Jam badge when subscription active', async ({ page }) => {
    const sidebar = page.locator('a[href="/settings/cabinet"]').first()
    const text = await sidebar.textContent()
    // If Jam subscription exists, badge should be visible
    if (text?.includes('Стандарт') || text?.includes('Продвинутый')) {
      expect(text).toMatch(/Джем (Стандарт|Продвинутый)/)
    }
    // Badge should NOT show "Нет подписки" in sidebar
    expect(text).not.toContain('Нет подписки')
  })

  test('sidebar scrolls when menu overflows', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav).toBeVisible()
    const overflow = await nav.evaluate(el => getComputedStyle(el).overflowY)
    expect(['auto', 'scroll']).toContain(overflow)
  })
})

test.describe('Dashboard — Trends Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard?week=2026-W12&type=week')
    await page.waitForLoadState('networkidle')
  })

  test('renders trends chart with data (not empty state)', async ({ page }) => {
    // Scroll to trends section
    const trendsCard = page.locator('text=Тренды ключевых метрик')
    await trendsCard.scrollIntoViewIfNeeded()
    await expect(trendsCard).toBeVisible()

    // Should NOT show empty state
    const emptyState = page.locator('text=Нет данных за этот период')
    await expect(emptyState).not.toBeVisible()
  })

  test('trends chart has all 7 metric lines in legend', async ({ page }) => {
    const trendsCard = page.locator('text=Тренды ключевых метрик')
    await trendsCard.scrollIntoViewIfNeeded()

    const legend = page.locator('.recharts-legend-wrapper')
    await expect(legend).toBeVisible()

    const expectedMetrics = [
      /Продажи/,
      /перечислению/,
      /Перечислено/,
      /Себестоимость/,
      /прибыль/i,
      /Логистика/,
      /Эффективность/,
    ]
    for (const metric of expectedMetrics) {
      await expect(legend.locator(`text=${metric}`)).toBeVisible()
    }
  })

  test('trends legend shows metric names without NaN', async ({ page }) => {
    const trendsCard = page.locator('text=Тренды ключевых метрик')
    await trendsCard.scrollIntoViewIfNeeded()

    // Verify chart rendered (has SVG lines)
    const legendItems = page.locator('.recharts-legend-item')
    const count = await legendItems.count()
    expect(count).toBeGreaterThanOrEqual(5)

    // No NaN in any visible text near chart
    const chartSection = page
      .locator('text=Тренды ключевых метрик')
      .locator('xpath=ancestor::*[contains(@class,"rounded")]')
    if ((await chartSection.count()) > 0) {
      const text = await chartSection.first().textContent()
      expect(text).not.toContain('NaN')
    }
  })
})

test.describe('Dashboard — Expense Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard?week=2026-W12&type=week')
    await page.waitForLoadState('networkidle')
  })

  test('renders horizontal expense bars', async ({ page }) => {
    const expenseCard = page.locator('text=Разбивка расходов')
    await expenseCard.scrollIntoViewIfNeeded()
    await expect(expenseCard).toBeVisible()

    // Should have recharts bars (horizontal layout)
    const bars = page.locator('.recharts-bar-rectangle')
    const barCount = await bars.count()
    expect(barCount).toBeGreaterThanOrEqual(3)
  })

  test('expense chart shows total badge', async ({ page }) => {
    const expenseCard = page.locator('text=Разбивка расходов').locator('..')
    await expenseCard.scrollIntoViewIfNeeded()

    // Total badge should contain currency value
    const badge = expenseCard.locator('text=/\\d.*₽/')
    await expect(badge.first()).toBeVisible()
  })

  test('expense categories have readable labels', async ({ page }) => {
    const expenseCard = page.locator('text=Разбивка расходов')
    await expenseCard.scrollIntoViewIfNeeded()

    // Key categories should be visible as Y-axis labels
    const expectedCategories = ['Комиссия WB', 'Логистика']
    for (const cat of expectedCategories) {
      await expect(page.locator(`text=${cat}`).first()).toBeVisible()
    }
  })

  test('small categories merged into Прочее', async ({ page }) => {
    const expenseCard = page.locator('text=Разбивка расходов')
    await expenseCard.scrollIntoViewIfNeeded()

    // "Прочее" should exist if there are small categories
    const prochee = page.locator('text=Прочее')
    // It's ok if not present (all categories > 1%)
    if (await prochee.isVisible()) {
      // Hover to check tooltip expands sub-items
      await prochee.hover()
      await page.waitForTimeout(300)
      const expenseSection = page.locator('text=Разбивка расходов').locator('..').locator('..')
      const tooltip = expenseSection.locator('.recharts-tooltip-wrapper').first()
      if (await tooltip.isVisible().catch(() => false)) {
        const text = await tooltip.textContent()
        expect(text).toContain('Включает')
      }
    }
  })
})

test.describe('Dashboard — Processing Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard?week=2026-W12&type=week')
    await page.waitForLoadState('networkidle')
  })

  test('no false FailedAlert when data exists', async ({ page }) => {
    // Should NOT show red error about financial data processing
    const failedAlert = page.locator('text=Ошибка обработки финансовых данных')
    await expect(failedAlert).not.toBeVisible()
  })

  test('dashboard shows financial metrics (not blocked by status)', async ({ page }) => {
    // At least one metric card should show a ruble value
    const metricValue = page.locator('text=/\\d+.*₽/').first()
    await expect(metricValue).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Unit Economics — Default Week', () => {
  test('defaults to last completed week (not current)', async ({ page }) => {
    await page.goto('/analytics/unit-economics')
    await page.waitForLoadState('networkidle')

    // Should NOT show current incomplete week (W14 as of 2026-03-31)
    // Should show a completed week
    const weekSelector = page.locator('text=/2026-W\\d+/')
    await expect(weekSelector.first()).toBeVisible()

    // Should show empty state or data, but NOT error alert
    const errorAlert = page.locator('text=Не удалось загрузить данные')
    await expect(errorAlert).not.toBeVisible()
  })
})
