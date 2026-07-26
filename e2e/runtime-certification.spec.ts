import { readFileSync } from 'node:fs'
import {
  request as playwrightRequest,
  type APIRequestContext,
  type APIResponse,
  type Page,
} from '@playwright/test'
import {
  assertCleanupAbsenceProof,
  assertCleanupDeleteProof,
  assertMutationAuthorityBinding,
  captureMutationCleanupAuthority,
  loadBoundMutationContext,
  selectMutationCleanupId,
  shouldIncludeTier0MutationProject,
} from './fixtures/tier0-mutation'
import {
  CHECK_LABELS,
  countsValue,
  fixtures,
  matchesOrdersResponse,
  setCabinet,
  textValue,
  type Tier0Fixtures,
} from './fixtures/tier0-orders'
import {
  expect,
  controlTier0NavigationURL,
  installTier0EgressEnforcement,
  test,
  type ApiProvenance,
  type ApiProvenanceBinding,
} from './fixtures/tier0-runtime'
import { assertAllowedURL } from '../scripts/tier0/runtime-safety.mjs'

const INTEGRITY_ROUTE = '/orders/integrity'

function markTier0Failure(failureClass: 'infrastructure' | 'runner'): void {
  test.info().annotations.push({ type: 'tier0-failure-class', description: failureClass })
}

async function fetchControlledApi(
  api: APIRequestContext,
  url: string,
  options: Parameters<APIRequestContext['fetch']>[1]
): Promise<APIResponse> {
  try {
    return await api.fetch(url, options)
  } catch (error) {
    markTier0Failure('infrastructure')
    throw error
  }
}

function isTier0MutationAuthorized(): boolean {
  if (!process.env.TIER0_PREFLIGHT_RECEIPT) return false
  const context = loadBoundMutationContext(process.env)
  return shouldIncludeTier0MutationProject(process.env, context.receipt, context.descriptor)
}

function numberValue(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
}

function exactBackendUrl(
  url: string,
  backendOrigins: string[],
  method: string,
  allowedMethods: string[]
): URL {
  const controlled = assertAllowedURL(
    url,
    backendOrigins.map(origin => new URL(origin).origin),
    'signed Tier-0 backend fixture',
    { method, allowedMethods }
  )
  if (!controlled) throw new Error('Tier-0 URL control returned no destination')
  return controlled
}

function recordDirectResponse(
  provenance: ApiProvenance[],
  method: string,
  url: URL,
  response: APIResponse,
  binding: ApiProvenanceBinding,
  proof?: ApiProvenance['proof'],
  controlDigest?: string
): void {
  const headers = response.headers()
  provenance.push({
    ...binding,
    method,
    origin: url.origin,
    pathname: url.pathname,
    search: url.search,
    status: response.status(),
    correlationId: headers['x-correlation-id'] || headers['x-request-id'] || undefined,
    proof,
    controlDigest,
    source: 'direct-api',
  })
}

async function switchCabinet(page: Page, cabinetId: string): Promise<void> {
  await page.evaluate(id => {
    const parsed = JSON.parse(window.localStorage.getItem('auth-storage') || '{}')
    parsed.state = { ...parsed.state, cabinetId: id }
    window.localStorage.setItem('auth-storage', JSON.stringify(parsed))
  }, cabinetId)
}

function isOrdersResponse(
  response: { url(): string },
  cabinetId: string,
  backendOrigins: readonly string[]
): boolean {
  return matchesOrdersResponse(
    response,
    ['/health/orders-integrity', '/v1/orders/reconciliation'],
    backendOrigins,
    cabinetId
  )
}

async function tokenFromStorage(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('auth-storage')
    if (!raw) return undefined
    const token = JSON.parse(raw)?.state?.token
    return typeof token === 'string' && token.length > 0 ? token : undefined
  })
}

async function loginWithDeclaredUser(page: Page): Promise<void> {
  const email = process.env.E2E_TEST_EMAIL
  const password = process.env.E2E_TEST_PASSWORD
  test.skip(!email || !password, 'BLOCKED:USER_AUTHORITY_MISSING')
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email!)
  await page.locator('input[type="password"]').fill(password!)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(url => !url.pathname.includes('/login'))
  await expect(page.locator('main').first()).toBeVisible()
}

