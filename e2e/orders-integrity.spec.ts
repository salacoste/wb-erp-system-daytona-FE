import {
  CHECK_LABELS,
  countsValue,
  expectRenderedChecks,
  fixtures,
  matchesOrdersResponse,
  setCabinet,
  textValue,
} from './fixtures/tier0-orders'
import { test, expect } from './fixtures/tier0-runtime'

const ROUTE = '/orders/integrity'

test.describe('Tier-0 Orders Integrity live contracts', () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.annotations.push({ type: 'tier0-product-contract' })
  })
  test('[OI-E01] authorized route renders under the bound production build', async ({
    page,
    tier0Runtime,
  }) => {
    const cabinetId = textValue(fixtures(tier0Runtime.descriptor.fixtures).cabinet_a_id)
    test.skip(!cabinetId, 'BLOCKED:CABINET_FIXTURE_MISSING')
    await setCabinet(page, cabinetId!)

    const integrity = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.goto(ROUTE)
    await expect(page.getByTestId('orders-integrity-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Целостность заказов', level: 1 })).toBeVisible()
    expect((await integrity).ok()).toBe(true)
  })

  test('[OI-E02] anonymous denial and optional wrong-role proof have no data flash', async ({
    page,
    tier0Runtime,
  }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        if (document.querySelector('[data-testid="orders-integrity-page"]')) {
          window.sessionStorage.setItem('tier0-protected-data-flash', 'observed')
        }
      })
      const start = () =>
        observer.observe(document.documentElement, { childList: true, subtree: true })
      if (document.documentElement) start()
      else window.addEventListener('DOMContentLoaded', start, { once: true })
    })
    await page.goto(ROUTE)
    await expect(page.getByTestId('orders-integrity-page')).toHaveCount(0)
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
    expect(
      await page.evaluate(() => sessionStorage.getItem('tier0-protected-data-flash'))
    ).toBeNull()

    const email = process.env.E2E_RESTRICTED_EMAIL
    const password = process.env.E2E_RESTRICTED_PASSWORD
    if (email && password) {
      const config = fixtures(tier0Runtime.descriptor.fixtures)
      const deniedPath = textValue(config.orders_integrity_denied_path)
      const deniedText = textValue(config.orders_integrity_denied_text)
      expect(deniedPath, 'signed wrong-role denial path is required').toBeDefined()
      expect(deniedText, 'signed wrong-role denial text is required').toBeDefined()
      await page.locator('input[type="email"]').fill(email)
      await page.locator('input[type="password"]').fill(password)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL(url => !url.pathname.includes('/login'))
      await page.evaluate(() => sessionStorage.removeItem('tier0-protected-data-flash'))
      await page.goto(ROUTE)
      await expect(page.getByTestId('orders-integrity-page')).toHaveCount(0)
      await expect(page).toHaveURL(new RegExp(deniedPath!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      await expect(page.getByText(deniedText!, { exact: false })).toBeVisible()
      expect(
        await page.evaluate(() => sessionStorage.getItem('tier0-protected-data-flash'))
      ).toBeNull()
    }
  })

  test('[OI-E03] deterministic sandbox delay exposes the real loading affordance', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.cabinet_a_id)
    const loadingDelay =
      typeof config.orders_loading_min_ms === 'number' ? config.orders_loading_min_ms : 0
    test.skip(!cabinetId || loadingDelay < 250, 'BLOCKED:ORDERS_LOADING_CONTROL_MISSING')
    await setCabinet(page, cabinetId!)

    await page.goto(ROUTE, { waitUntil: 'commit' })
    await expect(page.locator('[role="status"][aria-busy="true"]').first()).toBeVisible({
      timeout: 200,
    })
    await expect(page.getByRole('heading', { name: 'Целостность заказов' })).toBeVisible()
  })

  test('[OI-E04] populated real fixture renders all six integrity counts', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.cabinet_a_id)
    const expected = countsValue(config.orders_expected_checks)
    test.skip(!cabinetId || !expected, 'BLOCKED:ORDERS_CONTROL_MISSING')
    await setCabinet(page, cabinetId!)

    const integrity = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.goto(ROUTE)
    expect((await integrity).ok()).toBe(true)
    await expectRenderedChecks(page, expected!)
  })

  test('[OI-E05] empty cabinet shows an explicit empty state', async ({ page, tier0Runtime }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.orders_empty_cabinet_id)
    const priorCabinetId = textValue(config.cabinet_b_id)
    const priorExpected = countsValue(config.orders_expected_checks_b)
    const checkKey = textValue(config.isolation_check_key)
    test.skip(
      !cabinetId || !priorCabinetId || !priorExpected || !checkKey || !priorExpected[checkKey],
      'BLOCKED:ORDERS_EMPTY_FIXTURE_MISSING'
    )
    await setCabinet(page, priorCabinetId!)
    await page.goto(ROUTE)
    await expectRenderedChecks(page, priorExpected!)
    await page.evaluate(id => {
      const parsed = JSON.parse(window.localStorage.getItem('auth-storage') || '{}')
      parsed.state = { ...parsed.state, cabinetId: id }
      window.localStorage.setItem('auth-storage', JSON.stringify(parsed))
    }, cabinetId)

    const reconciliation = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/v1/orders/reconciliation',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.reload()
    expect((await reconciliation).ok()).toBe(true)
    await expect(page.getByText('Нет данных за выбранный период.')).toBeVisible()
    const priorCard = page
      .getByText(CHECK_LABELS[checkKey!], { exact: true })
      .locator('xpath=../..')
    await expect(
      priorCard.getByText(String(priorExpected![checkKey!]), { exact: true })
    ).toHaveCount(0)
  })

  test('[OI-E06] controlled backend error is recoverable and never rendered as zero', async ({
    page,
    tier0Runtime,
  }) => {
    const cabinetId = textValue(
      fixtures(tier0Runtime.descriptor.fixtures).orders_recovery_cabinet_id
    )
    test.skip(!cabinetId, 'BLOCKED:ORDERS_RECOVERY_FIXTURE_MISSING')
    await setCabinet(page, cabinetId!)

    const integrity = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.goto(ROUTE)
    expect((await integrity).ok()).toBe(false)
    await expect(
      page.getByText('Не удалось загрузить данные проверки. Попробуйте ещё раз.')
    ).toBeVisible()
    const recovery = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page
      .getByRole('button', { name: /Повторить/ })
      .first()
      .click()
    expect((await recovery).ok()).toBe(true)
    await expect(page.getByTestId('orders-integrity-page')).toBeVisible()
    await expect(
      page.getByText('Не удалось загрузить данные проверки. Попробуйте ещё раз.')
    ).toHaveCount(0)
  })

  test('[OI-E07] cabinet A and B remain isolated in requests and rendered counts', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetA = textValue(config.cabinet_a_id)
    const cabinetB = textValue(config.cabinet_b_id)
    const expectedA = countsValue(config.orders_expected_checks)
    const expectedB = countsValue(config.orders_expected_checks_b)
    const checkKey = textValue(config.isolation_check_key)
    test.skip(
      !cabinetA || !cabinetB || !expectedA || !expectedB || !checkKey,
      'BLOCKED:CABINET_ISOLATION_CONTROL_MISSING'
    )
    expect(expectedA![checkKey!]).not.toBe(expectedB![checkKey!])

    await setCabinet(page, cabinetA!)
    const responseA = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetA
      )
    )
    await page.goto(ROUTE)
    expect((await responseA).ok()).toBe(true)
    await expectRenderedChecks(page, expectedA!)

    await page.evaluate(id => {
      const parsed = JSON.parse(window.localStorage.getItem('auth-storage') || '{}')
      parsed.state = { ...parsed.state, cabinetId: id }
      window.localStorage.setItem('auth-storage', JSON.stringify(parsed))
    }, cabinetB)
    const responseB = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetB
      )
    )
    await page.reload()
    expect((await responseB).ok()).toBe(true)
    await expectRenderedChecks(page, expectedB!)
  })

  test('[OI-E08] reconciliation headline equals the authorized control within tolerance', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.cabinet_a_id)
    const control = fixtures(config.reconciliation)
    test.skip(
      !cabinetId ||
        !['total_count', 'local_count', 'expected_count'].every(
          key => typeof control[key] === 'number'
        ),
      'BLOCKED:FINANCE_FIXTURE_MISSING'
    )
    await setCabinet(page, cabinetId!)

    const reconciliation = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/v1/orders/reconciliation',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.goto(ROUTE)
    expect((await reconciliation).ok()).toBe(true)
    const summary = page.getByText('Всего заказов').locator('xpath=..')
    await expect(summary.getByText(String(control.total_count), { exact: true })).toBeVisible()
    await expect(
      page
        .getByText('Локальных')
        .locator('xpath=..')
        .getByText(String(control.local_count), { exact: true })
    ).toBeVisible()
    await expect(
      page
        .getByText('Ожидаемых')
        .locator('xpath=..')
        .getByText(String(control.expected_count), { exact: true })
    ).toBeVisible()
    const variance = page.getByText('Расхождение').locator('xpath=..')
    const varianceText = (await variance.locator('p').nth(1).textContent())?.trim()
    if (control.variance_percent == null) {
      expect(varianceText).toBe('—')
    } else {
      expect(typeof control.variance_percent).toBe('number')
      const actual = Number(varianceText?.replace('%', '').replace(/\s/g, '').replace(',', '.'))
      const tolerance = typeof control.tolerance === 'number' ? control.tolerance : 0.01
      expect(Math.abs(actual - Number(control.variance_percent))).toBeLessThanOrEqual(tolerance)
    }
  })

  test('[OI-E09] configured real row interaction preserves cabinet context', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.cabinet_a_id)
    const selector = textValue(config.orders_drilldown_selector)
    const expectedPath = textValue(config.orders_drilldown_path)
    const requestPath = textValue(config.orders_drilldown_request_path)
    const expectedText = textValue(config.orders_drilldown_expected_text)
    test.skip(
      !cabinetId || !selector || !expectedPath || !requestPath || !expectedText,
      'BLOCKED:ORDERS_DRILLDOWN_CONTROL_MISSING'
    )
    await setCabinet(page, cabinetId!)

    await page.goto(ROUTE)
    const detailResponse = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        requestPath!,
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.locator(selector!).click()
    expect((await detailResponse).ok()).toBe(true)
    await expect(page).toHaveURL(new RegExp(expectedPath!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    await expect(page.getByText(expectedText!, { exact: false })).toBeVisible()
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.cabinetId
      )
    ).toBe(cabinetId)
  })

  test('[OI-E10] required live APIs succeed and provenance remains sanitized', async ({
    page,
    tier0Runtime,
  }) => {
    const cabinetId = textValue(fixtures(tier0Runtime.descriptor.fixtures).cabinet_a_id)
    test.skip(!cabinetId, 'BLOCKED:CABINET_FIXTURE_MISSING')
    await setCabinet(page, cabinetId!)

    const integrity = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/health/orders-integrity',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    const reconciliation = page.waitForResponse(response =>
      matchesOrdersResponse(
        response,
        '/v1/orders/reconciliation',
        tier0Runtime.descriptor.allowed_origins.backend,
        cabinetId
      )
    )
    await page.goto(ROUTE)
    expect((await integrity).ok()).toBe(true)
    expect((await reconciliation).ok()).toBe(true)
    const requiredPaths = new Set(['/health/orders-integrity', '/v1/orders/reconciliation'])
    const backendOrigins = tier0Runtime.descriptor.allowed_origins.backend.map(
      origin => new URL(origin).origin
    )
    const records = tier0Runtime.apiProvenance.filter(record => requiredPaths.has(record.pathname))
    expect(new Set(records.map(record => record.pathname))).toEqual(requiredPaths)
    expect(
      records.every(record => backendOrigins.includes(record.origin) && record.status === 200)
    ).toBe(true)
  })
})
