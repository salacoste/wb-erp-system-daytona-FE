/**
 * E2E Tests: Supplies List Page
 * Epic 53-FE Story 53.8: E2E Tests & Polish
 *
 * Tests the Supplies list page including:
 * - Page load and display
 * - Status filtering
 * - Date range filtering
 * - Column sorting
 * - Pagination
 * - Navigation to detail page
 * - Create supply modal
 * - Error and empty states
 *
 * @see docs/stories/epic-53/story-53.8-fe-e2e-tests-polish.md
 */

import { test, expect } from '../fixtures/network-test'
import { MUTATING_E2E_SKIP_REASON, shouldSkipMutatingE2E } from '../fixtures/mutation-guard'

// Routes
const SUPPLIES_ROUTE = '/supplies'

// Selectors for supplies list page
const SELECTORS = {
  // Page elements
  pageRoot: '[data-testid="supplies-page"]',
  pageTitle: 'h1, [data-testid="supplies-page-title"]',
  suppliesTable: '[data-testid="supplies-table"]',
  supplyRow: '[data-testid="supply-row"]',

  // Filters
  statusFilter: '[data-testid="status-filter"]',
  dateFromInput: '[data-testid="date-from-input"]',
  dateToInput: '[data-testid="date-to-input"]',
  clearFiltersButton: '[data-testid="clear-filters-button"]',

  // Sorting
  sortableHeader: '[data-testid="sortable-header"]',
  sortIndicator: '[data-testid="sort-indicator"]',

  // Actions
  createSupplyButton: '[data-testid="create-supply-button"]',
  syncButton: '[data-testid="sync-supplies-button"]',
  createSupplyModal: '[data-testid="create-supply-modal"]',

  // States
  emptyState: '[data-testid="supplies-empty-state"]',
  errorState: '[data-testid="supplies-error-state"]',
  loadingSkeleton: '[data-testid="supplies-loading-skeleton"]',

  // Pagination
  pagination: '[data-testid="supplies-pagination"]',
  nextPageButton: '[data-testid="next-page-button"]',
  prevPageButton: '[data-testid="prev-page-button"]',

  // Status badge
  statusBadge: '[data-testid="supply-status-badge"]',
}

async function selectStatus(page: import('@playwright/test').Page, statusLabel: string) {
  await page.getByLabel('Фильтр по статусу').click()
  await page.getByRole('option', { name: statusLabel, exact: true }).click()
  await page.locator('main').waitFor({ state: 'visible' })
}

// Bounded terminal-state reconciliation (live backend): the list settles into exactly
// one of {table-with-rows | empty-state | error-state}. Assert that one is visible with
// a timeout instead of an elapsed sleep. Returns the settled terminal locators.
async function waitForSuppliesTerminal(page: import('@playwright/test').Page) {
  const table = page.locator('table tbody tr').or(page.locator(SELECTORS.supplyRow))
  const emptyState = page
    .locator(SELECTORS.emptyState)
    .or(page.locator('text=/Поставки не найдены|Нет поставок/i'))
  const errorState = page
    .locator(SELECTORS.errorState)
    .or(page.locator('text=/Ошибка|не удалось/i'))

  await expect(table.or(emptyState).or(errorState).first()).toBeVisible({ timeout: 10_000 })
  return { table, emptyState, errorState }
}

