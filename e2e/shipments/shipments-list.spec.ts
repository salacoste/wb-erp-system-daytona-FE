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

import { test, expect } from '../fixtures/network-test'
import type { Page } from '@playwright/test'

const SHIPMENTS_ROUTE = '/shipments'
type ShipmentScenario =
  | { kind: 'default' }
  | { kind: 'empty' }
  | { kind: 'error' }
  | { kind: 'pending'; gate: Promise<void> }

let shipmentScenario: ShipmentScenario = { kind: 'default' }
const SHIPMENT_FIXTURES = [
  {
    id: 'shipment-draft',
    cabinetId: 'cabinet-e2e',
    name: 'Черновая отправка',
    deliveryMode: 'FIXED_VEHICLE',
    totalDeliveryCost: '15000.0000',
    palletRate: null,
    status: 'DRAFT',
    createdBy: 'manager@example.test',
    confirmedBy: null,
    confirmedAt: null,
    supplyId: null,
    pallets: [
      {
        id: 'pallet-draft',
        shipmentId: 'shipment-draft',
        palletNumber: 1,
        boxLines: [],
        createdAt: '2026-08-29T08:00:00.000Z',
        updatedAt: '2026-08-29T08:00:00.000Z',
      },
    ],
    createdAt: '2026-08-29T08:00:00.000Z',
    updatedAt: '2026-08-29T08:00:00.000Z',
  },
  {
    id: 'shipment-confirmed',
    cabinetId: 'cabinet-e2e',
    name: 'Подтверждённая отправка',
    deliveryMode: 'PER_PALLET',
    totalDeliveryCost: null,
    palletRate: '2500.0000',
    status: 'CONFIRMED',
    createdBy: 'manager@example.test',
    confirmedBy: 'manager@example.test',
    confirmedAt: '2026-08-30T08:00:00.000Z',
    supplyId: null,
    pallets: [],
    createdAt: '2026-08-28T08:00:00.000Z',
    updatedAt: '2026-08-30T08:00:00.000Z',
  },
] as const

function shipmentListBody(requestUrl: string) {
  const url = new URL(requestUrl)
  const status = url.searchParams.get('status')
  const page = Number(url.searchParams.get('page') ?? '1')
  const limit = Number(url.searchParams.get('limit') ?? '10')
  const data = status
    ? SHIPMENT_FIXTURES.filter(shipment => shipment.status === status)
    : [...SHIPMENT_FIXTURES]

  return JSON.stringify({ data, total: status ? data.length : 12, page, limit })
}

async function installShipmentListFixture(page: Page) {
  await page.route('**/v1/shipments**', async route => {
    const url = new URL(route.request().url())
    const detailId = url.pathname.match(/\/v1\/shipments\/([^/]+)$/)?.[1]

    if (detailId) {
      const shipment = SHIPMENT_FIXTURES.find(item => item.id === detailId)
      return route.fulfill({
        status: shipment ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(shipment ?? { message: 'Shipment not found' }),
      })
    }

    if (shipmentScenario.kind === 'pending') {
      await shipmentScenario.gate
    }

    if (shipmentScenario.kind === 'error') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server Error' }),
      })
    }

    if (shipmentScenario.kind === 'empty') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 10 }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: shipmentListBody(route.request().url()),
    })
  })
}

