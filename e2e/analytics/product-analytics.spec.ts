/**
 * E2E spec for Unified Product Analytics page (Story 122.3-FE).
 * Covers: page load, all 4 tabs (Overview, Funnel, Advertising, Organic),
 * tab switching, and back navigation.
 */

import { test, expect } from '@playwright/test'

const PRODUCT_ROUTE = '/analytics/product/887604577'

test.describe('Epic 122-FE: Product Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCT_ROUTE)
    await page.waitForLoadState('domcontentloaded')
  })

  test('should display product analytics page with heading', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    const heading = page.locator('h1')
    await expect(heading).toContainText(/Аналитика товара/i)
  })

  test('should display all 4 tab triggers', async ({ page }) => {
    const tablist = page.locator('[role="tablist"]')
    await expect(tablist).toBeVisible()

    const tabs = ['Обзор', 'Воронка', 'Реклама', 'Органика']
    for (const tabName of tabs) {
      await expect(page.getByRole('tab', { name: tabName })).toBeVisible()
    }
  })

  test('should show overview tab content by default', async ({ page }) => {
    const activePanel = page.locator('[data-state="active"][role="tabpanel"]')
    await expect(activePanel).toBeVisible()
  })

  test('should switch to funnel tab and render KPI cards', async ({ page }) => {
    await page.getByRole('tab', { name: 'Воронка' }).click()

    const panel = page.locator('[data-state="active"][role="tabpanel"]')
    await expect(panel).toBeVisible()

    // Funnel tab shows KPI cards or loading state
    const hasContent = await page.locator('text=Просмотры').count()
    const hasSkeleton = await page.locator('.animate-pulse').count()
    expect(hasContent + hasSkeleton).toBeGreaterThan(0)
  })

  test('should switch to advertising tab', async ({ page }) => {
    await page.getByRole('tab', { name: 'Реклама' }).click()

    const panel = page.locator('[data-state="active"][role="tabpanel"]')
    await expect(panel).toBeVisible()
  })

  test('should switch to organic tab', async ({ page }) => {
    await page.getByRole('tab', { name: 'Органика' }).click()

    const panel = page.locator('[data-state="active"][role="tabpanel"]')
    await expect(panel).toBeVisible()
  })

  test('should have back navigation link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /Назад к аналитике/ })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/analytics')
  })
})
