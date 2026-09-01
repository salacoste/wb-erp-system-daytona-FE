import AxeBuilder from '@axe-core/playwright'
import type { Locator } from '@playwright/test'
import { expect, type Page } from './network-test'
import { TIMEOUTS, ROUTES } from './test-data'

const SETTINGS_ROUTES = {
  cabinet: '/settings/cabinet',
  tariffs: ROUTES.settings.tariffs,
  notifications: ROUTES.settings.notifications,
  tax: ROUTES.settings.tax,
  expenses: ROUTES.settings.expenses,
  backfill: '/settings/backfill',
  root: '/settings',
}

const SETTINGS_NAV_ROUTES = [
  [SETTINGS_ROUTES.root, 'Обзор'],
  [SETTINGS_ROUTES.cabinet, 'Кабинет'],
  [SETTINGS_ROUTES.notifications, 'Уведомления'],
  [SETTINGS_ROUTES.tax, 'Налоги'],
  [SETTINGS_ROUTES.tariffs, 'Тарифы'],
  [SETTINGS_ROUTES.expenses, 'Расходы'],
  [SETTINGS_ROUTES.backfill, 'Импорт'],
] as const

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(selectedTheme => window.localStorage.setItem('theme', selectedTheme), theme)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(
    theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
  )
}

async function expectMainHasNoHorizontalOverflow(page: Page) {
  const main = page.locator('main')
  await expect(main).toHaveCount(1)
  const dimensions = await main.evaluate(node => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function expectDocumentHasNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function expectContainedInViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('A fixed viewport is required for containment evidence')

  await expect
    .poll(async () => {
      const box = await locator.boundingBox()
      if (!box) return Number.POSITIVE_INFINITY
      return Math.max(
        0,
        -box.x,
        -box.y,
        box.x + box.width - viewport.width,
        box.y + box.height - viewport.height
      )
    })
    .toBeLessThanOrEqual(1)
}

async function expectSettingsAxeClean(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations, context).toEqual([])
}

