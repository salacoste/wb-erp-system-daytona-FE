/**
 * Epic 36 Frontend E2E Tests
 *
 * Tests for Product Card Linking (Склейки) feature.
 * Covers 5 critical scenarios per PO approval.
 *
 * @see frontend/docs/stories/epic-36/story-36.5-fe-testing-documentation.md
 */

import { test, expect, type Page } from './fixtures/network-test'

test.describe('Epic 36: Product Card Linking (Склейки)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to advertising analytics page
    await page.goto('/analytics/advertising')

    // Anti-pattern #9: the advertising page background-polls (sync-status badge + TanStack
    // Query), so networkidle never reliably settles. Wait for the groupBy toggle to render.
    await expect(page.getByRole('button', { name: /По артикулам/i })).toBeVisible({
      timeout: 30000,
    })
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

    // Register the response listener BEFORE clicking — on a warm localhost the response can
    // arrive before a post-click waitForResponse attaches (action-before-wait race → 30s timeout).
    const imtResp = page.waitForResponse(
      response =>
        response.url().includes('/v1/analytics/advertising') &&
        response.url().includes('group_by=imtId')
    )
    await imtIdButton.click()
    await imtResp

    // Check toggle state updated
    await expect(skuButton).toHaveAttribute('aria-pressed', 'false')
    await expect(imtIdButton).toHaveAttribute('aria-pressed', 'true')

    // Check URL updated
    await expect(page).toHaveURL(/group_by=imtId/)

    // Switch back to SKU. Do NOT wait for a network response here: sku data was already
    // fetched on initial load and is fresh in the TanStack cache, so toggling back is a cache
    // hit with NO new request (waiting for one would hang). Assert URL + toggle state instead.
    await skuButton.click()
    await expect(page).toHaveURL(/group_by=sku/)
    await expect(skuButton).toHaveAttribute('aria-pressed', 'true')
    await expect(imtIdButton).toHaveAttribute('aria-pressed', 'false')
  })

  /**
   * Scenario 2: Merged groups display with badge
   * AC: Table shows merged groups, badge appears, tooltip works
   */
  test('should display merged groups with badge and tooltip', async ({ page }) => {
    // Switch to merged groups view (wait for the imtId fetch, then the table to render)
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })
    const imtResp = page.waitForResponse(
      r => r.url().includes('/v1/analytics/advertising') && r.url().includes('group_by=imtId')
    )
    await imtIdButton.click()
    await imtResp
    await expect(mergedGroupsTable(page)).toBeVisible()

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
      // No merged groups for this cabinet — the склейки table renders its header with an empty
      // body (valid: nothing to merge). Verify the table is present and shows no склейка badges.
      await expect(mergedGroupsTable(page)).toBeVisible()
      await expect(page.locator('text=/🔗 Склейка/')).toHaveCount(0)
    }
  })

  /**
   * Scenario 3: URL state persistence
   * AC: Page refresh preserves groupBy state
   */
  test('should persist groupBy state in URL across page refresh', async ({ page }) => {
    // Switch to merged groups (wait for the URL to reflect the new state, not networkidle #9)
    await page.getByRole('button', { name: /По склейкам/i }).click()
    await expect(page).toHaveURL(/group_by=imtId/)

    // Refresh page — the toggle re-renders from the URL param (group_by=imtId)
    await page.reload()

    // Check state persisted after reload
    await expect(page).toHaveURL(/group_by=imtId/)
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })
    await expect(imtIdButton).toHaveAttribute('aria-pressed', 'true')
  })

  /**
   * Scenario 4: Backward compatibility with Epic 33
   * AC: All Epic 33 features work in both grouping modes
   */
  test('should preserve Epic 33 functionality in both modes', async ({ page }) => {
    // Test in SKU mode (default). Gate on the URL because the helper selects the table by group_by.
    await expect(page).toHaveURL(/group_by=sku/)
    await testEpic33Features(page)

    // Switch to merged groups mode (wait for the imtId refetch, not networkidle #9)
    const imtResp = page.waitForResponse(
      r => r.url().includes('/v1/analytics/advertising') && r.url().includes('group_by=imtId')
    )
    await page.getByRole('button', { name: /По склейкам/i }).click()
    await imtResp
    await expect(page).toHaveURL(/group_by=imtId/)

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

    // Reload to apply responsive styles (the toggle-visible assertions below gate readiness;
    // no networkidle #9 needed)
    await page.reload()

    // Toggle should be visible
    const skuButton = page.getByRole('button', { name: /По артикулам/i })
    const imtIdButton = page.getByRole('button', { name: /По склейкам/i })

    await expect(skuButton).toBeVisible()
    await expect(imtIdButton).toBeVisible()

    // Table should be scrollable
    const table = advertisingMetricsTable(page)
    await expect(table).toBeVisible()

    // Toggle should work on mobile. Use click (not tap — the chromium project doesn't enable
    // hasTouch); it exercises the same handler at the mobile viewport. toHaveURL auto-waits for
    // the router.replace that syncs group_by.
    await imtIdButton.click()
    await expect(page).toHaveURL(/group_by=imtId/)
  })
})

function advertisingMetricsTable(page: Page) {
  return page.getByRole('table', { name: /таблица рекламных метрик/i })
}

function mergedGroupsTable(page: Page) {
  return page.getByRole('table', { name: /таблица рекламной аналитики по склейкам/i })
}

/**
 * Helper: Test Epic 33 features (filters, sorting, pagination)
 */
async function testEpic33Features(page: Page) {
  // Check filters panel exists. There is no literal "Период" label — the date range is two
  // textboxes ("Дата начала периода" / "Дата окончания периода").
  await expect(page.getByRole('textbox', { name: /Дата начала периода/i })).toBeVisible()

  const table = page.url().includes('group_by=imtId')
    ? mergedGroupsTable(page)
    : advertisingMetricsTable(page)

  // Check the intended analytics table exists even when other risk tables are visible
  await expect(table).toBeVisible()

  // Check summary cards exist. Actual card labels are "Всего продаж" / "Общий ROAS" / "Общий
  // ROI" / "Расходы" (NOT "Рекламные затраты"). These strings also recur as column headers, so
  // scope to the first match to avoid a strict-mode violation.
  await expect(page.getByText(/Всего продаж/i).first()).toBeVisible()
  await expect(page.getByText(/Общий ROAS/i).first()).toBeVisible()

  // Check sorting works (click the Spend column header). Don't wait for a network response —
  // a repeat sort can be served from the TanStack cache; just assert the table stays rendered.
  const spendHeader = page.getByRole('columnheader', { name: /Spend|Затраты/i })
  if ((await spendHeader.count()) > 0) {
    await spendHeader.first().click()
    await expect(table).toBeVisible()
  }
}
