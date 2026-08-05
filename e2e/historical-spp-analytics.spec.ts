/**
 * Story 128.27 — report-derived historical SPP on the existing SKU analytics page.
 * Every API request is fulfilled locally by this spec; no backend, WB, or storefront I/O.
 */

import type { Page, Route } from '@playwright/test'
import { expect, test } from './fixtures/network-test'

const APP_ORIGIN = 'http://localhost:3100'
const CABINET_ID = 'historical-spp-cabinet'
const WEEK = '2026-W31'
const LOCAL_FUTURE_JWT =
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjQxMDI0NDQ4MDB9.historical-spp'

type ApiCapture = {
  requests: string[]
}

const baseSku = (nmId: string, name: string) => ({
  nm_id: nmId,
  sa_name: name,
  brand: 'История WB',
  category: 'Тест',
  sales: { quantity: 1, revenue_gross: 1000, revenue_net: 900 },
  returns: { quantity: 0, revenue_gross: 0, revenue_net: 0 },
  cogs: { unit_cost: 400, total: 400, source: 'test', valid_from: '2026-08-01' },
  gross_profit: 500,
  gross_margin_pct: 55.56,
  expenses: {
    logistics_delivery: 50,
    logistics_return: 0,
    logistics_total: 50,
    storage: 10,
    storage_source: 'paid_storage_api',
    penalties: 0,
    paid_acceptance: 0,
    other_adjustments: 0,
    total_operating: 60,
  },
  operating_profit: 440,
  operating_margin_pct: 48.89,
  profitability_status: 'excellent',
})

const paritySku = (nmId: string, name: string, sppRub: number | null, sppPct: number | null) => ({
  nm_id: nmId,
  sa_name: name,
  revenue_net: 900,
  total_units: 1,
  cogs: 400,
  profit: 500,
  margin_pct: 55.56,
  operating_profit: 440,
  operating_margin_pct: 48.89,
  missing_cogs_flag: false,
  spp_rub: sppRub,
  spp_pct: sppPct,
})

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function installAuthenticatedState(page: Page): Promise<void> {
  await page
    .context()
    .addCookies([{ name: 'auth-token', value: LOCAL_FUTURE_JWT, url: APP_ORIGIN }])
  await page.addInitScript(
    ({ cabinetId, token }) => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'historical-spp-e2e',
              email: 'historical-spp@example.test',
              role: 'Owner',
              cabinet_ids: [cabinetId],
            },
            token,
            cabinetId,
          },
          version: 0,
        })
      )
    },
    { cabinetId: CABINET_ID, token: LOCAL_FUTURE_JWT }
  )
}

