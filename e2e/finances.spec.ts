/**
 * E2E: NEW-7 — Finances (Account Balance + Financial Documents).
 *
 * Covers: balance populated/empty/error, documents list + filter + pagination,
 * and the download route being hit when the download button is clicked.
 *
 * Conventions (CLAUDE.md / CLAUDE-ANTI-PATTERNS.md):
 * - Observable waits ONLY: waitForResponse on the v1/finances endpoints, expect.poll/toBeVisible.
 * - No waitForTimeout (#7), no networkidle (#9), no page.clock.
 * - page.route interception for deterministic API stubs.
 *
 * NOTE: Chromium may not launch in some local envs (Mach-port bootstrap); the
 * behavior is also covered by jsdom component tests in src/app/(dashboard)/finances/.
 * Run: npx playwright test e2e/finances.spec.ts
 */

import { test, expect } from './fixtures/network-test'
import { ROUTES, TIMEOUTS } from './fixtures/test-data'

const FINANCES_URL = ROUTES.finances
const BALANCE_API = '**/v1/finances/balance'
// NOTE (Story 172.10 repair): Playwright globs are end-anchored, so the old
// '**/v1/finances/documents' never matched the real request — the documents
// query ALWAYS carries ?locale=ru&limit=…, the stub silently missed, and the
// page rendered live-BE documents instead of fixtures. A RegExp covers the
// request with and without a query string and cannot collide with
// /documents/categories or /documents/*/download (those continue with '/'
// after "documents", not '?' or end-of-URL).
const DOCS_API = /\/v1\/finances\/documents(?:\?.*)?$/
// Same query-string repair as DOCS_API: the categories request carries
// ?locale=ru, so the old end-anchored glob never matched and the dropdown
// silently listed live-BE categories instead of the stubs.
const CATEGORIES_API = /\/v1\/finances\/documents\/categories(?:\?.*)?$/
const DOWNLOAD_API = '**/v1/finances/documents/*/download*'
const TEST_TIMEOUT = 60_000

const POPULATED_BALANCE = { currency: 'RUB', current: 1523400.5, forWithdraw: 980000 }
const EMPTY_BALANCE = { currency: null, current: null, forWithdraw: null }
const CATEGORIES = [
  { name: 'ПА', title: 'Платёжное поручение' },
  { name: 'ЭДО', title: 'Электронный документооборот' },
]
const DOCUMENTS = [
  {
    serviceName: 'wildberries-ru/documents/ПА-2026-01',
    name: 'Платёжное поручение за январь',
    category: 'ПА',
    extensions: ['pdf', 'xlsx'],
    creationTime: '2026-02-01T10:00:00Z',
    viewed: false,
  },
  {
    serviceName: 'wildberries-ru/documents/ЭДО-2025-12',
    name: 'Акт сверки за декабрь',
    category: 'ЭДО',
    extensions: ['pdf'],
    creationTime: '2026-01-05T09:30:00Z',
    viewed: true,
  },
]

/**
 * A document set larger than one page (DEFAULT_PAGE_SIZE=20) so the Next-page
 * button is ENABLED and an offset>0 fetch returns rows. Mirrors how the route
 * stub below ignores offset (returns the full filtered array), which is fine:
 * the pagination test only asserts an offset>0 request fires + resolves.
 */
const PAGED_DOCUMENTS = Array.from({ length: 25 }, (_, i) => ({
  serviceName: `wildberries-ru/documents/ПА-2026-${String(i + 1).padStart(2, '0')}`,
  name: `Платёжное поручение ${i + 1}`,
  category: 'ПА',
  extensions: ['pdf'],
  creationTime: '2026-02-01T10:00:00Z',
  viewed: false,
}))

/** Install the default (populated) route stubs. */
async function installRoutes(
  page: import('@playwright/test').Page,
  opts: {
    balance?:
      { currency: string | null; current: number | null; forWithdraw: number | null } | 'error'
    docs?: typeof DOCUMENTS | 'error'
  } = {}
) {
  await page.route(BALANCE_API, async route => {
    if (opts.balance === 'error') {
      await route.fulfill({ status: 503, json: { message: 'WB rate limited' } })
    } else {
      await route.fulfill({ json: opts.balance ?? POPULATED_BALANCE })
    }
  })
  await page.route(CATEGORIES_API, route => route.fulfill({ json: CATEGORIES }))
  await page.route(DOCS_API, async route => {
    if (opts.docs === 'error') {
      await route.fulfill({ status: 503, json: { message: 'WB unavailable' } })
      return
    }
    const url = new URL(route.request().url())
    const category = url.searchParams.get('category')
    const docs = opts.docs ?? DOCUMENTS
    const filtered =
      category && category !== 'all' ? docs.filter(d => d.category === category) : docs
    await route.fulfill({ json: filtered })
  })
  await page.route(DOWNLOAD_API, route =>
    route.fulfill({ json: { fileName: 'doc.pdf', extension: 'pdf', document: 'VGVzdA==' } })
  )
}

