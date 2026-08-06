import { expect, test } from './fixtures/network-test'
import { installStory1626AnalyticsRoutes } from './fixtures/story-162-6-analytics'

test('category analytics binds the exact weekly response to a visible category row', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const routes = await installStory1626AnalyticsRoutes(page, {
    weeklyByCategory: { mode: 'data' },
    weeklyCabinetExpenses: { mode: 'data' },
  })
  const categoryRequest = routes.waitForAttempt('analytics.weeklyByCategory')
  const expensesRequest = routes.waitForAttempt('analytics.weeklyCabinetExpenses')

  await page.goto('/analytics/category?weekStart=2026-W05&weekEnd=2026-W05', {
    waitUntil: 'domcontentloaded',
  })
  const [category, expenses] = await Promise.all([categoryRequest, expensesRequest])
  const categoryUrl = new URL(category.url)
  expect(categoryUrl.pathname).toBe('/v1/analytics/weekly/by-category')
  const selectedWeek = categoryUrl.searchParams.get('week')
  expect(selectedWeek).toMatch(/^\d{4}-W\d{2}$/)
  expect(categoryUrl.searchParams.get('include_cogs')).toBe('true')
  expect(categoryUrl.searchParams.get('include_ads')).toBe('true')
  expect(categoryUrl.searchParams.get('include_stock')).toBe('true')
  expect(new URL(expenses.url).searchParams.get('weekStart')).toBe(selectedWeek)
  expect(new URL(expenses.url).searchParams.get('weekEnd')).toBe(selectedWeek)

  await expect(
    page.getByRole('heading', { name: 'Маржинальность по категориям', level: 1 })
  ).toBeVisible()
  await expect(
    page.getByRole('cell', { name: 'Категория Story 162.6', exact: true }).first()
  ).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
  routes.assertNoUnexpectedRequests()
})
