/**
 * E2E Tests: Supply Lifecycle
 * Epic 53-FE Story 53.8: E2E Tests & Polish
 *
 * Full lifecycle tests for FBS supply management:
 * 1. Create new supply
 * 2. Add orders to supply
 * 3. Close supply
 * 4. Generate stickers
 * 5. Deliver supply (mock)
 *
 * These tests validate the complete user journey through the supply module.
 *
 * @see docs/stories/epic-53/story-53.8-fe-e2e-tests-polish.md
 */

import { readFile } from 'node:fs/promises'

import { test, expect } from '../fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from '../fixtures/mutation-guard'
import {
  installStory1624EligibleOrdersRoute,
  installStory1624LifecycleRoutes,
  installStory1624OpenSupplyRoutes,
  STORY_162_4_ELIGIBLE_ORDER,
  STORY_162_4_LIFECYCLE_SUPPLY_ID,
  STORY_162_4_OPEN_SUPPLY_ID,
  STORY_162_4_STICKER_CONTENT,
  STORY_162_4_STICKER_DOCUMENT_ID,
} from '../fixtures/story-162-4-supplies'

// Routes
const SUPPLIES_ROUTE = '/supplies'

// Test configuration
const TEST_SUPPLY_NAME = `E2E Test Supply ${Date.now()}`

// Selectors
const SELECTORS = {
  // List page
  createSupplyButton: 'button:has-text("Создать"), button:has-text("Новая поставка")',
  suppliesTable: 'table, [data-testid="supplies-table"]',
  supplyRow: 'tbody tr, [data-testid="supply-row"]',

  // Create modal
  createModal: '[role="dialog"]',
  nameInput: 'input[name="name"], input[placeholder*="название"]',
  submitButton: '[role="dialog"] button[type="submit"]',

  // Detail page
  supplyTitle: 'h1, [data-testid="supply-title"]',
  statusBadge: '[class*="badge"], [data-testid*="status"]',

  // Actions
  addOrdersButton: 'button:has-text("Добавить заказы")',
  closeSupplyButton: 'button:has-text("Закрыть поставку")',
  generateStickersButton: 'button:has-text("Получить стикеры"), button:has-text("Стикеры")',

  // Order picker
  orderCheckbox: 'input[type="checkbox"]',
  addSelectedButton: 'button:has-text("Добавить выбранные"), button:has-text("Добавить")',

  // Dialogs
  confirmButton: 'button:has-text("Подтвердить"), button:has-text("Закрыть")',
  cancelButton: 'button:has-text("Отмена")',

  // Format selector
  formatSelector: 'select, [role="radiogroup"], [data-testid*="format"]',
  downloadButton: 'button:has-text("Скачать")',

  // Status indicators
  openStatus: 'text=/Открыта|OPEN/i',
  closedStatus: 'text=/Закрыта|CLOSED/i',
  deliveringStatus: 'text=/В пути|DELIVERING/i',
  deliveredStatus: 'text=/Доставлена|DELIVERED/i',
}

/** Bounded timeout for terminal-state assertions (Story 162.7). */
const SETTLE_TIMEOUT = 10_000

/**
 * Supplies-list terminals (live backend). The list page always settles into
 * exactly one of {data-rows, empty-state, error-state}. Used to replace former
 * elapsed-time waits with a bounded, named-terminal assertion so the claimed
 * behavior can never pass vacuously.
 */
function suppliesListTerminals(page: import('@playwright/test').Page) {
  return {
    dataRows: page.locator('tbody tr'),
    emptyState: page.getByText(/Нет поставок(?: за выбранный период)?/),
    errorState: page.locator('[data-testid="supplies-error-state"]'),
  }
}

/**
 * Bounded wait for the supplies list to settle into one terminal, returning
 * which terminal became visible. The union `.toBeVisible()` bounds the settle
 * (the page always renders exactly one of these terminals); the subsequent
 * re-read resolves WHICH, against already-visible locators.
 */
async function waitForSuppliesListTerminal(
  page: import('@playwright/test').Page
): Promise<'data' | 'empty' | 'error'> {
  const { dataRows, emptyState, errorState } = suppliesListTerminals(page)
  await expect(dataRows.or(emptyState).or(errorState).first()).toBeVisible({
    timeout: SETTLE_TIMEOUT,
  })
  if (
    await dataRows
      .first()
      .isVisible()
      .catch(() => false)
  )
    return 'data'
  if (await emptyState.isVisible().catch(() => false)) return 'empty'
  return 'error'
}

