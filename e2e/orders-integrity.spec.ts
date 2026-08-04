import { expect, test, type Page, type Route } from './fixtures/network-test'

const ROUTE = '/orders/integrity'
const INTEGRITY_API = '**/health/orders-integrity**'
const RECONCILIATION_API = '**/v1/orders/reconciliation**'
const CABINET_A = 'cabinet-orders-a'
const CABINET_B = 'cabinet-orders-b'
const EMPTY_CABINET = 'cabinet-orders-empty'

const CHECK_LABELS: Record<string, string> = {
  duplicates: 'Дубликаты',
  orphans: 'Сироты',
  missing_history: 'Пропущенная история',
  duplicate_status_history: 'Дубли истории',
  invalid_transitions: 'Неверные переходы',
  sync_overlaps: 'Пересечения синхронизации',
}

const COUNTS_A: Record<string, number> = {
  duplicates: 1,
  orphans: 2,
  missing_history: 3,
  duplicate_status_history: 4,
  invalid_transitions: 5,
  sync_overlaps: 6,
}

const COUNTS_B: Record<string, number> = {
  duplicates: 11,
  orphans: 12,
  missing_history: 13,
  duplicate_status_history: 14,
  invalid_transitions: 15,
  sync_overlaps: 16,
}

test.use({ storageState: { cookies: [], origins: [] } })

function encodeJwtPart(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

const TEST_TOKEN = `${encodeJwtPart({ alg: 'none', typ: 'JWT' })}.${encodeJwtPart({
  sub: 'orders-integrity-e2e',
  exp: 4_102_444_800,
})}.local-test`

function integrityResponse(counts: Record<string, number>) {
  return {
    status: 'healthy',
    checks: Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [key, { status: 'pass', count }])
    ),
    last_check: '2026-08-03T12:00:00Z',
    duration_ms: 25,
  }
}

function reconciliationResponse(
  byDate: unknown[] = [
    {
      date: '2026-08-03',
      local_count: 10,
      expected_count: 10,
      variance: 0,
      variance_percent: 0,
    },
  ]
) {
  return {
    data: {
      total_count: 10,
      local_count: 10,
      expected_count: 10,
      variance: 0,
      variance_percent: 0,
      by_status: [],
      by_date: byDate,
    },
  }
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function installAuthenticatedState(page: Page, baseURL: string, cabinetId: string) {
  await page.context().addCookies([{ name: 'auth-token', value: TEST_TOKEN, url: baseURL }])
  await page.addInitScript(
    ({ token, initialCabinetId }) => {
      if (window.sessionStorage.getItem('orders-integrity-auth-seeded')) return
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: {
              id: 'orders-integrity-e2e',
              email: 'orders-integrity@example.test',
              role: 'Owner',
              cabinet_ids: [initialCabinetId],
            },
            token,
            cabinetId: initialCabinetId,
          },
          version: 0,
        })
      )
      window.sessionStorage.setItem('orders-integrity-auth-seeded', 'true')
    },
    { token: TEST_TOKEN, initialCabinetId: cabinetId }
  )
}

async function changeCabinet(page: Page, cabinetId: string): Promise<void> {
  await page.evaluate(id => {
    const stored = JSON.parse(window.localStorage.getItem('auth-storage') || '{}')
    stored.state = { ...stored.state, cabinetId: id }
    window.localStorage.setItem('auth-storage', JSON.stringify(stored))
  }, cabinetId)
}

async function expectRenderedChecks(page: Page, counts: Record<string, number>) {
  for (const [key, label] of Object.entries(CHECK_LABELS)) {
    const card = page.getByText(label, { exact: true }).locator('xpath=../..')
    await expect(card.getByText(String(counts[key]), { exact: true })).toBeVisible()
  }
}

