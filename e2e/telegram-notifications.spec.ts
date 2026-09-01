import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Locator, type Page } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

type MutationMode = 'success' | 'failure' | 'pending'

type TelegramStatus = {
  bound: boolean
  telegram_user_id: number | null
  telegram_username: string | null
  binding_expires_at: string | null
}

type NotificationPreferences = {
  cabinet_id: string
  telegram_enabled: boolean
  telegram_bound: boolean
  telegram_username: string | null
  preferences: {
    task_completed: boolean
    task_failed: boolean
    task_stalled: boolean
    daily_digest: boolean
    digest_time: string
  }
  language: 'ru' | 'en'
  quiet_hours: {
    enabled: boolean
    from: string
    to: string
    timezone: string
  }
}

type OrderNotificationSettings = {
  cabinetId: string
  newOrderEnabled: boolean
  slaWarningEnabled: boolean
  dailySummaryEnabled: boolean
  dailySummaryHour: number
  quietHoursStart: number
  quietHoursEnd: number
  confirmationSlaWarningMinutes: number
  completionSlaWarningMinutes: number
}

type TelegramFixture = {
  status: TelegramStatus
  preferences: NotificationPreferences
  orderSettings: OrderNotificationSettings
  statusRequests: number
  preferenceReads: number
  orderSettingsReads: number
  bindRequests: Record<string, unknown>[]
  preferenceWrites: Record<string, unknown>[]
  orderSettingsWrites: Record<string, unknown>[]
  unbindRequests: number
  bindMode: MutationMode
  preferenceMode: MutationMode
  unbindMode: MutationMode
  releaseBind?: () => void
  releasePreference?: () => void
  releaseUnbind?: () => void
}

const BOUND_USERNAME = 'очень_длинное_имя_telegram_для_проверки_переноса'
const BINDING_CODE = 'STORY735'

function createFixture(bound = true): TelegramFixture {
  return {
    status: {
      bound,
      telegram_user_id: bound ? 1735 : null,
      telegram_username: bound ? BOUND_USERNAME : null,
      binding_expires_at: null,
    },
    preferences: {
      cabinet_id: 'cabinet-story-173-5',
      telegram_enabled: bound,
      telegram_bound: bound,
      telegram_username: bound ? BOUND_USERNAME : null,
      preferences: {
        task_completed: true,
        task_failed: false,
        task_stalled: false,
        daily_digest: true,
        digest_time: '08:00',
      },
      language: 'ru',
      quiet_hours: {
        enabled: true,
        from: '23:00',
        to: '07:00',
        timezone: 'Europe/Moscow',
      },
    },
    orderSettings: {
      cabinetId: 'cabinet-story-173-5',
      newOrderEnabled: true,
      slaWarningEnabled: true,
      dailySummaryEnabled: true,
      dailySummaryHour: 9,
      quietHoursStart: 23,
      quietHoursEnd: 7,
      confirmationSlaWarningMinutes: 30,
      completionSlaWarningMinutes: 60,
    },
    statusRequests: 0,
    preferenceReads: 0,
    orderSettingsReads: 0,
    bindRequests: [],
    preferenceWrites: [],
    orderSettingsWrites: [],
    unbindRequests: 0,
    bindMode: 'success',
    preferenceMode: 'success',
    unbindMode: 'success',
  }
}

function mergePreferences(
  current: NotificationPreferences,
  update: Record<string, unknown>
): NotificationPreferences {
  const eventTypes =
    update.preferences && typeof update.preferences === 'object'
      ? (update.preferences as Partial<NotificationPreferences['preferences']>)
      : {}
  const quietHours =
    update.quiet_hours && typeof update.quiet_hours === 'object'
      ? (update.quiet_hours as Partial<NotificationPreferences['quiet_hours']>)
      : {}

  return {
    ...current,
    ...update,
    language: update.language === 'en' ? 'en' : current.language,
    preferences: { ...current.preferences, ...eventTypes },
    quiet_hours: { ...current.quiet_hours, ...quietHours },
  }
}

async function waitForRelease(assign: (release: () => void) => void) {
  await new Promise<void>(resolve => assign(resolve))
}

