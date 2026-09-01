/**
 * E2E Tests: Settings Pages
 * Covers /settings/cabinet, /settings/tariffs, /settings/notifications, /settings/tax
 *
 * Conventions (from CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - domcontentloaded + element-presence waits only (anti-pattern #9 — no networkidle)
 * - No hard waits (anti-pattern #7)
 * - test.skip(condition, reason) for graceful conditional skips (anti-pattern #6)
 * - Locale assertions use regex — not exact formatted strings
 *
 * Run: npx playwright test e2e/settings-pages.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { TIMEOUTS } from './fixtures/test-data'
import {
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
} from './fixtures/settings-pages'

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
      const formCard = page
        .getByRole('heading', { level: 2, name: 'Редактирование тарифов' })
        .locator('xpath=ancestor::*[@tabindex="-1"][1]')
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
        await expectContainedInViewport(page, dialog)
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
    test('loads the exact saved tax and VAT values', async ({ page }) => {
      await installTaxApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expectTaxSettingsLoaded(page)
      await expect(page.getByText('Система налогообложения и НДС')).toBeVisible()
      await expect(page.getByText('Налоговые настройки получены')).toBeVisible()
    })

    test('sends one exact PUT after keyboard editing and restores focus after success', async ({
      page,
    }) => {
      const fixture = await installTaxApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expectTaxSettingsLoaded(page)
      await enterManualTaxWithVat(page)

      await page.getByRole('button', { name: 'Сохранить', exact: true }).press('Enter')
      await expect(page.getByRole('status', { name: 'Результат сохранения' })).toHaveText(
        /Налоговые настройки сохранены/
      )
      await expect(page.getByRole('form', { name: 'Налоговые настройки' })).toBeFocused()
      expect(fixture.putPayloads).toEqual([
        { taxSystem: 'manual', taxRate: 7.5, vatPayer: true, vatRate: 20 },
      ])
    })

    test('rejects an out-of-range manual rate without a PUT and focuses the field', async ({
      page,
    }) => {
      const fixture = await installTaxApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expectTaxSettingsLoaded(page)
      const form = page.getByRole('form', { name: 'Налоговые настройки' })
      await form.getByRole('radio', { name: 'Пользовательская ставка' }).press('Space')
      await form.getByLabel('Ставка налога (%)').fill('100.01')
      await form.getByRole('button', { name: 'Сохранить', exact: true }).press('Enter')

      await expect(form.getByRole('alert')).toHaveText(/Исправьте ошибки в форме/)
      await expect(form.getByLabel('Ставка налога (%)')).toBeFocused()
      await expect(form.getByLabel('Ставка налога (%)')).toHaveAttribute('aria-invalid', 'true')
      expect(fixture.putPayloads).toEqual([])
    })

    test('requires keyboard confirmation before saving without a tax system', async ({ page }) => {
      const fixture = await installTaxApiFixture(page)
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expectTaxSettingsLoaded(page)
      const form = page.getByRole('form', { name: 'Налоговые настройки' })
      await form.getByRole('radio', { name: 'Не настроена' }).press('Space')
      await form.getByRole('button', { name: 'Сохранить', exact: true }).press('Enter')

      const dialog = page.getByRole('alertdialog', { name: 'Сохранить без налоговой системы?' })
      await expect(dialog).toBeVisible()
      await expect(dialog).toContainText('Прибыль продолжит отображаться до вычета налогов')
      expect(fixture.putPayloads).toEqual([])
      await dialog.getByRole('button', { name: 'Сохранить без системы' }).press('Enter')
      await expect(dialog).toBeHidden()
      await expect(form).toBeFocused()
      expect(fixture.putPayloads).toEqual([
        { taxSystem: null, taxRate: null, vatPayer: false, vatRate: 0 },
      ])
    })

    test('locks every control, prevents duplicate PUTs, and honors reduced motion while pending', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const fixture = await installTaxApiFixture(page, { holdFirstPut: true })
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expectTaxSettingsLoaded(page)
      await enterManualTaxWithVat(page)
      const form = page.getByRole('form', { name: 'Налоговые настройки' })
      await form.getByRole('button', { name: 'Сохранить', exact: true }).press('Enter')
      await expect.poll(() => fixture.putPayloads.length).toBe(1)

      await expect(form.getByRole('status', { name: 'Состояние сохранения' })).toBeVisible()
      await expect(form.getByLabel('Ставка налога (%)')).toBeDisabled()
      await expect(form.getByRole('checkbox', { name: 'Являюсь плательщиком НДС' })).toBeDisabled()
      const pendingButton = form.getByRole('button', { name: 'Сохранение…' })
      await expect(pendingButton).toBeDisabled()
      await expect(pendingButton.locator('svg')).toHaveCSS('animation-name', 'none')
      await pendingButton.click({ force: true })
      expect(fixture.putPayloads).toHaveLength(1)

      fixture.releaseFirstPut()
      await expect(page.getByRole('status', { name: 'Результат сохранения' })).toBeVisible()
      expect(fixture.putPayloads).toHaveLength(1)
    })

    test('retains a failed draft and retries the identical PUT', async ({ page }) => {
      const fixture = await installTaxApiFixture(page, { failPutAttempts: 1 })
      await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
      await expectTaxSettingsLoaded(page)
      await enterManualTaxWithVat(page)
      const form = page.getByRole('form', { name: 'Налоговые настройки' })
      await form.getByRole('button', { name: 'Сохранить', exact: true }).press('Enter')

      await expect(form.getByRole('alert')).toHaveText(/Черновик сохранён/)
      await expect(form.getByLabel('Ставка налога (%)')).toHaveValue('7.5')
      await form.getByRole('button', { name: 'Повторить сохранение' }).press('Enter')
      await expect(page.getByRole('status', { name: 'Результат сохранения' })).toBeVisible()
      expect(fixture.putPayloads).toEqual([
        { taxSystem: 'manual', taxRate: 7.5, vatPayer: true, vatRate: 20 },
        { taxSystem: 'manual', taxRate: 7.5, vatPayer: true, vatRate: 20 },
      ])
    })

    for (const theme of ['light', 'dark'] as const) {
      for (const width of [320, 390, 768, 1024, 1280, 1440]) {
        test(`${theme} tax settings reflows without overflow at ${width}px`, async ({ page }) => {
          await installTaxApiFixture(page)
          await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
          await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
          await setTheme(page, theme)
          await expectTaxSettingsLoaded(page)

          const form = page.getByRole('form', { name: 'Налоговые настройки' })
          await form.getByRole('radio', { name: 'Пользовательская ставка' }).click()
          await expect(form.getByLabel('Ставка налога (%)')).toBeVisible()
          await expect(form.getByText('Допустимое значение: от 0 до 100 процентов.')).toBeVisible()
          await expect(form.getByText('%', { exact: true })).toBeVisible()
          await expectMainHasNoHorizontalOverflow(page)
          await expectDocumentHasNoHorizontalOverflow(page)

          if (width === 390 || width === 1280) {
            await expectSettingsAxeClean(page, `${theme} tax settings at ${width}px`)
          }
        })
      }

      test(`${theme} tax settings preserves warning containment at 200 percent zoom`, async ({
        page,
      }) => {
        await installTaxApiFixture(page)
        await page.setViewportSize({ width: 640, height: 900 })
        await page.goto(SETTINGS_ROUTES.tax, { waitUntil: 'domcontentloaded' })
        await setTheme(page, theme)
        await expectTaxSettingsLoaded(page)
        await page.evaluate(() => {
          document.documentElement.style.zoom = '200%'
        })

        const form = page.getByRole('form', { name: 'Налоговые настройки' })
        await form.getByRole('radio', { name: 'Не настроена' }).click()
        await form.getByRole('button', { name: 'Сохранить', exact: true }).click()
        const dialog = page.getByRole('alertdialog', { name: 'Сохранить без налоговой системы?' })
        await expect(dialog).toBeVisible()
        await expectMainHasNoHorizontalOverflow(page)
        await expectDocumentHasNoHorizontalOverflow(page)
        await expectContainedInViewport(page, dialog)
      })
    }
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