test.describe('Orders integrity local contracts', () => {
  test('anonymous access redirects without protected-data flash', async ({ page }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        if (document.querySelector('[data-testid="orders-integrity-page"]')) {
          window.sessionStorage.setItem('orders-integrity-data-flash', 'observed')
        }
      })
      const start = () =>
        observer.observe(document.documentElement, { childList: true, subtree: true })
      if (document.documentElement) start()
      else window.addEventListener('DOMContentLoaded', start, { once: true })
    })

    await page.goto(ROUTE)

    await expect(page).toHaveURL(/\/login(?:\?|$)/)
    await expect(page.getByTestId('orders-integrity-page')).toHaveCount(0)
    expect(
      await page.evaluate(() => sessionStorage.getItem('orders-integrity-data-flash'))
    ).toBeNull()
  })

  test.describe('authenticated states', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      const baseURL = String(testInfo.project.use.baseURL ?? 'http://localhost:3100')
      await installAuthenticatedState(page, baseURL, CABINET_A)
    })

    test('renders the page and all six integrity counts', async ({ page }) => {
      await page.route(INTEGRITY_API, route => fulfillJson(route, integrityResponse(COUNTS_A)))
      await page.route(RECONCILIATION_API, route => fulfillJson(route, reconciliationResponse()))

      await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })

      await expect(page.getByTestId('orders-integrity-page')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Целостность заказов', level: 1 })
      ).toBeVisible()
      await expectRenderedChecks(page, COUNTS_A)
    })

    test('shows the real loading affordance while integrity is pending', async ({ page }) => {
      let releaseIntegrity: (() => void) | undefined
      const integrityGate = new Promise<void>(resolve => {
        releaseIntegrity = resolve
      })
      await page.route(INTEGRITY_API, async route => {
        await integrityGate
        await fulfillJson(route, integrityResponse(COUNTS_A))
      })
      await page.route(RECONCILIATION_API, route => fulfillJson(route, reconciliationResponse()))

      await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[role="status"][aria-busy="true"]').first()).toBeVisible()
      releaseIntegrity?.()
      await expect(page.getByText('Данные в порядке')).toBeVisible()
    })

    test('shows an explicit empty reconciliation state after a cabinet switch', async ({
      page,
    }) => {
      await page.route(INTEGRITY_API, route => fulfillJson(route, integrityResponse(COUNTS_A)))
      await page.route(RECONCILIATION_API, route => {
        const cabinetId = new URL(route.request().url()).searchParams.get('cabinet_id')
        return fulfillJson(
          route,
          reconciliationResponse(cabinetId === EMPTY_CABINET ? [] : undefined)
        )
      })

      await page.goto(ROUTE)
      await expect(page.getByText('Всего заказов')).toBeVisible()

      await changeCabinet(page, EMPTY_CABINET)
      await page.reload()

      await expect(page.getByText('Нет данных за выбранный период.')).toBeVisible()
    })

    test('recovers from an integrity error without rendering it as zero', async ({ page }) => {
      let attempts = 0
      await page.route(INTEGRITY_API, route => {
        attempts += 1
        return attempts <= 2
          ? fulfillJson(route, { error: { message: 'controlled failure' } }, 500)
          : fulfillJson(route, integrityResponse(COUNTS_A))
      })
      await page.route(RECONCILIATION_API, route => fulfillJson(route, reconciliationResponse()))

      await page.goto(ROUTE)
      await expect(
        page.getByText('Не удалось загрузить данные проверки. Попробуйте ещё раз.')
      ).toBeVisible()
      await expect(page.getByText('Дубликаты', { exact: true })).toHaveCount(0)
      await page
        .getByRole('button', { name: /Повторить/ })
        .first()
        .click()

      await expect(page.getByText('Данные в порядке')).toBeVisible()
      await expect(
        page.getByText('Не удалось загрузить данные проверки. Попробуйте ещё раз.')
      ).toHaveCount(0)
    })

    test('keeps cabinet requests and rendered counts isolated', async ({ page }) => {
      const requestedCabinets: string[] = []
      await page.route(INTEGRITY_API, route => {
        const cabinetId = new URL(route.request().url()).searchParams.get('cabinet_id') ?? ''
        requestedCabinets.push(cabinetId)
        const counts = cabinetId === CABINET_B ? COUNTS_B : COUNTS_A
        return fulfillJson(route, integrityResponse(counts))
      })
      await page.route(RECONCILIATION_API, route => fulfillJson(route, reconciliationResponse()))

      await page.goto(ROUTE)
      await expectRenderedChecks(page, COUNTS_A)

      await changeCabinet(page, CABINET_B)
      await page.reload()
      await expectRenderedChecks(page, COUNTS_B)

      expect(requestedCabinets).toContain(CABINET_A)
      expect(requestedCabinets).toContain(CABINET_B)
    })
  })
})
