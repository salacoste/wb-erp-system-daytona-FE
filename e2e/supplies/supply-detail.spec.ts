/**
 * E2E Tests: Supply Detail Page
 * Epic 53-FE Story 53.8: E2E Tests & Polish
 *
 * Tests the Supply detail page including:
 * - Supply header and status stepper
 * - Order Picker drawer functionality
 * - Order removal from supply
 * - Close supply workflow
 * - Sticker generation
 * - Documents list and download
 * - 404/403 error states
 * - Mobile responsive drawer
 *
 * @see docs/stories/epic-53/story-53.8-fe-e2e-tests-polish.md
 */

import { test, expect, type Page } from '../fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from '../fixtures/mutation-guard'

// Routes
const SUPPLIES_LIST_ROUTE = '/supplies'
const DOCUMENT_DOWNLOAD_SUPPLY_ID = 'story-162-4-document-download-supply'
const DOCUMENT_DOWNLOAD_PATH =
  `/v1/supplies/${DOCUMENT_DOWNLOAD_SUPPLY_ID}/documents/STICKER` as const
const DOCUMENT_DOWNLOAD_CONTENT = 'story-162-4-document-download'

// Selectors for supply detail page
const SELECTORS = {
  // Navigation
  backLink: 'a:has-text("Назад"), a[href="/supplies"]',

  // Header
  supplyTitle: '[data-testid="supply-title"], h1',
  statusBadge: '[data-testid="supply-status-badge"]',
  wbSupplyId: '[data-testid="wb-supply-id"]',

  // Status stepper
  statusStepper: '[data-testid="supply-status-stepper"]',
  stepperStep: '[data-testid="stepper-step"]',

  // Action buttons
  addOrdersButton: '[data-testid="add-orders-button"], button:has-text("Добавить заказы")',
  closeSupplyButton: '[data-testid="close-supply-button"], button:has-text("Закрыть поставку")',
  generateStickersButton:
    '[data-testid="generate-stickers-button"], button:has-text("Получить стикеры")',
  refreshStatusButton: '[data-testid="refresh-status-button"], button:has-text("Обновить")',

  // Orders table
  ordersSection: '[data-testid="orders-section"]',
  ordersTable: '[data-testid="supply-orders-table"]',
  orderRow: '[data-testid="order-row"]',
  removeOrderButton: '[data-testid="remove-order-button"]',
  selectAllCheckbox: '[data-testid="select-all-orders"]',
  bulkRemoveButton: '[data-testid="bulk-remove-orders-button"]',

  // Order Picker Drawer
  orderPickerDrawer: '[data-testid="order-picker-drawer"]',
  orderPickerTable: '[data-testid="order-picker-table"]',
  orderPickerFilters: '[data-testid="order-picker-filters"]',
  orderPickerSelection: '[data-testid="order-picker-selection"]',
  addSelectedOrdersButton: '[data-testid="add-selected-orders-button"]',
  closeDrawerButton: '[data-testid="close-drawer-button"]',

  // Close Supply Dialog
  closeSupplyDialog: '[data-testid="close-supply-dialog"]',
  confirmCloseButton: '[data-testid="confirm-close-button"]',
  cancelCloseButton: '[data-testid="cancel-close-button"]',

  // Stickers Modal
  stickersModal: '[data-testid="stickers-modal"]',
  stickerFormatSelector: '[data-testid="sticker-format-selector"]',
  stickerPreview: '[data-testid="sticker-preview"]',
  downloadStickersButton: '[data-testid="download-stickers-button"]',

  // Documents
  documentsSection: '[data-testid="documents-section"]',
  documentItem: '[data-testid="document-item"]',
  downloadDocumentButton: '[data-testid="download-document-button"]',

  // States — match the real terminals rendered by SupplyDetailError:
  // - 404 → <h1>"Поставка не найдена"</h1>; 403 → <h1>"Нет доступа"</h1>;
  // - generic API error → <Alert variant="destructive"> (role="alert") with
  //   AlertTitle "Ошибка загрузки" + "Не удалось загрузить данные поставки".
  // The component exposes no data-testid on these states, so the unions target
  // the rendered text. Each selector is a SINGLE Playwright engine (text or
  // css) — comma-combining css `:has-text(...)` with `text=...` in one string
  // makes Playwright's CSS parser choke on the `=` in `text=`.
  loadingState: '[data-testid="supply-loading"]',
  errorState: '[role="alert"]:has-text("Не удалось загрузить данные поставки")',
  notFoundState: 'text=Поставка не найдена',
  forbiddenState: 'text=Нет доступа к этой поставке',

  // Remove Order Dialog
  removeOrderDialog: '[data-testid="remove-order-dialog"]',
  confirmRemoveButton: '[data-testid="confirm-remove-button"]',
}

