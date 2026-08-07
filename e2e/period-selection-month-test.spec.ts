import { expect, test } from './fixtures/network-test'

test.describe('Dashboard period selection - month', () => {
  test('selects month and proves URL, storage, exact finance request, and rendered metrics', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const monthButton = page.getByTestId('period-toggle-month')
    await expect(monthButton).toBeVisible({ timeout: 10000 })
    const financeResponse = page.waitForResponse(response => {
      const url = new URL(response.url())
      return (
        response.request().method() === 'GET' &&
        url.pathname === '/v1/analytics/weekly/finance-summary' &&
        url.searchParams.size === 1 &&
        /^\d{4}-\d{2}$/.test(url.searchParams.get('month') ?? '')
      )
    })

    await monthButton.click()
    const response = await financeResponse
    expect(response.status()).toBe(200)
    const selectedMonth = new URL(response.url()).searchParams.get('month')
    expect(selectedMonth).toMatch(/^\d{4}-\d{2}$/)

    // Story 163.6-FE: RadioGroup radio exposes data-state="checked" when selected.
    await expect(monthButton).toHaveAttribute('data-state', 'checked')
    await expect(page).toHaveURL(new RegExp(`[?&]month=${selectedMonth}(?:&|$)`))
    await expect(page).toHaveURL(/[?&]type=month(?:&|$)/)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('dashboard-period-type')))
      .toBe('month')

    const selector = page.getByTestId('month-selector')
    await expect(selector).toBeVisible()
    await expect(selector).toContainText(/[А-Яа-я]+ \d{4}/)
    await expect(page.locator('[role="region"][aria-label="Основные метрики P&L"]')).toBeVisible({
      timeout: 10000,
    })
  })
})