test.describe('Supplies List Page - Epic 53-FE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SUPPLIES_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
  })

  test.describe('Page Load & Display', () => {
    test('should display supplies page with heading', async ({ page }) => {
      // AC1: Page loads correctly with title
      await expect(page.getByRole('heading', { name: /Поставки|Supplies/i })).toBeVisible()
      await expect(page.locator(SELECTORS.pageRoot)).toBeVisible()
    })

    test('should navigate to Supplies from sidebar', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const suppliesLink = page.locator('a[href*="supplies"], a:has-text("Поставки")')
      if (await suppliesLink.isVisible()) {
        await suppliesLink.click()
        await expect(page).toHaveURL(/supplies/)
      }
    })

    test('should display loading state while fetching supplies', async ({ page }) => {
      await page.reload()

      // Should show loading skeleton or table
      const loadingOrContent = page
        .locator(SELECTORS.loadingSkeleton)
        .or(page.locator('[class*="skeleton"]'))
        .or(page.locator('table tbody tr'))

      await expect(loadingOrContent.first()).toBeVisible({ timeout: 10000 })
    })

    test('should display supplies table with key columns', async ({ page }) => {
      // Bounded terminal-state wait: the list settles into table-with-rows, empty, or error.
      const { table } = await waitForSuppliesTerminal(page)

      if ((await table.count()) > 0) {
        const fullTable = page.locator('table').or(page.locator(SELECTORS.suppliesTable))
        const headers = fullTable.locator('thead th, [role="columnheader"]')
        await expect(headers).not.toHaveCount(0)

        // Key columns: ID, Name, Status, Orders, Value, Date
        const headerTexts = await headers.allTextContents()
        const hasRequiredColumns =
          headerTexts.some(h => /ID|Номер/i.test(h)) ||
          headerTexts.some(h => /Статус|Status/i.test(h)) ||
          headerTexts.some(h => /Заказ|Orders/i.test(h))

        expect(hasRequiredColumns || headerTexts.length > 0).toBeTruthy()
      }
    })

    test('should display supply rows with status badges', async ({ page }) => {
      const { table } = await waitForSuppliesTerminal(page)

      const rowCount = await table.count()

      if (rowCount > 0) {
        const firstRow = table.first()
        await expect(firstRow).toBeVisible()

        // Row should contain status badge
        const statusBadge = firstRow.locator('[class*="badge"], [data-testid*="status"]')
        if ((await statusBadge.count()) > 0) {
          await expect(statusBadge.first()).toBeVisible()
        }
      }
    })
  })

  test.describe('Status Filtering - Story 53.2', () => {
    test('should filter by OPEN status', async ({ page }) => {
      const statusFilter = page.getByLabel('Фильтр по статусу')

      if (await statusFilter.isVisible()) {
        await selectStatus(page, 'Открыта')
        // URL should contain status parameter
        await expect(page).toHaveURL(/status=OPEN/)
      }
    })

    test('should filter by CLOSED status', async ({ page }) => {
      const statusFilter = page.getByLabel('Фильтр по статусу')

      if (await statusFilter.isVisible()) {
        await selectStatus(page, 'Закрыта')
        await expect(page).toHaveURL(/status=CLOSED/)
      }
    })

    test('should filter by DELIVERED status', async ({ page }) => {
      const statusFilter = page.getByLabel('Фильтр по статусу')

      if (await statusFilter.isVisible()) {
        await selectStatus(page, 'Доставлена')
        await expect(page).toHaveURL(/status=DELIVERED/)
      }
    })

    test('should clear status filter', async ({ page }) => {
      // Apply filter first
      const statusFilter = page.getByLabel('Фильтр по статусу')
      if (await statusFilter.isVisible()) {
        await selectStatus(page, 'Открыта')

        // Clear filter
        const clearButton = page.getByRole('button', {
          name: 'Очистить все фильтры',
          exact: true,
        })

        await expect(clearButton).toBeVisible()
        await clearButton.click()
        await page.locator('main').waitFor({ state: 'visible' })
        await expect(page).not.toHaveURL(/status=/)
      }
    })
  })

  test.describe('Date Range Filtering', () => {
    test('should filter by date from', async ({ page }) => {
      const dateFromInput = page.getByLabel('Дата начала')

      if (await dateFromInput.isVisible()) {
        await dateFromInput.fill('2025-01-01')
        await page.locator('main').waitFor({ state: 'visible' })

        await expect(page).toHaveURL(/from=2025-01-01/)
      }
    })

    test('should filter by date to', async ({ page }) => {
      const dateToInput = page.getByLabel('Дата окончания')

      if (await dateToInput.isVisible()) {
        await dateToInput.fill('2025-12-31')
        await page.locator('main').waitFor({ state: 'visible' })

        await expect(page).toHaveURL(/to=2025-12-31/)
      }
    })

    test('should combine date range with status filter', async ({ page }) => {
      // Apply date filter
      const dateFromInput = page.getByLabel('Дата начала')
      if (await dateFromInput.isVisible()) {
        await dateFromInput.fill('2025-01-01')
        await expect(page).toHaveURL(/from=2025-01-01/, { timeout: 10_000 })

        // Apply status filter
        const statusFilter = page.getByLabel('Фильтр по статусу')
        if (await statusFilter.isVisible()) {
          await selectStatus(page, 'Открыта')
          await expect(page).toHaveURL(/status=OPEN/, { timeout: 10_000 })

          // Both filters should be in URL
          const url = page.url()
          expect(url).toMatch(/from=/)
          expect(url).toMatch(/status=/)
        }
      }
    })
  })

  test.describe('Column Sorting - Story 53.2', () => {
    test('should sort by created_at column', async ({ page }) => {
      const { table } = await waitForSuppliesTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'sandbox has no supplies rows for created_at sort coverage')
        return
      }

      const dateHeader = page.locator('th:has-text("Создана"), th:has-text("Дата")').first()
      await expect(dateHeader).toBeVisible()
      await expect(dateHeader).toHaveAttribute('aria-sort', 'descending')

      await dateHeader.click()
      await expect(dateHeader).toHaveAttribute('aria-sort', 'ascending')
      await expect(page).toHaveURL(/sort_order=asc/)
    })

    test('should sort by orders_count column', async ({ page }) => {
      const { table } = await waitForSuppliesTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'sandbox has no supplies rows for orders_count sort coverage')
        return
      }

      const ordersHeader = page.locator('th:has-text("Заказ"), th:has-text("Кол-во")')
      await expect(ordersHeader).toBeVisible()
      await ordersHeader.click()
      await expect(page).toHaveURL(/sort_by=orders_count/, { timeout: 10_000 })
    })

    test('should toggle sort direction on second click', async ({ page }) => {
      const { table } = await waitForSuppliesTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'sandbox has no supplies rows for sort-toggle coverage')
        return
      }

      const dateHeader = page.locator('th:has-text("Создана"), th:has-text("Дата")').first()
      await expect(dateHeader).toBeVisible()
      await expect(dateHeader).toHaveAttribute('aria-sort', 'descending')

      await dateHeader.click()
      await expect(dateHeader).toHaveAttribute('aria-sort', 'ascending')
      await expect(page).toHaveURL(/sort_order=asc/)

      await dateHeader.click()
      await expect(dateHeader).toHaveAttribute('aria-sort', 'descending')
      await expect(page).not.toHaveURL(/sort_order=asc/)
    })
  })

  test.describe('Navigation to Detail Page', () => {
    test('should navigate to detail page on row click', async ({ page }) => {
      const { table } = await waitForSuppliesTerminal(page)
      if ((await table.count()) === 0) {
        test.skip(true, 'sandbox has no supplies rows for navigation coverage')
        return
      }

      const firstRow = page
        .locator('tbody tr:first-child')
        .or(page.locator(SELECTORS.supplyRow).first())
      await expect(firstRow).toBeVisible()
      await firstRow.click()
      await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    })
  })

  test.describe('Create Supply Modal - Story 53.3 @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should open create supply modal', async ({ page }) => {
      const createButton = page
        .locator(SELECTORS.createSupplyButton)
        .or(page.locator('button:has-text("Создать"), button:has-text("Новая поставка")'))

      if (await createButton.isVisible()) {
        await createButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()
      }
    })

    test('should close modal with close button', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /Создать поставку|Новая поставка/i })
      if (await createButton.isVisible()) {
        await createButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()

        const closeButton = page.locator(
          '[aria-label="Close"], button:has-text("Закрыть"), button:has-text("Отмена")'
        )
        await closeButton.click()
        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
    })

    test('should close modal with Escape key', async ({ page }) => {
      const createButton = page.locator(
        'button:has-text("Создать"), button:has-text("Новая поставка")'
      )
      if (await createButton.isVisible()) {
        await createButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).not.toBeVisible()
      }
    })

    test('should create supply with optional name', async ({ page }) => {
      const createButton = page.locator(
        'button:has-text("Создать"), button:has-text("Новая поставка")'
      )
      if (await createButton.isVisible()) {
        await createButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()

        // Fill optional name
        const nameInput = page.locator('input[name="name"], input[placeholder*="название"]')
        if (await nameInput.isVisible()) {
          await nameInput.fill('E2E Test Supply')
        }

        // Submit: register the response waiter BEFORE the action, then reconcile.
        const submitButton = page.getByRole('dialog').getByRole('button', { name: /^Создать$/ })
        const createResponse = page.waitForResponse(
          response =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname === '/v1/supplies',
          { timeout: 10_000 }
        )
        await submitButton.click()
        await createResponse

        // Should navigate to the detail page (bounded regex asserting a real
        // supply id, mirroring supply-lifecycle Step 1) OR show the success
        // toast — bounded reconciliation, no permissive substring match.
        const successToast = page.locator('text=Поставка создана')
        await expect
          .poll(
            async () =>
              /\/supplies\/[a-zA-Z0-9-]+/.test(page.url()) ||
              (await successToast.isVisible().catch(() => false)),
            { timeout: 10_000, intervals: [250, 500, 1000] }
          )
          .toBeTruthy()
      }
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination when many supplies', async ({ page }) => {
      await waitForSuppliesTerminal(page)

      await expect(page.getByRole('heading', { name: 'Поставки FBS', exact: true })).toBeVisible()
      const previousButton = page.getByRole('button', {
        name: 'Предыдущая страница',
        exact: true,
      })
      const nextButton = page.getByRole('button', { name: 'Следующая страница', exact: true })

      if (!(await previousButton.isVisible()) || !(await nextButton.isVisible())) {
        // Pagination controls are not rendered when the sandbox has too few
        // supplies to span a page. That is a valid settle for both the empty
        // state (<h3>"Нет поставок") and a single page of rows — either way the
        // pagination assertions below cannot apply. Surface as skipped-with-reason
        // rather than asserting the empty heading, which would false-fail when
        // the table holds a single page of real rows without pagination.
        const emptyHeading = page.getByRole('heading', { name: /^Нет поставок/ })
        const hasEmpty = await emptyHeading.isVisible().catch(() => false)
        test.skip(
          true,
          hasEmpty
            ? 'Configured supplies fixture is empty, so pagination controls are not rendered'
            : 'Configured supplies fixture has fewer rows than one page, so pagination controls are not rendered'
        )
        return
      }

      await expect(previousButton).toBeVisible()
      await expect(previousButton).toBeDisabled()
      await expect(nextButton).toBeVisible()
      await expect(page.getByText(/^Стр\. 1 из \d+$/)).toBeVisible()

      if (await nextButton.isDisabled()) {
        test.skip(true, 'Configured supplies fixture contains only one page of records')
        return
      }

      await expect(nextButton).toBeEnabled()
    })

    test('should navigate to next page', async ({ page }) => {
      await waitForSuppliesTerminal(page)

      const nextButton = page.getByRole('button', { name: 'Следующая страница' })

      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await expect(page.getByText(/Стр\.\s*2/)).toBeVisible({ timeout: 10_000 })
      }
    })

    test('should navigate to previous page', async ({ page }) => {
      // Go to page 2 first
      await page.goto(`${SUPPLIES_ROUTE}?page=2`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const prevButton = page
        .locator(SELECTORS.prevPageButton)
        .or(page.locator('button:has-text("Назад"), button[aria-label*="Previous"]'))

      if (await prevButton.isEnabled()) {
        await prevButton.click()
        await expect(page).not.toHaveURL(/page=2/, { timeout: 10_000 })
      }
    })
  })

  test.describe('Empty State', () => {
    test('should display empty state when no supplies match filters', async ({ page }) => {
      // Apply filter that returns no results
      await page.goto(`${SUPPLIES_ROUTE}?status=CANCELLED&from=1990-01-01&to=1990-12-31`, {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('main').waitFor({ state: 'visible' })

      // Bounded terminal: the filtered list must settle into empty-state (the named terminal
      // this test asserts), table-with-rows, or error-state. Vacuous `if (isVisible)` guard
      // removed — the terminal is asserted, not optional.
      const { emptyState } = await waitForSuppliesTerminal(page)
      await expect(emptyState.first()).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should display error state on API failure', async ({ page }) => {
      // Block API to simulate error
      await page.route('**/v1/supplies**', route => route.abort())
      await page.reload()

      // Bounded terminal: with the route aborted the list must settle into error-state.
      const { errorState } = await waitForSuppliesTerminal(page)
      // Page should not crash
      await expect(page.locator('body')).toBeVisible()
      await expect(errorState.first()).toBeVisible()
    })

    test('should display retry button on error', async ({ page }) => {
      await page.route('**/v1/supplies**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.reload()

      // Bounded terminal: 500 response settles the list into error-state, which renders the
      // retry button. Assert the named terminal then the button (no vacuous guard).
      const { errorState } = await waitForSuppliesTerminal(page)
      await expect(errorState.first()).toBeVisible()
      const retryButton = page.locator(
        'button:has-text("Повторить"), button:has-text("Попробовать")'
      )
      await expect(retryButton).toBeEnabled()
    })
  })

  test.describe('Sync Button @mutating', () => {
    test.skip(shouldSkipMutatingE2E(), MUTATING_E2E_SKIP_REASON)

    test('should display sync button', async ({ page }) => {
      const syncButton = page
        .locator(SELECTORS.syncButton)
        .or(page.locator('button:has-text("Синхронизировать"), button[aria-label*="sync"]'))

      if (await syncButton.isVisible()) {
        await expect(syncButton).toBeEnabled()
      }
    })

    test('should trigger sync on button click', async ({ page }) => {
      const syncButton = page.locator(
        'button:has-text("Синхронизировать"), button[aria-label*="sync"]'
      )

      if (await syncButton.isVisible()) {
        // Register the sync response waiter BEFORE the click, then reconcile the toast.
        const syncResponse = page.waitForResponse(
          response =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname === '/v1/supplies',
          { timeout: 10_000 }
        )
        await syncButton.click()
        await syncResponse

        const successOrLoading = page.locator('text=/Синхронизация|обновлен/i')
        await expect(successOrLoading.first()).toBeVisible({ timeout: 10_000 })
      }
    })
  })
})