async function expectCabinetAxeClean(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .include('main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations, context).toEqual([])
}

async function expectCabinetLoaded(page: Page) {
  const main = page.locator('main')
  await expect(main.getByRole('heading', { level: 2, name: 'Информация о продавце' })).toBeVisible()
  await expect(main.getByLabel('Целевая маржа, %')).toBeVisible()
  await expect(
    main.getByText(
      'Очень длинное название кабинета продавца для проверки переноса без потери данных'
    )
  ).toBeVisible()
}

const cabinetApiCounts = new WeakMap<Page, { updates: number }>()

function getCabinetApiCounts(page: Page) {
  const counts = cabinetApiCounts.get(page)
  if (!counts) throw new Error('Cabinet API fixture is not installed for this page')
  return counts
}

async function installCabinetApiFixture(page: Page) {
  const counts = { updates: 0 }
  cabinetApiCounts.set(page, counts)
  await page.route('**/v1/cabinets/**', async route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    const nestedEndpoint = pathname.match(
      /^\/v1\/cabinets\/[^/]+\/(seller-info|jam-status|seller-rating|token-status)\/?$/
    )?.[1]
    let body: object

    if (nestedEndpoint) {
      if (request.method() !== 'GET') {
        throw new Error(`Unexpected cabinet fixture method: ${request.method()} ${pathname}`)
      }
    }

    if (nestedEndpoint === 'seller-info') {
      body = {
        available: true,
        name: 'Очень длинное название кабинета продавца для проверки переноса без потери данных',
        sid: 'seller-story-173-3',
        tradeMark: 'Длинная торговая марка с русским названием',
      }
    } else if (nestedEndpoint === 'jam-status') {
      body = {
        available: true,
        tier: 'standard',
        searchTextsLimit: 50,
        checkedAt: '2026-08-29T12:00:00Z',
        probeCallsMade: 1,
      }
    } else if (nestedEndpoint === 'seller-rating') {
      body = { available: true, valuation: 4.6, feedbackCount: 1234 }
    } else if (nestedEndpoint === 'token-status') {
      body = { healthy: true, errorCount: 0 }
    } else if (/^\/v1\/cabinets\/[^/]+\/?$/.test(pathname)) {
      if (request.method() === 'PUT') {
        const payload = request.postDataJSON() as unknown
        if (
          typeof payload !== 'object' ||
          payload === null ||
          Array.isArray(payload) ||
          Object.keys(payload).length !== 1 ||
          (payload as Record<string, unknown>).target_margin_pct !== 35
        ) {
          throw new Error(`Unexpected target-margin payload for ${pathname}`)
        }
        counts.updates += 1
      } else if (request.method() !== 'GET') {
        throw new Error(`Unexpected cabinet fixture method: ${request.method()} ${pathname}`)
      }
      body = {
        id: pathname.split('/').at(-1) ?? 'cabinet-story-173-3',
        name: 'Story 173.3 cabinet',
        isActive: true,
        createdAt: '2026-08-29T10:00:00Z',
        updatedAt: '2026-08-29T12:00:00Z',
        taxSystem: null,
        taxRate: null,
        vatPayer: false,
        vatRate: null,
        targetMarginPct: request.method() === 'PUT' ? 35 : 20,
      }
    } else {
      throw new Error(`Unhandled cabinet fixture request: ${request.method()} ${pathname}`)
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

const TARIFF_SETTINGS_FIXTURE = {
  acceptanceBoxRatePerLiter: 1.8,
  acceptancePalletRate: 520,
  logisticsVolumeTiers: [
    { fromLiters: 0.001, toLiters: 0.2, rateRub: 24 },
    { fromLiters: 0.201, toLiters: 0.4, rateRub: 27 },
  ],
  logisticsLargeFirstLiterRate: 48,
  logisticsLargeAdditionalLiterRate: 15,
  returnLogisticsFboRate: 50,
  returnLogisticsFbsRate: 60,
  defaultCommissionFboPct: 15,
  defaultCommissionFbsPct: 12,
  storageFreeDays: 30,
  fixationClothingDays: 14,
  fixationOtherDays: 7,
  fbsUsesFboLogisticsRates: true,
  source: 'manual',
  notes: 'Плановое обновление тарифов для длинного русского описания',
} as const

interface TariffApiFixtureOptions {
  failPatchAttempts?: number
  holdFirstPatch?: boolean
}

interface TariffApiFixtureState {
  patchPayloads: unknown[]
  releaseFirstPatch: () => void
}

async function installTariffApiFixture(
  page: Page,
  { failPatchAttempts = 0, holdFirstPatch = false }: TariffApiFixtureOptions = {}
): Promise<TariffApiFixtureState> {
  let currentSettings: Record<string, unknown> = { ...TARIFF_SETTINGS_FIXTURE }
  let remainingFailures = failPatchAttempts
  let releaseFirstPatch: () => void = () => {}
  const firstPatchGate = holdFirstPatch
    ? new Promise<void>(resolve => {
        releaseFirstPatch = resolve
      })
    : Promise.resolve()
  const state: TariffApiFixtureState = {
    patchPayloads: [],
    releaseFirstPatch: () => releaseFirstPatch(),
  }

  await page.route('**/v1/tariffs/settings', async route => {
    const request = route.request()
    const method = request.method()

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentSettings),
      })
      return
    }

    if (method !== 'PATCH') {
      throw new Error(`Unexpected tariff fixture method: ${method} ${request.url()}`)
    }

    const payload = request.postDataJSON() as unknown
    state.patchPayloads.push(payload)
    if (state.patchPayloads.length === 1) await firstPatchGate

    if (remainingFailures > 0) {
      remainingFailures -= 1
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Временная ошибка тарифного сервиса' }),
      })
      return
    }

    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new Error('Tariff PATCH payload must be an object')
    }
    currentSettings = { ...currentSettings, ...payload }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSettings),
    })
  })

  return state
}

async function expectTariffSettingsLoaded(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Управление тарифами' })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
  await expect(
    page.getByRole('heading', { level: 2, name: 'Редактирование тарифов' })
  ).toBeVisible()
  await expect(page.getByLabel(/Тариф приёмки.*₽\/литр/i)).toHaveValue('1.8')
  await expect(page.getByLabel('Заметки')).toHaveValue(
    'Плановое обновление тарифов для длинного русского описания'
  )
}

async function editAcceptanceRateWithKeyboard(page: Page, value: string) {
  const input = page.getByLabel(/Тариф приёмки.*₽\/литр/i)
  await input.focus()
  await expect(input).toBeFocused()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type(value)
  await page.keyboard.press('Tab')
  await expect(input).toHaveValue(value)
}

async function openTariffSaveDialog(page: Page) {
  const save = page.getByRole('button', { name: 'Сохранить', exact: true })
  await expect(save).toBeEnabled()
  await save.press('Enter')
  return page.getByRole('alertdialog', { name: 'Сохранить изменения тарифов?' })
}

interface TaxSettingsPayload {
  taxSystem: 'usn6' | 'usn15' | 'manual' | null
  taxRate: number | null
  vatPayer: boolean
  vatRate: number
}

interface TaxApiFixtureOptions {
  failPutAttempts?: number
  holdFirstPut?: boolean
}

interface TaxApiFixtureState {
  putPayloads: TaxSettingsPayload[]
  releaseFirstPut: () => void
}

const TAX_CABINET_FIXTURE = {
  id: 'cabinet-story-173-7',
  name: 'Story 173.7 cabinet',
  isActive: true,
  createdAt: '2026-08-30T00:00:00Z',
  updatedAt: '2026-08-30T00:00:00Z',
  taxSystem: 'usn6',
  taxRate: null,
  vatPayer: false,
  vatRate: null,
  targetMarginPct: 20,
} as const

