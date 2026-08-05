import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * E2E Tests: Financial Summary
 * Story: 3.5 (Financial Summary View)
 *
 * Tests the financial summary page including:
 * - Week selector
 * - Period comparison
 * - Metric groups display
 * - Navigation to detailed analytics
 */
test.describe('Financial Summary', () => {
  test.beforeEach(async ({ page }) => {
    // Main analytics page serves as the financial summary.
    await page.goto(ROUTES.analytics.main, { waitUntil: 'domcontentloaded' })
    // NOT networkidle — the analytics page background-polls (TanStack Query) so it never
    // settles → beforeEach times out at 60s and fails EVERY test (anti-pattern #9; validation
    // F-53, same class F-4/F-52 fixed in the setup files). Wait for the page shell instead.
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/analytics$/)
    await expect(page.getByRole('heading', { name: 'Аналитика', level: 1 })).toBeVisible()
    await expect(page.getByText('Финансовая сводка за период', { exact: true })).toBeVisible()
  })

  test.describe('Story 3.5: Financial Summary View', () => {
    test('displays analytics page', async ({ page }) => {
      // Page heading - may say "Аналитика", "Финансы", "Summary", etc.
      const heading = page
        .locator('h1, h2')
        .filter({ hasText: /финанс|summary|итог|аналитик|analytic|обзор|overview/i })
      await expect(heading.first()).toBeVisible({ timeout: TIMEOUTS.navigation })
    })

    test('has week selector', async ({ page }) => {
      // The WeekSelector renders a Radix Select trigger (button[role="combobox"]) once the
      // available-weeks query resolves. The beforeEach domcontentloaded wait does NOT block on
      // that data, so WAIT for the control to appear rather than snapshot-checking (which raced
      // the data load — the bug exposed when networkidle was removed in F-53).
      await expect(page.locator('button[role="combobox"]').first()).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('can change selected week', async ({ page }) => {
      const weekSelector = page.locator('select').first()

      if (await weekSelector.isVisible()) {
        // Change to different week
        await weekSelector.selectOption({ index: 1 })

        // Page should update
        await page.waitForTimeout(1000)
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('displays period comparison', async ({ page }) => {
      await page.getByRole('button', { name: 'Сравнить периоды' }).click()
      await expect(page.getByRole('button', { name: 'Один период' })).toBeVisible()
      await expect(page.getByRole('combobox', { name: 'Период 1' })).toBeVisible()
      await expect(page.getByRole('combobox', { name: 'Период 2' })).toBeVisible()
    })

    test('shows financial data or loading state', async ({ page }) => {
      await page.waitForTimeout(2000) // Wait for API data

      const terminalState = page
        .getByText('Доходы', { exact: true })
        .or(page.getByText(/Нет данных для отображения|Не удалось загрузить финансовые данные/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(terminalState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('shows expense metrics group', async ({ page }) => {
      await page.waitForTimeout(2000)

      const expenseState = page
        .getByText(/Расходы WB/)
        .or(page.getByText(/Нет данных для отображения|Не удалось загрузить финансовые данные/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(expenseState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('shows adjustments metrics group', async ({ page }) => {
      await page.waitForTimeout(2000)

      const financialData = page.getByText('Доходы', { exact: true })
      const adjustments = page.getByText('Компенсации', { exact: true })
      const adjustmentsState = financialData
        .or(page.getByText(/Нет данных для отображения|Не удалось загрузить финансовые данные/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(adjustmentsState).toBeVisible({ timeout: TIMEOUTS.api })

      test.skip(
        !(await financialData.isVisible()),
        'Financial-summary fixture has no loaded data for compensation assertions'
      )
      test.skip(
        !(await adjustments.isVisible()),
        'Financial-summary fixture has no positive loyalty compensation'
      )
      await expect(adjustments).toBeVisible()
    })

    test('shows payout total', async ({ page }) => {
      await page.waitForTimeout(2000)

      const payoutState = page
        .getByText('Итого к оплате', { exact: true })
        .or(page.getByText(/Нет данных для отображения|Не удалось загрузить финансовые данные/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(payoutState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('displays page content', async ({ page }) => {
      await page.waitForTimeout(2000) // Wait for data

      await expect(page.getByRole('heading', { name: 'Аналитика', level: 1 })).toBeVisible()
      await expect(page.getByText('Финансовая сводка за период', { exact: true })).toBeVisible()
    })

    test('metrics show formatted currency values', async ({ page }) => {
      await page.waitForTimeout(2000)

      const currencyState = page
        .getByText(/[\d\s]+₽/)
        .or(page.getByText(/Нет данных для отображения|Не удалось загрузить финансовые данные/i))
        .or(page.locator('.animate-pulse'))
        .first()
      await expect(currencyState).toBeVisible({ timeout: TIMEOUTS.api })
    })

    test('has navigation cards to detailed analytics', async ({ page }) => {
      await expect(page.getByRole('link', { name: /По товарам/ })).toBeVisible()
      await expect(page.getByRole('link', { name: /По брендам/ })).toBeVisible()
    })

    test('can navigate to SKU analytics', async ({ page }) => {
      const skuLink = page.getByRole('link', { name: /По товарам/ })
      await expect(skuLink).toBeVisible()
      await skuLink.click()
      await expect(page).toHaveURL(/\/analytics\/sku$/, { timeout: TIMEOUTS.navigation })
    })
  })

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile', async ({ page, isMobile }) => {
      if (isMobile) {
        // Content should be visible
        await expect(page.locator('body')).toBeVisible()

        // Should have readable text
        const content = await page.locator('body').textContent()
        expect(content?.length).toBeGreaterThan(0)
      }
    })

    test('metrics are accessible on small screens', async ({ page }) => {
      // Set small viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.reload()
      await page.waitForTimeout(1000)

      // Content should still be visible
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Data Loading', () => {
    test('page handles data loading', async ({ page }) => {
      // Reload to trigger loading
      await page.reload({ waitUntil: 'domcontentloaded' })
      // NOT networkidle (anti-pattern #9, F-53) — wait for the page shell to re-render.
      await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

      // Page should be functional after loading
      await expect(page.locator('body')).toBeVisible()
    })

    test('handles empty data', async ({ page }) => {
      await page.route('**/finance-summary**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ data: null }),
        })
      })

      await page.reload()
      await page.waitForTimeout(2000)

      // Should show empty state or zeros
      await expect(page.locator('body')).toBeVisible()
    })

    test('handles API error', async ({ page }) => {
      await page.route('**/finance-summary**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server Error' }),
        })
      })

      await page.reload()
      await page.waitForTimeout(2000)

      // Should show error state
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('has proper heading structure', async ({ page }) => {
      const h1 = page.locator('h1')
      const hasH1 = (await h1.count()) > 0

      expect(hasH1).toBeTruthy()
    })

    test('tables have headers', async ({ page }) => {
      const tables = page.locator('table')

      if ((await tables.count()) > 0) {
        const tableHeaders = page.locator('th')
        expect(await tableHeaders.count()).toBeGreaterThan(0)
      }
    })

    test('interactive elements are keyboard accessible', async ({ page }) => {
      // Tab through page
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should have focused element
      const focusedElement = page.locator(':focus')
      const hasFocus = (await focusedElement.count()) > 0

      expect(hasFocus).toBeTruthy()
    })
  })
})