async function installMockApi(page: Page, capture: ApiCapture): Promise<void> {
  await page.route('**/v1/**', async route => {
    const url = new URL(route.request().url())
    capture.requests.push(url.toString())

    if (url.pathname === `/v1/cabinets/${CABINET_ID}`) {
      return fulfillJson(route, {
        id: CABINET_ID,
        name: 'Исторический кабинет',
        isActive: true,
        cabinetKeys: [{ keyName: 'wb_api_token', updatedAt: '2026-08-05T00:00:00Z' }],
      })
    }
    if (url.pathname === `/v1/cabinets/${CABINET_ID}/seller-info`) {
      return fulfillJson(route, {
        name: 'Исторический продавец',
        sid: 'local-seller',
        tradeMark: 'История WB',
        available: true,
      })
    }
    if (url.pathname === `/v1/cabinets/${CABINET_ID}/jam-status`) {
      return fulfillJson(route, {
        tier: 'none',
        available: true,
        searchTextsLimit: 0,
        checkedAt: '2026-08-05T00:00:00Z',
        probeCallsMade: 0,
      })
    }
    if (url.pathname === `/v1/cabinets/${CABINET_ID}/token-status`) {
      return fulfillJson(route, { healthy: true, errorCount: 0 })
    }
    if (url.pathname === '/v1/analytics/supply-planning') {
      return fulfillJson(route, { meta: {}, summary: {}, data: [] })
    }
    if (url.pathname === '/v1/analytics/weekly/available-weeks') {
      return fulfillJson(route, [{ week: WEEK, start_date: '2026-07-27', end_date: '2026-08-02' }])
    }
    if (url.pathname === '/v1/analytics/sku-financials') {
      return fulfillJson(route, {
        meta: {
          week: WEEK,
          week_start: '2026-07-27',
          week_end: '2026-08-02',
          cabinet_id: CABINET_ID,
          total_skus: 2,
          returned_skus: 2,
          generated_at: '2026-08-05T00:00:00Z',
          data_sources: { transactions: 'fixture', storage: 'fixture', cogs: 'fixture' },
        },
        totals: {},
        data: [baseSku('101', 'Нулевое СПП'), baseSku('102', 'СПП недоступно')],
      })
    }
    if (url.pathname === '/v1/analytics/weekly/cabinet-expenses') {
      return fulfillJson(route, {
        sales_gross: 2000,
        returns_gross: 0,
        marketplace_commission: 200,
        acquiring_fee: 0,
        cogs_total: 800,
        gross_profit_sku: 1000,
        logistics: 100,
        storage: 20,
        storage_weekly_report: 20,
        storage_difference: 0,
        other_adjustments: 0,
        wb_commission_adj: 0,
        penalties: 0,
        paid_acceptance: 0,
        total: 120,
        weeks_included: [WEEK],
      })
    }
    if (url.pathname === '/v1/analytics/weekly/by-sku') {
      const enabled = url.searchParams.get('include_cogs') === 'true'
      return fulfillJson(route, {
        items: enabled
          ? [paritySku('101', 'Нулевое СПП', 0, 0), paritySku('102', 'СПП недоступно', null, null)]
          : [
              paritySku('101', 'Нулевое СПП', null, null),
              paritySku('102', 'СПП недоступно', null, null),
            ],
        meta: { count: 2 },
      })
    }

    throw new Error(`Unhandled local API request: ${url.pathname}${url.search}`)
  })
}

test.describe('Story 128.27 historical SPP analytics', () => {
  test('uses URL-stable include_cogs state and never leaks hidden historical values', async ({
    page,
  }) => {
    const capture: ApiCapture = { requests: [] }
    await installAuthenticatedState(page)
    await installMockApi(page, capture)

    await page.goto(`/analytics/sku?weekStart=${WEEK}&weekEnd=${WEEK}`, {
      waitUntil: 'domcontentloaded',
    })

    const toggle = page.getByRole('switch', {
      name: 'Показывать фактическое историческое СПП из финансовых отчётов WB',
    })
    await expect(toggle).toBeChecked()
    await expect(page.getByText('Историческое СПП из отчётов WB')).toBeVisible()
    await expect(
      page.getByText('Фактические значения по транзакциям финансовых отчётов WB.')
    ).toBeVisible()

    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, ₽' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, %' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, ₽' })).toHaveAttribute(
      'title',
      'Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽'
    )
    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, %' })).toHaveAttribute(
      'title',
      'Фактическое историческое СПП по транзакциям финансового отчёта WB, %'
    )

    const zeroRow = page.getByRole('row', { name: /Нулевое СПП/ })
    await expect(
      zeroRow.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽')
    ).toHaveText(/0\s*₽/)
    await expect(
      zeroRow.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, %')
    ).toHaveText(/0%/)

    const nullRow = page.getByRole('row', { name: /СПП недоступно/ })
    await expect(
      nullRow.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽')
    ).toHaveText('—')
    await expect(
      nullRow.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, %')
    ).toHaveText('—')

    expect(
      capture.requests.some(
        request =>
          request.includes('/v1/analytics/weekly/by-sku?') && request.includes('include_cogs=true')
      )
    ).toBe(true)

    await toggle.click()
    await expect(page).toHaveURL(/include_cogs=false/)
    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, ₽' })).toHaveCount(0)
    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, %' })).toHaveCount(0)
    await expect(
      zeroRow.getByTitle('Фактическое историческое СПП по транзакциям финансового отчёта WB, ₽')
    ).toHaveCount(0)
    await expect
      .poll(() =>
        capture.requests.some(
          request =>
            request.includes('/v1/analytics/weekly/by-sku?') &&
            request.includes('include_cogs=false')
        )
      )
      .toBe(true)

    await toggle.click()
    await expect(page).toHaveURL(/include_cogs=true/)
    await expect(page.getByRole('columnheader', { name: 'Историческое СПП, ₽' })).toBeVisible()

    expect(capture.requests.every(request => new URL(request).hostname === 'localhost')).toBe(true)
  })
})
