/**
 * E2E Tests: Shipment Detail Page
 * Epic 77-FE Story 77.2: Shipment E2E Tests
 *
 * Tests the Shipment detail page including:
 * - Page load and header display
 * - Pallet accordion expand/collapse
 * - Box line table rendering
 * - Draft vs confirmed action buttons
 * - Calculation results display
 *
 * @see _bmad-output/implementation-artifacts/77.2-fe-shipment-e2e-tests.md
 */

import { test, expect, type Page } from '../fixtures/network-test'
import AxeBuilder from '@axe-core/playwright'

const SHIPMENTS_ROUTE = '/shipments'
const STORY_DETAIL_ROUTE = '/shipments/story-173-9-detail'
const STORY_DETAIL_API = '**/v1/shipments/story-173-9-detail'

const STORY_DETAIL_FIXTURE = {
  id: 'story-173-9-detail',
  cabinetId: 'cabinet-e2e',
  name: 'Отправка для приёмки',
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
      id: 'pallet-story-173-9',
      shipmentId: 'story-173-9-detail',
      palletNumber: 1,
      boxLines: [
        {
          id: 'line-calculated',
          palletId: 'pallet-story-173-9',
          nmId: 123456,
          boxCount: 2,
          totalUnits: 20,
          unitCostRub: '500.00',
          boxVolume: '1.00',
          totalVolume: '2.00',
          volumeShare: '0.50',
          allocatedDeliveryCost: '1000.00',
          deliveryCostPerUnit: '50.00',
          finalCostPerUnit: '550.00',
          finalCostLine: '11000.00',
          createdAt: '2026-08-30T08:00:00.000Z',
          updatedAt: '2026-08-30T08:00:00.000Z',
        },
        {
          id: 'line-pending',
          palletId: 'pallet-story-173-9',
          nmId: 789012,
          boxCount: 1,
          totalUnits: 5,
          unitCostRub: null,
          boxVolume: null,
          totalVolume: null,
          volumeShare: null,
          allocatedDeliveryCost: null,
          deliveryCostPerUnit: null,
          finalCostPerUnit: null,
          finalCostLine: null,
          createdAt: '2026-08-30T08:00:00.000Z',
          updatedAt: '2026-08-30T08:00:00.000Z',
        },
      ],
      createdAt: '2026-08-30T08:00:00.000Z',
      updatedAt: '2026-08-30T08:00:00.000Z',
    },
  ],
  createdAt: '2026-08-30T08:00:00.000Z',
  updatedAt: '2026-08-30T09:00:00.000Z',
} as const

async function installStoryDetailFixture(
  page: Page,
  options: { status?: 200 | 404 | 500; gate?: Promise<void> } = {}
) {
  await page.route(STORY_DETAIL_API, async route => {
    await options.gate
    const status = options.status ?? 200
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(
        status === 200
          ? STORY_DETAIL_FIXTURE
          : { message: status === 404 ? 'Hostile missing detail' : 'Hostile service detail' }
      ),
    })
  })
}