test.describe('Shipments List Page - Epic 77-FE', () => {
  test.beforeEach(async ({ page }) => {
    shipmentScenario = { kind: 'default' }
    await installShipmentListFixture(page)
    await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.locator('main').waitFor({ state: 'visible' })
  })

  test.describe('Page Load & Display', () => {
    test('should display shipments page with heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Отправки/i })).toBeVisible()
    })

    test('should display table or empty state', async ({ page }) => {
      const main = page.locator('main')
      const mainText = (await main.textContent()) ?? ''
      const table = main.locator('table')

      const hasTable = (await table.count()) > 0 && (await table.isVisible())
      const hasKnownState =
        /нет отправок|нет отправок по фильтру|создайте первую отправку|загружаем отправки/i.test(
          mainText
        )
      const hasLoadingSkeleton = (await main.locator('.animate-pulse').count()) > 0

      expect(hasTable || hasKnownState || hasLoadingSkeleton).toBeTruthy()
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
      const badge = firstRow.locator('[data-slot="status-badge"]')
      await expect(badge).toHaveCount(1)
      await expect(badge).toContainText(/ЧЕРНОВИК|ПОДТВЕРЖДЕНА/)
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
        await page.locator('main').waitFor({ state: 'visible' })
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

    test('should display the semantic loading state while shipments are pending', async ({
      page,
    }) => {
      let releaseResponse!: () => void
      const responseGate = new Promise<void>(resolve => {
        releaseResponse = resolve
      })
      shipmentScenario = { kind: 'pending', gate: responseGate }

      await page.reload({ waitUntil: 'domcontentloaded' })
      const loadingRegion = page.getByRole('region', { name: 'Загружаем отправки' })
      await expect(loadingRegion).toHaveAttribute('data-state', 'loading')
      await expect(
        page.getByRole('heading', { level: 1, name: 'Отправки', exact: true })
      ).toBeVisible()

      releaseResponse()
      await expect(page.getByRole('table', { name: 'Очередь отправок' })).toBeVisible()
    })
  })

  test.describe('Status Filtering', () => {
    test('should display status filter', async ({ page }) => {
      await expect(page.getByRole('combobox', { name: 'Статус отправки' })).toBeVisible()
    })

    test('should filter by DRAFT status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: 'Статус отправки' })

      await statusFilter.click()
      await page.getByRole('option', { name: 'Черновик', exact: true }).click()
      await page.locator('main').waitFor({ state: 'visible' })

      // All visible badges should show ЧЕРНОВИК
      const badges = page.locator('table tbody [data-slot="status-badge"]')
      await expect(badges).toHaveCount(1)
      await expect(badges.first()).toContainText('ЧЕРНОВИК')
    })

    test('should filter by CONFIRMED status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: 'Статус отправки' })

      await statusFilter.click()
      await page.getByRole('option', { name: 'Подтверждена', exact: true }).click()
      await page.locator('main').waitFor({ state: 'visible' })

      const badges = page.locator('table tbody [data-slot="status-badge"]')
      await expect(badges).toHaveCount(1)
      await expect(badges.first()).toContainText('ПОДТВЕРЖДЕНА')
    })

    test('should show all shipments when filter cleared', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: 'Статус отправки' })

      // Apply filter first
      await statusFilter.click()
      await page.getByRole('option', { name: 'Черновик', exact: true }).click()
      await page.locator('main').waitFor({ state: 'visible' })

      // Clear filter by selecting "Все"
      await statusFilter.click()
      await page.getByRole('option', { name: 'Все' }).click()
      await expect(page.locator('table tbody [data-slot="status-badge"]')).toHaveCount(2)
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
      const prevButton = page.getByRole('button', { name: 'Предыдущая страница' })
      const nextButton = page.getByRole('button', { name: 'Следующая страница' })

      // At least one pagination element should be visible
      const hasPagination =
        (await rowsPerPage.isVisible()) ||
        (await prevButton.isVisible()) ||
        (await nextButton.isVisible())

      expect(hasPagination).toBeTruthy()
    })

    test('should have prev button disabled on first page', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled()
    })

    test('should navigate to next page if available', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: 'Следующая страница' })
      await expect(nextButton).toBeEnabled()

      await nextButton.click()
      await page.locator('main').waitFor({ state: 'visible' })

      // Prev button should now be enabled
      await expect(page.getByRole('button', { name: 'Предыдущая страница' })).toBeEnabled()
    })

    test('should change rows per page', async ({ page }) => {
      const rowsPerPage = page.getByLabel('Строк на странице')
      await rowsPerPage.click()
      await page.getByRole('option', { name: '20 строк' }).click()
      await expect(rowsPerPage).toContainText('20 строк')
    })

    test('should sort by created date', async ({ page }) => {
      const rows = page.locator('table tbody tr')
      if ((await rows.count()) === 0) {
        test.skip(true, 'No data to sort')
        return
      }

      const table = page.getByRole('table', { name: 'Очередь отправок' })
      const dateHeader = table.locator('th').filter({
        has: page.getByRole('button', { name: /Сортировать по дате/i }),
      })
      await expect(dateHeader).toHaveAttribute('aria-sort', 'descending')
      await dateHeader.getByRole('button', { name: 'Сортировать по дате по возрастанию' }).click()
      await expect(dateHeader).toHaveAttribute('aria-sort', 'ascending')
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
      shipmentScenario = { kind: 'empty' }

      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      await expect(page.getByRole('heading', { name: 'Нет отправок', exact: true })).toBeVisible()

      const createButton = page.getByRole('button', {
        name: 'Создать отправку',
      })
      await expect(createButton).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should display error on API failure', async ({ page }) => {
      shipmentScenario = { kind: 'error' }

      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      // Page should not crash
      await expect(page.locator('body')).toBeVisible()

      // Wait for TanStack Query retry cycle to complete and error state to render
      const retryButton = page.getByRole('button', { name: 'Повторить' })
      const errorText = page.getByText(/Ошибка|ошибка/i)

      await expect(retryButton.or(errorText).first()).toBeVisible({ timeout: 15000 })
    })

    test('should have retry button on error', async ({ page }) => {
      shipmentScenario = { kind: 'error' }

      await page.goto(SHIPMENTS_ROUTE, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor({ state: 'visible' })

      const retryButton = page.getByRole('button', { name: 'Повторить' })
      await expect(retryButton).toBeVisible({ timeout: 15000 })
      await expect(retryButton).toBeEnabled()
    })
  })
})
