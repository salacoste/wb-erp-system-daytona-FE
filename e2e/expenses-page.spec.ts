import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Locator, type Page } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

/**
 * 174.4: axe analysis with a single dev-reload recovery. Under full-suite
 * load `next dev` can finish a background compile mid-analyze and force a
 * page reload, destroying the execution context ("Execution context was
 * destroyed, most likely because of a navigation" — both light and dark
 * baseline failures at the first .analyze()). One retry after re-awaiting
 * the page heading absorbs that transient without masking real violations.
 */
async function analyzeStably(
  page: Page,
  build: () => AxeBuilder,
  settleHeading: string,
  // Post-recovery existence guard (174.4 review F4): a reload mid-analysis can
  // close a dialog, making the retried include() scan zero elements and pass
  // vacuously. Callers that target overlays must pass a stillPresent locator
  // asserted after the settle wait, before the retry is trusted.
  stillPresent?: Locator
): Promise<Awaited<ReturnType<AxeBuilder['analyze']>>> {
  try {
    return await build().analyze()
  } catch (error) {
    const destroyed = error instanceof Error && /destroyed/i.test(error.message)
    if (!destroyed) throw error
    await expect(page.getByRole('heading', { name: settleHeading })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    if (stillPresent) {
      await expect(stillPresent).toBeVisible({ timeout: TIMEOUTS.api })
    }
    return await build().analyze()
  }
}

type ExpenseRecord = {
  id: string
  cabinetId: string
  category: string
  amount: number
  month: string
  description: string | null
  createdAt: string
  updatedAt: string
}

type MutationMode = 'success' | 'failure' | 'pending'

type ExpenseFixture = {
  records: ExpenseRecord[]
  listRequests: string[]
  summaryRequests: string[]
  creates: Record<string, unknown>[]
  updates: Array<{ id: string; body: Record<string, unknown> }>
  deletes: string[]
  createMode: MutationMode
  updateMode: MutationMode
  deleteMode: MutationMode
  releaseCreate?: () => void
  releaseUpdate?: () => void
  releaseDelete?: () => void
}

const MONTH = '2026-08'
const RECORD: ExpenseRecord = {
  id: 'expense-rent',
  cabinetId: 'cabinet-1',
  category: 'rent',
  amount: 50000,
  month: MONTH,
  description: 'Очень длинное описание аренды большого офиса для проверки переноса данных',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
}

function createFixture(records: ExpenseRecord[] = [RECORD]): ExpenseFixture {
  return {
    records: records.map(record => ({ ...record })),
    listRequests: [],
    summaryRequests: [],
    creates: [],
    updates: [],
    deletes: [],
    createMode: 'success',
    updateMode: 'success',
    deleteMode: 'success',
  }
}

function summary(records: ExpenseRecord[]) {
  const byCategory = { rent: 0, salary: 0, packaging: 0, transport: 0, other: 0 }
  for (const record of records) {
    byCategory[record.category as keyof typeof byCategory] += record.amount
  }
  const total = records.reduce((sum, record) => sum + record.amount, 0)
  return { total, byCategory, byMonth: [{ month: MONTH, total }] }
}

async function installFixture(page: Page, state: ExpenseFixture) {
  await page.route('**/v1/expenses**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()

    if (url.pathname.endsWith('/v1/expenses/summary') && method === 'GET') {
      state.summaryRequests.push(url.search)
      await route.fulfill({ status: 200, json: summary(state.records) })
      return
    }
    if (url.pathname.endsWith('/v1/expenses') && method === 'GET') {
      state.listRequests.push(url.search)
      await route.fulfill({ status: 200, json: state.records })
      return
    }
    if (url.pathname.endsWith('/v1/expenses') && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>
      state.creates.push(body)
      if (state.createMode === 'pending') {
        await new Promise<void>(resolve => {
          state.releaseCreate = resolve
        })
      }
      if (state.createMode === 'failure') {
        await route.fulfill({ status: 500, json: { detail: 'create failed' } })
        return
      }
      const created: ExpenseRecord = {
        ...RECORD,
        id: 'expense-created',
        category: String(body.category),
        amount: Number(body.amount),
        month: String(body.month),
        description: typeof body.description === 'string' ? body.description : null,
      }
      state.records.push(created)
      await route.fulfill({ status: 200, json: created })
      return
    }

    const id = url.pathname.split('/').at(-1) ?? ''
    if (method === 'PUT') {
      const body = request.postDataJSON() as Record<string, unknown>
      state.updates.push({ id, body })
      if (state.updateMode === 'pending') {
        await new Promise<void>(resolve => {
          state.releaseUpdate = resolve
        })
      }
      if (state.updateMode === 'failure') {
        await route.fulfill({ status: 500, json: { detail: 'update failed' } })
        return
      }
      const index = state.records.findIndex(record => record.id === id)
      state.records[index] = { ...state.records[index], ...body }
      await route.fulfill({ status: 200, json: state.records[index] })
      return
    }
    if (method === 'DELETE') {
      state.deletes.push(id)
      if (state.deleteMode === 'pending') {
        await new Promise<void>(resolve => {
          state.releaseDelete = resolve
        })
      }
      if (state.deleteMode === 'failure') {
        await route.fulfill({ status: 500, json: { detail: 'delete failed' } })
        return
      }
      state.records = state.records.filter(record => record.id !== id)
      await route.fulfill({ status: 204, body: '' })
      return
    }
    await route.fallback()
  })
}