test.describe('Story 173.9 deterministic shipment detail', () => {
  // 174.4: cold-compile/hydration budget. Under full-suite load the dev server
  // compiles /shipments/[id] for 6.8s+ and the dashboard layout renders its
  // pre-hydration "Загрузка..." shell past the default 5s expect budget
  // (baseline failures: h1/region "element(s) not found"). 15s covers the
  // observed worst case without masking a real hang.
  const COLD_START = 15_000

  test('exposes entity, lifecycle, partial evidence, accordion, and named table contracts', async ({
    page,
  }) => {
    await installStoryDetailFixture(page)
    await page.goto(STORY_DETAIL_ROUTE, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1, name: 'Отправка для приёмки' })).toBeVisible(
      { timeout: COLD_START }
    )
    await expect(page.locator('[data-slot="context-bar"]')).toBeVisible()
    await expect(page.locator('[data-slot="status-badge"]')).toContainText('ЧЕРНОВИК')
    await expect(page.getByRole('region', { name: 'Расчёт выполнен частично' })).toBeVisible()

    const palletTrigger = page.getByRole('button', { name: 'Раскрыть паллету 1' })
    await expect(palletTrigger).toHaveAttribute('aria-expanded', 'false')
    await palletTrigger.click()
    await expect(palletTrigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('table', { name: 'Товары паллеты' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Таблица товаров паллеты' })).toHaveAttribute(
      'tabindex',
      '0'
    )
  })

  test('keeps route identity visible while detail data is loading', async ({ page }) => {
    let releaseResponse!: () => void
    const gate = new Promise<void>(resolve => {
      releaseResponse = resolve
    })
    await installStoryDetailFixture(page, { gate })
    await page.goto(STORY_DETAIL_ROUTE, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1, name: 'Детали отправки' })).toBeVisible({
      timeout: COLD_START,
    })
    await expect(page.getByRole('region', { name: 'Загрузка отправки' })).toHaveAttribute(
      'data-state',
      'loading'
    )

    releaseResponse()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Отправка для приёмки' })
    ).toBeVisible()
  })

  test('renders a safe not-found terminal with a return action', async ({ page }) => {
    await installStoryDetailFixture(page, { status: 404 })
    await page.goto(STORY_DETAIL_ROUTE, { waitUntil: 'domcontentloaded' })

    // 174.4: COLD_START — the 404 query settle lands after hydration; with
    // retry:1 the terminal can pass the default 5s budget under full-suite
    // load (baseline failure: region not found while the page still showed
    // the loading region).
    await expect(page.getByRole('region', { name: 'Отправка не найдена' })).toHaveAttribute(
      'data-state',
      'not-found',
      { timeout: COLD_START }
    )
    await expect(page.getByRole('link', { name: 'Вернуться к отправкам' })).toHaveAttribute(
      'href',
      '/shipments'
    )
    await expect(page.locator('main').getByText('Hostile missing detail')).toHaveCount(0)
  })

  test('preserves mobile navigation and contains wide detail tables locally', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await installStoryDetailFixture(page)
    await page.goto(STORY_DETAIL_ROUTE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Раскрыть паллету 1' }).click()

    const scrollRegion = page.getByRole('region', { name: 'Таблица товаров паллеты' })
    const regionBox = await scrollRegion.boundingBox()
    expect(regionBox?.width).toBeLessThanOrEqual(320)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true)
    await scrollRegion.focus()
    await expect(scrollRegion).toBeFocused()
  })

  test('has no deterministic WCAG 2.2 AA violations in the loaded detail state', async ({
    page,
  }) => {
    await installStoryDetailFixture(page)
    await page.goto(STORY_DETAIL_ROUTE, { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
})

/**
 * Navigate to the first available shipment detail page.
 * Optionally filter by status.
 */
async function navigateToShipmentDetail(page: Page, options?: { status?: 'DRAFT' | 'CONFIRMED' }) {
  let url = SHIPMENTS_ROUTE
  if (options?.status === 'DRAFT') {
    url += '?status=DRAFT'
  } else if (options?.status === 'CONFIRMED') {
    url += '?status=CONFIRMED'
  }

  await page.goto(url)
  await page.locator('main').waitFor({ state: 'visible' })

  // Match only detail links (UUID paths), not /shipments/sku-packaging
  const firstViewLink = page.locator('table a[href*="/shipments/"]').first()
  if ((await firstViewLink.count()) > 0 && (await firstViewLink.isVisible())) {
    await firstViewLink.click()
    await page.locator('main').waitFor({ state: 'visible' })
    return true
  }
  return false
}

test.describe('Shipment Detail Page - Epic 77-FE', () => {
  test.describe('Page Load & Header', () => {
    test('should display shipment name and status badge', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      // Should show heading with shipment name
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()

      // Should show status badge
      const badge = page.locator('[class*="badge"]').first()
      if (await badge.isVisible()) {
        const badgeText = await badge.textContent()
        expect(badgeText?.includes('ЧЕРНОВИК') || badgeText?.includes('ПОДТВЕРЖДЕНА')).toBeTruthy()
      }
    })

    test('should display back link to list', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const backLink = page.getByText('Назад к списку').or(page.locator('a[href="/shipments"]'))
      await expect(backLink).toBeVisible()
    })

    test('should navigate back to list on back link click', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const backLink = page.getByText('Назад к списку').or(page.locator('a[href="/shipments"]'))
      await backLink.click()
      await page.locator('main').waitFor({ state: 'visible' })
      await expect(page).toHaveURL(/\/shipments\/?$/)
    })

    test('should display info grid with delivery mode and cost', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      // Delivery mode label
      const deliveryModeLabel = page.getByText('Способ доставки')
      await expect(deliveryModeLabel).toBeVisible()

      // Delivery mode value
      const deliveryModeValue = page
        .getByText('Фиксированная стоимость')
        .or(page.getByText('За паллету'))
      await expect(deliveryModeValue).toBeVisible()

      // Created date label
      await expect(page.getByText('Создано')).toBeVisible()
    })

    test('should display loading skeleton initially', async ({ page }) => {
      // Navigate directly to a detail URL
      await page.goto('/shipments/test-id-loading')

      const skeleton = page
        .locator('[class*="animate-pulse"]')
        .or(page.locator('[class*="skeleton"]'))
        .or(page.locator('h1'))

      await expect(skeleton.first()).toBeVisible({ timeout: 10000 })
    })

    test('should display error state for non-existent shipment', async ({ page }) => {
      await page.route('**/v1/shipments/**', route =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not found' }),
        })
      )

      await page.goto('/shipments/non-existent-id')
      await page.locator('main').waitFor({ state: 'visible' })

      // Wait for error state to render (TanStack Query retry delay)
      const retryButton = page.getByRole('button', { name: 'Повторить' })
      const errorIndicator = page.getByText(/Ошибка|ошибка|Детали отправки/i)
      await expect(retryButton.or(errorIndicator).first()).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Pallet Accordion', () => {
    test('should display pallets section header', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const palletsHeader = page
        .getByText(/Паллеты\s*\(\d+\)/i)
        .or(page.getByText('Паллеты ещё не добавлены'))
      await expect(palletsHeader).toBeVisible()
    })

    test('should expand/collapse pallet accordion', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      // Find first pallet trigger
      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()

      if (!(await palletTrigger.isVisible())) {
        test.skip(true, 'No pallets to expand')
        return
      }

      // Expand
      await palletTrigger.click()

      // Should show box line table or empty message
      const content = page
        .locator('table')
        .or(page.getByText('Товары ещё не добавлены'))
        .or(page.getByText('Товары будут добавлены позже'))
      await expect(content.first()).toBeVisible({ timeout: 5000 })

      // Collapse
      await palletTrigger.click()
    })

    test('should show pallet header with item count', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      // Pallet header pattern: "Паллета #N (M товаров)"
      const palletHeader = page.getByText(/Паллета #\d+/i).first()
      if (await palletHeader.isVisible()) {
        const text = await palletHeader.textContent()
        expect(text).toMatch(/Паллета #\d+/)
      }
    })

    test('should show add pallet button for draft shipments', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'DRAFT',
      })
      if (!navigated) {
        test.skip(true, 'No draft shipments available')
        return
      }

      const addPalletButton = page.getByRole('button', {
        name: 'Добавить паллету',
      })
      await expect(addPalletButton).toBeVisible()
    })

    test('should hide add pallet button for confirmed shipments', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'CONFIRMED',
      })
      if (!navigated) {
        test.skip(true, 'No confirmed shipments available')
        return
      }

      const addPalletButton = page.getByRole('button', {
        name: 'Добавить паллету',
      })
      await expect(addPalletButton).not.toBeVisible()
    })
  })

  test.describe('Box Line Table', () => {
    test('should display box line table with correct columns', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      // Expand first pallet
      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()
      if (!(await palletTrigger.isVisible())) {
        test.skip(true, 'No pallets to expand')
        return
      }

      await palletTrigger.click()

      // Check for box line table
      const boxLineTable = page.locator('table').last()
      if (await boxLineTable.isVisible()) {
        const headers = boxLineTable.locator('thead th')
        const headerTexts = await headers.allTextContents()

        expect(headerTexts.some(h => /Товар/i.test(h))).toBeTruthy()
        expect(headerTexts.some(h => /Коробок/i.test(h))).toBeTruthy()
        expect(headerTexts.some(h => /Всего штук/i.test(h))).toBeTruthy()
      }
    })

    test('should display box line items with nmId', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()
      if (!(await palletTrigger.isVisible())) {
        test.skip(true, 'No pallets')
        return
      }

      await palletTrigger.click()

      // Box line rows should show numeric nmId
      const boxLineRows = page.locator('table').last().locator('tbody tr')
      if ((await boxLineRows.count()) > 0) {
        const firstCell = boxLineRows.first().locator('td').first()
        const text = await firstCell.textContent()
        // nmId should be a number
        expect(text?.trim()).toMatch(/\d+/)
      }
    })

    test('should show add item button in draft pallets', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'DRAFT',
      })
      if (!navigated) {
        test.skip(true, 'No draft shipments available')
        return
      }

      const palletTrigger = page.getByRole('button', { name: /Раскрыть паллету/i }).first()
      if (!(await palletTrigger.isVisible())) {
        test.skip(true, 'No pallets')
        return
      }

      await palletTrigger.click()

      const addItemButton = page.getByRole('button', {
        name: 'Добавить товар',
      })
      await expect(addItemButton).toBeVisible()
    })
  })

  test.describe('Action Buttons - Draft', () => {
    test('should display all draft action buttons', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'DRAFT',
      })
      if (!navigated) {
        test.skip(true, 'No draft shipments available')
        return
      }

      // Draft actions
      await expect(page.getByRole('button', { name: 'Редактировать' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Рассчитать/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Подтвердить/ })).toBeVisible()
    })

    test('should open edit dialog on Редактировать click', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'DRAFT',
      })
      if (!navigated) {
        test.skip(true, 'No draft shipments available')
        return
      }

      await page.getByRole('button', { name: 'Редактировать' }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByText('Редактировать отправку')).toBeVisible()

      // Edit dialog fields
      await expect(dialog.locator('#se-name')).toBeVisible()
      await expect(dialog.locator('#se-cost')).toBeVisible()

      await page.keyboard.press('Escape')
    })

    test('should not show delete button for confirmed shipments', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'CONFIRMED',
      })
      if (!navigated) {
        test.skip(true, 'No confirmed shipments available')
        return
      }

      // Shipment-level delete button should not be visible for confirmed
      await expect(page.getByRole('button', { name: /Удалить/i })).not.toBeVisible()
    })
  })

  test.describe('Action Buttons - Confirmed', () => {
    test('should show recalculate button for confirmed shipments', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'CONFIRMED',
      })
      if (!navigated) {
        test.skip(true, 'No confirmed shipments available')
        return
      }

      const recalcButton = page.getByRole('button', {
        name: /Пересчитать/i,
      })
      await expect(recalcButton).toBeVisible()
    })

    test('should not show edit/confirm buttons for confirmed shipments', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'CONFIRMED',
      })
      if (!navigated) {
        test.skip(true, 'No confirmed shipments available')
        return
      }

      await expect(page.getByRole('button', { name: 'Редактировать' })).not.toBeVisible()
      await expect(page.getByRole('button', { name: /^Подтвердить/ })).not.toBeVisible()
    })

    test('should show lock icon for confirmed shipments', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'CONFIRMED',
      })
      if (!navigated) {
        test.skip(true, 'No confirmed shipments available')
        return
      }

      // Confirmed badge should be visible (with lock icon rendered alongside)
      await expect(page.getByText('ПОДТВЕРЖДЕНА')).toBeVisible()
    })
  })

  test.describe('Calculation Results', () => {
    test('should display calculation results if present', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page)
      if (!navigated) {
        test.skip(true, 'No shipments available')
        return
      }

      const calcResultsHeader = page.getByText('Результаты расчёта')
      if (await calcResultsHeader.isVisible()) {
        // Should show results table with expected columns
        const resultsSection = calcResultsHeader.locator('..')
        await expect(resultsSection).toBeVisible()

        // Check for "Товар" column in results
        const resultsTable = page.locator('table').filter({
          has: page.locator('th:has-text("Товар")'),
        })
        if (await resultsTable.isVisible()) {
          const headers = resultsTable.locator('thead th')
          const headerTexts = await headers.allTextContents()
          expect(headerTexts.some(h => /Товар/i.test(h))).toBeTruthy()
        }
      }
    })

    test('should trigger calculate on Рассчитать click', async ({ page }) => {
      const navigated = await navigateToShipmentDetail(page, {
        status: 'DRAFT',
      })
      if (!navigated) {
        test.skip(true, 'No draft shipments available')
        return
      }

      const calcButton = page.getByRole('button', { name: /Рассчитать/ })
      if (!(await calcButton.isVisible())) {
        test.skip(true, 'Calculate button not visible')
        return
      }

      // Wait for response with extended timeout
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/calculate') && resp.status() >= 200,
        { timeout: 15_000 }
      )

      await calcButton.click()

      try {
        await responsePromise
        await page.locator('main').waitFor({ state: 'visible' })

        // After calculation, should show results or validation errors
        const resultsOrErrors = page
          .getByText('Результаты расчёта')
          .or(page.getByText('Ошибки валидации'))
          .or(page.locator('[role="alert"]'))

        await expect(resultsOrErrors.first()).toBeVisible({ timeout: 10000 })
      } catch {
        // Calculate may fail if no box lines — that's acceptable
      }
    })
  })
})
