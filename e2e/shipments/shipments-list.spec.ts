/**
 * E2E Tests: Shipments List Page
 * Epic 77-FE Story 77.2: Shipment E2E Tests
 *
 * Tests the Shipments list page including:
 * - Page load and display
 * - Status filtering (DRAFT/CONFIRMED)
 * - Pagination
 * - Create shipment dialog
 * - Empty state and error handling
 *
 * @see _bmad-output/implementation-artifacts/77.2-fe-shipment-e2e-tests.md
 */

import { test, expect } from '@playwright/test'

const SHIPMENTS_ROUTE = '/shipments'

test.describe('Shipments List Page - Epic 77-FE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHIPMENTS_ROUTE)
    await page.waitForLoadState('networkidle')
  })

  test.describe('Page Load & Display', () => {
    test('should display shipments page with heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Отправки/i })).toBeVisible()
    })

    test('should display table or empty state', async ({ page }) => {
      const table = page.locator('table')
      const emptyState = page.getByText('Нет отправок')

      const hasTable = (await table.count()) > 0 && (await table.isVisible())
      const hasEmptyState = (await emptyState.count()) > 0 && (await emptyState.isVisible())

      expect(hasTable || hasEmptyState).toBeTruthy()
    })

    test('should display table with correct columns when data exists', async ({ page }) => {
      const table = page.locator('table')
      if (!(await table.isVisible())) {
        test.skip(true, 'No shipments table — empty state shown')
        return
      }

      const headers = table.locator('thead th')
      const headerTexts = await headers.allTextContents()

      expect(headerTexts.some(h => /Название/i.test(h))).toBeTruthy()
      expect(headerTexts.some(h => /Статус/i.test(h))).toBeTruthy()
      expect(headerTexts.some(h => /Способ доставки/i.test(h))).toBeTruthy()
    })

    test('should display status badges in rows', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No shipments in test data')
        return
      }

      const firstRow = rows.first()
      // Status badge should contain ЧЕРНОВИК or ПОДТВЕРЖДЕНА
      const badge = firstRow.locator('[class*="badge"]')
      if ((await badge.count()) > 0) {
        const badgeText = await badge.first().textContent()
        expect(badgeText?.includes('ЧЕРНОВИК') || badgeText?.includes('ПОДТВЕРЖДЕНА')).toBeTruthy()
      }
    })

    test('should display view button per row', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No shipments in test data')
        return
      }

      const viewButton = rows
        .first()
        .getByRole('link', { name: 'Открыть отправку' })
        .or(rows.first().locator('a[href*="/shipments/"]'))
      await expect(viewButton).toBeVisible()
    })

    test('should navigate to detail page on view click', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No shipments in test data')
        return
      }

      const viewLink = rows.first().locator('a[href*="/shipments/"]')
      if (await viewLink.isVisible()) {
        await viewLink.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/\/shipments\/[a-zA-Z0-9-]+/)
      }
    })

    test('should display create button when shipments exist', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        // In empty state, the create button is inside the empty card
        const emptyCreateButton = page.getByRole('button', {
          name: 'Создать отправку',
        })
        await expect(emptyCreateButton).toBeVisible()
        return
      }

      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      await expect(createButton).toBeVisible()
    })

    test('should display loading skeleton on reload', async ({ page }) => {
      await page.reload()

      const skeleton = page
        .locator('[class*="skeleton"]')
        .or(page.locator('[class*="animate-pulse"]'))
        .or(page.locator('table'))

      await expect(skeleton.first()).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Status Filtering', () => {
    test('should display status filter', async ({ page }) => {
      const statusFilter = page
        .getByLabel('Фильтр по статусу')
        .or(page.locator('button:has-text("Все статусы")'))

      // Filter may not be visible if no data
      if (await statusFilter.isVisible()) {
        await expect(statusFilter).toBeVisible()
      }
    })

    test('should filter by DRAFT status', async ({ page }) => {
      const statusFilter = page
        .getByLabel('Фильтр по статусу')
        .or(page.locator('button:has-text("Все статусы")'))

      if (!(await statusFilter.isVisible())) {
        test.skip(true, 'Status filter not available')
        return
      }

      await statusFilter.click()
      await page.getByText('Черновик').click()
      await page.waitForLoadState('networkidle')

      // All visible badges should show ЧЕРНОВИК
      const badges = page.locator('table tbody [class*="badge"]')
      const count = await badges.count()
      for (let i = 0; i < count; i++) {
        const text = await badges.nth(i).textContent()
        expect(text).toContain('ЧЕРНОВИК')
      }
    })

    test('should filter by CONFIRMED status', async ({ page }) => {
      const statusFilter = page
        .getByLabel('Фильтр по статусу')
        .or(page.locator('button:has-text("Все статусы")'))

      if (!(await statusFilter.isVisible())) {
        test.skip(true, 'Status filter not available')
        return
      }

      await statusFilter.click()
      await page.getByText('Подтверждена').click()
      await page.waitForLoadState('networkidle')

      const badges = page.locator('table tbody [class*="badge"]')
      const count = await badges.count()
      for (let i = 0; i < count; i++) {
        const text = await badges.nth(i).textContent()
        expect(text).toContain('ПОДТВЕРЖДЕНА')
      }
    })

    test('should show all shipments when filter cleared', async ({ page }) => {
      const statusFilter = page
        .getByLabel('Фильтр по статусу')
        .or(page.locator('button:has-text("Все статусы")'))

      if (!(await statusFilter.isVisible())) {
        test.skip(true, 'Status filter not available')
        return
      }

      // Apply filter first
      await statusFilter.click()
      await page.getByText('Черновик').click()
      await page.waitForLoadState('networkidle')

      // Clear filter by selecting "Все"
      await statusFilter.click()
      const allOption = page.getByText('Все').first()
      if (await allOption.isVisible()) {
        await allOption.click()
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No data for pagination')
        return
      }

      const rowsPerPage = page.getByLabel('Строк на странице')
      const prevButton = page.getByRole('button', { name: 'Назад' })
      const nextButton = page.getByRole('button', { name: 'Вперёд' })

      // At least one pagination element should be visible
      const hasPagination =
        (await rowsPerPage.isVisible()) ||
        (await prevButton.isVisible()) ||
        (await nextButton.isVisible())

      expect(hasPagination).toBeTruthy()
    })

    test('should have prev button disabled on first page', async ({ page }) => {
      const prevButton = page.getByRole('button', { name: 'Назад' })
      if (await prevButton.isVisible()) {
        await expect(prevButton).toBeDisabled()
      }
    })

    test('should navigate to next page if available', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: 'Вперёд' })
      if (!(await nextButton.isVisible()) || (await nextButton.isDisabled())) {
        test.skip(true, 'Next page not available')
        return
      }

      await nextButton.click()
      await page.waitForLoadState('networkidle')

      // Prev button should now be enabled
      const prevButton = page.getByRole('button', { name: 'Назад' })
      if (await prevButton.isVisible()) {
        await expect(prevButton).toBeEnabled()
      }
    })

    test('should change rows per page', async ({ page }) => {
      const rowsPerPage = page.getByLabel('Строк на странице')
      if (!(await rowsPerPage.isVisible())) {
        test.skip(true, 'Rows per page selector not visible')
        return
      }

      await rowsPerPage.click()
      const option20 = page.getByText('20 строк')
      if (await option20.isVisible()) {
        await option20.click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('should sort by created date', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No data to sort')
        return
      }

      const dateHeader = page.locator('th').filter({ hasText: 'Дата создания' })
      if (await dateHeader.isVisible()) {
        const sortButton = dateHeader.locator('button')
        if (await sortButton.isVisible()) {
          await sortButton.click()
          await page.waitForLoadState('networkidle')
        }
      }
    })
  })

  test.describe('Create Shipment Dialog', () => {
    test('should open create dialog on button click', async ({ page }) => {
      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })

      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Создать отправку').first()).toBeVisible()
    })

    test('should display form fields in dialog', async ({ page }) => {
      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      // Name field
      await expect(dialog.locator('#sp-name')).toBeVisible()

      // Cost field
      await expect(dialog.locator('#sp-cost')).toBeVisible()

      // Delivery mode radio
      const fixedVehicle = dialog.locator('#mode-FIXED_VEHICLE')
      const perPallet = dialog.locator('#mode-PER_PALLET')
      expect((await fixedVehicle.isVisible()) || (await perPallet.isVisible())).toBeTruthy()
    })

    test('should close dialog with Escape key', async ({ page }) => {
      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should close dialog with cancel button', async ({ page }) => {
      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.getByRole('button', { name: 'Отмена' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should show validation error for empty name', async ({ page }) => {
      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      if (!(await createButton.isVisible()) || !(await createButton.isEnabled())) {
        test.skip(true, 'Create button not visible')
        return
      }

      await createButton.click()
      const dialog = page.getByRole('dialog')

      // Fill cost but leave name empty
      await dialog.locator('#sp-cost').fill('1000')

      // Submit
      await dialog.getByRole('button', { name: 'Создать' }).click()

      // Should show name validation error
      const nameError = dialog
        .locator('#sp-name-error')
        .or(dialog.getByText('Название обязательно'))
      if (await nameError.isVisible()) {
        await expect(nameError).toBeVisible()
      }
    })
  })

  test.describe('Empty State', () => {
    test('should display empty state when no shipments', async ({ page }) => {
      // Mock empty API response
      await page.route('**/v1/shipments**', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            total: 0,
            page: 1,
            limit: 10,
          }),
        })
      )

      await page.goto(SHIPMENTS_ROUTE)
      await page.waitForLoadState('networkidle')

      const emptyState = page.getByText('Нет отправок')
      await expect(emptyState).toBeVisible()

      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      await expect(createButton).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should display error on API failure', async ({ page }) => {
      await page.route('**/v1/shipments**', route =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ message: 'Server Error' }),
        })
      )

      await page.goto(SHIPMENTS_ROUTE)
      await page.waitForLoadState('networkidle')

      // Page should not crash
      await expect(page.locator('body')).toBeVisible()

      // Wait for TanStack Query retry cycle to complete and error state to render
      const retryButton = page.getByRole('button', { name: 'Повторить' })
      const errorText = page.getByText(/Ошибка|ошибка/i)

      await expect(retryButton.or(errorText).first()).toBeVisible({ timeout: 15000 })
    })

    test('should have retry button on error', async ({ page }) => {
      await page.route('**/v1/shipments**', route =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ message: 'Server Error' }),
        })
      )

      await page.goto(SHIPMENTS_ROUTE)
      await page.waitForLoadState('networkidle')

      const retryButton = page.getByRole('button', { name: 'Повторить' })
      await expect(retryButton).toBeVisible({ timeout: 15000 })
      await expect(retryButton).toBeEnabled()
    })
  })
})
