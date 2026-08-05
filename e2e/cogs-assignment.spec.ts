import { test, expect, type Page } from './fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from './fixtures/mutation-guard'
import { ROUTES, TIMEOUTS, TEST_PRODUCTS } from './fixtures/test-data'

/**
 * E2E Tests: COGS Assignment
 * Stories: 4.1 (Single Product COGS), 4.8 (Margin Recalculation Polling)
 *
 * Tests the COGS assignment workflow including:
 * - Product list display
 * - Single product COGS assignment
 * - Margin calculation and polling
 * - Bulk COGS assignment
 */
const COGS_HEADING = 'Управление себестоимостью'
const PRODUCT_SEARCH_PLACEHOLDER = 'Поиск по артикулу или названию...'
const SEEDED_PRODUCT_ID = TEST_PRODUCTS.withCogs.nmId.toString()

async function expectCogsShell(page: Page) {
  await expect(page.getByRole('heading', { name: COGS_HEADING, level: 1 })).toBeVisible({
    timeout: TIMEOUTS.api,
  })
}

async function expectProductTerminalState(page: Page) {
  const table = page.locator('table[aria-label="Список товаров"]')
  const emptyState = page.locator('[data-testid="product-empty-state"]')
  await expect(table.or(emptyState)).toBeVisible({ timeout: TIMEOUTS.api })
  return { table, emptyState }
}

async function openSeededProductCogsForm(page: Page) {
  await expectCogsShell(page)
  await page.getByPlaceholder(PRODUCT_SEARCH_PLACEHOLDER).fill(SEEDED_PRODUCT_ID)

  const { table, emptyState } = await expectProductTerminalState(page)
  await expect(emptyState).toHaveCount(0)
  await expect(table).toBeVisible()
  const productRow = table.getByRole('row').filter({ hasText: SEEDED_PRODUCT_ID })
  await expect(productRow).toHaveCount(1)
  await productRow.click()

  const assignmentDialog = page.getByRole('dialog', { name: 'Назначение себестоимости' })
  await expect(assignmentDialog).toBeVisible()
  await expect(assignmentDialog.getByLabel('Себестоимость (₽)')).toBeVisible()
}

