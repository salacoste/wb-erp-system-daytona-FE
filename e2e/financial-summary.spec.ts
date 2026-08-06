import { expect, test } from './fixtures/network-test'
import { installStory1626DashboardRoutes } from './fixtures/story-162-6-dashboard'

test.describe('Financial summary exact route synchronization', () => {
  test('binds available weeks and finance summary to the visible selected period', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      availableWeeks: { mode: 'data' },
      financeSummary: { mode: 'data' },
    })
    const weeksRequest = routes.waitForAttempt('dashboard.availableWeeks')
    const summaryRequest = routes.waitForAttempt('dashboard.financeSummary')

    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    const [weeks, summary] = await Promise.all([weeksRequest, summaryRequest])
    expect(new URL(weeks.url).pathname).toBe('/v1/analytics/weekly/available-weeks')
    expect(new URL(weeks.url).search).toBe('')
    const summaryUrl = new URL(summary.url)
    expect(summaryUrl.pathname).toBe('/v1/analytics/weekly/finance-summary')
    expect(summaryUrl.searchParams.get('week')).toBe('2026-W05')

    await expect(page.getByRole('heading', { name: 'Аналитика', level: 1 })).toBeVisible()
    await expect(page.getByText('Финансовая сводка за период', { exact: true })).toBeVisible()
    await expect(page.getByRole('combobox').first()).toContainText(/2026.*05|Неделя 5/i)
    await expect(page.getByText('Итого к оплате', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/87.?074/).first()).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })

  test('comparison controls expose their mounted client state without a timer', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      availableWeeks: { mode: 'data' },
      financeSummary: { mode: 'data' },
    })

    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    await routes.waitForAttempt('dashboard.financeSummary')
    await page.getByRole('button', { name: 'Сравнить периоды' }).click()
    await expect(page.getByRole('button', { name: 'Один период' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Период 1' })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Период 2' })).toBeVisible()
    routes.assertNoUnexpectedRequests()
  })
})