function assertTaxPayload(payload: unknown): asserts payload is TaxSettingsPayload {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Tax PUT payload must be an object')
  }
  const record = payload as Record<string, unknown>
  const keys = Object.keys(record).sort()
  if (keys.join(',') !== 'taxRate,taxSystem,vatPayer,vatRate') {
    throw new Error(`Unexpected tax PUT keys: ${keys.join(',')}`)
  }
  const allowedTaxSystems: unknown[] = [null, 'usn6', 'usn15', 'manual']
  if (!allowedTaxSystems.includes(record.taxSystem)) {
    throw new Error(`Unexpected taxSystem: ${String(record.taxSystem)}`)
  }
  if (record.taxRate !== null && typeof record.taxRate !== 'number') {
    throw new Error('taxRate must be a number or null')
  }
  if (typeof record.vatPayer !== 'boolean' || typeof record.vatRate !== 'number') {
    throw new Error('vatPayer and vatRate must preserve their API types')
  }
  if (
    (record.taxSystem === 'manual' &&
      (typeof record.taxRate !== 'number' || record.taxRate < 0 || record.taxRate > 100)) ||
    (record.taxSystem !== 'manual' && record.taxRate !== null)
  ) {
    throw new Error('taxRate must match the selected tax system and the inclusive 0–100 range')
  }
  if (
    (record.vatPayer && ![0, 5, 20, 22].includes(record.vatRate)) ||
    (!record.vatPayer && record.vatRate !== 0)
  ) {
    throw new Error('vatRate must match VAT-payer state and the supported rate catalog')
  }
}

async function installTaxApiFixture(
  page: Page,
  { failPutAttempts = 0, holdFirstPut = false }: TaxApiFixtureOptions = {}
): Promise<TaxApiFixtureState> {
  let currentCabinet: Record<string, unknown> = { ...TAX_CABINET_FIXTURE }
  let remainingFailures = failPutAttempts
  let releaseFirstPut: () => void = () => {}
  const firstPutGate = holdFirstPut
    ? new Promise<void>(resolve => {
        releaseFirstPut = resolve
      })
    : Promise.resolve()
  const state: TaxApiFixtureState = {
    putPayloads: [],
    releaseFirstPut: () => releaseFirstPut(),
  }

  await page.route(/^https?:\/\/[^/]+\/v1\/cabinets\/[^/]+\/?$/, async route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    if (!/^\/v1\/cabinets\/[^/]+\/?$/.test(pathname)) {
      throw new Error(`Unexpected tax fixture endpoint: ${request.method()} ${pathname}`)
    }
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentCabinet),
      })
      return
    }
    if (request.method() !== 'PUT') {
      throw new Error(`Unexpected tax fixture method: ${request.method()} ${pathname}`)
    }

    const payload = request.postDataJSON() as unknown
    assertTaxPayload(payload)
    state.putPayloads.push(payload)
    if (state.putPayloads.length === 1) await firstPutGate
    if (remainingFailures > 0) {
      remainingFailures -= 1
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Временная ошибка налогового сервиса' }),
      })
      return
    }

    currentCabinet = {
      ...currentCabinet,
      ...payload,
      vatRate: payload.vatPayer ? payload.vatRate : null,
      updatedAt: '2026-08-30T01:00:00Z',
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentCabinet),
    })
  })

  return state
}

async function expectTaxSettingsLoaded(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Налоговые настройки' })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
  const form = page.getByRole('form', { name: 'Налоговые настройки' })
  await expect(form).toBeVisible()
  await expect(form.getByRole('radio', { name: 'УСН 6% — по доходам' })).toBeChecked()
  await expect(form.getByRole('checkbox', { name: 'Являюсь плательщиком НДС' })).not.toBeChecked()
}

async function enterManualTaxWithVat(page: Page, rate = '7.5') {
  const form = page.getByRole('form', { name: 'Налоговые настройки' })
  await form.getByRole('radio', { name: 'Пользовательская ставка' }).press('Space')
  const taxRate = form.getByLabel('Ставка налога (%)')
  await taxRate.focus()
  await page.keyboard.type(rate)
  await form.getByRole('checkbox', { name: 'Являюсь плательщиком НДС' }).press('Space')
  await form.getByRole('radio', { name: '20% — стандартная ставка' }).press('Space')
  await expect(taxRate).toHaveValue(rate)
}

export {
  SETTINGS_ROUTES,
  SETTINGS_NAV_ROUTES,
  setTheme,
  expectMainHasNoHorizontalOverflow,
  expectDocumentHasNoHorizontalOverflow,
  expectContainedInViewport,
  expectSettingsAxeClean,
  expectCabinetAxeClean,
  expectCabinetLoaded,
  getCabinetApiCounts,
  installCabinetApiFixture,
  installTariffApiFixture,
  expectTariffSettingsLoaded,
  editAcceptanceRateWithKeyboard,
  openTariffSaveDialog,
  installTaxApiFixture,
  expectTaxSettingsLoaded,
  enterManualTaxWithVat,
}