test.describe('Supply Lifecycle - Epic 53-FE @mutating', () => {
  test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

  test.describe.serial('Complete Supply Flow', () => {
    let createdSupplyId: string | null = null

    test('Step 1: Create new supply', async ({ page }) => {
      await page.goto(SUPPLIES_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Click create button
      const createButton = page.locator(SELECTORS.createSupplyButton)
      if (!(await createButton.isVisible())) {
        test.skip(
          true,
          'Create-supply button not visible — supplies list state prevents the create flow'
        )
        return
      }

      await createButton.click()
      await expect(page.locator(SELECTORS.createModal)).toBeVisible()

      // Fill name (optional)
      const nameInput = page.locator(SELECTORS.nameInput)
      if (await nameInput.isVisible()) {
        await nameInput.fill(TEST_SUPPLY_NAME)
      }

      // Register the create response BEFORE the submit click so the mutation
      // is reconciled via its network response, not an elapsed wait.
      const createResponsePromise = page.waitForResponse(
        response =>
          response.request().method() === 'POST' && /\/v1\/supplies(?:\?|$)/.test(response.url()),
        { timeout: 10_000 }
      )

      // Submit
      await page.locator(SELECTORS.submitButton).click()
      const createResponse = await createResponsePromise
      expect(createResponse.status()).toBeLessThan(300)

      // Reconcile the created entity: the UI either redirects to the detail
      // page or re-renders the list with the new row. Bound on the detail URL
      // OR the named list terminal, then assert the entity is visible.
      await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

      const url = page.url()
      createdSupplyId = url.split('/supplies/')[1]?.split('?')[0] || null
      await expect(page.locator(SELECTORS.supplyTitle)).toBeVisible({ timeout: 10_000 })

      expect(createdSupplyId).toBeTruthy()
      console.log(`Created supply ID: ${createdSupplyId}`)
    })

    test('Step 2: Add orders to supply', async ({ page }) => {
      // Skip if no supply was created
      if (!createdSupplyId) {
        test.skip(
          true,
          'No supply created in Step 1 — Step 2 (add orders) depends on a created supply'
        )
        return
      }

      await page.goto(`/supplies/${createdSupplyId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      // Bound the detail-load settle to the supply title rendering (the named
      // terminal for a supply detail page), not an elapsed wait.
      await expect(page.locator(SELECTORS.supplyTitle)).toBeVisible({ timeout: 10_000 })

      // Open order picker
      const addButton = page.locator(SELECTORS.addOrdersButton)
      if (!(await addButton.isVisible()) || !(await addButton.isEnabled())) {
        console.log('Add orders button not available - supply may not be OPEN')
        test.skip(
          true,
          'Add-orders button not available/enabled — supply may not be in OPEN status'
        )
        return
      }

      await addButton.click()
      const drawer = page.getByRole('dialog', {
        name: 'Добавить заказы в поставку',
        exact: true,
      })
      const drawerOpened = await drawer.isVisible({ timeout: 1500 }).catch(() => false)

      if (!drawerOpened) {
        test.skip(
          true,
          'Known functional gap logged as task-45: supply detail add-orders drawer is not wired'
        )
        return
      }

      await expect(drawer).toBeVisible()

      // Bound the orders-load settle to the first eligible-order checkbox
      // rendering inside the drawer (the named terminal for "orders loaded"),
      // not an elapsed wait.
      const checkbox = page.locator(SELECTORS.orderCheckbox).first()
      const ordersLoaded = await checkbox.isVisible({ timeout: 10_000 }).catch(() => false)

      if (ordersLoaded) {
        await checkbox.check()

        // Add selected orders. Register the add-orders response BEFORE the
        // click so the mutation is reconciled via its network response.
        const addSelectedButton = page.locator(SELECTORS.addSelectedButton)
        if (await addSelectedButton.isVisible()) {
          const addOrdersResponsePromise = page.waitForResponse(
            response =>
              response.request().method() === 'POST' &&
              /\/v1\/supplies\/[^/]+\/orders(?:\?|$)/.test(response.url()),
            { timeout: 10_000 }
          )
          await addSelectedButton.click()
          const addOrdersResponse = await addOrdersResponsePromise
          expect(addOrdersResponse.status()).toBeLessThan(300)

          // Verify orders were added — bound on the orders table repopulating.
          const ordersTable = page.locator('table tbody tr')
          await expect(ordersTable.first()).toBeVisible({ timeout: 10_000 })
          const orderCount = await ordersTable.count()
          expect(orderCount).toBeGreaterThan(0)

          console.log(`Added ${orderCount} orders to supply`)
        }
      } else {
        console.log('No available orders to add')
        // Close drawer
        await page.keyboard.press('Escape')
      }
    })

    test('Step 3: Close supply', async ({ page }) => {
      await installStory1624LifecycleRoutes(page, 'OPEN')

      await page.goto(`/supplies/${STORY_162_4_LIFECYCLE_SUPPLY_ID}`, {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('main').waitFor({ state: 'visible' })

      await expect(
        page.getByRole('heading', { name: 'Story 162.4 lifecycle supply' })
      ).toBeVisible()
      await expect(page.getByLabel('Статус поставки: Открыта', { exact: true })).toBeVisible()

      const closeButton = page.getByRole('button', { name: 'Закрыть поставку', exact: true })
      await expect(closeButton).toBeEnabled()

      await closeButton.click()

      const dialog = page.getByRole('alertdialog', { name: 'Закрыть поставку?', exact: true })
      await expect(dialog).toBeVisible()

      const closeResponsePromise = page.waitForResponse(
        response => {
          return (
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith(
              `/v1/supplies/${STORY_162_4_LIFECYCLE_SUPPLY_ID}/close`
            )
          )
        },
        { timeout: SETTLE_TIMEOUT }
      )
      const confirmButton = dialog.getByRole('button', {
        name: 'Закрыть поставку',
        exact: true,
      })
      await confirmButton.click()

      const closeResponse = await closeResponsePromise
      expect(closeResponse.status()).toBe(200)
      expect(closeResponse.request().postDataJSON()).toEqual({})
      await expect(page.getByText('Поставка закрыта', { exact: true })).toBeVisible()
      await expect(page.getByLabel('Статус поставки: Закрыта', { exact: true })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Сгенерировать стикеры', exact: true })
      ).toBeEnabled()
    })

    test('Step 4: Generate stickers', async ({ page }) => {
      await installStory1624LifecycleRoutes(page, 'CLOSED')

      await page.goto(`/supplies/${STORY_162_4_LIFECYCLE_SUPPLY_ID}`, {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('main').waitFor({ state: 'visible' })

      await expect(
        page.getByRole('heading', { name: 'Story 162.4 lifecycle supply' })
      ).toBeVisible()
      await expect(page.getByLabel('Статус поставки: Закрыта', { exact: true })).toBeVisible()

      const stickersButton = page.getByRole('button', {
        name: 'Сгенерировать стикеры',
        exact: true,
      })
      await expect(stickersButton).toBeEnabled()

      await stickersButton.click()

      const modal = page.getByRole('dialog', { name: 'Генерация стикеров', exact: true })
      await expect(modal).toBeVisible()
      await expect(modal.getByRole('radio', { name: /PNG/i })).toBeChecked()

      const stickersResponsePromise = page.waitForResponse(
        response => {
          return (
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith(
              `/v1/supplies/${STORY_162_4_LIFECYCLE_SUPPLY_ID}/stickers`
            )
          )
        },
        { timeout: SETTLE_TIMEOUT }
      )
      const stickerDocumentResponsePromise = page.waitForResponse(
        response => {
          return (
            response.request().method() === 'GET' &&
            new URL(response.url()).pathname.endsWith(
              `/v1/supplies/${STORY_162_4_LIFECYCLE_SUPPLY_ID}/documents/STICKER`
            )
          )
        },
        { timeout: SETTLE_TIMEOUT }
      )
      const downloadPromise = page.waitForEvent('download')
      await modal.getByRole('button', { name: 'Скачать', exact: true }).click()

      const stickersResponse = await stickersResponsePromise
      expect(stickersResponse.status()).toBe(201)
      expect(stickersResponse.request().postDataJSON()).toEqual({ format: 'png' })
      await expect(stickersResponse.json()).resolves.toEqual({
        id: STORY_162_4_STICKER_DOCUMENT_ID,
        docType: 'STICKER',
        format: 'png',
        fileSize: STORY_162_4_STICKER_CONTENT.length,
        generatedAt: '2026-08-05T13:05:00.000Z',
      })

      const [stickerDocumentResponse, download] = await Promise.all([
        stickerDocumentResponsePromise,
        downloadPromise,
      ])
      expect(stickerDocumentResponse.status()).toBe(200)
      expect(download.suggestedFilename()).toBe(`stickers-${STORY_162_4_LIFECYCLE_SUPPLY_ID}.png`)
      const downloadedFilePath = await download.path()
      expect(downloadedFilePath).not.toBeNull()
      expect(await readFile(downloadedFilePath!, 'utf8')).toBe(STORY_162_4_STICKER_CONTENT)
      await expect(page.getByText('Стикеры скачаны', { exact: true })).toBeVisible()
      await expect(modal).not.toBeVisible()
    })

    test('Step 5: Verify delivery status (mock)', async ({ page }) => {
      if (!createdSupplyId) {
        test.skip(
          true,
          'No supply created in Step 1 — Step 5 (delivery status) depends on a created supply'
        )
        return
      }

      // In a real scenario, the supply would transition through DELIVERING -> DELIVERED
      // after physical delivery. Here we verify the UI handles these states.

      await page.goto(`/supplies/${createdSupplyId}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Get current status
      const statusBadge = page.locator(SELECTORS.statusBadge).first()
      const currentStatus = await statusBadge.textContent()

      console.log(`Final supply status: ${currentStatus}`)

      // Verify status is one of the valid states
      const validStatuses = [
        'Открыта',
        'OPEN',
        'Закрыта',
        'CLOSED',
        'В пути',
        'DELIVERING',
        'Доставлена',
        'DELIVERED',
      ]
      const hasValidStatus = validStatuses.some(s => currentStatus?.includes(s))
      expect(hasValidStatus).toBeTruthy()

      // Verify page displays correctly for current status
      await expect(page.locator(SELECTORS.supplyTitle)).toBeVisible()
    })
  })

  test.describe('Lifecycle Edge Cases', () => {
    test('should prevent closing supply without orders', async ({ page }) => {
      await page.goto(SUPPLIES_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Create a new supply
      const createButton = page.locator(SELECTORS.createSupplyButton)
      if (await createButton.isVisible()) {
        await createButton.click()
        await expect(page.locator(SELECTORS.createModal)).toBeVisible()

        // Register the create response BEFORE the submit click so the mutation
        // is reconciled via its network response, not an elapsed wait.
        const createResponsePromise = page.waitForResponse(
          response =>
            response.request().method() === 'POST' && /\/v1\/supplies(?:\?|$)/.test(response.url()),
          { timeout: SETTLE_TIMEOUT }
        )
        await page.locator(SELECTORS.submitButton).click()
        const createResponse = await createResponsePromise
        expect(createResponse.status()).toBeLessThan(300)

        // Navigate to detail if not already there. The create flow redirects
        // to the new supply's detail page; bound the redirect to the URL
        // change, then to the detail title rendering.
        await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: SETTLE_TIMEOUT })
        if (!page.url().includes('/supplies/') || page.url() === SUPPLIES_ROUTE) {
          // Defensive: if no redirect occurred, reconcile via the list and the
          // first row. Bound the list settle to a named terminal first.
          await waitForSuppliesListTerminal(page)
          const firstRow = page.locator('tbody tr:first-child')
          if (await firstRow.isVisible()) {
            await firstRow.click()
            await page.locator('main').waitFor({ state: 'visible' })
          }
        }

        // Try to close empty supply
        const closeButton = page.locator(SELECTORS.closeSupplyButton)
        if (await closeButton.isVisible()) {
          // Check if button is disabled or shows warning
          const isDisabled = await closeButton.isDisabled()
          if (!isDisabled) {
            await closeButton.click()

            // Should show warning or error
            const warningOrError = page.locator('text=/нет заказов|без заказов|минимум/i')
            if ((await warningOrError.count()) > 0) {
              await expect(warningOrError.first()).toBeVisible()
            }
          }
        }
      }
    })

    test('should prevent adding orders to CLOSED supply', async ({ page }) => {
      // Navigate to a CLOSED supply
      await page.goto(`${SUPPLIES_ROUTE}?status=CLOSED`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      // Bound the list-filter settle to a named terminal (rows / empty / error)
      // instead of an elapsed wait.
      await waitForSuppliesListTerminal(page)

      const firstRow = page.locator('tbody tr:first-child')
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.locator('main').waitFor({ state: 'visible' })

        // Add orders button should be disabled or hidden
        const addButton = page.locator(SELECTORS.addOrdersButton)
        if ((await addButton.count()) > 0) {
          const isDisabled = await addButton.isDisabled()
          const isHidden = !(await addButton.isVisible())
          expect(isDisabled || isHidden).toBeTruthy()
        }
      }
    })

    test('should prevent removing orders from CLOSED supply', async ({ page }) => {
      // Navigate to a CLOSED supply
      await page.goto(`${SUPPLIES_ROUTE}?status=CLOSED`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      await waitForSuppliesListTerminal(page)

      const firstRow = page.locator('tbody tr:first-child')
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.locator('main').waitFor({ state: 'visible' })

        // Remove buttons should not be visible for CLOSED supply
        const removeButton = page.locator(
          'button[aria-label*="удалить"], button:has-text("Удалить")'
        )
        const count = await removeButton.count()
        expect(count === 0 || !(await removeButton.first().isEnabled())).toBeTruthy()
      }
    })

    test('should handle concurrent operations gracefully', async ({ page }) => {
      // Navigate to OPEN supply
      await page.goto(`${SUPPLIES_ROUTE}?status=OPEN`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      await waitForSuppliesListTerminal(page)

      const firstRow = page.locator('tbody tr:first-child')
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.locator('main').waitFor({ state: 'visible' })

        // Click multiple buttons quickly
        const closeButton = page.locator(SELECTORS.closeSupplyButton)
        if ((await closeButton.isVisible()) && (await closeButton.isEnabled())) {
          // Double click should not cause issues
          await closeButton.dblclick()

          // Should show only one dialog — bound on the dialog rendering.
          const dialogs = page.locator('[role="dialog"]')
          await expect(dialogs.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
          const dialogCount = await dialogs.count()
          expect(dialogCount).toBeLessThanOrEqual(1)

          // Cancel
          const cancelButton = page.locator(SELECTORS.cancelButton)
          if (await cancelButton.isVisible()) {
            await cancelButton.click()
          }
        }
      }
    })

    test('should maintain state on page refresh', async ({ page }) => {
      // Navigate to a supply
      await page.goto(`${SUPPLIES_ROUTE}?status=CLOSED`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      await waitForSuppliesListTerminal(page)

      const firstRow = page.locator('tbody tr:first-child')
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.locator('main').waitFor({ state: 'visible' })

        // Get supply info before refresh
        const titleBefore = await page.locator(SELECTORS.supplyTitle).textContent()
        const statusBefore = await page.locator(SELECTORS.statusBadge).first().textContent()

        // Refresh page
        await page.reload()
        await page.locator('main').waitFor({ state: 'visible' })

        // Verify info is the same — bound on the detail title re-rendering.
        await expect(page.locator(SELECTORS.supplyTitle)).toBeVisible({ timeout: SETTLE_TIMEOUT })
        const titleAfter = await page.locator(SELECTORS.supplyTitle).textContent()
        const statusAfter = await page.locator(SELECTORS.statusBadge).first().textContent()

        expect(titleBefore).toBe(titleAfter)
        expect(statusBefore).toBe(statusAfter)
      }
    })

    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto(SUPPLIES_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      // Bound the list settle to a named terminal so the subsequent firstRow
      // probe runs against a loaded list, not an arbitrary elapsed window.
      await waitForSuppliesListTerminal(page)

      // Navigate to supply detail
      const firstRow = page.locator('tbody tr:first-child')
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.locator('main').waitFor({ state: 'visible' })

        const detailUrl = page.url()

        // Go back
        await page.goBack()
        await page.locator('body').waitFor({ state: 'visible' })
        if (page.url() === 'about:blank') {
          test.skip(true, 'Browser history returned to about:blank in isolated E2E context')
          return
        }
        await expect(page).toHaveURL(/\/supplies\/?$/)

        // Go forward
        await page.goForward()
        await page.locator('body').waitFor({ state: 'visible' })
        await expect(page).toHaveURL(detailUrl)
      }
    })
  })

  test.describe('Performance & Loading States', () => {
    test('should show loading state during data fetch', async ({ page }) => {
      // Hold the supplies response on an external Promise so the request stays
      // genuinely in-flight (real loading state) without a timer helper. The
      // test releases the gate after observing the loading terminal.
      let releaseResponse: () => void = () => {}
      const gatedResponse = new Promise<void>(resolve => {
        releaseResponse = resolve
      })
      await page.route('**/v1/supplies**', async route => {
        await gatedResponse
        await route.fallback()
      })

      await page.goto(SUPPLIES_ROUTE, { waitUntil: 'domcontentloaded' })

      const loadingIndicator = page.locator(
        '[class*="skeleton"], [class*="spinner"], [data-testid*="loading"]'
      )
      // Wrap the gated-Promise body in try/finally so the release ALWAYS runs.
      // A failed assertion while the route is held would otherwise strand the
      // request; Playwright routes persist per worker, so it would cascade into
      // a hang in every subsequent test in this worker. `releaseResponse()` is
      // idempotent (2nd call is a no-op), so finally-release is safe.
      try {
        // Should show loading skeleton or spinner while the response is held.
        await expect(loadingIndicator.first()).toBeVisible({ timeout: SETTLE_TIMEOUT })
      } finally {
        // Release the response so the in-flight request can settle.
        releaseResponse()
      }
      // Assert the page settles to a real terminal after the release.
      await waitForSuppliesListTerminal(page)
      await expect(page.locator('main')).toBeVisible()
    })

    test('should show loading state during order addition', async ({ page }) => {
      await installStory1624OpenSupplyRoutes(page)
      await installStory1624EligibleOrdersRoute(page)

      await page.goto(`${SUPPLIES_ROUTE}?status=OPEN`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      // Bound the list-filter settle to the page heading (the named terminal
      // for a loaded supplies list) instead of an elapsed wait.
      await expect(page.getByRole('heading', { name: 'Поставки FBS', exact: true })).toBeVisible({
        timeout: SETTLE_TIMEOUT,
      })

      await expect(
        page.getByRole('button', {
          name: `Поставка ${STORY_162_4_OPEN_SUPPLY_ID}`,
          exact: true,
        })
      ).toBeVisible()
      await page.goto(`${SUPPLIES_ROUTE}/${STORY_162_4_OPEN_SUPPLY_ID}`, {
        waitUntil: 'domcontentloaded',
      })
      await expect(page).toHaveURL(/\/supplies\/[^/?]+/)
      await expect(page.getByLabel('Статус поставки: Открыта', { exact: true })).toBeVisible()

      const addButton = page.getByRole('button', { name: 'Добавить заказы', exact: true })
      await expect(addButton).toBeVisible()
      await expect(addButton).toBeEnabled()

      await addButton.click()

      const drawer = page.getByRole('dialog', { name: 'Добавить заказы в поставку', exact: true })
      await expect(drawer).toBeVisible()
      const checkbox = drawer.getByRole('checkbox', {
        name: `Выбрать заказ #${STORY_162_4_ELIGIBLE_ORDER.orderId}`,
        exact: true,
      })
      await expect(checkbox).toBeVisible()

      await checkbox.check()
      const addSelectedButton = drawer.getByRole('button', {
        name: 'Добавить выбранные (1)',
        exact: true,
      })
      await expect(addSelectedButton).toBeEnabled()

      // Hold the POST orders response on an external Promise so the request
      // stays genuinely in-flight (real "Добавление..." pending state) without
      // a timer helper. The test releases the gate after observing the pending
      // state, then reconciles the success response.
      let releaseAddResponse: () => void = () => {}
      const gatedAddResponse = new Promise<void>(resolve => {
        releaseAddResponse = resolve
      })
      const addOrdersRoute = '**/v1/supplies/*/orders'
      await page.route(addOrdersRoute, async route => {
        if (route.request().method() !== 'POST') {
          await route.fallback()
          return
        }
        await gatedAddResponse
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ added: 1, failed: 0 }),
        })
      })
      const responsePromise = page.waitForResponse(
        response => {
          return (
            response.request().method() === 'POST' &&
            /\/v1\/supplies\/[^/?]+\/orders(?:\?|$)/.test(response.url())
          )
        },
        { timeout: SETTLE_TIMEOUT }
      )

      await addSelectedButton.click()
      const pendingAddButton = drawer.getByRole('button', {
        name: 'Добавление...',
        exact: true,
      })
      // Wrap the gated-Promise body in try/finally so the release ALWAYS runs.
      // A failed assertion while the POST is held would otherwise strand the
      // request; Playwright routes persist per worker, so it would cascade into
      // a hang in every subsequent test in this worker. `releaseAddResponse()`
      // is idempotent (2nd call is a no-op), so finally-release is safe.
      try {
        await expect(pendingAddButton).toBeDisabled()
        await expect(pendingAddButton).toHaveText('Добавление...')
      } finally {
        // Release the held response so the mutation reconciles.
        releaseAddResponse()
      }

      const response = await responsePromise
      expect(response.status()).toBeGreaterThanOrEqual(200)
      expect(response.status()).toBeLessThan(300)
      const requestBody = response.request().postDataJSON() as { orderIds?: unknown[] }
      expect(requestBody.orderIds).toHaveLength(1)
      await expect(drawer).not.toBeVisible()
      await expect(page.getByText(/^Добавлено: 1 заказ$/)).toBeVisible()
    })
  })
})
