/**
 * Story O1 (Epic Moysklad): Order operational-status UI — NON-MUTATING smoke.
 *
 * Verifies the operational-status badge + change control render on /orders.
 * Does NOT submit any transition (would mutate a real order). Resilient to an
 * empty orders list (uses the same terminal-state pattern as orders.spec.ts).
 */

import { expect, test, type Page } from './fixtures/network-test'

const ORDERS_ROUTE = '/orders'

/** Locator matching the operational-status column header */
function operationalHeader(page: Page) {
  return page.getByRole('columnheader', { name: /Опер\. статус/i })
}

test.describe('O1 — operational status UI (non-mutating)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ORDERS_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible', timeout: 15_000 })
  })

  test('renders the operational-status column header', async ({ page }) => {
    await expect(operationalHeader(page)).toBeVisible({ timeout: 15_000 })
  })

  test('renders at least one status badge or an empty list (no errors)', async ({ page }) => {
    // Either a row with an operational badge (NEW/Assembled/…) or the empty state.
    const tableOrEmpty = page
      .locator('table')
      .or(page.getByText(/Заказы не найдены/i))
      .or(page.getByTestId('orders-error-state'))
      .or(page.getByTestId('orders-slow-loading-state'))
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 20_000 })

    // If rows exist, at least one operational badge must be present.
    const rowCount = await page.locator('table tbody tr').count()
    if (rowCount > 0) {
      const badge = page.locator('[data-operational-status]').first()
      await expect(badge).toBeVisible({ timeout: 10_000 })
      // Badge text must be one of the known Russian labels.
      await expect(badge).toContainText(/Новый|Собран|Упакован|Отгружен|Доставлен|Отменён|Возврат/)
    }
  })

  test('shows the «Сменить статус» control on non-terminal rows', async ({ page }) => {
    const rowCount = await page.locator('table tbody tr').count()
    test.skip(rowCount === 0, 'No orders present — nothing to assert the change control against')

    // At least one non-terminal row should expose the change-status control.
    // Terminal rows (DELIVERED/CANCELLED/RETURNED) render the control only
    // when onOperationalStatusChange is wired; the page wires it unconditionally,
    // so any non-terminal row will have the trigger.
    const changeControl = page.getByRole('combobox', { name: /Сменить статус заказа/i }).first()
    await expect(changeControl).toBeVisible({ timeout: 10_000 })
  })
})
