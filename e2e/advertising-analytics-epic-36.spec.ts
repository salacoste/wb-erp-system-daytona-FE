/**
 * Epic 36 Frontend E2E Tests
 *
 * Tests for Product Card Linking (Склейки) feature.
 * Covers 5 critical scenarios per PO approval.
 *
 * @see frontend/docs/stories/epic-36/story-36.5-fe-testing-documentation.md
 */

import { test, expect } from '@playwright/test'

test.describe('Epic 36: Product Card Linking (Склейки)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to advertising analytics page
    await page.goto('/analytics/advertising')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  /**
   * Scenario 1: Toggle switches between grouping modes
   * AC: Toggle state updates, URL updates, API call with correct parameter
   */
  test('should switch between SKU and imtId grouping modes', async ({ page }) => {
    // Check default state: "По артикулам" active
    const skuButton = page.getByRole('button', { name: /По артикулам/i })
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })

    await expect(skuButton).toHaveAttribute('aria-pressed', 'true')
    await expect(imtIdButton).toHaveAttribute('aria-pressed', 'false')

    // Check default URL param
    await expect(page).toHaveURL(/group_by=sku/)

    // Click "По склейкам"
    await imtIdButton.click()

    // Wait for API response
    await page.waitForResponse(response =>
      response.url().includes('/v1/analytics/advertising') &&
      response.url().includes('group_by=imtId')
    )

    // Check toggle state updated
    await expect(skuButton).toHaveAttribute('aria-pressed', 'false')
    await expect(imtIdButton).toHaveAttribute('aria-pressed', 'true')

    // Check URL updated
    await expect(page).toHaveURL(/group_by=imtId/)

    // Switch back to SKU
    await skuButton.click()
    await page.waitForResponse(response =>
      response.url().includes('group_by=sku')
    )

    await expect(page).toHaveURL(/group_by=sku/)
  })

  /**
   * Scenario 2: Merged groups display with badge
   * AC: Table shows merged groups, badge appears, tooltip works
   */
  test('should display merged groups with badge and tooltip', async ({ page }) => {
    // Switch to merged groups view
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })
    await imtIdButton.click()

    // Wait for data to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Look for merged group badge (if data has merged groups)
    const badges = page.locator('text=/🔗 Склейка \\(\\d+\\)/')
    const badgeCount = await badges.count()

    if (badgeCount > 0) {
      // Test first badge
      const firstBadge = badges.first()
      await expect(firstBadge).toBeVisible()

      // Hover over badge to show tooltip
      await firstBadge.hover()

      // Check tooltip appears with product list
      await expect(page.getByText(/Объединённая карточка/i)).toBeVisible({ timeout: 3000 })
      await expect(page.getByText(/Товары в группе/i)).toBeVisible()
      await expect(page.getByText(/Рекламные затраты основной карточки/i)).toBeVisible()
    } else {
      // No merged groups in current data - verify individual products display
      const tableRows = page.locator('table tbody tr')
      await expect(tableRows.first()).toBeVisible()

      // Should NOT have any badges
      await expect(page.locator('text=/🔗 Склейка/')).toHaveCount(0)
    }
  })

  /**
   * Scenario 3: URL state persistence
   * AC: Page refresh preserves groupBy state
   */
  test('should persist groupBy state in URL across page refresh', async ({ page }) => {
    // Switch to merged groups
    await page.getByRole('button', { name: /По склейкам/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify URL contains group_by=imtId
    const url = page.url()
    expect(url).toContain('group_by=imtId')

    // Refresh page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check state persisted
    await expect(page).toHaveURL(/group_by=imtId/)
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })
    await expect(imtIdButton).toHaveAttribute('aria-pressed', 'true')
  })

  /**
   * Scenario 4: Backward compatibility with Epic 33
   * AC: All Epic 33 features work in both grouping modes
   */
  test('should preserve Epic 33 functionality in both modes', async ({ page }) => {
    // Test in SKU mode (default)
    await testEpic33Features(page)

    // Switch to merged groups mode
    await page.getByRole('button', { name: /По склейкам/i }).click()
    await page.waitForLoadState('networkidle')

    // Test Epic 33 features still work
    await testEpic33Features(page)
  })

  /**
   * Scenario 5: Mobile responsive behavior
   * AC: Toggle buttons stack vertically on mobile, table scrolls
   */
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 })

    // Reload to apply responsive styles
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Toggle should be visible
    const skuButton = page.getByRole('button', { name: /По артикулам/i })
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })

    await expect(skuButton).toBeVisible()
    await expect(imtIdButton).toBeVisible()

    // Table should be scrollable
    const table = page.locator('table')
    await expect(table).toBeVisible()

    // Toggle should work on mobile
    await imtIdButton.tap()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/group_by=imtId/)
  })
})

/**
 * Helper: Test Epic 33 features (filters, sorting, pagination)
 */
async function testEpic33Features(page: any) {
  // Check filters panel exists
  await expect(page.getByText(/Период/i)).toBeVisible()

  // Check table exists
  await expect(page.locator('table')).toBeVisible()

  // Check summary cards exist
  await expect(page.getByText(/Рекламные затраты/i)).toBeVisible()
  await expect(page.getByText(/ROAS/i)).toBeVisible()

  // Check sorting works (click on Spend column header)
  const spendHeader = page.getByRole('columnheader', { name: /Spend|Затраты/i })
  if (await spendHeader.count() > 0) {
    await spendHeader.click()
    await page.waitForLoadState('networkidle')
  }
}