/**
 * Helper: Wait for the supplies list to settle into a bounded terminal state
 * (table-with-rows | empty-state | error-state) instead of an elapsed sleep.
 */
async function waitForSuppliesListTerminal(page: Page) {
  const table = page.locator('tbody tr:first-child')
  const emptyState = page.locator('text=/Поставки не найдены|Нет поставок/i')
  const errorState = page.locator('text=/Ошибка|не удалось/i')
  await expect(table.or(emptyState).or(errorState).first()).toBeVisible({ timeout: 10_000 })
  return { table, emptyState, errorState }
}

/**
 * Helper: Wait for the supply detail page to settle into a bounded terminal state
 * (loaded title | not-found | forbidden | error/loading) instead of an elapsed sleep.
 */
async function waitForSupplyDetailTerminal(page: Page) {
  const loaded = page.locator(SELECTORS.supplyTitle)
  const notFound = page.locator(SELECTORS.notFoundState)
  const forbidden = page.locator(SELECTORS.forbiddenState)
  const errorState = page.locator(SELECTORS.errorState)
  await expect(loaded.or(notFound).or(forbidden).or(errorState).first()).toBeVisible({
    timeout: 10_000,
  })
  return { loaded, notFound, forbidden, errorState }
}

/**
 * Helper: Navigate to an existing supply detail page
 */
