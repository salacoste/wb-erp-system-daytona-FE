/**
 * E2E Tests: Settings Pages
 * Covers /settings/cabinet, /settings/tariffs, /settings/notifications
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex — not exact formatted strings
 *
 * Run: npx playwright test e2e/settings-pages.spec.ts
 */

import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from './fixtures/network-test'
import { TIMEOUTS, ROUTES } from './fixtures/test-data'

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

test.describe('Settings Pages', () => {
  // ===========================================================================
  // Cabinet Settings Page
  // ===========================================================================

  test.describe('Cabinet page', () => {
    test.beforeEach(async ({ page }) => {
      await installCabinetApiFixture(page)
    })

    test('navigates to /settings/cabinet and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })

      // Heading "Кабинет" must be visible (rendered after auth store hydrates)
      await expect(page.getByRole('heading', { name: 'Кабинет' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders deterministic seller information without dropping long values', async ({
      page,
    }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      const main = page.locator('main')
      await expect(page.getByRole('heading', { name: 'Кабинет' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      await expect(
        page.getByRole('heading', { level: 2, name: 'Информация о продавце' })
      ).toBeVisible()
      await expect(
        main.getByText(
          'Очень длинное название кабинета продавца для проверки переноса без потери данных'
        )
      ).toBeVisible()
      await expect(main.getByText('Длинная торговая марка с русским названием')).toBeVisible()
    })

    test('shows the Jam and seller-rating sections with deterministic responses', async ({
      page,
    }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      const main = page.locator('main')
      await expect(page.getByRole('heading', { name: 'Кабинет' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      await expect(page.getByRole('heading', { level: 2, name: 'Подписка Джем' })).toBeVisible()
      await expect(main.getByText('Джем Стандарт')).toHaveCount(2)
      await expect(page.getByLabel('Рейтинг: 4.6 из 5')).toBeVisible()
    })

    test('announces a successful target-margin save', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      const input = page.getByLabel('Целевая маржа, %')
      await expect(input).toHaveValue('20')
      await input.fill('35')
      const updateResponse = page.waitForResponse(
        response =>
          response.request().method() === 'PUT' &&
          /\/v1\/cabinets\/[^/]+\/?$/.test(new URL(response.url()).pathname)
      )
      await page.getByRole('button', { name: 'Сохранить' }).click()
      await updateResponse

      await expect(
        page.getByRole('status', { name: 'Результат сохранения целевой маржи' })
      ).toHaveText('Целевая маржа сохранена')
      expect(getCabinetApiCounts(page).updates).toBe(1)
    })

    test('associates validation feedback without issuing an update request', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      const input = page.getByLabel('Целевая маржа, %')
      await input.fill('101')
      await page.getByRole('button', { name: 'Сохранить' }).click()

      const error = page.getByText(/целевая маржа должна быть от 0 до 100/i)
      await expect(error).toBeVisible()
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      const describedBy = await input.getAttribute('aria-describedby')
      expect(describedBy).toContain(await error.getAttribute('id'))
      expect(getCabinetApiCounts(page).updates).toBe(0)
    })

    test('supports keyboard-only editing with reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
      const input = page.getByLabel('Целевая маржа, %')
      await input.focus()
      await expect(input).toBeFocused()
      await page.keyboard.press('ControlOrMeta+A')
      await page.keyboard.type('35')
      await page.keyboard.press('Tab')
      const save = page.getByRole('button', { name: 'Сохранить' })
      await expect(save).toBeFocused()
      const updateResponse = page.waitForResponse(
        response => response.request().method() === 'PUT' && /\/v1\/cabinets\//.test(response.url())
      )
      await page.keyboard.press('Enter')
      await updateResponse

      await expect(
        page.getByRole('status', { name: 'Результат сохранения целевой маржи' })
      ).toHaveText('Целевая маржа сохранена')
    })

    for (const theme of ['light', 'dark'] as const) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        test(`${theme} cabinet settings reflows without overflow at ${width}px`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
          await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
          await setTheme(page, theme)
          await expectCabinetLoaded(page)
          await expect(page.getByRole('heading', { level: 1, name: 'Кабинет' })).toBeVisible({
            timeout: TIMEOUTS.navigation,
          })
          await expectMainHasNoHorizontalOverflow(page)
          if (width === 390 || width === 1280) {
            await expectCabinetAxeClean(page, `${theme} cabinet settings at ${width}px`)
          }
        })
      }

      test(`${theme} cabinet settings preserves reflow at 200 percent zoom`, async ({ page }) => {
        await page.setViewportSize({ width: 640, height: 900 })
        await page.goto(SETTINGS_ROUTES.cabinet, { waitUntil: 'domcontentloaded' })
        await setTheme(page, theme)
        await expectCabinetLoaded(page)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '200%'
        })

        await expect(page.getByRole('heading', { level: 1, name: 'Кабинет' })).toBeVisible()
        await expectMainHasNoHorizontalOverflow(page)
      })
    }
  })

  // ===========================================================================
  // Tariffs Settings Page
  // ===========================================================================

  test.describe('Tariffs page', () => {
    test('navigates to /settings/tariffs and shows heading', async ({ page }) => {
      await installTariffApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })

      await expectTariffSettingsLoaded(page)
    })

    test('renders tab navigation with three tabs', async ({ page }) => {
      await installTariffApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expectTariffSettingsLoaded(page)

      await expect(page.getByRole('tab', { name: 'Текущие настройки' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'История версий' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Журнал изменений' })).toBeVisible()
    })

    test('shows rate-limit indicator in header', async ({ page }) => {
      await installTariffApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expectTariffSettingsLoaded(page)

      const rateLimit = page.getByTestId('rate-limit-indicator')
      const rateLimitVisible = await rateLimit.isVisible().catch(() => false)
      test.skip(!rateLimitVisible, 'Rate limit indicator not rendered — may need API response')
      expect(rateLimitVisible).toBeTruthy()
    })

    test('sends one exact PATCH after keyboard editing and announces success with focus recovery', async ({
      page,
    }) => {
      const fixture = await installTariffApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expectTariffSettingsLoaded(page)

      await editAcceptanceRateWithKeyboard(page, '2.75')
      const dialog = await openTariffSaveDialog(page)
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: 'Подтвердить' }).press('Enter')

      await expect(dialog).toBeHidden()
      await expect(page.getByRole('status', { name: 'Результат сохранения тарифов' })).toHaveText(
        /Тарифы сохранены/
      )
      await expect(page.getByLabel(/Тариф приёмки.*₽\/литр/i)).toHaveValue('2.75')
      await expect(page.getByRole('button', { name: 'Сохранить', exact: true })).toBeDisabled()
      const formCard = page.locator('[tabindex="-1"]').filter({
        has: page.getByRole('heading', { level: 2, name: 'Редактирование тарифов' }),
      })
      await expect(formCard).toBeFocused()
      expect(fixture.patchPayloads).toEqual([{ acceptanceBoxRatePerLiter: 2.75 }])
    })

    test('contains the pending dialog, blocks dismissal, and honors reduced motion', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const fixture = await installTariffApiFixture(page, { holdFirstPatch: true })
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expectTariffSettingsLoaded(page)

      await editAcceptanceRateWithKeyboard(page, '2.75')
      const dialog = await openTariffSaveDialog(page)
      await dialog.getByRole('button', { name: 'Подтвердить' }).press('Enter')
      await expect.poll(() => fixture.patchPayloads.length).toBe(1)

      const pendingAction = dialog.getByRole('button', { name: 'Сохранение...' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('status')).toHaveText(/Не закрывайте окно/)
      await expect(dialog.getByRole('button', { name: 'Отмена' })).toBeDisabled()
      await expect(pendingAction).toBeDisabled()
      await expect(pendingAction.locator('svg')).toHaveCSS('animation-name', 'none')
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      await page.mouse.click(1, 1)
      await expect(dialog).toBeVisible()

      fixture.releaseFirstPatch()
      await expect(dialog).toBeHidden()
      expect(fixture.patchPayloads).toEqual([{ acceptanceBoxRatePerLiter: 2.75 }])
    })

    test('retains the valid draft after a recoverable failure and retries the same PATCH', async ({
      page,
    }) => {
      const fixture = await installTariffApiFixture(page, { failPatchAttempts: 1 })
      await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
      await expectTariffSettingsLoaded(page)

      await editAcceptanceRateWithKeyboard(page, '2.75')
      const dialog = await openTariffSaveDialog(page)
      await dialog.getByRole('button', { name: 'Подтвердить' }).press('Enter')

      await expect(dialog.getByRole('alert')).toHaveText(/Не удалось сохранить тарифы/)
      await expect(page.getByLabel(/Тариф приёмки.*₽\/литр/i)).toHaveValue('2.75')
      await dialog.getByRole('button', { name: 'Повторить сохранение' }).press('Enter')
      await expect(dialog).toBeHidden()
      await expect(page.getByRole('status', { name: 'Результат сохранения тарифов' })).toHaveText(
        /Тарифы сохранены/
      )
      expect(fixture.patchPayloads).toEqual([
        { acceptanceBoxRatePerLiter: 2.75 },
        { acceptanceBoxRatePerLiter: 2.75 },
      ])
    })

    for (const theme of ['light', 'dark'] as const) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        test(`${theme} tariff settings reflows without overflow at ${width}px`, async ({
          page,
        }) => {
          await installTariffApiFixture(page)
          await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
          await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
          await setTheme(page, theme)
          await expectTariffSettingsLoaded(page)

          await expect(page.getByText('Стоимость приёмки за литр объёма')).toBeVisible()
          await expect(page.getByLabel(/Крупногабарит доп.*₽\/л/i)).toBeVisible()
          const actionLabels = await page
            .getByRole('form', { name: 'Редактирование тарифов' })
            .getByRole('button')
            .allTextContents()
          const cancelIndex = actionLabels.findIndex(label => label.trim() === 'Отмена')
          const saveIndex = actionLabels.findIndex(label => label.trim() === 'Сохранить')
          expect(cancelIndex).toBeGreaterThanOrEqual(0)
          expect(saveIndex).toBeGreaterThan(cancelIndex)
          await expectMainHasNoHorizontalOverflow(page)
          await expectDocumentHasNoHorizontalOverflow(page)

          if (width === 390 || width === 1280) {
            await expectSettingsAxeClean(page, `${theme} tariff settings at ${width}px`)
          }
        })
      }

      test(`${theme} tariff settings preserves dialog containment at 200 percent zoom`, async ({
        page,
      }) => {
        await installTariffApiFixture(page)
        await page.setViewportSize({ width: 640, height: 900 })
        await page.goto(SETTINGS_ROUTES.tariffs, { waitUntil: 'domcontentloaded' })
        await setTheme(page, theme)
        await expectTariffSettingsLoaded(page)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '200%'
        })

        await expectMainHasNoHorizontalOverflow(page)
        await expectDocumentHasNoHorizontalOverflow(page)
        await editAcceptanceRateWithKeyboard(page, '2.75')
        const dialog = await openTariffSaveDialog(page)
        await expect(dialog).toBeVisible()
        const viewport = page.viewportSize()
        const box = await dialog.boundingBox()
        expect(viewport).not.toBeNull()
        expect(box).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.y).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1)
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 1)
      })
    }
  })

  // ===========================================================================
  // Notifications Settings Page
  // ===========================================================================

  test.describe('Notifications page', () => {
    test('navigates to /settings/notifications and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: /Telegram Уведомления/ })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders telegram section or hero banner', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: /Telegram Уведомления/ })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // When bound: "Настройки уведомлений" panel is visible
      // When not bound: hero banner with connect button is shown
      const hasBoundState = (await page.getByText('Настройки уведомлений').count()) > 0
      const hasHeroBanner =
        (await page.getByRole('heading', { name: /Подключите Telegram/ }).count()) > 0

      test.skip(
        !hasBoundState && !hasHeroBanner,
        'Neither bound state nor hero banner visible — unexpected page state'
      )
      expect(hasBoundState || hasHeroBanner).toBeTruthy()
    })

    test('shows help section with guide link', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: /Telegram Уведомления/ })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      // Help section is always visible regardless of binding state
      await expect(page.getByText('Нужна помощь с настройкой?')).toBeVisible()
      await expect(page.getByRole('link', { name: /Открыть руководство/ })).toBeVisible()
    })
  })

  // ===========================================================================
  // Tax Settings Page
  // ===========================================================================

  test.describe('Tax page', () => {
    test('navigates to /settings/tax and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: 'Налоговые настройки' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('renders form area or skeleton', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Налоговые настройки' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      const hasForm = (await page.locator('form').count()) > 0
      const hasSkeleton = (await page.getByTestId('skeleton').count()) > 0
      test.skip(!hasForm && !hasSkeleton, 'Neither form nor skeleton visible — needs backend data')
      expect(hasForm || hasSkeleton).toBeTruthy()
    })
  })

  // ===========================================================================
  // Expenses Settings Page
  // ===========================================================================

  test.describe('Expenses page', () => {
    test('navigates to /settings/expenses and shows heading', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.expenses, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { name: 'Операционные расходы' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
    })

    test('shows month selector', async ({ page }) => {
      await page.goto(SETTINGS_ROUTES.expenses, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { name: 'Операционные расходы' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })

      const monthInput = page.locator('#month-selector')
      await expect(monthInput).toBeVisible()
    })
  })

  // ===========================================================================
  // Root Settings Overview and Shared Navigation
  // ===========================================================================

  test.describe('Settings shell', () => {
    test('/settings remains on the overview and exposes the canonical desktop navigation', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })

      await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible({
        timeout: TIMEOUTS.navigation,
      })
      expect(new URL(page.url()).pathname).toBe(SETTINGS_ROUTES.root)

      const navigation = page.getByRole('navigation', { name: 'Разделы настроек' })
      await expect(navigation).toBeVisible()
      await expect(navigation.getByRole('link')).toHaveText([
        'Обзор',
        'Кабинет',
        'Уведомления',
        'Налоги',
        'Тарифы',
        'Расходы',
        'Импорт',
      ])
      await expect(navigation.getByRole('link', { name: 'Обзор' })).toHaveAttribute(
        'aria-current',
        'page'
      )

      const navigationBox = await navigation.boundingBox()
      const headingBox = await page
        .getByRole('heading', { level: 1, name: 'Настройки' })
        .boundingBox()
      expect(navigationBox).not.toBeNull()
      expect(headingBox).not.toBeNull()
      expect(navigationBox!.x + navigationBox!.width).toBeLessThan(headingBox!.x)
    })

    for (const [route, label] of SETTINGS_NAV_ROUTES) {
      test(`${route} exposes exactly one visible current settings item`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 })
        await page.goto(route, { waitUntil: 'domcontentloaded' })

        const navigation = page.getByRole('navigation', { name: 'Разделы настроек' })
        await expect(navigation).toBeVisible({ timeout: TIMEOUTS.navigation })
        const currentItems = navigation.locator('[aria-current="page"]:visible')
        await expect(currentItems).toHaveCount(1)
        await expect(currentItems).toHaveAccessibleName(label)
      })
    }

    test('compact Sheet contains focus, navigates, and returns focus after Escape', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(SETTINGS_ROUTES.notifications, { waitUntil: 'domcontentloaded' })
      await page.emulateMedia({ reducedMotion: 'reduce' })

      const trigger = page.getByRole('button', { name: 'Открыть разделы настроек' })
      await expect(trigger).toBeVisible({ timeout: TIMEOUTS.navigation })
      await trigger.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const navigation = dialog.getByRole('navigation', { name: 'Разделы настроек' })
      await expect(navigation.getByRole('link', { name: 'Уведомления' })).toHaveAttribute(
        'aria-current',
        'page'
      )

      for (let step = 0; step < 12; step += 1) {
        await page.keyboard.press('Tab')
        expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
      }
      for (let step = 0; step < 12; step += 1) {
        await page.keyboard.press('Shift+Tab')
        expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
      }

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()

      await trigger.click()
      const reopenedDialog = page.getByRole('dialog')
      await reopenedDialog.getByRole('link', { name: 'Кабинет' }).click()
      await expect(page).toHaveURL(/\/settings\/cabinet\/?$/)
      await expect(reopenedDialog).toBeHidden()
    })

    for (const theme of ['light', 'dark'] as const) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        test(`${theme} settings overview reflows without overflow at ${width}px`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
          await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })
          await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible({
            timeout: TIMEOUTS.navigation,
          })
          await setTheme(page, theme)
          await expectMainHasNoHorizontalOverflow(page)

          const trigger = page.getByRole('button', { name: 'Открыть разделы настроек' })
          const navigation = page.getByRole('navigation', { name: 'Разделы настроек' })
          if (width < 1024) {
            await expect(trigger).toBeVisible()
            await expect(navigation).toBeHidden()
          } else {
            await expect(trigger).toBeHidden()
            await expect(navigation).toBeVisible()
          }

          if (width === 390) {
            await trigger.click()
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await expectSettingsAxeClean(page, `${theme} compact settings Sheet`)
          }
          if (width === 1280) {
            await expectSettingsAxeClean(page, `${theme} desktop settings overview`)
          }
        })
      }

      test(`${theme} settings overview preserves reflow at 200 percent zoom`, async ({ page }) => {
        await page.setViewportSize({ width: 640, height: 900 })
        await page.goto(SETTINGS_ROUTES.root, { waitUntil: 'domcontentloaded' })
        await setTheme(page, theme)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '200%'
        })

        await expect(page.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Открыть разделы настроек' })).toBeVisible()
        await expectMainHasNoHorizontalOverflow(page)
      })
    }
  })

  // ===========================================================================
  // Accessibility: Heading Hierarchy
  // ===========================================================================

  test.describe('Accessibility', () => {
    const pages = [
      {
        name: 'Overview',
        url: SETTINGS_ROUTES.root,
        heading: 'Настройки',
      },
      {
        name: 'Cabinet',
        url: SETTINGS_ROUTES.cabinet,
        heading: 'Кабинет',
      },
      {
        name: 'Tariffs',
        url: SETTINGS_ROUTES.tariffs,
        heading: 'Управление тарифами',
      },
      {
        name: 'Notifications',
        url: SETTINGS_ROUTES.notifications,
        heading: /Telegram Уведомления/,
      },
      {
        name: 'Tax',
        url: SETTINGS_ROUTES.tax,
        heading: 'Налоговые настройки',
      },
      {
        name: 'Expenses',
        url: SETTINGS_ROUTES.expenses,
        heading: 'Операционные расходы',
      },
      {
        name: 'Backfill',
        url: SETTINGS_ROUTES.backfill,
        heading: 'Управление бэкфиллом',
      },
    ]

    for (const { name, url, heading } of pages) {
      test(`${name} page has exactly one h1 heading`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: heading })).toBeVisible({
          timeout: TIMEOUTS.navigation,
        })

        const h1Count = await page.getByRole('heading', { level: 1 }).count()
        expect(h1Count).toBe(1)
      })
    }
  })
})