async function installTelegramFixture(page: Page, state: TelegramFixture) {
  await page.route('**/v1/notifications/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()

    if (url.pathname.endsWith('/v1/notifications/telegram/status') && method === 'GET') {
      state.statusRequests += 1
      await route.fulfill({ status: 200, json: state.status })
      return
    }

    if (url.pathname.endsWith('/v1/notifications/telegram/bind') && method === 'POST') {
      state.bindRequests.push((request.postDataJSON() ?? {}) as Record<string, unknown>)
      if (state.bindMode === 'pending') {
        await waitForRelease(release => {
          state.releaseBind = release
        })
      }
      if (state.bindMode === 'failure') {
        await route.fulfill({ status: 500, json: { detail: 'binding unavailable' } })
        return
      }
      await route.fulfill({
        status: 200,
        json: {
          binding_code: BINDING_CODE,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          instructions: `Отправьте боту команду /start ${BINDING_CODE}`,
          deep_link: `https://t.me/Kernel_crypto_bot?start=${BINDING_CODE}`,
        },
      })
      return
    }

    if (url.pathname.endsWith('/v1/notifications/telegram/unbind') && method === 'DELETE') {
      state.unbindRequests += 1
      if (state.unbindMode === 'pending') {
        await waitForRelease(release => {
          state.releaseUnbind = release
        })
      }
      if (state.unbindMode === 'failure') {
        await route.fulfill({ status: 500, json: { detail: 'unbind failed' } })
        return
      }
      state.status = {
        bound: false,
        telegram_user_id: null,
        telegram_username: null,
        binding_expires_at: null,
      }
      await route.fulfill({ status: 204, body: '' })
      return
    }

    if (url.pathname.endsWith('/v1/notifications/preferences') && method === 'GET') {
      state.preferenceReads += 1
      await route.fulfill({ status: 200, json: state.preferences })
      return
    }

    if (url.pathname.endsWith('/v1/notifications/preferences') && method === 'PUT') {
      const update = request.postDataJSON() as Record<string, unknown>
      state.preferenceWrites.push(update)
      if (state.preferenceMode === 'pending') {
        await waitForRelease(release => {
          state.releasePreference = release
        })
      }
      if (state.preferenceMode === 'failure') {
        await route.fulfill({ status: 500, json: { detail: 'preference save failed' } })
        return
      }
      state.preferences = mergePreferences(state.preferences, update)
      await route.fulfill({ status: 200, json: state.preferences })
      return
    }

    if (url.pathname.endsWith('/v1/notifications/orders/settings') && method === 'GET') {
      state.orderSettingsReads += 1
      await route.fulfill({ status: 200, json: state.orderSettings })
      return
    }

    if (url.pathname.endsWith('/v1/notifications/orders/settings') && method === 'POST') {
      const update = request.postDataJSON() as Record<string, unknown>
      state.orderSettingsWrites.push(update)
      state.orderSettings = { ...state.orderSettings, ...update }
      await route.fulfill({ status: 200, json: state.orderSettings })
      return
    }

    throw new Error(`Unexpected notifications request: ${method} ${url.pathname}`)
  })
}

async function openNotifications(page: Page, state: TelegramFixture) {
  await installTelegramFixture(page, state)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(ROUTES.settings.notifications, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1, name: 'Telegram Уведомления' })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
  await expect.poll(() => state.orderSettingsReads).toBeGreaterThan(0)
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(selectedTheme => window.localStorage.setItem('theme', selectedTheme), theme)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(
    theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
  )
  await expect(page.getByRole('heading', { level: 1, name: 'Telegram Уведомления' })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
}

