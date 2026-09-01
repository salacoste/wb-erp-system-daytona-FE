/**
 * Deterministic E2E evidence for Story 173.11: SKU Packaging.
 *
 * API fixtures are installed before navigation so these scenarios never accept
 * whichever live-backend terminal state happens to render.
 */

import { test, expect, type Page } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const ACTIVE_BOX_TYPE = {
  id: 'box-standard',
  cabinetId: 'cabinet-story-173-11',
  name: 'Короб стандартный',
  lengthCm: '40',
  widthCm: '30',
  heightCm: '20',
  volumeCm3: '24000',
  isActive: true,
  createdAt: '2026-08-30T09:00:00.000Z',
  updatedAt: '2026-08-30T09:00:00.000Z',
}

const INACTIVE_BOX_TYPE = {
  ...ACTIVE_BOX_TYPE,
  id: 'box-archive',
  name: 'Архивная коробка',
  isActive: false,
}

const PACKAGING_FIXTURES = [
  {
    nmId: 173_110_001,
    cabinetId: 'cabinet-story-173-11',
    boxTypeId: ACTIVE_BOX_TYPE.id,
    unitsPerBox: 12,
    boxType: ACTIVE_BOX_TYPE,
    product: {
      nmId: 173_110_001,
      vendorCode: 'SKU-АКТИВ',
      brand: 'Тестовый бренд',
      subject: 'Куртка демисезонная',
    },
    createdAt: '2026-08-30T09:00:00.000Z',
    updatedAt: '2026-08-30T09:00:00.000Z',
  },
  {
    nmId: 173_110_002,
    cabinetId: 'cabinet-story-173-11',
    boxTypeId: INACTIVE_BOX_TYPE.id,
    unitsPerBox: 4,
    boxType: INACTIVE_BOX_TYPE,
    product: {
      nmId: 173_110_002,
      vendorCode: 'SKU-АРХИВ',
      brand: 'Тестовый бренд',
      subject: 'Ботинки зимние',
    },
    createdAt: '2026-08-30T09:00:00.000Z',
    updatedAt: '2026-08-30T09:00:00.000Z',
  },
] as const

const BULK_PAYLOAD = {
  items: [
    {
      nmId: PACKAGING_FIXTURES[0].nmId,
      boxTypeId: ACTIVE_BOX_TYPE.id,
      unitsPerBox: 16,
    },
  ],
}

async function installSkuPackagingApiFixtures(page: Page) {
  await page.route(/\/v1\/sku-packaging\/bulk$/, async route => {
    const request = route.request()
    if (request.method() !== 'POST' || request.postDataJSON() === undefined) {
      throw new Error(`Unexpected bulk fixture request: ${request.method()} ${request.url()}`)
    }
    expect(request.postDataJSON()).toEqual(BULK_PAYLOAD)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ created: 0, updated: 1, errors: [] }),
    })
  })

  await page.route(/\/v1\/sku-packaging\/\d+$/, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (
      request.method() !== 'DELETE' ||
      url.pathname !== `/v1/sku-packaging/${PACKAGING_FIXTURES[0].nmId}` ||
      request.postData() !== null
    ) {
      throw new Error(
        `Unexpected delete fixture request: ${request.method()} ${url.pathname} body=${request.postData()}`
      )
    }
    await route.fulfill({ status: 204, body: '' })
  })

  await page.route(/\/v1\/box-types(?:\?.*)?$/, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() !== 'GET' || url.pathname !== '/v1/box-types' || url.search !== '') {
      throw new Error(
        `Unexpected box-types fixture request: ${request.method()} ${url.pathname}${url.search}`
      )
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([ACTIVE_BOX_TYPE]),
    })
  })

  await page.route(/\/v1\/sku-packaging(?:\?.*)?$/, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname !== '/v1/sku-packaging' || url.search !== '') {
      throw new Error(
        `Unexpected SKU-packaging fixture request: ${request.method()} ${url.pathname}${url.search}`
      )
    }

    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PACKAGING_FIXTURES),
      })
      return
    }

    if (request.method() === 'POST') {
      const payload = request.postDataJSON() as {
        nmId?: unknown
        boxTypeId?: unknown
        unitsPerBox?: unknown
      }
      if (
        payload.nmId !== PACKAGING_FIXTURES[0].nmId ||
        payload.boxTypeId !== ACTIVE_BOX_TYPE.id ||
        payload.unitsPerBox !== 18 ||
        Object.keys(payload).length !== 3
      ) {
        throw new Error(`Unexpected SKU-packaging upsert payload: ${JSON.stringify(payload)}`)
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...PACKAGING_FIXTURES[0], unitsPerBox: 18 }),
      })
      return
    }

    throw new Error(`Unexpected SKU-packaging fixture method: ${request.method()}`)
  })
}