/** Navigate to /finances and wait for the heading (hydration confirmation). */
async function gotoFinances(page: import('@playwright/test').Page) {
  await page.goto(FINANCES_URL, { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('heading', { name: 'Финансы' })
    .waitFor({ state: 'visible', timeout: TIMEOUTS.api })
}

test.describe('NEW-7 — Finances page', () => {
  test('renders the populated balance and documents list', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await installRoutes(page)
    const balanceResponse = page.waitForResponse(resp =>
      resp.url().includes('/v1/finances/balance')
    )
    await gotoFinances(page)
    await balanceResponse

    // exact:true — 'Баланс кабинета' is also a substring of the page subtitle;
    // 'Финансовые документы' is additionally a substring of the table caption
    // (strict mode resolved 2-3 elements without the flag).
    await expect(page.getByText('Баланс кабинета', { exact: true })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    await expect(page.getByText('Текущий баланс')).toBeVisible()
    // Money formatted as RUB (regex — locale-formatted).
    await expect(page.getByText(/1\s523\s400/)).toBeVisible()
    // Documents table renders rows.
    await expect(page.getByText('Финансовые документы', { exact: true })).toBeVisible()
    await expect(page.getByText('Платёжное поручение за январь')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('renders the balance empty state when WB returns all-null', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await installRoutes(page, { balance: EMPTY_BALANCE })
    await gotoFinances(page)
    await expect(page.getByText('Данные о балансе пока недоступны')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    // Documents table still usable (AC4 independence).
    await expect(page.getByText('Финансовые документы', { exact: true })).toBeVisible()
  })

  test('renders balance error + retry on 503 (documents stay usable)', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await installRoutes(page, { balance: 'error' })
    await gotoFinances(page)
    await expect(
      page.getByText('Не удалось загрузить баланс кабинета. Попробуйте ещё раз.')
    ).toBeVisible({ timeout: TIMEOUTS.api })
    await expect(page.getByRole('button', { name: /Повторить/ })).toBeVisible()
    // AC4: documents independent — not blanked by the balance failure.
    await expect(page.getByText('Финансовые документы', { exact: true })).toBeVisible()
  })

  test('filters the documents list by category via an exact request', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await installRoutes(page)
    await gotoFinances(page)
    await expect(page.getByText('Акт сверки за декабрь')).toBeVisible({ timeout: TIMEOUTS.api })

    // Selecting a category issues a filtered documents request.
    const filteredResponse = page.waitForResponse(resp => {
      const u = new URL(resp.url())
      return (
        u.pathname.endsWith('/v1/finances/documents') && u.searchParams.get('category') === 'ЭДО'
      )
    })
    await page
      .getByRole('group', { name: 'Фильтры документов' })
      .getByRole('combobox')
      .first()
      .click()
    await page.getByRole('option', { name: 'Электронный документооборот' }).click()
    await filteredResponse
    await expect(page.getByText('Акт сверки за декабрь')).toBeVisible({ timeout: TIMEOUTS.api })
  })

  test('distinguishes filtered empty and resets to the unfiltered first page', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await installRoutes(page)
    await page.route(DOCS_API, async route => {
      const url = new URL(route.request().url())
      if (url.searchParams.get('category') === 'ЭДО') {
        await route.fulfill({ json: [] })
        return
      }
      await route.fallback()
    })
    await gotoFinances(page)
    await page.getByLabel('Категория').click()
    await page.getByRole('option', { name: 'Электронный документооборот' }).click()
    await expect(page.getByText('По выбранным фильтрам документов нет')).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const resetResponse = page.waitForResponse(resp => {
      const url = new URL(resp.url())
      return (
        url.pathname.endsWith('/v1/finances/documents') &&
        !url.searchParams.has('category') &&
        Number(url.searchParams.get('offset')) === 0
      )
    })
    await page.getByRole('button', { name: 'Сбросить фильтры' }).click()
    await resetResponse
    await expect(page.getByText('Платёжное поручение за январь')).toBeVisible({
      timeout: TIMEOUTS.api,
    })
  })

  test('paginates the documents list via an offset request', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    // Seed >pageSize (DEFAULT_PAGE_SIZE=20) rows so the Next button is ENABLED;
    // with only 2 rows Next is disabled (isLastPage = count < pageSize) and the
    // click is a no-op, which would let the offset>0 waitForResponse time out.
    await installRoutes(page, { docs: PAGED_DOCUMENTS })
    await gotoFinances(page)
    // exact:true — rows 10-19 contain "Платёжное поручение 1" as a substring
    // (non-exact getByText resolved 11 elements → strict mode violation).
    await expect(page.getByText('Платёжное поручение 1', { exact: true })).toBeVisible({
      timeout: TIMEOUTS.api,
    })
    // Next-page button issues a request with offset > 0.
    const nextResponse = page.waitForResponse(resp => {
      const u = new URL(resp.url())
      return (
        u.pathname.endsWith('/v1/finances/documents') && Number(u.searchParams.get('offset')) > 0
      )
    })
    await page.getByRole('button', { name: 'Следующая страница' }).click()
    await nextResponse
  })

  test('hits the download route when the download button is clicked', async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    await installRoutes(page)
    await gotoFinances(page)
    await expect(page.getByText('Платёжное поручение за январь')).toBeVisible({
      timeout: TIMEOUTS.api,
    })

    const downloadResponse = page.waitForResponse(
      resp => resp.url().includes('/v1/finances/documents/') && resp.url().includes('/download')
    )
    await page
      .getByRole('button', { name: /Скачать документ/ })
      .first()
      .click()
    await downloadResponse
    // Confirm the response resolved (observable assertion, not a hard wait).
    expect(downloadResponse).toBeDefined()
  })
})
