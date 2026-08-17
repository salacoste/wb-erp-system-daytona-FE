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

// ---------------------------------------------------------------------------
// Story 168.1 — Analytics Hub shadcn migration evidence (behavior lock).
// Fail-closed: reuses the Story 162-6 synthetic dashboard routes; every hub
// navigation card href/title/badge and the heading structure must survive the
// semantic-token migration byte-identical. No real API surface is touched.
// ---------------------------------------------------------------------------
test.describe('Story 168.1 analytics hub navigation contract', () => {
  test('keeps all 24 grouped navigation links, badges, and heading structure', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const routes = await installStory1626DashboardRoutes(page, {
      availableWeeks: { mode: 'data' },
      financeSummary: { mode: 'data' },
    })

    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    await routes.waitForAttempt('dashboard.financeSummary')

    // Heading structure: single h1 + four group h2s (accessibility contract)
    await expect(page.getByRole('heading', { name: 'Аналитика', level: 1 })).toBeVisible()
    for (const group of [
      'Финансовый анализ',
      'Операционная аналитика',
      'Маркетинг и SEO',
      'Стратегический анализ',
    ]) {
      await expect(page.getByRole('heading', { name: group, level: 2 })).toBeVisible()
    }

    // All 24 navigation cards render as links to their exact routes
    // Nav cards are the only `a.group` links (hub navigation grid); sidebar links excluded
    const links = page.locator('a.group[href^="/analytics/"]')
    await expect(links).toHaveCount(24)
    for (const href of [
      '/analytics/sku',
      '/analytics/brand',
      '/analytics/category',
      '/analytics/time-period',
      '/analytics/finance-history',
      '/analytics/buyout-reconciliation',
      '/analytics/storage',
      '/analytics/supply-planning',
      '/analytics/orders',
      '/analytics/fbs-stock',
      '/analytics/fbs-enhanced',
      '/analytics/reorder',
      '/analytics/funnel',
      '/analytics/advertising',
      '/analytics/search',
      '/analytics/buyout',
      '/analytics/returns',
      '/analytics/cross-reference',
      '/analytics/unit-economics',
      '/analytics/forecast',
      '/analytics/pricing',
      '/analytics/alerts',
      '/analytics/gaps',
      '/analytics/forecast-accuracy',
    ]) {
      await expect(page.locator(`a.group[href="${href}"]`)).toHaveCount(1)
    }

    // Badge copies survive byte-identical
    await expect(page.getByText('Важно', { exact: true })).toBeVisible()
    await expect(page.getByText('Новое', { exact: true })).toBeVisible()
    await expect(page.getByText('ML', { exact: true })).toBeVisible()

    // Semantic-token boundary: no legacy hue classes on navigation cards
    const legacy = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('a.group')).filter(el =>
          /(?:^|\s)(?:text|bg|border|hover:bg|hover:text)-(?:blue|emerald|violet|amber|cyan|sky|slate|rose|orange|teal|pink|purple|indigo|yellow|red)-\d/.test(
            el.className
          )
        ).length
    )
    expect(legacy).toBe(0)

    routes.assertNoUnexpectedRequests()
  })
})
