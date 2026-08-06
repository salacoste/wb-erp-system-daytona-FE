import { expect, test, type Page } from './fixtures/network-test'

async function openDashboard(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/dashboard?week=2026-W12&type=week', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 10000 })
}

async function openAnalyticsDisclosure(page: Page): Promise<void> {
  const disclosure = page.getByRole('button', { name: /^Аналитика/ })
  await disclosure.click()
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#analytical-detail')).toBeVisible()
}

test.describe('Dashboard session regressions', () => {
  test.beforeEach(async ({ page }) => {
    await openDashboard(page)
  })

  test('shows a concrete seller identity in the sidebar', async ({ page }) => {
    const seller = page.locator('a[href="/settings/cabinet"]').first()
    await expect(seller).toBeVisible()
    await expect(seller).not.toHaveText(/^\s*$/)
    await expect(seller).not.toContainText('Нет подписки')
  })

  test('sidebar exposes scroll overflow for long navigation', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect
      .poll(() => nav.evaluate(node => getComputedStyle(node).overflowY))
      .toMatch(/auto|scroll/)
  })

  test('trends section reaches a named chart, empty, or error terminal state', async ({ page }) => {
    await openAnalyticsDisclosure(page)
    const title = page.getByText('Тренды ключевых метрик', { exact: true }).last()
    await expect(title).toBeVisible({ timeout: 10000 })
    const card = title.locator('xpath=ancestor::*[contains(@class,"rounded")][1]')
    await expect(
      card
        .locator('.recharts-wrapper')
        .or(card.getByText('Нет данных для отображения', { exact: true }))
        .or(card.getByText(/Ошибка загрузки/))
        .first()
    ).toBeVisible({ timeout: 10000 })
    await expect(card).not.toContainText('NaN')
  })

  test('expense section reaches a named chart, empty, or error terminal state', async ({
    page,
  }) => {
    await openAnalyticsDisclosure(page)
    const title = page.getByText('Разбивка расходов', { exact: true }).last()
    await expect(title).toBeVisible({ timeout: 10000 })
    const card = title.locator('xpath=ancestor::*[contains(@class,"rounded")][1]')
    await expect(
      card
        .locator('.recharts-wrapper')
        .or(card.getByText(/Нет данных/))
        .or(card.getByText(/Ошибка загрузки/))
        .first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('does not show a false failed-processing alert when metrics render', async ({ page }) => {
    await expect(page.getByText('Ошибка обработки финансовых данных')).toHaveCount(0)
    await expect(page.locator('[role="region"][aria-label="Основные метрики P&L"]')).toBeVisible({
      timeout: 10000,
    })
  })
})

test('unit economics defaults to a completed week without an error terminal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/analytics/unit-economics', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/2026-W\d+/).first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Не удалось загрузить данные')).toHaveCount(0)
})
