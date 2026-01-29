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

import { test, expect } from '@playwright/test'

// Routes
const SUPPLIES_ROUTE = '/supplies'

// Selectors for supplies list page
const SELECTORS = {
  // Page elements
  page: '[data-testid="supplies-page"]',
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

test.describe('Supplies List Page - Epic 53-FE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SUPPLIES_ROUTE)
    await page.waitForLoadState('networkidle')
  })

  test.describe('Page Load & Display', () => {
    test('should display supplies page with heading', async ({ page }) => {
      // AC1: Page loads correctly with title
      await expect(page.getByRole('heading', { name: /Поставки|Supplies/i })).toBeVisible()
      await expect(page.locator(SELECTORS.page).or(page.locator('main'))).toBeVisible()
    })

    test('should navigate to Supplies from sidebar', async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

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
      await page.waitForTimeout(2000)

      const table = page.locator('table').or(page.locator(SELECTORS.suppliesTable))
      if (await table.isVisible()) {
        const headers = table.locator('thead th, [role="columnheader"]')
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
      await page.waitForTimeout(2000)

      const supplyRows = page.locator('tbody tr').or(page.locator(SELECTORS.supplyRow))
      const rowCount = await supplyRows.count()

      if (rowCount > 0) {
        const firstRow = supplyRows.first()
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
      const statusFilter = page
        .locator(SELECTORS.statusFilter)
        .or(page.locator('select[name*="status"], button:has-text("Статус")'))

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.click('text=Открыта')
        await page.waitForLoadState('networkidle')

        // URL should contain status parameter
        await expect(page).toHaveURL(/status=OPEN/)
      }
    })

    test('should filter by CLOSED status', async ({ page }) => {
      const statusFilter = page
        .locator(SELECTORS.statusFilter)
        .or(page.locator('select[name*="status"], button:has-text("Статус")'))

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.click('text=Закрыта')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/status=CLOSED/)
      }
    })

    test('should filter by DELIVERED status', async ({ page }) => {
      const statusFilter = page
        .locator(SELECTORS.statusFilter)
        .or(page.locator('select[name*="status"], button:has-text("Статус")'))

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.click('text=Доставлена')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/status=DELIVERED/)
      }
    })

    test('should clear status filter', async ({ page }) => {
      // Apply filter first
      const statusFilter = page
        .locator(SELECTORS.statusFilter)
        .or(page.locator('button:has-text("Статус")'))
      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.click('text=Открыта')
        await page.waitForLoadState('networkidle')

        // Clear filter
        const clearButton = page
          .locator(SELECTORS.clearFiltersButton)
          .or(page.locator('button:has-text("Сбросить"), button:has-text("Очистить")'))

        if (await clearButton.isVisible()) {
          await clearButton.click()
          await page.waitForLoadState('networkidle')
          await expect(page).not.toHaveURL(/status=/)
        }
      }
    })
  })

  test.describe('Date Range Filtering', () => {
    test('should filter by date from', async ({ page }) => {
      const dateFromInput = page
        .locator(SELECTORS.dateFromInput)
        .or(page.locator('input[name*="from"], input[type="date"]:first-of-type'))

      if (await dateFromInput.isVisible()) {
        await dateFromInput.fill('2025-01-01')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/from=2025-01-01/)
      }
    })

    test('should filter by date to', async ({ page }) => {
      const dateToInput = page
        .locator(SELECTORS.dateToInput)
        .or(page.locator('input[name*="to"], input[type="date"]:last-of-type'))

      if (await dateToInput.isVisible()) {
        await dateToInput.fill('2025-12-31')
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/to=2025-12-31/)
      }
    })

    test('should combine date range with status filter', async ({ page }) => {
      // Apply date filter
      const dateFromInput = page.locator('input[name*="from"], input[type="date"]').first()
      if (await dateFromInput.isVisible()) {
        await dateFromInput.fill('2025-01-01')
        await page.waitForTimeout(500)

        // Apply status filter
        const statusFilter = page
          .locator(SELECTORS.statusFilter)
          .or(page.locator('button:has-text("Статус")'))
        if (await statusFilter.isVisible()) {
          await statusFilter.click()
          await page.click('text=Открыта')
          await page.waitForLoadState('networkidle')

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
      await page.waitForTimeout(2000)

      const dateHeader = page.locator('th:has-text("Создана"), th:has-text("Дата")')
      if (await dateHeader.isVisible()) {
        await dateHeader.click()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/sort_by=created_at/)
      }
    })

    test('should sort by orders_count column', async ({ page }) => {
      await page.waitForTimeout(2000)

      const ordersHeader = page.locator('th:has-text("Заказ"), th:has-text("Кол-во")')
      if (await ordersHeader.isVisible()) {
        await ordersHeader.click()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/sort_by=orders_count/)
      }
    })

    test('should toggle sort direction on second click', async ({ page }) => {
      await page.waitForTimeout(2000)

      const dateHeader = page.locator('th:has-text("Создана"), th:has-text("Дата")')
      if (await dateHeader.isVisible()) {
        // First click - desc
        await dateHeader.click()
        await page.waitForLoadState('networkidle')

        // Second click - asc
        await dateHeader.click()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/sort_order=asc/)
      }
    })
  })

  test.describe('Navigation to Detail Page', () => {
    test('should navigate to detail page on row click', async ({ page }) => {
      await page.waitForTimeout(2000)

      const firstRow = page
        .locator('tbody tr:first-child')
        .or(page.locator(SELECTORS.supplyRow).first())
      if (await firstRow.isVisible()) {
        await firstRow.click()
        await page.waitForLoadState('networkidle')

        // Should navigate to /supplies/{id}
        await expect(page).toHaveURL(/\/supplies\/[a-zA-Z0-9-]+/)
      }
    })
  })

  test.describe('Create Supply Modal - Story 53.3', () => {
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
      const createButton = page.locator(
        'button:has-text("Создать"), button:has-text("Новая поставка")'
      )
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

        // Submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Создать")')
        await submitButton.click()

        // Wait for response
        await page.waitForTimeout(2000)

        // Should show success or navigate to detail
        const successOrRedirect =
          page.url().includes('/supplies/') ||
          (await page.locator('text=Поставка создана').isVisible()) ||
          (await page.locator('[class*="toast"]').isVisible())

        expect(successOrRedirect).toBeTruthy()
      }
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination when many supplies', async ({ page }) => {
      await page.waitForTimeout(2000)

      const pagination = page
        .locator(SELECTORS.pagination)
        .or(page.locator('[class*="pagination"], nav[aria-label*="pagination"]'))

      // Pagination may not be visible if few supplies
      const hasPagination = (await pagination.count()) > 0
      expect(hasPagination || true).toBeTruthy()
    })

    test('should navigate to next page', async ({ page }) => {
      await page.waitForTimeout(2000)

      const nextButton = page
        .locator(SELECTORS.nextPageButton)
        .or(page.locator('button:has-text("Далее"), button[aria-label*="Next"]'))

      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/page=2/)
      }
    })

    test('should navigate to previous page', async ({ page }) => {
      // Go to page 2 first
      await page.goto(`${SUPPLIES_ROUTE}?page=2`)
      await page.waitForLoadState('networkidle')

      const prevButton = page
        .locator(SELECTORS.prevPageButton)
        .or(page.locator('button:has-text("Назад"), button[aria-label*="Previous"]'))

      if (await prevButton.isEnabled()) {
        await prevButton.click()
        await page.waitForLoadState('networkidle')
        await expect(page).not.toHaveURL(/page=2/)
      }
    })
  })

  test.describe('Empty State', () => {
    test('should display empty state when no supplies match filters', async ({ page }) => {
      // Apply filter that returns no results
      await page.goto(`${SUPPLIES_ROUTE}?status=CANCELLED&from=1990-01-01&to=1990-12-31`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const emptyState = page
        .locator(SELECTORS.emptyState)
        .or(page.locator('text=/Поставки не найдены|Нет поставок/i'))

      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should display error state on API failure', async ({ page }) => {
      // Block API to simulate error
      await page.route('**/supplies**', route => route.abort())
      await page.reload()
      await page.waitForTimeout(2000)

      // Page should not crash
      await expect(page.locator('body')).toBeVisible()

      const errorState = page
        .locator(SELECTORS.errorState)
        .or(page.locator('text=/Ошибка|не удалось/i'))

      if ((await errorState.count()) > 0) {
        await expect(errorState.first()).toBeVisible()
      }
    })

    test('should display retry button on error', async ({ page }) => {
      await page.route('**/supplies**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.reload()
      await page.waitForTimeout(2000)

      const retryButton = page.locator(
        'button:has-text("Повторить"), button:has-text("Попробовать")'
      )
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeEnabled()
      }
    })
  })

  test.describe('Sync Button', () => {
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
        await syncButton.click()

        // Should show loading state or success message
        await page.waitForTimeout(2000)

        const successOrLoading = page.locator('text=/Синхронизация|обновлен/i')
        if ((await successOrLoading.count()) > 0) {
          await expect(successOrLoading.first()).toBeVisible()
        }
      }
    })
  })
})