test.describe('COGS Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.cogs)
    await page.waitForLoadState('domcontentloaded')
    await expectCogsShell(page)
  })

  test.describe('Story 4.1: Product List Display', () => {
    test('displays product list', async ({ page }) => {
      await expectProductTerminalState(page)
    })

    test('shows product rows with key information', async ({ page }) => {
      const { table, emptyState } = await expectProductTerminalState(page)
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText('Товары не найдены')
        test.skip(true, 'Local COGS fixture contains no products for row-content assertions')
        return
      }

      const firstProductRow = table.locator('tbody tr').first()
      await expect(firstProductRow).toBeVisible()
      await expect(firstProductRow.locator('td').first()).toHaveText(/^\d+$/)
      await expect(firstProductRow.locator('td').nth(2)).not.toHaveText('')
    })

    test('has search or filter functionality', async ({ page }) => {
      await expectProductTerminalState(page)
      await expect(page.getByPlaceholder(PRODUCT_SEARCH_PLACEHOLDER)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Все товары', exact: true })).toBeVisible()
    })

    test('has pagination controls', async ({ page }) => {
      const { emptyState } = await expectProductTerminalState(page)
      if (await emptyState.isVisible()) {
        test.skip(true, 'Local COGS fixture contains no products, so pagination is not rendered')
        return
      }

      await expect(page.getByText(/^Показано \d+ из \d+ товаров$/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Назад', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Вперёд', exact: true })).toBeVisible()
    })

    test('can filter by COGS status', async ({ page }) => {
      const filterButton = page.getByRole('button', { name: 'Все товары', exact: true })
      await filterButton.click()
      await expect(
        page.getByRole('button', { name: 'Без себестоимости', exact: true })
      ).toBeVisible()
      await page.getByRole('button', { name: 'Без себестоимости', exact: true }).click()
      await expect(
        page.getByRole('button', { name: 'С себестоимостью', exact: true })
      ).toBeVisible()
    })
  })

  test.describe('Story 4.1: Single Product COGS Assignment @mutating', () => {
    test.describe.configure({ mode: 'serial' })
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('can open COGS assignment form', async ({ page }) => {
      await openSeededProductCogsForm(page)
    })

    test('displays COGS input field', async ({ page }) => {
      await openSeededProductCogsForm(page)
      await expect(page.getByRole('dialog').getByLabel('Себестоимость (₽)')).toHaveAttribute(
        'id',
        'unit_cost_rub'
      )
    })

    test('validates COGS input', async ({ page }) => {
      await openSeededProductCogsForm(page)
      const dialog = page.getByRole('dialog')
      const cogsInput = dialog.getByLabel('Себестоимость (₽)')
      await cogsInput.fill('-100')
      await dialog.getByRole('button', { name: /себестоимость/i }).click()
      const nativeValidity = await cogsInput.evaluate(input => {
        const element = input as HTMLInputElement
        return {
          isValid: element.validity.valid,
          isRangeUnderflow: element.validity.rangeUnderflow,
          validationMessage: element.validationMessage,
        }
      })
      expect(nativeValidity.isValid).toBe(false)
      expect(nativeValidity.isRangeUnderflow).toBe(true)
      expect(nativeValidity.validationMessage).not.toBe('')
      await expect(dialog).toBeVisible()
      await expect(cogsInput).toBeFocused()
    })

    test('can assign COGS to product', async ({ page }) => {
      await openSeededProductCogsForm(page)
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Себестоимость (₽)').fill(TEST_PRODUCTS.withCogs.cogs.toString())

      const responsePromise = page.waitForResponse(
        response =>
          response.request().method() === 'POST' &&
          response.url().includes(`/v1/products/${SEEDED_PRODUCT_ID}/cogs`)
      )
      await dialog.getByRole('button', { name: /себестоимость/i }).click()
      const response = await responsePromise
      expect(response.ok()).toBeTruthy()
      await expect(page.getByText('Себестоимость назначена успешно', { exact: true })).toBeVisible()
      await expect(dialog).not.toBeVisible()
    })
  })

  test.describe('Story 4.8: Margin Calculation & Polling', () => {
    test('shows margin after COGS assignment', async ({ page }) => {
      const { table, emptyState } = await expectProductTerminalState(page)
      if (await emptyState.isVisible()) {
        test.skip(true, 'Local COGS fixture contains no product margin states')
        return
      }

      await expect(table.locator('tbody tr').first().locator('td').nth(4)).toHaveText(
        /%|нет COGS|Расчёт|Нет продаж|Нет данных|Аналитика недоступна|в карточке/
      )
    })

    test('displays loading state during margin calculation', async ({ page }) => {
      await page.route('**/v1/products?**', async route => {
        await new Promise(resolve => setTimeout(resolve, 750))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            products: [],
            pagination: { total: 0, page: 1, limit: 25, total_pages: 0 },
          }),
        })
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.locator('[data-testid="product-loading-skeleton"]')).toBeVisible()
    })

    test('shows margin calculation status', async ({ page }) => {
      const { table, emptyState } = await expectProductTerminalState(page)
      if (await emptyState.isVisible()) {
        await expect(emptyState).toContainText('Товары не найдены')
        return
      }

      await expect(table.getByRole('columnheader', { name: 'Маржа' })).toBeVisible()
      await expect(table.locator('tbody tr').first().locator('td').nth(4)).not.toHaveText('')
    })
  })

  test.describe('Bulk COGS Assignment', () => {
    test('has bulk assignment option', async ({ page }) => {
      await page.goto(ROUTES.cogsBulk, { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('heading', { name: 'Массовое назначение себестоимости', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })
      await expect(page.getByText('Выбор товаров и назначение себестоимости')).toBeVisible()
    })

    test('uses product selection rather than stale CSV upload workflow', async ({ page }) => {
      await page.goto(ROUTES.cogsBulk, { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('heading', { name: 'Массовое назначение себестоимости', level: 1 })
      ).toBeVisible({ timeout: TIMEOUTS.api })

      const search = page.getByPlaceholder(PRODUCT_SEARCH_PLACEHOLDER)
      const emptyState = page.getByRole('heading', { name: 'Товары не найдены', level: 3 })
      await expect(search).toBeVisible()
      await expect(page.getByText('Выбор товаров и назначение себестоимости')).toBeVisible()
      await expect(page.getByRole('table').or(emptyState)).toBeVisible({ timeout: TIMEOUTS.api })
    })
  })

  test.describe('Error Handling', () => {
    test('handles API errors gracefully', async ({ page }) => {
      // Try to trigger an error state
      await page.route('**/products**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.reload()

      // Should show error state or empty state
      await page.waitForTimeout(2000)

      await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible({
        timeout: TIMEOUTS.api,
      })
    })

    test('handles network timeout', async ({ page }) => {
      // Simulate slow network
      await page.route('**/products**', async route => {
        await new Promise(resolve => setTimeout(resolve, 750))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            products: [],
            pagination: { total: 0, page: 1, limit: 25, total_pages: 0 },
          }),
        })
      })

      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.locator('[data-testid="product-loading-skeleton"]')).toBeVisible()
    })
  })
})
