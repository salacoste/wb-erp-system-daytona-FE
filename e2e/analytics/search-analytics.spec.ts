/**
 * E2E Smoke Tests: Search Analytics Page
 * Story 71.8-FE: Search Analytics Tests & Polish
 * Epic 71-FE: Search Analytics & Jam Gating
 */

import { test, expect } from '@playwright/test'

const SEARCH_ROUTE = '/analytics/search'

test.describe('Epic 71-FE: Search Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SEARCH_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
  })

  test('should display search analytics page with heading', async ({ page }) => {
    await expect(page.locator('main')).toBeVisible()

    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    const headingText = await heading.textContent()
    expect(headingText).toMatch(/Поисковая аналитика/i)
  })

  test('should display 3 tab triggers', async ({ page }) => {
    const tabList = page.locator('[role="tablist"]')
    await expect(tabList).toBeVisible()

    await expect(page.getByRole('tab', { name: /Заказы/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /По товарам/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /По запросам/i })).toBeVisible()
  })

  test('should render content or RequireJam overlay', async ({ page }) => {
    // Check text-based markers rather than DOM roles (tabpanel exists in both states)
    const overlay = page.getByText('Доступно с подпиской WB Джем')
    const hasOverlay = await overlay.isVisible().catch(() => false)

    if (hasOverlay) {
      await expect(page.getByRole('link', { name: /Подробнее о WB Джем/ })).toBeVisible()
    } else {
      await expect(page.locator('[data-state="active"][role="tabpanel"]')).toBeVisible()
    }
  })
})
