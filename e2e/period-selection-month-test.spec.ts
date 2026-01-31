import { test, expect } from '@playwright/test'

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
    // Collect console logs and errors
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []
    const networkErrors: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    page.on('response', response => {
      if (response.status() === 404 || response.status() === 500) {
        networkErrors.push(`${response.status()} - ${response.url()}`)
      }
    })

    // Navigate to dashboard (auth is handled by setup)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Extra wait for data to load

    console.log('=== Dashboard loaded - Initial state ===')
    console.log('Console logs:', consoleLogs.slice(-10)) // Last 10 logs
    console.log('Console errors:', consoleErrors)
    console.log('Network errors:', networkErrors)

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/screenshots/month-test-initial.png',
      fullPage: true,
    })

    // Click "Месяц" button (month period toggle)
    // The button is a TabsTrigger with data-testid="period-tab-month"
    const monthButton = page.getByTestId('period-tab-month')
    await expect(monthButton).toBeVisible({ timeout: 5000 })
    await monthButton.click()

    // Wait for data to load
    await page.waitForTimeout(3000)
    await page.waitForLoadState('networkidle')

    // Debug: Log the current month selector value
    const monthSelector = page.getByTestId('month-selector')
    const monthValue = await monthSelector.getAttribute('data-value')
    console.log('Selected month value:', monthValue)

    console.log('=== After clicking Month button ===')
    console.log('Console logs:', consoleLogs.slice(-10)) // Last 10 logs
    console.log('Console errors:', consoleErrors)
    console.log('Network errors:', networkErrors)

    // Take screenshot after month selection
    await page.screenshot({
      path: 'test-results/screenshots/month-test-after-click.png',
      fullPage: true,
    })

    // Verify page shows data (not empty state)
    const pageContent = await page.content()

    // Check for common indicators of loaded data
    const hasMetricCards = (await page.locator('[data-testid*="metric"]').count()) > 0
    const hasDataDisplay = pageContent.includes('₽') || pageContent.includes('%')
    const hasNoEmptyState =
      !pageContent.includes('Нет данных') && !pageContent.includes('Нет активных периодов')

    console.log('=== Data verification ===')
    console.log('Has metric cards:', hasMetricCards)
    console.log('Has data display:', hasDataDisplay)
    console.log('Has no empty state:', hasNoEmptyState)

    // Assertions
    expect(networkErrors.filter(e => e.includes('404')).length, 'Should have no 404 errors').toBe(0)
    expect(
      consoleErrors.filter(e => e.includes('404')).length,
      'Should have no 404 errors in console'
    ).toBe(0)

    // At least one data indicator should be present
    const hasData = hasMetricCards || hasDataDisplay || hasNoEmptyState
    expect(hasData, 'Page should show some data').toBeTruthy()

    // Log final summary
    console.log('=== Test Summary ===')
    console.log('Total console logs:', consoleLogs.length)
    console.log('Total console errors:', consoleErrors.length)
    console.log('Total network errors (404/500):', networkErrors.length)
    console.log('All errors:', [...consoleErrors, ...networkErrors])
  })
})