async function expectMainHasNoHorizontalOverflow(page: Page) {
  const main = page.locator('main').first()
  await expect(main).toBeVisible()
  const dimensions = await main.evaluate(node => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
}

async function expectDialogFitsViewport(
  page: Page,
  dialog: Locator,
  actionNames: readonly string[]
) {
  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  await expect(dialog).toBeVisible()
  await expect
    .poll(async () => {
      const box = await dialog.boundingBox()
      if (!box) return Number.POSITIVE_INFINITY
      return Math.max(
        0,
        -box.x,
        -box.y,
        box.x + box.width - viewport!.width,
        box.y + box.height - viewport!.height
      )
    })
    .toBeLessThanOrEqual(1)

  for (const name of actionNames) {
    const action = dialog.getByRole('button', { name })
    await action.scrollIntoViewIfNeeded()
    await expect(action).toBeVisible()
    await expect
      .poll(async () => {
        const actionBox = await action.boundingBox()
        if (!actionBox) return Number.POSITIVE_INFINITY
        return Math.max(0, -actionBox.y, actionBox.y + actionBox.height - viewport!.height)
      })
      .toBeLessThanOrEqual(1)
  }
}

async function expectScopedAxeClean(page: Page, selector: string, context: string) {
  await expect(page.locator(selector).first()).toBeVisible({ timeout: TIMEOUTS.navigation })
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze()
  expect(results.violations, context).toEqual([])
}

test.describe('Telegram notification settings', () => {
  test('presents the unbound state without enabling Telegram preferences', async ({ page }) => {
    const state = createFixture(false)
    await openNotifications(page, state)

    await expect(
      page.getByRole('heading', { level: 2, name: 'Получайте уведомления в Telegram' })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Подключить Telegram' })).toBeVisible()
    await expect(
      page.getByText('Настройки уведомлений станут доступны после подключения')
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Настройки уведомлений' })
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Тихие часы' })).toBeVisible()
    await expect(page.getByText('Уведомления о заказах FBS', { exact: true })).toBeVisible()
  })

  test('presents bound Telegram identity and operable named settings', async ({ page }) => {
    await openNotifications(page, createFixture())

    await expect(page.getByText('Telegram подключен', { exact: true })).toBeVisible()
    await expect(page.getByText(`@${BOUND_USERNAME}`)).toBeVisible()
    await expect(
      page.getByRole('switch', { name: 'Задача завершилась с ошибкой' })
    ).not.toBeChecked()
    await expect(page.getByRole('switch', { name: 'Включить тихие часы' })).toBeChecked()
    await expect(page.getByText('Уведомления о заказах FBS', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Подключение Telegram' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 2, name: 'Настройки уведомлений' })
    ).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Тихие часы' })).toBeVisible()
  })

  test('announces binding-code creation while the request is pending', async ({ page }) => {
    const state = createFixture(false)
    state.bindMode = 'pending'
    await openNotifications(page, state)

    await page.getByRole('button', { name: 'Подключить Telegram' }).press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Подключение Telegram' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('status', { name: /создаём код привязки/i })).toBeVisible()
    expect(state.bindRequests).toEqual([{}])

    state.bindMode = 'success'
    state.releaseBind?.()
    await expect(dialog.getByText(`/start ${BINDING_CODE}`)).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('shows a generated binding code and verification-pending status', async ({ page }) => {
    const state = createFixture(false)
    await openNotifications(page, state)

    await page.getByRole('button', { name: 'Подключить Telegram' }).click()
    const dialog = page.getByRole('dialog', { name: 'Подключение Telegram' })
    await expect(dialog.getByText(`/start ${BINDING_CODE}`)).toBeVisible()
    await expect(dialog.getByRole('progressbar')).toHaveAccessibleName(/время до истечения кода/i)
    await expect(dialog.getByRole('status')).toContainText('Ожидаем подтверждения')
    expect(state.bindRequests).toEqual([{}])
  })

  test('saves a changed notification preference and announces success', async ({ page }) => {
    const state = createFixture()
    await openNotifications(page, state)

    await page.getByRole('switch', { name: 'Задача завершилась с ошибкой' }).click()
    await expect(page.getByText(/несохранённые изменения/i)).toBeVisible()
    await page.getByRole('button', { name: 'Сохранить настройки' }).click()

    await expect(page.getByText('Настройки сохранены', { exact: true })).toBeVisible()
    expect(state.preferenceWrites).toHaveLength(1)
    expect(state.preferenceWrites[0]).toMatchObject({
      preferences: { task_failed: true },
      language: 'ru',
      quiet_hours: state.preferences.quiet_hours,
    })
  })

  test('edits and saves digest time without disabling the digest event', async ({ page }) => {
    const state = createFixture()
    await openNotifications(page, state)
    const digestSwitch = page.getByRole('switch', { name: 'Ежедневный дайджест' })
    const digestTime = page.getByLabel('Время отправки ежедневного дайджеста')

    await digestTime.click()
    await digestTime.fill('09:15')
    await expect(digestSwitch).toBeChecked()
    await page.getByRole('button', { name: 'Сохранить настройки' }).click()

    await expect(page.getByText('Настройки сохранены', { exact: true })).toBeVisible()
    expect(state.preferenceWrites).toHaveLength(1)
    expect(state.preferenceWrites[0]).toMatchObject({
      preferences: { daily_digest: true, digest_time: '09:15' },
    })
  })

  test('announces a preference-save failure after the configured retry', async ({ page }) => {
    const state = createFixture()
    state.preferenceMode = 'failure'
    await openNotifications(page, state)

    await page.getByRole('switch', { name: 'Задача завершилась с ошибкой' }).click()
    await page.getByRole('button', { name: 'Сохранить настройки' }).click()

    await expect(
      page.getByText('Не удалось сохранить настройки. Попробуйте ещё раз.')
    ).toBeVisible()
    expect(state.preferenceWrites).toHaveLength(2)
    expect(state.preferenceWrites[1]).toEqual(state.preferenceWrites[0])
  })

  test('writes a valid quiet-hours change immediately with the exact value', async ({ page }) => {
    const state = createFixture()
    await openNotifications(page, state)

    await page.getByLabel('Начало тихих часов').fill('22:30')

    await expect.poll(() => state.preferenceWrites.length).toBe(1)
    expect(state.preferenceWrites[0]).toEqual({
      quiet_hours: {
        enabled: true,
        from: '22:30',
        to: '07:00',
        timezone: 'Europe/Moscow',
      },
    })
  })

  test('associates an invalid quiet-hours value without writing preferences', async ({ page }) => {
    const state = createFixture()
    await openNotifications(page, state)
    const start = page.getByLabel('Начало тихих часов')

    await start.fill('')

    await expect(start).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await start.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy}`)).toHaveAttribute('role', 'alert')
    await expect(page.locator(`#${describedBy}`)).not.toHaveText('')
    expect(state.preferenceWrites).toHaveLength(0)
  })

  test('unbinds only after confirmation and returns to the unbound state', async ({ page }) => {
    const state = createFixture()
    await openNotifications(page, state)
    await page.getByRole('button', { name: 'Отключить Telegram' }).click()

    const dialog = page.getByRole('alertdialog', { name: 'Отключить Telegram?' })
    await expect(dialog).toBeVisible()
    expect(state.unbindRequests).toBe(0)
    await dialog.getByRole('button', { name: 'Подтвердить отключение Telegram' }).click()

    await expect(page.getByText('Telegram отключен', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Подключить Telegram' })).toBeVisible()
    expect(state.unbindRequests).toBe(1)
  })

  test('keeps unbind confirmation guarded until the pending request succeeds', async ({ page }) => {
    const state = createFixture()
    state.unbindMode = 'pending'
    await openNotifications(page, state)
    await page.getByRole('button', { name: 'Отключить Telegram' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Отключить Telegram?' })

    await dialog.getByRole('button', { name: 'Подтвердить отключение Telegram' }).click()
    await expect.poll(() => state.unbindRequests).toBe(1)
    await expect.poll(() => Boolean(state.releaseUnbind)).toBe(true)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Отменить отключение' })).toBeDisabled()
    await expect(
      dialog.getByRole('button', { name: 'Подтвердить отключение Telegram' })
    ).toBeDisabled()
    await page.keyboard.press('Escape')
    await page.mouse.click(1, 1)
    await expect(dialog).toBeVisible()

    state.unbindMode = 'success'
    state.releaseUnbind?.()
    await expect(page.getByRole('button', { name: 'Подключить Telegram' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Настройки Telegram-уведомлений' })).toBeFocused()
  })

  test('keeps unbind confirmation retryable after a request failure and retry', async ({
    page,
  }) => {
    const state = createFixture()
    state.unbindMode = 'failure'
    await openNotifications(page, state)
    await page.getByRole('button', { name: 'Отключить Telegram' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Отключить Telegram?' })

    await dialog.getByRole('button', { name: 'Подтвердить отключение Telegram' }).click()

    await expect(page.getByText('Не удалось отключить Telegram. Попробуйте ещё раз.')).toBeVisible()
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Подтвердить отключение Telegram' })
    ).toBeEnabled()
    await expect(page.getByText('Telegram подключен', { exact: true })).toBeVisible()
    expect(state.unbindRequests).toBe(2)
  })

  test('contains unbind focus and returns it to the invoking action after Escape', async ({
    page,
  }) => {
    await openNotifications(page, createFixture())
    const trigger = page.getByRole('button', { name: 'Отключить Telegram' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('alertdialog', { name: 'Отключить Telegram?' })
    await expect(dialog).toBeVisible()

    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('contains binding focus and returns it to the connect action when closed', async ({
    page,
  }) => {
    await openNotifications(page, createFixture(false))
    const trigger = page.getByRole('button', { name: 'Подключить Telegram' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Подключение Telegram' })
    await expect(dialog).toBeVisible()
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 390, 768, 1024, 1280, 1440]) {
      test(`${theme} bound notification settings reflow without overflow at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: width < 1024 ? 844 : 900 })
        await openNotifications(page, createFixture())
        await setTheme(page, theme)

        await expect(page.getByText(`@${BOUND_USERNAME}`)).toBeVisible()
        await expect(
          page.getByRole('switch', { name: 'Задача завершилась с ошибкой' })
        ).toBeVisible()
        await expect(page.getByLabel('Начало тихих часов')).toBeVisible()
        await expectMainHasNoHorizontalOverflow(page)
      })
    }

    test(`${theme} binding modal fits the 320px viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 844 })
      await openNotifications(page, createFixture(false))
      await setTheme(page, theme)
      await page.getByRole('button', { name: 'Подключить Telegram' }).click()
      const dialog = page.getByRole('dialog', { name: 'Подключение Telegram' })
      await expect(dialog).toBeVisible()
      const box = await dialog.boundingBox()
      expect(box).not.toBeNull()
      const isContainedByViewport = box!.x >= 0 && box!.x + box!.width <= 321
      expect(isContainedByViewport).toBe(true)
    })

    test(`${theme} unbind confirmation remains reachable at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 450 })
      await openNotifications(page, createFixture())
      await setTheme(page, theme)
      await page.getByRole('button', { name: 'Отключить Telegram' }).click()
      const dialog = page.getByRole('alertdialog', { name: 'Отключить Telegram?' })

      await expectDialogFitsViewport(page, dialog, [
        'Отменить отключение',
        'Подтвердить отключение Telegram',
      ])
      await expectMainHasNoHorizontalOverflow(page)
    })

    test(`${theme} notification settings preserve reflow at 200 percent zoom`, async ({ page }) => {
      await page.setViewportSize({ width: 640, height: 900 })
      await openNotifications(page, createFixture())
      await setTheme(page, theme)
      await page.evaluate(() => {
        document.documentElement.style.zoom = '200%'
      })

      await expect(page.getByRole('switch', { name: 'Задача завершилась с ошибкой' })).toBeVisible()
      await expectMainHasNoHorizontalOverflow(page)
      await page.getByRole('button', { name: 'Отключить Telegram' }).click()
      await expectDialogFitsViewport(
        page,
        page.getByRole('alertdialog', { name: 'Отключить Telegram?' }),
        ['Отменить отключение', 'Подтвердить отключение Telegram']
      )
    })

    test(`${theme} bound settings are scoped axe clean`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await openNotifications(page, createFixture())
      await setTheme(page, theme)
      await expectScopedAxeClean(page, 'main', `${theme} bound notification settings`)
    })
  }

  test('binding dialog is scoped axe clean', async ({ page }) => {
    await openNotifications(page, createFixture(false))
    await page.getByRole('button', { name: 'Подключить Telegram' }).click()
    await expect(page.getByText(`/start ${BINDING_CODE}`)).toBeVisible()
    await expectScopedAxeClean(page, '[role="dialog"]', 'Telegram binding dialog')
  })

  test('unbind confirmation is scoped axe clean', async ({ page }) => {
    await openNotifications(page, createFixture())
    await page.getByRole('button', { name: 'Отключить Telegram' }).click()
    await expect(page.getByRole('alertdialog', { name: 'Отключить Telegram?' })).toBeVisible()
    await expectScopedAxeClean(page, '[role="alertdialog"]', 'Telegram unbind confirmation')
  })
})
