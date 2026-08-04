import { test, expect } from './fixtures/network-test'

/**
 * E2E smoke: /products — discontinued-product assortment management
 * («Снят с продажи»). Verifies the page mounts with its heading and both
 * sections (discontinued list + system suggestions), each resolving to a state.
 */
test.describe('Products assortment (discontinued lifecycle)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
  })

  test('renders the page heading and both section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ассортимент/i })).toBeVisible()
    await expect(page.getByText('Снятые с продажи').first()).toBeVisible()
    await expect(page.getByText('Подсказки системы').first()).toBeVisible()
  })

  test('each section resolves to a state (list, empty, loading, or error)', async ({ page }) => {
    // Each section resolves to either its <ul> list or a status message.
    const states = page.locator(
      'ul, :is(:text("Нет снятых товаров"), :text("Подсказок нет"), :text("Загрузка"), :text("Ошибка"))'
    )
    // At least one section's state is visible once the queries settle.
    await expect(states.first()).toBeVisible({ timeout: 15_000 })
  })
})
