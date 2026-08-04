import { test, expect } from './fixtures/network-test'

/**
 * E2E test to verify month period selection bug fix
 *
 * Bug: When clicking "Month" button, should use last completed week (2026-W04)
 * Expected: No 404 errors, page loads correctly with data
 *
 * Note: This test relies on auth.setup.ts for authentication
 */
test.describe('Dashboard Period Selection - Month', () => {
  test('should select month period and load data without errors', async ({ page }) => {
    let serverErrorCount = 0
    page.on('response', response => {
      if (response.status() === 404 || response.status() === 500) {
        serverErrorCount += 1
      }
    })

    // Navigate to dashboard (auth is handled by setup)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000) // Extra wait for data to load

    // Click "Месяц" button (month period toggle)
    // The button is a TabsTrigger with data-testid="period-tab-month"
    const monthButton = page.getByTestId('period-tab-month')
    await expect(monthButton).toBeVisible({ timeout: 5000 })
    await monthButton.click()

    // Wait for data to load
    await page.waitForTimeout(3000)
    await page.locator('main').waitFor({ state: 'visible' })

    const monthSelector = page.getByTestId('month-selector')
    await expect(monthSelector).toHaveAttribute('data-value', /\S+/)

    // Verify page shows data (not empty state)
    const pageContent = await page.content()

    // Check for common indicators of loaded data
    const hasMetricCards = (await page.locator('[data-testid*="metric"]').count()) > 0
    const hasDataDisplay = pageContent.includes('₽') || pageContent.includes('%')
    const hasNoEmptyState =
      !pageContent.includes('Нет данных') && !pageContent.includes('Нет активных периодов')

    expect(serverErrorCount, 'Should have no 404/500 responses').toBe(0)

    // At least one data indicator should be present
    const hasData = hasMetricCards || hasDataDisplay || hasNoEmptyState
    expect(hasData, 'Page should show some data').toBeTruthy()
  })
})
