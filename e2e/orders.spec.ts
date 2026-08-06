/**
 * E2E smoke tests: Orders page.
 *
 * This suite replaces the old scaffold-only skipped checklist with stable,
 * non-mutating checks for the implemented /orders surface. Data-dependent row,
 * modal, and sync lifecycle flows remain covered by component/integration tests
 * until explicit backend fixtures are available for E2E.
 */

import { expect, test } from './fixtures/network-test'

const ORDERS_ROUTE = '/orders'

async function openOrdersPage(page: import('@playwright/test').Page) {
  await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
  await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 })
}

test.describe('Orders page smoke', () => {
  test.beforeEach(async ({ page }) => {
    await openOrdersPage(page)
  })

  test('renders the orders page heading and read-only controls', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Заказы FBS/i })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/Управление заказами и отслеживание статусов/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Обновить/i })).toBeVisible()
  })

  test('shows filters and a terminal list state without page errors', async ({ page }) => {
    await expect(page.getByLabel('С:')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('По:')).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Статус продавца/i })).toBeVisible()
    await expect(page.getByRole('combobox', { name: /Статус WB/i })).toBeVisible()
    await expect(page.getByLabel(/Поиск по SKU/i)).toBeVisible()

    const terminalState = page
      .locator('table')
      .or(page.getByText(/Заказы не найдены/i))
      .or(page.getByTestId('orders-error-state'))
      .or(page.getByTestId('orders-slow-loading-state'))

    await expect(terminalState.first()).toBeVisible({ timeout: 20_000 })
  })
})