async function openPage(page: Page, state: ExpenseFixture) {
  await installFixture(page, state)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(ROUTES.settings.expenses, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Операционные расходы' })).toBeVisible({
    timeout: TIMEOUTS.navigation,
  })
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(value => window.localStorage.setItem('theme', value), theme)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveClass(
    theme === 'dark' ? /(^|\s)dark(\s|$)/ : /^(?!.*(^|\s)dark(\s|$)).*$/
  )
}

test.describe('Expenses Page', () => {
  test('renders a deterministic empty month state', async ({ page }) => {
    await openPage(page, createFixture([]))
    await expect(page.getByRole('heading', { name: 'Нет расходов за этот месяц' })).toBeVisible()
    await expect(page.getByRole('table')).toHaveCount(0)
  })

  test('keeps a cleared primary month unavailable without new financial requests', async ({
    page,
  }) => {
    const state = createFixture([])
    await openPage(page, state)
    const initialListRequests = state.listRequests.length
    const initialSummaryRequests = state.summaryRequests.length
    const selector = page.getByLabel('Выбрать месяц')

    await selector.fill('')

    await expect(selector).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('heading', { name: 'Выберите корректный месяц' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Нет расходов за этот месяц' })).toHaveCount(0)
    await expect(page.getByText('Итого за месяц')).toHaveCount(0)
    await expect(page.getByText(/0.*₽/)).toHaveCount(0)
    expect(state.listRequests).toHaveLength(initialListRequests)
    expect(state.summaryRequests).toHaveLength(initialSummaryRequests)
  })

  test('retains identity, value, period, record state, and named actions', async ({ page }) => {
    await openPage(page, createFixture())
    const table = page.getByRole('table', { name: /расходы за август 2026/i })
    await expect(table).toBeVisible()
    await expect(table.getByText(/50.*000.*₽/)).toBeVisible()
    await expect(table.locator('tbody td').filter({ hasText: /^Август 2026$/ })).toBeVisible()
    await expect(table.getByText('Сохранён')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /изменить расход аренда, 50.*000.*₽/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /удалить расход аренда, 50.*000.*₽/i })
    ).toBeVisible()
  })

  test('associates invalid amount feedback and sends no create request', async ({ page }) => {
    const state = createFixture([])
    await openPage(page, state)
    await page.getByRole('button', { name: 'Добавить расход' }).press('Enter')
    const amount = page.getByLabel('Сумма (₽)')
    await amount.fill('0')
    await page
      .getByRole('form', { name: 'Форма расхода' })
      .evaluate(form => (form as HTMLFormElement).requestSubmit())
    const error = page.getByText('Введите сумму от 0,01 ₽ с точностью до копеек')
    await expect(error).toBeVisible()
    await expect(amount).toHaveAttribute('aria-invalid', 'true')
    const errorId = await error.getAttribute('id')
    expect(errorId).not.toBeNull()
    await expect(amount).toHaveAttribute('aria-describedby', errorId!)
    await expect(amount).toBeFocused()
    expect(state.creates).toHaveLength(0)
  })

  test('rejects sub-cent amounts and a cleared month before create requests', async ({ page }) => {
    const state = createFixture([])
    await openPage(page, state)
    await page.getByRole('button', { name: 'Добавить расход' }).click()
    const form = page.getByRole('form', { name: 'Форма расхода' })
    const amount = page.getByLabel('Сумма (₽)')
    const month = form.getByLabel('Месяц', { exact: true })

    await amount.fill('0.001')
    await form.evaluate(node => (node as HTMLFormElement).requestSubmit())
    await expect(amount).toBeFocused()
    expect(state.creates).toHaveLength(0)

    await amount.fill('100')
    await month.fill('')
    await form.evaluate(node => (node as HTMLFormElement).requestSubmit())
    const error = page.getByText('Выберите корректный месяц')
    await expect(error).toBeVisible()
    await expect(month).toHaveAttribute('aria-invalid', 'true')
    const errorId = await error.getAttribute('id')
    expect(errorId).not.toBeNull()
    await expect(month).toHaveAttribute('aria-describedby', errorId!)
    await expect(month).toBeFocused()
    expect(state.creates).toHaveLength(0)
  })

  test('creates an expense by keyboard and announces success', async ({ page }) => {
    const state = createFixture([])
    await openPage(page, state)
    await page.getByRole('button', { name: 'Добавить первый расход' }).focus()
    await page.keyboard.press('Enter')
    await page.getByLabel('Сумма (₽)').pressSequentially('12500')
    await page.getByLabel('Описание (необязательно)').pressSequentially('Новая операция')
    await page.getByRole('button', { name: 'Добавить', exact: true }).press('Enter')

    await expect(page.getByText('Расход добавлен')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Добавить расход' })).toBeFocused()
    expect(state.creates).toHaveLength(1)
    expect(state.creates[0]).toMatchObject({ amount: 12500, description: 'Новая операция' })
  })

  test('announces save failure and preserves dialog values', async ({ page }) => {
    const state = createFixture([])
    state.createMode = 'failure'
    await openPage(page, state)
    await page.getByRole('button', { name: 'Добавить расход' }).click()
    await page.getByLabel('Сумма (₽)').fill('7500')
    await page.getByLabel('Описание (необязательно)').fill('Сохранить при ошибке')
    await page.getByRole('button', { name: 'Добавить', exact: true }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: 'Не удалось сохранить расход' })
    ).toBeVisible()
    await expect(page.getByLabel('Сумма (₽)')).toHaveValue('7500')
    await expect(page.getByLabel('Описание (необязательно)')).toHaveValue('Сохранить при ошибке')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('keeps create pending open across Cancel, Escape, and close requests', async ({ page }) => {
    const state = createFixture([])
    state.createMode = 'pending'
    await openPage(page, state)
    await page.getByRole('button', { name: 'Добавить расход' }).click()
    await page.getByLabel('Сумма (₽)').fill('7500')
    await page.getByRole('button', { name: 'Добавить', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(page.getByRole('form', { name: 'Форма расхода' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    await expect(page.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Закрыть' }).click()
    await expect(dialog).toBeVisible()
    expect(state.creates).toHaveLength(1)

    state.createMode = 'success'
    state.releaseCreate?.()
    await expect(page.getByText('Расход добавлен')).toBeVisible()
    await expect(dialog).toHaveCount(0)
  })

  test('edits a named expense without changing category or period', async ({ page }) => {
    const state = createFixture()
    await openPage(page, state)
    await page.getByRole('button', { name: /изменить расход аренда/i }).click()
    await page.getByLabel('Сумма (₽)').fill('55000')
    await page.getByLabel('Описание (необязательно)').fill('Обновлённая аренда')
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()

    await expect(page.getByText('Расход обновлён')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /изменить расход аренда, 55.*000.*₽/i })
    ).toBeFocused()
    expect(state.updates).toHaveLength(1)
    expect(state.updates[0]).toEqual({
      id: 'expense-rent',
      body: { amount: 55000, description: 'Обновлённая аренда' },
    })
  })

  test('keeps update pending open and retains values when the request fails', async ({ page }) => {
    const state = createFixture()
    state.updateMode = 'pending'
    await openPage(page, state)
    await page.getByRole('button', { name: /изменить расход аренда/i }).click()
    await page.getByLabel('Сумма (₽)').fill('55000')
    await page.getByLabel('Описание (необязательно)').fill('Сохранить после ожидания')
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(page.getByRole('form', { name: 'Форма расхода' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    await expect(page.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Закрыть' }).click()
    await expect(dialog).toBeVisible()
    expect(state.updates).toHaveLength(1)

    state.updateMode = 'failure'
    state.releaseUpdate?.()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Не удалось сохранить расход' })
    ).toBeVisible()
    await expect(page.getByLabel('Сумма (₽)')).toHaveValue('55000')
    await expect(page.getByLabel('Описание (необязательно)')).toHaveValue(
      'Сохранить после ожидания'
    )
    await expect(dialog).toBeVisible()
  })

  test('requires named confirmation before sending delete', async ({ page }) => {
    const state = createFixture()
    await openPage(page, state)
    const trigger = page.getByRole('button', { name: /удалить расход аренда/i })
    await trigger.press('Enter')
    expect(state.deletes).toHaveLength(0)
    await expect(page.getByRole('alertdialog', { name: 'Удалить расход?' })).toBeVisible()
    await page.getByRole('button', { name: /подтвердить удаление расхода аренда/i }).press('Enter')
    await expect(page.getByText('Расход удалён')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Добавить расход' })).toBeFocused()
    expect(state.deletes).toEqual(['expense-rent'])
  })

  test('exposes a named pending state while deletion is in flight', async ({ page }) => {
    const state = createFixture()
    state.deleteMode = 'pending'
    await openPage(page, state)
    await page.getByRole('button', { name: /удалить расход аренда/i }).click()
    await page.getByRole('button', { name: /подтвердить удаление расхода аренда/i }).click()
    const pending = page.getByRole('button', { name: /удаление расхода аренда/i })
    await expect(pending).toBeDisabled()
    await expect(page.getByRole('alertdialog')).toHaveAttribute('aria-busy', 'true')
    state.releaseDelete?.()
    await expect(page.getByText('Расход удалён')).toBeVisible()
  })

  test('keeps the expense and confirmation recoverable after delete failure', async ({ page }) => {
    const state = createFixture()
    state.deleteMode = 'failure'
    await openPage(page, state)
    await page.getByRole('button', { name: /удалить расход аренда/i }).click()
    await page.getByRole('button', { name: /подтвердить удаление расхода аренда/i }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: 'Не удалось удалить расход' })
    ).toBeVisible()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    expect(state.records).toHaveLength(1)
  })

  test('contains focus and returns it to the invoking delete action', async ({ page }) => {
    await openPage(page, createFixture())
    const trigger = page.getByRole('button', { name: /удалить расход аренда/i })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press('Tab')
      const focusInside = await dialog.evaluate(node => node.contains(document.activeElement))
      expect(focusInside).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('returns form focus after cancel and Escape', async ({ page }) => {
    await openPage(page, createFixture())
    const add = page.getByRole('button', { name: 'Добавить расход' })
    await add.click()
    await page.getByRole('button', { name: 'Отмена' }).click()
    await expect(add).toBeFocused()

    const edit = page.getByRole('button', { name: /изменить расход аренда/i })
    await edit.press('Enter')
    await page.keyboard.press('Escape')
    await expect(edit).toBeFocused()
  })

  test('keeps malformed expense periods explicit and the remaining row usable', async ({
    page,
  }) => {
    const malformed = { ...RECORD, month: '2026-13' }
    await openPage(page, createFixture([malformed]))

    await expect(page.getByRole('cell', { name: 'Период недоступен' })).toBeVisible()
    await expect(page.getByRole('button', { name: /изменить расход аренда/i })).toBeVisible()
  })

  test('keeps a backend-null amount explicitly unavailable everywhere', async ({ page }) => {
    const unavailable = { ...RECORD, amount: null as unknown as number }
    await openPage(page, createFixture([unavailable]))

    await expect(page.getByRole('cell', { name: 'Сумма недоступна', exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /изменить расход аренда, сумма недоступна/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /удалить расход аренда, сумма недоступна/i }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Аренда, Сумма недоступна')
    await expect(page.getByText(/NaN|не число/i)).toHaveCount(0)
  })

  test('makes the narrow expense table keyboard-scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await openPage(page, createFixture())
    const region = page.getByRole('region', { name: /таблица расходов за август 2026/i })
    await region.focus()
    await expect(region).toBeFocused()
    const dimensions = await region.evaluate(node => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth)
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => region.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
  })

  // Repository security intentionally denies retained screenshots and attachments. These named
  // tests are the installed equivalent: geometry, focus visibility, DOM order, theme, and axe
  // are asserted without persisting raw browser data that may contain authenticated UI state.
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 390, 768, 1024, 1280, 1440]) {
      test(`retains focus, reading order, and contrast evidence at ${width}px in ${theme}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 })
        await openPage(page, createFixture())
        await setTheme(page, theme)
        const main = page.locator('main')
        const dimensions = await main.evaluate(node => ({
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
        }))
        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
        await expect(page.getByText(RECORD.description!)).toBeVisible()
        const deleteAction = page.getByRole('button', { name: /удалить расход аренда/i })
        await expect(deleteAction).toBeVisible()
        await deleteAction.focus()
        await expect(deleteAction).toBeFocused()
        const focusStyle = await deleteAction.evaluate(node => {
          const style = getComputedStyle(node)
          return `${style.outlineStyle} ${style.outlineWidth} ${style.boxShadow}`
        })
        expect(focusStyle).not.toBe('none 0px none')
        const readingOrderIsPreserved = await main.evaluate(node => {
          const title = node.querySelector('h1')
          const table = node.querySelector('table')
          return (
            !!title &&
            !!table &&
            Boolean(title.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING)
          )
        })
        expect(readingOrderIsPreserved).toBe(true)
      })
    }

    test(`preserves both dialogs at 200 percent reflow in ${theme} theme`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 450 })
      await openPage(page, createFixture())
      await setTheme(page, theme)
      await page.getByRole('button', { name: 'Добавить расход' }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const box = await dialog.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(320)
      expect(box!.y + box!.height).toBeLessThanOrEqual(450)
      await dialog.evaluate(node => (node.scrollTop = node.scrollHeight))
      await expect(page.getByRole('button', { name: 'Отмена' })).toBeVisible()
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: /удалить расход аренда/i }).click()
      const alertDialog = page.getByRole('alertdialog')
      await expect
        .poll(async () => (await alertDialog.boundingBox())?.x ?? -1)
        .toBeGreaterThanOrEqual(0)
      const alertBox = await alertDialog.boundingBox()
      expect(alertBox).not.toBeNull()
      expect(alertBox!.x).toBeGreaterThanOrEqual(0)
      expect(alertBox!.y).toBeGreaterThanOrEqual(0)
      expect(alertBox!.x + alertBox!.width).toBeLessThanOrEqual(320)
      expect(alertBox!.y + alertBox!.height).toBeLessThanOrEqual(450)
      await alertDialog.evaluate(node => (node.scrollTop = node.scrollHeight))
      await expect(page.getByRole('button', { name: /подтвердить удаление/i })).toBeVisible()
    })
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`has no WCAG A, AA, or 2.2 AA axe violations in ${theme}`, async ({ page }) => {
      const heading = 'Операционные расходы'
      await openPage(page, createFixture())
      await setTheme(page, theme)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      let results = await analyzeStably(
        page,
        () =>
          new AxeBuilder({ page })
            .include('[aria-label="Настройки операционных расходов"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag22aa']),
        heading
      )
      expect(results.violations).toEqual([])

      await page.getByRole('button', { name: /удалить расход аренда/i }).click()
      results = await analyzeStably(
        page,
        () =>
          new AxeBuilder({ page })
            .include('[role="alertdialog"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag22aa']),
        heading,
        page.locator('[role="alertdialog"]')
      )
      expect(results.violations).toEqual([])

      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'Добавить расход' }).click()
      results = await analyzeStably(
        page,
        () =>
          new AxeBuilder({ page })
            .include('[role="dialog"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag22aa']),
        heading,
        page.locator('[role="dialog"]')
      )
      expect(results.violations).toEqual([])
    })
  }
})
