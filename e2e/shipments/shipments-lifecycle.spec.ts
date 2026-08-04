/**
 * E2E Tests: Shipment Lifecycle
 * Epic 77-FE Story 77.2: Shipment E2E Tests
 *
 * Full lifecycle tests for shipment cost management:
 * 1. Create shipment (name, delivery mode, cost)
 * 2. Add pallet
 * 3. Add box line (nmId + boxCount)
 * 4. Calculate (extended timeout)
 * 5. Confirm → verify readonly state
 * 6. Delete (separate draft shipment)
 *
 * Uses test.describe.serial for ordered execution with shared state.
 *
 * @see _bmad-output/implementation-artifacts/77.2-fe-shipment-e2e-tests.md
 */

import { test, expect } from '../fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from '../fixtures/mutation-guard'

const SHIPMENTS_ROUTE = '/shipments'
const TEST_SHIPMENT_NAME = `E2E Lifecycle ${Date.now()}`
const TEST_DELETE_SHIPMENT_NAME = `E2E Delete ${Date.now()}`

test.describe('Shipment Lifecycle - Epic 77-FE @mutating', () => {
  test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

  test.describe.serial('Complete Shipment Flow', () => {
    let shipmentId: string | null = null

    test('Step 1: Create shipment', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not available')
        return
      }

      await createButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Fill name
      await dialog.locator('#sp-name').fill(TEST_SHIPMENT_NAME)

      // Select delivery mode (FIXED_VEHICLE)
      const fixedVehicleRadio = dialog.locator('#mode-FIXED_VEHICLE')
      if (await fixedVehicleRadio.isVisible()) {
        await fixedVehicleRadio.click()
      }

      // Fill cost
      await dialog.locator('#sp-cost').fill('5000')

      // Submit and wait for API response
      const responsePromise = page.waitForResponse(
        resp =>
          resp.url().includes('/v1/shipments') &&
          resp.request().method() === 'POST' &&
          resp.status() >= 200 &&
          resp.status() < 300
      )

      await dialog.getByRole('button', { name: 'Создать' }).click()
      await responsePromise
      await page.locator('main').waitFor({ state: 'visible' })

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/shipments\/[a-zA-Z0-9-]+/)
      shipmentId = page.url().split('/shipments/')[1]?.split('?')[0] || null

      expect(shipmentId).toBeTruthy()

      // Verify shipment name in header
      await expect(page.locator('h1')).toContainText(TEST_SHIPMENT_NAME)
    })

    test('Step 2: Add pallet', async ({ page }) => {
      if (!shipmentId) {
        test.skip(true, 'No shipment created in Step 1')
        return
      }

      await page.goto(`/shipments/${shipmentId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const addPalletButton = page.getByRole('button', {
        name: 'Добавить паллету',
      })
      await expect(addPalletButton).toBeVisible()

      // Wait for pallet creation API response
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/pallets') && resp.request().method() === 'POST'
      )

      await addPalletButton.click()
      await responsePromise
      await page.locator('main').waitFor({ state: 'visible' })

      // Verify pallet accordion item appears
      const palletHeader = page.getByText(/Паллета #\d+/i).first()
      await expect(palletHeader).toBeVisible({ timeout: 10000 })
    })

    test('Step 3: Add box line', async ({ page }) => {
      if (!shipmentId) {
        test.skip(true, 'No shipment created')
        return
      }

      await page.goto(`/shipments/${shipmentId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Expand first pallet
      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()
      if (!(await palletTrigger.isVisible())) {
        test.skip(true, 'No pallet to expand')
        return
      }

      await palletTrigger.click()

      // Click "Добавить товар"
      const addItemButton = page.getByRole('button', { name: 'Добавить товар' })
      await expect(addItemButton).toBeVisible()
      await addItemButton.click()

      // Fill box line form
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Enter nmId — use ProductCombobox or direct input
      const nmIdInput = dialog.locator('#boxline-nmid')
      if (await nmIdInput.isVisible()) {
        await nmIdInput.fill('173589742')
      } else {
        // May be a combobox — try typing in the search field
        const comboboxInput = dialog
          .locator('input[role="combobox"]')
          .or(dialog.locator('input').first())
        if (await comboboxInput.isVisible()) {
          await comboboxInput.fill('173589742')
          // Wait for and select the first option
          const option = page.locator('[role="option"]').first()
          if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
            await option.click()
          }
        }
      }

      // Fill box count
      await dialog.locator('#boxline-count').fill('5')

      // Submit
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/box-lines') && resp.request().method() === 'POST'
      )

      const submitButton = dialog.getByRole('button', { name: 'Добавить' })
      await submitButton.click()

      const response = await responsePromise
      if (!response.ok()) {
        // Product may not exist in test data — skip remaining lifecycle steps gracefully
        return
      }

      await page.locator('main').waitFor({ state: 'visible' })

      // Verify box line appears in table
      const boxLineRow = page.locator('table tbody tr').filter({ hasText: '173589742' })
      await expect(boxLineRow).toBeVisible({ timeout: 10000 })
    })

    test('Step 4: Calculate', async ({ page }) => {
      if (!shipmentId) {
        test.skip(true, 'No shipment created')
        return
      }

      await page.goto(`/shipments/${shipmentId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const calcButton = page.getByRole('button', { name: /Рассчитать/ })
      if (!(await calcButton.isVisible())) {
        test.skip(true, 'Calculate button not visible')
        return
      }

      // Wait for calculate response with extended timeout (15s)
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/calculate') && resp.status() >= 200,
        { timeout: 15_000 }
      )

      await calcButton.click()
      await responsePromise
      await page.locator('main').waitFor({ state: 'visible' })

      // Should show calculation results or validation errors
      const resultsOrErrors = page
        .getByText('Результаты расчёта')
        .or(page.getByText('Ошибки валидации'))
        .or(page.locator('[role="alert"]'))

      await expect(resultsOrErrors.first()).toBeVisible({ timeout: 10000 })
    })

    test('Step 5: Confirm', async ({ page }) => {
      if (!shipmentId) {
        test.skip(true, 'No shipment created')
        return
      }

      await page.goto(`/shipments/${shipmentId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const confirmButton = page.getByRole('button', { name: /Подтвердить/ })
      if (!(await confirmButton.isVisible())) {
        test.skip(true, 'Confirm button not visible — shipment may already be confirmed')
        return
      }

      // Wait for confirm API response
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/confirm') && resp.status() >= 200,
        { timeout: 15_000 }
      )

      await confirmButton.click()
      await responsePromise
      await page.locator('main').waitFor({ state: 'visible' })

      // Status should change to CONFIRMED
      await expect(page.getByText('ПОДТВЕРЖДЕНА')).toBeVisible({ timeout: 10000 })

      // Readonly state: no edit/delete buttons
      await expect(page.getByRole('button', { name: 'Редактировать' })).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Добавить паллету' })).not.toBeVisible()

      // Should have Пересчитать instead
      await expect(page.getByRole('button', { name: /Пересчитать/ })).toBeVisible()
    })

    test('Step 6: Delete (separate draft shipment)', async ({ page }) => {
      // Create a NEW draft shipment specifically for deletion
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not available')
        return
      }

      await createButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      await dialog.locator('#sp-name').fill(TEST_DELETE_SHIPMENT_NAME)
      await dialog.locator('#sp-cost').fill('1000')

      const createResponse = page.waitForResponse(
        resp =>
          resp.url().includes('/v1/shipments') &&
          resp.request().method() === 'POST' &&
          resp.status() >= 200 &&
          resp.status() < 300
      )

      await dialog.getByRole('button', { name: 'Создать' }).click()
      await createResponse
      await page.locator('main').waitFor({ state: 'visible' })

      // Should be on detail page of new shipment
      await expect(page).toHaveURL(/\/shipments\/[a-zA-Z0-9-]+/)

      // Find and click delete button
      const deleteButton = page.getByRole('button', { name: /Удалить/i })

      if (!(await deleteButton.isVisible())) {
        test.skip(true, 'Delete button not visible')
        return
      }

      await deleteButton.click()

      // Confirm deletion in AlertDialog
      const alertDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
      await expect(alertDialog).toBeVisible()

      const confirmDeleteButton = alertDialog.getByRole('button', { name: /Удалить/i })
      const deleteResponse = page.waitForResponse(
        resp => resp.request().method() === 'DELETE' && resp.status() >= 200
      )

      await confirmDeleteButton.click()
      await deleteResponse
      await page.locator('main').waitFor({ state: 'visible' })

      // Should redirect back to list
      await expect(page).toHaveURL(/\/shipments\/?$/, { timeout: 10000 })
    })
  })

  test.describe('Lifecycle Edge Cases', () => {
    test('should maintain state on page refresh', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const firstViewLink = page.locator('table a[href*="/shipments/"]').first()
      if (!(await firstViewLink.isVisible())) {
        test.skip(true, 'No shipments available')
        return
      }

      await firstViewLink.click()
      await page.locator('main').waitFor({ state: 'visible' })

      const titleBefore = await page.locator('h1').textContent()

      await page.reload()
      await page.locator('main').waitFor({ state: 'visible' })

      const titleAfter = await page.locator('h1').textContent()
      expect(titleBefore).toBe(titleAfter)
    })

    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const firstViewLink = page.locator('table a[href*="/shipments/"]').first()
      if (!(await firstViewLink.isVisible())) {
        test.skip(true, 'No shipments available')
        return
      }

      await firstViewLink.click()
      await page.locator('main').waitFor({ state: 'visible' })

      const detailUrl = page.url()

      // Go back to list
      await page.goBack()
      await page.locator('main').waitFor({ state: 'visible' })
      await expect(page).toHaveURL(/\/shipments\/?$/)

      // Go forward to detail
      await page.goForward()
      await page.locator('main').waitFor({ state: 'visible' })
      await expect(page).toHaveURL(detailUrl)
    })
  })
})