test.describe('Tier-0 dedicated runtime certification', () => {
  test.beforeEach(({}, testInfo) => {
    testInfo.annotations.push({ type: 'tier0-product-contract' })
  })
  test('[RT-E01] owned production server identity is live and ready', async ({ page }) => {
    const identityPath = process.env.TIER0_SERVER_IDENTITY
    test.skip(!identityPath, 'BLOCKED:SERVER_IDENTITY_MISSING')
    const identity = JSON.parse(readFileSync(identityPath!, 'utf8')) as {
      server_pid?: number
      build_id?: string
    }
    expect(identity.server_pid).toBeGreaterThan(0)
    expect(() => process.kill(identity.server_pid!, 0)).not.toThrow()
    expect(identity.build_id).toBe(readFileSync('.next/BUILD_ID', 'utf8').trim())
    const response = await page.goto('/login')
    expect(response?.ok()).toBe(true)
  })

  test('[RT-E02] public login renders the production authentication contract', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeEnabled()
  })

  test('[RT-E03] authenticated routes render without login fallback', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
    await page.goto(INTEGRITY_ROUTE)
    await expect(page.getByTestId('orders-integrity-page')).toBeVisible()
  })

  test('[RT-E04] public runtime has clean console and exact network destinations', async ({
    page,
  }) => {
    const response = await page.goto('/login')
    expect(response?.ok()).toBe(true)
    await expect(page.locator('form')).toBeVisible()
    // The auto fixture fails this row for console, page, protocol, or origin violations.
  })

  test('[RT-E05] real login creates a session that survives reload', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')
    await page.evaluate(() => window.localStorage.clear())
    await loginWithDeclaredUser(page)
    expect(await tokenFromStorage(page)).toBeTruthy()
    await page.reload()
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page).not.toHaveURL(/\/login(?:\?|$)/)
  })

  test('[RT-E06] cleared or invalid session cannot render a protected route', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')
    await page.evaluate(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token: 'tier0-invalid-session', user: null }, version: 0 })
      )
    })
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login(?:\?|$)/)
    await expect(page.locator('main')).toHaveCount(0)
  })

  test('[RT-E07] user and manager identities enforce the declared role boundary', async ({
    browser,
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const deniedPath = textValue(config.role_denied_path)
    const deniedText = textValue(config.role_denied_text)
    const allowedPath = textValue(config.role_authorized_path)
    const allowedText = textValue(config.role_authorized_text)
    test.skip(
      !process.env.E2E_MANAGER_EMAIL ||
        !process.env.E2E_MANAGER_PASSWORD ||
        !deniedPath ||
        !deniedText ||
        !allowedPath ||
        !allowedText,
      'BLOCKED:MANAGER_ROLE_CONTROL_MISSING'
    )

    await page.goto(deniedPath!)
    await expect(page.getByText(deniedText!, { exact: false })).toBeVisible()

    const managerStorageState = process.env.TIER0_MANAGER_STORAGE_STATE
    test.skip(!managerStorageState, 'BLOCKED:MANAGER_STORAGE_STATE_MISSING')
    const context = await browser.newContext({
      storageState: managerStorageState!,
      baseURL: 'http://127.0.0.1:3100',
      serviceWorkers: 'block',
    })
    const managerPage = await context.newPage()
    const failures: string[] = []
    await installTier0EgressEnforcement(
      managerPage,
      [
        ...tier0Runtime.descriptor.allowed_origins.frontend,
        ...tier0Runtime.descriptor.allowed_origins.backend,
      ].map(origin => new URL(origin).origin),
      tier0Runtime.descriptor.allowed_origins.backend.map(origin => new URL(origin).origin),
      tier0Runtime.apiProvenance,
      failures,
      { provenanceBinding: tier0Runtime.provenanceBinding }
    )
    await managerPage.goto(allowedPath!)
    await expect(managerPage.getByText(allowedText!, { exact: false })).toBeVisible()
    expect(failures).toEqual([])
    await context.close()
  })

  test('[RT-E08] cabinet switch propagates to subsequent real API requests', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetA = textValue(config.cabinet_a_id)
    const cabinetB = textValue(config.cabinet_b_id)
    test.skip(!cabinetA || !cabinetB, 'BLOCKED:CABINET_FIXTURE_MISSING')
    await setCabinet(page, cabinetA!)
    const responseA = page.waitForResponse(response =>
      isOrdersResponse(response, cabinetA!, tier0Runtime.descriptor.allowed_origins.backend)
    )
    await page.goto(INTEGRITY_ROUTE)
    expect((await responseA).ok()).toBe(true)
    await switchCabinet(page, cabinetB!)
    const responseB = page.waitForResponse(response =>
      isOrdersResponse(response, cabinetB!, tier0Runtime.descriptor.allowed_origins.backend)
    )
    await page.reload()
    expect((await responseB).ok()).toBe(true)
  })

  test('[RT-E09] cabinet controls prove cross-cabinet data isolation', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetA = textValue(config.cabinet_a_id)
    const cabinetB = textValue(config.cabinet_b_id)
    const key = textValue(config.isolation_check_key)
    const expectedA = countsValue(config.orders_expected_checks)
    const expectedB = countsValue(config.orders_expected_checks_b)
    test.skip(
      !cabinetA || !cabinetB || !key || !expectedA || !expectedB,
      'BLOCKED:CABINET_ISOLATION_CONTROL_MISSING'
    )
    expect(expectedA![key!]).not.toBe(expectedB![key!])
    const label = CHECK_LABELS[key!]
    test.skip(!label, 'BLOCKED:ISOLATION_CHECK_KEY_UNSUPPORTED')
    await setCabinet(page, cabinetA!)
    await page.goto(INTEGRITY_ROUTE)
    await expect(
      page
        .getByText(label, { exact: true })
        .locator('xpath=../..')
        .getByText(String(expectedA![key!]), { exact: true })
    ).toBeVisible()
    await switchCabinet(page, cabinetB!)
    await page.reload()
    await expect(
      page
        .getByText(label, { exact: true })
        .locator('xpath=../..')
        .getByText(String(expectedB![key!]), { exact: true })
    ).toBeVisible()
  })

  test('[RT-E10] success, empty, error, and anonymous API semantics are real', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const successId = textValue(config.cabinet_a_id)
    const emptyId = textValue(config.orders_empty_cabinet_id)
    const errorId = textValue(config.orders_error_cabinet_id)
    const authProbe = textValue(config.authorization_probe_url)
    test.skip(
      !successId || !emptyId || !errorId || !authProbe,
      'BLOCKED:API_SEMANTICS_CONTROL_MISSING'
    )

    await setCabinet(page, successId!)
    const success = page.waitForResponse(response =>
      isOrdersResponse(response, successId!, tier0Runtime.descriptor.allowed_origins.backend)
    )
    await page.goto(INTEGRITY_ROUTE)
    expect((await success).ok()).toBe(true)

    await switchCabinet(page, emptyId!)
    await page.reload()
    await expect(page.getByText('Нет данных за выбранный период.')).toBeVisible()

    await switchCabinet(page, errorId!)
    const failure = page.waitForResponse(response =>
      isOrdersResponse(response, errorId!, tier0Runtime.descriptor.allowed_origins.backend)
    )
    await page.reload()
    expect((await failure).ok()).toBe(false)
    await expect(page.getByRole('button', { name: /Повторить/ }).first()).toBeVisible()

    const probeUrl = exactBackendUrl(
      authProbe!,
      tier0Runtime.descriptor.allowed_origins.backend,
      'GET',
      ['GET']
    )
    const anonymous = await playwrightRequest.newContext()
    const denied = await fetchControlledApi(anonymous, probeUrl.href, {
      method: 'GET',
      maxRedirects: 0,
    })
    recordDirectResponse(
      tier0Runtime.apiProvenance,
      'GET',
      probeUrl,
      denied,
      tier0Runtime.provenanceBinding
    )
    expect([401, 403]).toContain(denied.status())
    await anonymous.dispose()
  })

  test('[RT-E11] financial reconciliation matches the declared control and tolerance', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.cabinet_a_id)
    const control = fixtures(config.reconciliation)
    const total = numberValue(control.total_count)
    const variance = numberValue(control.variance_percent)
    const tolerance = numberValue(control.tolerance) ?? 0.01
    test.skip(!cabinetId || total === undefined, 'BLOCKED:FINANCE_FIXTURE_MISSING')
    await setCabinet(page, cabinetId!)
    await page.goto(INTEGRITY_ROUTE)
    await expect(
      page.getByText('Всего заказов').locator('xpath=..').getByText(String(total), { exact: true })
    ).toBeVisible()
    if (variance !== undefined) {
      const value = await page
        .getByText('Расхождение')
        .locator('xpath=..')
        .locator('p')
        .nth(1)
        .textContent()
      const actual = Number(value?.replace('%', '').replace(/\s/g, '').replace(',', '.'))
      expect(Math.abs(actual - variance)).toBeLessThanOrEqual(tolerance)
    }
  })

  test('[RT-E12] missing financial values render as unavailable rather than zero', async ({
    page,
    tier0Runtime,
  }) => {
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const cabinetId = textValue(config.finance_missing_cabinet_id)
    test.skip(!cabinetId, 'BLOCKED:FINANCE_MISSING_DATA_CONTROL_MISSING')
    await setCabinet(page, cabinetId!)
    await page.goto(INTEGRITY_ROUTE)
    const variance = page.getByText('Расхождение').locator('xpath=..').locator('p').nth(1)
    await expect(variance).toHaveText('—')
    await expect(variance).not.toHaveText('0%')
  })

  test('[RT-E13] mutation guard denies execution unless all three opt-ins match', async () => {
    const original = {
      enable: process.env.E2E_ENABLE_MUTATIONS,
      target: process.env.E2E_MUTATION_TARGET,
      ack: process.env.E2E_MUTATION_ACK,
    }
    try {
      delete process.env.E2E_ENABLE_MUTATIONS
      process.env.E2E_MUTATION_TARGET = 'sandbox'
      process.env.E2E_MUTATION_ACK = 'I_UNDERSTAND_THIS_MUTATES_TEST_DATA'
      expect(isTier0MutationAuthorized()).toBe(false)
      process.env.E2E_ENABLE_MUTATIONS = '1'
      expect(isTier0MutationAuthorized()).toBe(false)
      process.env.E2E_ENABLE_MUTATIONS = 'true'
      delete process.env.E2E_MUTATION_ACK
      expect(isTier0MutationAuthorized()).toBe(false)
    } finally {
      if (original.enable === undefined) delete process.env.E2E_ENABLE_MUTATIONS
      else process.env.E2E_ENABLE_MUTATIONS = original.enable
      if (original.target === undefined) delete process.env.E2E_MUTATION_TARGET
      else process.env.E2E_MUTATION_TARGET = original.target
      if (original.ack === undefined) delete process.env.E2E_MUTATION_ACK
      else process.env.E2E_MUTATION_ACK = original.ack
    }
  })

  test('[RT-E14] authorized sandbox write is observed and always cleaned up', async ({
    page,
    tier0Runtime,
  }) => {
    test.skip(!isTier0MutationAuthorized(), 'BLOCKED:MUTATION_AUTHORITY_MISSING')
    const authorizedContext = loadBoundMutationContext(process.env)
    if (!authorizedContext.plan) throw new Error('signed mutation plan is missing')
    const plan = authorizedContext.plan
    const config = fixtures(tier0Runtime.descriptor.fixtures)
    const mutation = fixtures(config.mutation)
    const ownerMarker = textValue(mutation.owner_marker)
    const idField = textValue(mutation.response_id_field)
    const idHeader = textValue(mutation.response_id_header)
    const ownerHeader = textValue(mutation.response_owner_header)
    const testOwnedId = textValue(config.mutation_record_id)
    const cleanupControl = textValue(config.cleanup_control_id)
    const body = plan!.mutation.create_body
    test.skip(
      !ownerMarker ||
        !idField ||
        !idHeader ||
        !ownerHeader ||
        !testOwnedId ||
        !cleanupControl ||
        !body ||
        typeof body !== 'object' ||
        textValue(fixtures(body).owner_marker) !== ownerMarker,
      'BLOCKED:REVERSIBLE_MUTATION_CONTROL_MISSING'
    )
    const armedCleanupId = plan!.signedId
    const create = plan.create!
    const createMethod = plan.createMethod
    const armedCleanup = plan.cleanup!
    const cleanupMethod = plan.cleanupMethod
    const token = await tokenFromStorage(page)
    test.skip(!token, 'BLOCKED:USER_SESSION_TOKEN_MISSING')
    // Arm cleanup before the mutation from the ID bound into the signed create payload. This
    // remains the exact cleanup target if the create commits but its response cannot be read.
    const createContext = loadBoundMutationContext(process.env)
    expect(createContext.binding).toBe(authorizedContext.binding)
    expect(createContext.plan?.signedId).toBe(armedCleanupId)
    expect(createContext.plan?.create?.href).toBe(create.href)
    let cleanupAuthority: ReturnType<typeof captureMutationCleanupAuthority>
    try {
      cleanupAuthority = captureMutationCleanupAuthority(createContext)
      assertMutationAuthorityBinding(cleanupAuthority, createContext)
    } catch (error) {
      markTier0Failure('runner')
      throw error
    }
    const api = await playwrightRequest.newContext({
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    try {
      const response = await fetchControlledApi(api, create.href, {
        method: createMethod,
        data: cleanupAuthority.createBody as Record<string, unknown>,
        maxRedirects: 0,
      })
      recordDirectResponse(
        tier0Runtime.apiProvenance,
        createMethod,
        create,
        response,
        tier0Runtime.provenanceBinding
      )
      const responseHeaders = response.headers()
      const returnedId = textValue(responseHeaders[idHeader!.toLowerCase()])
      const returnedOwner = textValue(responseHeaders[ownerHeader!.toLowerCase()])
      const cleanupId = selectMutationCleanupId(
        armedCleanupId,
        returnedId,
        returnedOwner,
        ownerMarker!
      )
      expect(response.ok()).toBe(true)
      expect(returnedId, 'successful create must return its exact ID header').toBeDefined()
      expect(returnedOwner, 'successful create must return its owner header').toBe(ownerMarker)
      expect(cleanupId).toBe(returnedId)
      const created = (await response.json()) as Tier0Fixtures
      const createdId = textValue(created[idField!])
      const createdBody = JSON.stringify(created)
      expect(createdId).toBe(cleanupId)
      expect(createdId).toBe(testOwnedId)
      expect(createdBody).toContain(ownerMarker!)
      await page.goto(plan.observation!.href)
      await expect(page.getByText(plan!.observeText, { exact: true })).toBeVisible()
    } finally {
      try {
        let cleanupBindingError: unknown
        try {
          const cleanupContext = loadBoundMutationContext(process.env, {
            allowExpiredReceipt: true,
          })
          assertMutationAuthorityBinding(cleanupAuthority, cleanupContext)
        } catch (error) {
          cleanupBindingError = error
        }
        const cleanupTarget = new URL(cleanupAuthority.cleanup.href)
        const expectedCleanup = {
          signedId: cleanupAuthority.signedId,
          ownerMarker: cleanupAuthority.ownerMarker,
          cleanupControlId: cleanupAuthority.cleanupControlId,
        }
        const deleteResponse = await fetchControlledApi(api, cleanupTarget.href, {
          method: cleanupAuthority.cleanupMethod,
          maxRedirects: 0,
        })
        assertCleanupDeleteProof(deleteResponse.status(), deleteResponse.headers(), expectedCleanup)
        recordDirectResponse(
          tier0Runtime.apiProvenance,
          cleanupAuthority.cleanupMethod,
          cleanupTarget,
          deleteResponse,
          tier0Runtime.provenanceBinding,
          'cleanup-delete-ack',
          cleanupAuthority.controlDigest
        )
        const absenceResponse = await fetchControlledApi(api, cleanupTarget.href, {
          method: 'GET',
          maxRedirects: 0,
        })
        assertCleanupAbsenceProof(
          absenceResponse.status(),
          absenceResponse.headers(),
          expectedCleanup
        )
        recordDirectResponse(
          tier0Runtime.apiProvenance,
          'GET',
          cleanupTarget,
          absenceResponse,
          tier0Runtime.provenanceBinding,
          'cleanup-absence',
          cleanupAuthority.controlDigest
        )
        if (cleanupBindingError) {
          markTier0Failure('runner')
          throw cleanupBindingError
        }
      } finally {
        await api.dispose()
      }
    }
  })
})