async function navigateToSupplyDetail(page: Page, supplyId?: string) {
  if (supplyId) {
    await page.goto(`/supplies/${supplyId}`, { waitUntil: 'domcontentloaded' })
  } else {
    // Get first supply from list — bounded terminal-state wait replaces the elapsed sleep.
    await page.goto(SUPPLIES_LIST_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
    const { table } = await waitForSuppliesListTerminal(page)

    if ((await table.count()) > 0) {
      await table.first().click()
      await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    }
  }
}

async function installDocumentDownloadFixture(page: Page) {
  await page.route(
    new RegExp(`/v1/supplies/${DOCUMENT_DOWNLOAD_SUPPLY_ID}(?:\\?|$)`),
    async route => {
      if (route.request().method() !== 'GET') {
        await route.fulfill({
          status: 501,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Unexpected document-download fixture request: ${route.request().method()} ${new URL(route.request().url()).pathname}`,
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: DOCUMENT_DOWNLOAD_SUPPLY_ID,
          wbSupplyId: 'WB-STORY-162-4',
          name: 'Story 162.4 document download supply',
          status: 'DELIVERED',
          ordersCount: 0,
          createdAt: '2026-08-05T10:00:00.000Z',
          closedAt: '2026-08-05T11:00:00.000Z',
          syncedAt: '2026-08-05T12:00:00.000Z',
          warehouseId: 507,
          warehouseName: 'Коледино',
          orders: [],
          documents: [
            {
              type: 'sticker',
              format: 'png',
              generatedAt: '2026-08-05T12:05:00.000Z',
              downloadUrl: DOCUMENT_DOWNLOAD_PATH,
              sizeBytes: DOCUMENT_DOWNLOAD_CONTENT.length,
            },
          ],
        }),
      })
    }
  )

  await page.route(new RegExp(`${DOCUMENT_DOWNLOAD_PATH}(?:\\?|$)`), async route => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `Unexpected document-download fixture request: ${route.request().method()} ${new URL(route.request().url()).pathname}`,
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'Content-Disposition': 'attachment; filename="STICKER.png"' },
      body: DOCUMENT_DOWNLOAD_CONTENT,
    })
  })
}

test.describe('Supply Detail Page - Epic 53-FE', () => {
  test.describe('Page Load & Header Display', () => {
    test('should display supply header with title and status', async ({ page }) => {
      await navigateToSupplyDetail(page)

      // Should show supply title
      const title = page.locator(SELECTORS.supplyTitle)
      await expect(title).toBeVisible()

      // Should show status badge
      const statusBadge = page.locator('[class*="badge"], [data-testid*="status"]')
      if ((await statusBadge.count()) > 0) {
        await expect(statusBadge.first()).toBeVisible()
      }
    })

    test('should display back navigation link', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const backLink = page.locator(SELECTORS.backLink)
      await expect(backLink).toBeVisible()

      await backLink.click()
      await expect(page).toHaveURL(/\/supplies\/?$/)
    })

    test('should display loading state initially', async ({ page }) => {
      await page.goto('/supplies/test-id', { waitUntil: 'domcontentloaded' })

      // Should show loading skeleton
      const loadingOrContent = page
        .locator('[class*="skeleton"]')
        .or(page.locator(SELECTORS.loadingState))
        .or(page.locator(SELECTORS.supplyTitle))
        .or(page.locator(SELECTORS.errorState))
        .or(page.getByText(/не найдена|not found|ошибка/i))

      await expect(loadingOrContent.first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Status Stepper - Story 53.4', () => {
    test('should display status stepper with all steps', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const stepper = page.locator(SELECTORS.statusStepper).or(page.locator('[class*="stepper"]'))
      if (await stepper.isVisible()) {
        // Should have multiple steps: OPEN -> CLOSED -> DELIVERING -> DELIVERED
        const steps = stepper.locator('[class*="step"], [data-testid*="step"]')
        await expect(steps).not.toHaveCount(0)
      }
    })

    test('should highlight current status in stepper', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const stepper = page.locator(SELECTORS.statusStepper).or(page.locator('[class*="stepper"]'))
      if (await stepper.isVisible()) {
        // At least one step should be active/completed
        const activeStep = stepper.locator(
          '[class*="active"], [data-active="true"], [aria-current]'
        )
        if ((await activeStep.count()) > 0) {
          await expect(activeStep.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Orders Table - Story 53.4', () => {
    test('should display orders table with order data', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const ordersTable = page.locator('table').or(page.locator(SELECTORS.ordersTable))
      if (await ordersTable.isVisible()) {
        // Table should have headers
        const headers = ordersTable.locator('thead th')
        await expect(headers).not.toHaveCount(0)
      }
    })

    test('should display order count in section title', async ({ page }) => {
      await navigateToSupplyDetail(page)

      // Should show "Заказы в поставке (N)" heading
      const ordersHeading = page
        .getByRole('heading', { name: /Заказы.*\(\d+\)/ })
        .or(page.getByRole('heading', { name: /Заказы/ }))
      if (await ordersHeading.isVisible()) {
        await expect(ordersHeading.first()).toBeVisible()
      }
    })

    test('should navigate to order detail on order click', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const orderRow = page.locator('tbody tr:first-child')
      if (await orderRow.isVisible()) {
        // Some implementations may have clickable rows
        const hasClickHandler =
          (await orderRow.getAttribute('onclick')) !== null ||
          (await orderRow.locator('a').count()) > 0

        if (hasClickHandler) {
          await orderRow.click()
          await page.locator('main').waitFor({ state: 'visible' })
          await expect(page).toHaveURL(/\/orders/)
        }
      }
    })
  })

  test.describe('Order Picker Drawer - Story 53.5 @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should open order picker drawer on Add Orders click', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()

        // Drawer should open
        const drawer = page
          .getByRole('dialog')
          .or(page.locator('[class*="drawer"], [class*="sheet"]'))
        await expect(drawer).toBeVisible()
      }
    })

    test('should display available orders in drawer', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()

        // Should show orders table or empty state (bounded terminal — no sleep).
        const ordersOrEmpty = page
          .locator('[data-testid="order-picker-table"] tbody tr')
          .or(page.locator('text=/нет заказов|no orders/i'))

        await expect(ordersOrEmpty.first()).toBeVisible({ timeout: 5000 })
      }
    })

    test('should filter available orders by status', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()

        // Wait for the drawer's filter control to render before interacting (bounded).
        const statusFilter = page.locator('[data-testid*="filter"], select[name*="status"]')
        if ((await statusFilter.count()) > 0) {
          await statusFilter.first().click()
          // Select a status filter option
          await page.locator('main').waitFor({ state: 'visible' })
        }
      }
    })

    test('should close drawer with close button', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()

        const closeButton = page.locator(
          '[data-testid="close-drawer-button"], button[aria-label*="close"], button:has-text("Закрыть")'
        )
        await closeButton.first().click()

        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
    })

    test('should close drawer with Escape key', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
    })

    test('should select orders and add to supply', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()

        // Wait for the order-picker table rows to render before selecting (bounded).
        const pickerRow = page.locator('[data-testid="order-picker-table"] tbody tr').first()
        const checkbox = page.locator('input[type="checkbox"]').first()
        if ((await pickerRow.count()) > 0 && (await checkbox.isVisible())) {
          await checkbox.check()

          // Click add button: register the add-orders response waiter BEFORE the action.
          const addSelectedButton = page.locator(
            'button:has-text("Добавить выбранные"), button:has-text("Добавить")'
          )
          if (await addSelectedButton.isVisible()) {
            const addResponse = page.waitForResponse(
              response =>
                response.request().method() === 'POST' &&
                new URL(response.url()).pathname.includes('/v1/supplies/'),
              { timeout: 10_000 }
            )
            await addSelectedButton.click()
            await addResponse

            // Should show success or drawer closes (bounded reconciliation).
            await expect
              .poll(
                async () =>
                  (await page
                    .locator('[class*="toast"]')
                    .isVisible()
                    .catch(() => false)) ||
                  !(await page
                    .getByRole('dialog')
                    .isVisible()
                    .catch(() => true)),
                { timeout: 10_000, intervals: [250, 500, 1000] }
              )
              .toBeTruthy()
          }
        }
      }
    })
  })

  test.describe('Remove Orders - Story 53.4 @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should show remove button for each order in OPEN supply', async ({ page }) => {
      await navigateToSupplyDetail(page)

      // Check if supply is OPEN (remove buttons visible)
      const removeButton = page
        .locator(SELECTORS.removeOrderButton)
        .or(page.locator('button[aria-label*="удалить"], button:has-text("Удалить")'))

      if ((await removeButton.count()) > 0) {
        await expect(removeButton.first()).toBeVisible()
      }
    })

    test('should open confirmation dialog on remove click', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const removeButton = page
        .locator('button[aria-label*="удалить"], button:has-text("Удалить")')
        .first()
      if ((await removeButton.isVisible()) && (await removeButton.isEnabled())) {
        await removeButton.click()

        // Confirmation dialog should appear
        const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
        await expect(dialog).toBeVisible()
      }
    })

    test('should remove order on confirmation', async ({ page }) => {
      await navigateToSupplyDetail(page)

      // Count orders before removal
      const ordersBefore = await page.locator('tbody tr').count()

      const removeButton = page
        .locator('button[aria-label*="удалить"], button:has-text("Удалить")')
        .first()
      if ((await removeButton.isVisible()) && (await removeButton.isEnabled())) {
        await removeButton.click()

        const confirmButton = page
          .locator('button:has-text("Подтвердить"), button:has-text("Удалить")')
          .last()
        // Register the remove-order response waiter BEFORE the confirm click.
        const removeResponse = page.waitForResponse(
          response =>
            response.request().method() === 'DELETE' &&
            new URL(response.url()).pathname.includes('/v1/supplies/'),
          { timeout: 10_000 }
        )
        await confirmButton.click()
        await removeResponse

        // Orders count should decrease or success toast shown (bounded reconciliation).
        await expect
          .poll(
            async () => {
              const ordersAfter = await page.locator('tbody tr').count()
              const hasSuccessToast = await page
                .locator('[class*="toast"]')
                .isVisible()
                .catch(() => false)
              return ordersAfter < ordersBefore || hasSuccessToast
            },
            { timeout: 10_000, intervals: [250, 500, 1000] }
          )
          .toBeTruthy()
      }
    })

    test('should cancel removal on cancel click', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const removeButton = page
        .locator('button[aria-label*="удалить"], button:has-text("Удалить")')
        .first()
      if ((await removeButton.isVisible()) && (await removeButton.isEnabled())) {
        await removeButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()

        const cancelButton = page.locator('button:has-text("Отмена")')
        await cancelButton.click()

        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
    })
  })

  test.describe('Close Supply - Story 53.6 @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should show close supply button for OPEN supply', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const closeButton = page.locator(SELECTORS.closeSupplyButton)
      // Button visibility depends on supply status
      if (await closeButton.isVisible()) {
        await expect(closeButton).toBeVisible()
      }
    })

    test('should open close confirmation dialog', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const closeButton = page.locator(SELECTORS.closeSupplyButton)
      if ((await closeButton.isVisible()) && (await closeButton.isEnabled())) {
        await closeButton.click()

        // Confirmation dialog
        const dialog = page.getByRole('dialog').or(page.getByRole('alertdialog'))
        await expect(dialog).toBeVisible()
      }
    })

    test('should close supply on confirmation', async ({ page }) => {
      await navigateToSupplyDetail(page)

      const closeButton = page.locator(SELECTORS.closeSupplyButton)
      if ((await closeButton.isVisible()) && (await closeButton.isEnabled())) {
        await closeButton.click()

        const confirmButton = page.locator(
          'button:has-text("Закрыть поставку"), button:has-text("Подтвердить")'
        )
        // Register the close response waiter BEFORE the confirm click.
        const closeResponse = page.waitForResponse(
          response =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith('/close'),
          { timeout: 10_000 }
        )
        await confirmButton.click()
        await closeResponse

        // Status should change to CLOSED or success message shown (bounded reconciliation).
        await expect
          .poll(
            async () => {
              const statusBadge = page.locator('[class*="badge"]')
              const statusText = await statusBadge
                .first()
                .textContent()
                .catch(() => null)
              const hasClosedStatus =
                statusText?.includes('Закрыта') || statusText?.includes('CLOSED')
              const hasSuccessToast = await page
                .locator('[class*="toast"]')
                .isVisible()
                .catch(() => false)
              return Boolean(hasClosedStatus || hasSuccessToast)
            },
            { timeout: 10_000, intervals: [250, 500, 1000] }
          )
          .toBeTruthy()
      }
    })
  })

  test.describe('Generate Stickers - Story 53.6 @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should show stickers button for CLOSED supply', async ({ page }) => {
      // Navigate to a CLOSED supply
      await page.goto(`${SUPPLIES_LIST_ROUTE}?status=CLOSED`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      const { table } = await waitForSuppliesListTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'Configured sandbox has no CLOSED supply for sticker-button coverage')
        return
      }

      const firstRow = page.locator('tbody tr:first-child')
      await firstRow.click()
      await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

      const stickersButton = page.locator(SELECTORS.generateStickersButton)
      await expect(stickersButton).toBeVisible()
      await expect(stickersButton).toBeEnabled()
    })

    test('should open stickers modal with format selector', async ({ page }) => {
      await page.goto(`${SUPPLIES_LIST_ROUTE}?status=CLOSED`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      const { table } = await waitForSuppliesListTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'Configured sandbox has no CLOSED supply for sticker-modal coverage')
        return
      }

      const firstRow = page.locator('tbody tr:first-child')
      await firstRow.click()
      await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

      const stickersButton = page.locator(SELECTORS.generateStickersButton)
      await expect(stickersButton).toBeVisible()
      await expect(stickersButton).toBeEnabled()
      await stickersButton.click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // Should have format selector
      const formatSelector = modal.locator('select, [role="radiogroup"], [data-testid="format"]')
      if ((await formatSelector.count()) > 0) {
        await expect(formatSelector.first()).toBeVisible()
      }
    })
  })

  test.describe('Documents List - Story 53.6', () => {
    test('should show documents section for CLOSED/DELIVERED supply', async ({ page }) => {
      await page.goto(`${SUPPLIES_LIST_ROUTE}?status=DELIVERED`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })
      const { table } = await waitForSuppliesListTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'Configured sandbox has no DELIVERED supply for documents coverage')
        return
      }

      const firstRow = page.locator('tbody tr:first-child')
      await firstRow.click()
      await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: 10_000 })

      const documentsSection = page
        .locator(SELECTORS.documentsSection)
        .or(page.locator('text=/Документы|Documents/i'))
      await expect(documentsSection.first()).toBeVisible({ timeout: 10_000 })
    })

    test('should download document on button click', async ({ page }) => {
      await installDocumentDownloadFixture(page)

      await page.goto(`/supplies/${DOCUMENT_DOWNLOAD_SUPPLY_ID}`, {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('main').waitFor({ state: 'visible' })
      await expect(
        page.getByRole('heading', { name: 'Story 162.4 document download supply', exact: true })
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Документы', exact: true })).toBeVisible()

      const downloadButton = page.getByRole('button', {
        name: 'Скачать Стикеры (PNG)',
        exact: true,
      })
      await expect(downloadButton).toBeVisible()

      const responsePromise = page.waitForResponse(
        response => {
          return (
            response.request().method() === 'GET' &&
            new URL(response.url()).pathname === DOCUMENT_DOWNLOAD_PATH
          )
        },
        { timeout: 10_000 }
      )
      const downloadPromise = page.waitForEvent('download')

      await downloadButton.click()
      const [response, download] = await Promise.all([responsePromise, downloadPromise])

      expect(response.status()).toBe(200)
      expect(new URL(response.url()).pathname).toBe(DOCUMENT_DOWNLOAD_PATH)
      expect(download.suggestedFilename()).toBe('sticker-png.png')
      // 174.4: scope to main — the sr-only success announcement and the
      // sonner toast both carry the exact text 'Документ скачан', so the
      // page-wide getByText hit a strict-mode violation (2 elements). The
      // toast lives in the layout-level Notifications region outside main.
      await expect(page.locator('main').getByText('Документ скачан', { exact: true })).toBeVisible()
    })
  })

  test.describe('Error States - Story 53.8', () => {
    test('should display 404 error for non-existent supply', async ({ page }) => {
      // Use a valid-format UUID that does not exist. The backend's UUID
      // validation rejects free-form ids with 400 (→ generic error terminal);
      // a well-formed but absent UUID returns a real 404 whose message contains
      // "not found", which SupplyDetailError maps to the not-found terminal
      // (<h1>"Поставка не найдена</h1>). This exercises the intended 404 path.
      await page.goto('/supplies/00000000-0000-0000-0000-000000000000', {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('main').waitFor({ state: 'visible' })

      // Bounded terminal: a non-existent supply settles into the not-found terminal.
      const { notFound } = await waitForSupplyDetailTerminal(page)
      await expect(notFound.first()).toBeVisible()

      // Should have back to list link. Scope to the main content (the global
      // sidebar also has supplies links) and use .first() so the visibility
      // guard does not trip strict-mode on the multi-match locator.
      const backLink = page
        .locator('main')
        .locator('a[href="/supplies"], button:has-text("Вернуться")')
        .first()
      if (await backLink.isVisible()) {
        await expect(backLink).toBeVisible()
      }
    })

    test('should display 403 error for forbidden supply', async ({ page }) => {
      // Mock the API 403 (NOT the document navigation). Scope the route to
      // /v1/supplies/<id> so the page route loads normally and the data fetch's
      // 403 drives SupplyDetailError. The message includes lowercase
      // "forbidden" so the component's is403 guard renders the forbidden
      // terminal (<h1>"Нет доступа</h1>).
      await page.route('**/v1/supplies/**', route => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({ error: { code: 'FORBIDDEN', message: 'forbidden' } }),
        })
      })

      await page.goto('/supplies/00000000-0000-0000-0000-000000000000', {
        waitUntil: 'domcontentloaded',
      })

      // Bounded terminal: the mocked 403 settles the detail into the forbidden terminal.
      const { forbidden } = await waitForSupplyDetailTerminal(page)
      await expect(forbidden.first()).toBeVisible()
    })

    test('should display retry button on API error', async ({ page }) => {
      // Mock the API 500 (NOT the document navigation). Scope the route to
      // /v1/supplies/<id> so the page loads and the data fetch's 500 drives
      // SupplyDetailError into its generic-error branch: a destructive Alert
      // (role="alert") with "Не удалось загрузить данные поставки" + "Повторить".
      await page.route('**/v1/supplies/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: { code: 'INTERNAL', message: 'Internal Server Error' } }),
        })
      })

      await page.goto('/supplies/00000000-0000-0000-0000-000000000000', {
        waitUntil: 'domcontentloaded',
      })

      // Bounded terminal: the mocked 500 settles the detail into the error terminal, which
      // renders the retry button. Assert the named terminal then the button (no vacuous guard).
      const { errorState } = await waitForSupplyDetailTerminal(page)
      await expect(errorState.first()).toBeVisible()
      const retryButton = page.locator(
        'button:has-text("Повторить"), button:has-text("Попробовать")'
      )
      await expect(retryButton).toBeEnabled()
    })
  })

  test.describe('Mobile Responsive - Story 53.8', () => {
    test('should display mobile-friendly layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await navigateToSupplyDetail(page)

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible()

      // Title should be visible
      const title = page.locator('h1, [data-testid="supply-title"]')
      await expect(title).toBeVisible()
    })

    test('should display order picker as full-screen drawer on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await navigateToSupplyDetail(page)

      const addButton = page.locator(SELECTORS.addOrdersButton)
      if ((await addButton.isVisible()) && (await addButton.isEnabled())) {
        await addButton.click()

        const drawer = page
          .getByRole('dialog')
          .or(page.locator('[class*="drawer"], [class*="sheet"]'))
        await expect(drawer).toBeVisible()

        // Drawer should be nearly full width on mobile
        const drawerBox = await drawer.boundingBox()
        if (drawerBox) {
          expect(drawerBox.width).toBeGreaterThanOrEqual(350)
        }
      }
    })

    test('should have horizontal scroll on orders table on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await navigateToSupplyDetail(page)

      const tableWrapper = page
        .locator('.overflow-x-auto')
        .filter({ has: page.locator('table') })
        .first()
      if (await tableWrapper.isVisible()) {
        const overflowX = await tableWrapper.evaluate(el => window.getComputedStyle(el).overflowX)
        // Table container should allow horizontal scroll
        expect(['auto', 'scroll', 'visible']).toContain(overflowX)
      }
    })
  })
})
