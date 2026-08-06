/**
 * E2E Smoke Tests: Search Analytics Page
 * Story 71.8-FE: Search Analytics Tests & Polish
 * Epic 71-FE: Search Analytics & Jam Gating
 */

import { test, expect, type Page } from '../fixtures/network-test'

const SEARCH_ROUTE = '/analytics/search'

async function expectJamGateOrTabs(page: Page) {
  const gate = page.getByRole('region', { name: 'Требуется подписка WB Джем' })
  const tabs = page.locator('[role="tablist"]')
  const state = await Promise.race([
    gate.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'gate' as const),
    tabs.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'tabs' as const),
  ]).catch(() => 'timeout' as const)

  expect(state).not.toBe('timeout')

  if (state === 'gate') {
    await expect(page.getByRole('link', { name: /Подробнее/ })).toBeVisible()
    return false
  }

  await expect(tabs).toBeVisible()
  return true
}

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

  test('should display tab triggers or RequireJam overlay', async ({ page }) => {
    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    await expect(page.getByRole('tab', { name: /Заказы/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /По товарам/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /По запросам/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Позиции/i })).toBeVisible()
  })

  test('should render content or RequireJam overlay', async ({ page }) => {
    // Check text-based markers rather than DOM roles (tabpanel is absent in fail-closed gate).
    const hasTabs = await expectJamGateOrTabs(page)
    if (!hasTabs) return

    await expect(page.locator('[data-state="active"][role="tabpanel"]')).toBeVisible()
  })
})