async function openPopulatedPage(page: Page) {
  await page.goto(ROUTES.shipmentsSkuPackaging, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Упаковка товаров' })).toBeVisible({
    timeout: TIMEOUTS.api,
  })
  const viewportWidth = page.viewportSize()?.width ?? 1280
  if (viewportWidth < 768) {
    await expect(
      page
        .getByRole('group', { name: 'Карточки привязок упаковки для узкого экрана' })
        .getByRole('heading', { name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)) })
    ).toBeVisible()
  } else {
    await expect(
      page.getByRole('row', { name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)) })
    ).toBeVisible()
  }
}

function resultAnnouncement(page: Page) {
  return page.locator('section[aria-label="Упаковка товаров"] > p[role="status"]')
}

test.describe('SKU Packaging Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await installSkuPackagingApiFixtures(page)
  })

  test('renders populated package status and entity-specific actions', async ({ page }) => {
    await openPopulatedPage(page)

    const activeRow = page.getByRole('row', {
      name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)),
    })
    const inactiveRow = page.getByRole('row', {
      name: new RegExp(String(PACKAGING_FIXTURES[1].nmId)),
    })

    await expect(activeRow).toContainText('Куртка демисезонная')
    await expect(activeRow).toContainText('Короб стандартный')
    await expect(activeRow).toContainText('12 шт.')
    await expect(activeRow.getByText('Привязка активна')).toBeVisible()
    await expect(inactiveRow.getByText('Тип коробки неактивен')).toBeVisible()
    await expect(
      activeRow.getByRole('button', {
        name: new RegExp(`Редактировать .+${PACKAGING_FIXTURES[0].nmId}`, 'i'),
      })
    ).toBeVisible()
    await expect(
      activeRow.getByRole('button', {
        name: new RegExp(`Удалить .+${PACKAGING_FIXTURES[0].nmId}`, 'i'),
      })
    ).toBeVisible()
  })

  test('shows filtered empty state and resets the client-side filter', async ({ page }) => {
    await openPopulatedPage(page)

    const search = page.getByRole('searchbox', { name: /Поиск/i })
    await search.fill('несуществующий SKU')

    await expect(page.getByText(/^По фильтру ничего не найдено$/i)).toBeVisible()
    await expect(
      page.getByRole('row', { name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)) })
    ).toBeHidden()

    await page
      .getByRole('region', { name: 'Фильтр привязок упаковки' })
      .getByRole('button', { name: 'Показать все привязки' })
      .click()
    await expect(search).toHaveValue('')
    await expect(search).toBeFocused()
    await expect(
      page.getByRole('row', { name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)) })
    ).toBeVisible()
  })

  test('preserves the exact single-upsert request contract when editing', async ({ page }) => {
    await openPopulatedPage(page)

    const row = page.getByRole('row', { name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)) })
    await row
      .getByRole('button', {
        name: new RegExp(`Редактировать .+${PACKAGING_FIXTURES[0].nmId}`, 'i'),
      })
      .click()

    const dialog = page.getByRole('dialog', { name: 'Редактировать упаковку' })
    await expect(dialog.locator('input:disabled').first()).toHaveValue(
      String(PACKAGING_FIXTURES[0].nmId)
    )
    await dialog.getByLabel('Штук в коробке').fill('18')

    const upsertRequest = page.waitForRequest(request => {
      const url = new URL(request.url())
      return request.method() === 'POST' && url.pathname === '/v1/sku-packaging'
    })
    await dialog.getByRole('button', { name: 'Сохранить' }).click()

    const request = await upsertRequest
    expect(request.postDataJSON()).toEqual({
      nmId: PACKAGING_FIXTURES[0].nmId,
      boxTypeId: ACTIVE_BOX_TYPE.id,
      unitsPerBox: 18,
    })
    await expect(dialog).toBeHidden()
    await expect(resultAnnouncement(page)).toContainText(
      `Упаковка SKU ${PACKAGING_FIXTURES[0].nmId} сохранена.`
    )
    await expect(page.getByRole('region', { name: 'Упаковка товаров' })).toBeFocused()
  })

  test('preserves exact bulk and delete wire contracts with terminal announcements', async ({
    page,
  }) => {
    await openPopulatedPage(page)

    await page.getByRole('button', { name: 'Массовое добавление' }).click()
    const bulkDialog = page.getByRole('dialog', { name: 'Массовое добавление упаковки' })
    await bulkDialog
      .getByRole('textbox')
      .fill(`${PACKAGING_FIXTURES[0].nmId}, ${ACTIVE_BOX_TYPE.id}, 16`)
    await bulkDialog.getByRole('button', { name: 'Предпросмотр' }).click()
    await expect(
      bulkDialog.getByRole('table', { name: 'Предпросмотр массового добавления упаковки' })
    ).toContainText('16 шт.')
    await bulkDialog.getByRole('button', { name: 'Отправить (1)' }).click()
    await expect(
      bulkDialog.getByRole('table', { name: 'Результаты массового добавления упаковки' })
    ).toContainText('Сохранено')
    await bulkDialog.getByRole('button', { name: 'Закрыть', exact: true }).last().click()
    await expect(resultAnnouncement(page)).toContainText(
      'Массовая обработка завершена: создано 0, обновлено 1, ошибок 0.'
    )
    await expect(page.getByRole('region', { name: 'Упаковка товаров' })).toBeFocused()

    const row = page.getByRole('row', { name: new RegExp(String(PACKAGING_FIXTURES[0].nmId)) })
    await row
      .getByRole('button', {
        name: `Удалить упаковку SKU ${PACKAGING_FIXTURES[0].nmId}`,
      })
      .click()
    const deleteDialog = page.getByRole('alertdialog', { name: 'Удалить привязку упаковки?' })
    await deleteDialog.getByRole('button', { name: 'Удалить' }).click()
    await expect(deleteDialog).toBeHidden()
    await expect(resultAnnouncement(page)).toContainText(
      `Привязка упаковки SKU ${PACKAGING_FIXTURES[0].nmId} удалена.`
    )
    await expect(page.getByRole('region', { name: 'Упаковка товаров' })).toBeFocused()
  })

  test('keeps validation and first-invalid focus operable from the keyboard', async ({ page }) => {
    await openPopulatedPage(page)

    const create = page.getByRole('button', { name: 'Добавить упаковку' })
    await create.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Добавить упаковку' })
    const submit = dialog.getByRole('button', { name: 'Создать' })
    await submit.focus()
    await page.keyboard.press('Enter')

    await expect(dialog.getByRole('alert')).toContainText('Проверьте поля формы')
    await expect(dialog.getByRole('combobox', { name: 'Товар (nmId)' })).toBeFocused()
  })

  for (const width of [320, 390]) {
    test(`keeps complete narrow cards without page overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await openPopulatedPage(page)

      await expect(page.locator('[data-table-wide-content]')).toBeHidden()
      const narrow = page.getByRole('group', {
        name: 'Карточки привязок упаковки для узкого экрана',
      })
      await expect(narrow).toBeVisible()
      await expect(narrow).toContainText(String(PACKAGING_FIXTURES[0].nmId))
      await expect(narrow).toContainText('Короб стандартный')
      await expect(narrow).toContainText('12 шт.')
      await expect(narrow).toContainText('Привязка активна')
      await expect(
        narrow.getByRole('button', {
          name: `Редактировать упаковку SKU ${PACKAGING_FIXTURES[0].nmId}`,
        })
      ).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )
      ).toBe(true)
    })
  }
})
