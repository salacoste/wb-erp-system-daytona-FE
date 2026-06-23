import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import {
  attachRequestCollectors,
  clearMutationEnv,
  collectOperationalRouteWarnings,
  findDeniedVisibleControls,
  installFbsEnhancedReadOnlyApiFixture,
  installReadOnlyNetworkGuard,
  MUTATING_CONTROL_PATTERNS,
  routeArtifactStem,
  type AuditManifest,
  type AuthState,
  type RouteAuditRecord,
  type SessionContext,
} from './fixtures/read-only-network-guard'

type InventoryRoute = {
  path: string
  source: string
  dynamic: boolean
  group: string
}

type RouteInventory = {
  generated_at: string
  routes: InventoryRoute[]
}

type DynamicRouteFixtureValue = string | { path: string }
type DynamicRouteFixtureMap = Record<string, DynamicRouteFixtureValue>

type DynamicRouteFixture = {
  path: string
  source: string
}

type StorageState = Exclude<BrowserContextOptions['storageState'], string | undefined>
type AuditAuthContext = AuditManifest['auth_context']

const inventoryPath = process.env.ROUTE_AUDIT_INVENTORY
const dynamicFixturesInput = process.env.ROUTE_AUDIT_DYNAMIC_FIXTURES
const runId =
  process.env.ROUTE_AUDIT_RUN_ID ??
  new Date().toISOString().replace(/[:.]/g, '-').replace('T', 'T').replace('Z', 'Z')
const artifactRoot =
  process.env.ROUTE_AUDIT_ARTIFACT_DIR ??
  '.omx/artifacts/visual-ralph/full-frontend-validation/runs'
const runDir = path.resolve(artifactRoot, runId)
const screenshotDir = path.join(runDir, 'screenshots')
const routeDir = path.join(runDir, 'routes')
const ownerAuthFile = 'e2e/.auth/user.json'
const managerAuthFile = 'e2e/.auth/manager.json'
const authFile =
  process.env.ROUTE_AUDIT_AUTH_FILE ??
  (fs.existsSync(managerAuthFile) ? managerAuthFile : ownerAuthFile)
const auditAuthRole = process.env.ROUTE_AUDIT_AUTH_ROLE ?? 'Analyst'
const records: RouteAuditRecord[] = []
const builtInApiFixturesEnabled = process.env.ROUTE_AUDIT_BUILTIN_API_FIXTURES !== '0'

clearMutationEnv()
fs.mkdirSync(screenshotDir, { recursive: true })
fs.mkdirSync(routeDir, { recursive: true })

function readInventory(): RouteInventory {
  if (!inventoryPath) {
    throw new Error(
      'ROUTE_AUDIT_INVENTORY is required. Generate or provide a route inventory JSON before running read-only route audit.'
    )
  }

  return JSON.parse(fs.readFileSync(inventoryPath, 'utf8')) as RouteInventory
}

function readDynamicRouteFixtures(): Map<string, DynamicRouteFixture> {
  if (!dynamicFixturesInput) return new Map()

  const trimmed = dynamicFixturesInput.trim()
  const fixtureSource = trimmed.startsWith('{') ? 'env:ROUTE_AUDIT_DYNAMIC_FIXTURES' : trimmed
  const rawFixtures = trimmed.startsWith('{')
    ? (JSON.parse(trimmed) as DynamicRouteFixtureMap)
    : (JSON.parse(fs.readFileSync(path.resolve(trimmed), 'utf8')) as DynamicRouteFixtureMap)

  return new Map(
    Object.entries(rawFixtures).map(([templatePath, value]) => {
      const fixturePath = typeof value === 'string' ? value : value.path
      if (!templatePath.startsWith('/')) {
        throw new Error(`Dynamic fixture template must be an absolute route: ${templatePath}`)
      }
      if (!fixturePath.startsWith('/')) {
        throw new Error(`Dynamic fixture path for ${templatePath} must be an absolute route`)
      }
      if (/\[[^\]]+\]/.test(fixturePath)) {
        throw new Error(`Dynamic fixture path for ${templatePath} must not contain route params`)
      }
      if (!fixturePathMatchesTemplate(templatePath, fixturePath)) {
        throw new Error(`Dynamic fixture path ${fixturePath} must match template ${templatePath}`)
      }

      return [templatePath, { path: fixturePath, source: fixtureSource }]
    })
  )
}

function classifyRoute(
  route: InventoryRoute,
  dynamicFixture?: DynamicRouteFixture
): {
  sessionContext: SessionContext
  authState: AuthState
} {
  if (route.dynamic && !dynamicFixture) return { sessionContext: 'blocked', authState: 'blocked' }
  if (route.group === '(auth)' || route.path === '/')
    return { sessionContext: 'anonymous', authState: 'clean' }
  if (route.group === '(onboarding)')
    return { sessionContext: 'onboarding', authState: 'storage-state' }
  return { sessionContext: 'authenticated', authState: 'storage-state' }
}

function contextOptionsFor(
  sessionContext: SessionContext,
  authState: AuthState
): BrowserContextOptions {
  if (
    (sessionContext === 'authenticated' || sessionContext === 'onboarding') &&
    authState === 'storage-state'
  ) {
    return { storageState: storageStateForRouteAudit() }
  }

  return { storageState: { cookies: [], origins: [] } }
}

function storageStateForRouteAudit(): BrowserContextOptions['storageState'] {
  if (auditAuthRole === 'preserve') return authFile

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf8')) as StorageState
  let rewroteAuthStorage = false
  for (const origin of storageState.origins ?? []) {
    const authEntry = origin.localStorage?.find(entry => entry.name === 'auth-storage')
    if (!authEntry) continue

    const persistedAuth = JSON.parse(authEntry.value) as {
      state?: { user?: { role?: string; email?: string; name?: string } }
      version?: number
    }
    if (persistedAuth.state?.user) {
      persistedAuth.state.user.role = auditAuthRole
      persistedAuth.state.user.email = `route-audit-${auditAuthRole.toLowerCase()}@test.local`
      persistedAuth.state.user.name = `Route Audit ${auditAuthRole}`
      authEntry.value = JSON.stringify(persistedAuth)
      rewroteAuthStorage = true
    }
  }

  if (!rewroteAuthStorage) {
    throw new Error(
      `ROUTE_AUDIT_AUTH_ROLE=${auditAuthRole} requested but ${authFile} has no auth-storage user role to override`
    )
  }

  return storageState
}

function decodeJwtRole(token: unknown): string | null {
  if (typeof token !== 'string') return null
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: unknown
    }
    return typeof decoded.role === 'string' ? decoded.role : null
  } catch {
    return null
  }
}

function inspectAuthStorageState(): StorageState {
  return JSON.parse(fs.readFileSync(authFile, 'utf8')) as StorageState
}

function buildAuthContext(): AuditAuthContext {
  if (auditAuthRole === 'preserve') {
    return {
      requested_role: 'preserve',
      auth_file: authFile,
      storage_state_strategy: 'preserve',
      client_storage_role: null,
      token_roles: [],
      token_role_matches_requested: null,
    }
  }

  const storageState = inspectAuthStorageState()
  const tokenRoles = new Set<string>()
  for (const cookie of storageState.cookies ?? []) {
    const role = decodeJwtRole(cookie.value)
    if (role) tokenRoles.add(role)
  }

  let clientStorageRole: string | null = null
  for (const origin of storageState.origins ?? []) {
    const authEntry = origin.localStorage?.find(entry => entry.name === 'auth-storage')
    if (!authEntry) continue

    const persistedAuth = JSON.parse(authEntry.value) as {
      state?: { token?: unknown; user?: { role?: string } }
    }
    const tokenRole = decodeJwtRole(persistedAuth.state?.token)
    if (tokenRole) tokenRoles.add(tokenRole)
    if (persistedAuth.state?.user?.role) clientStorageRole = auditAuthRole
  }

  if (!clientStorageRole) {
    throw new Error(
      `ROUTE_AUDIT_AUTH_ROLE=${auditAuthRole} requested but ${authFile} has no auth-storage user role to override`
    )
  }

  const observedTokenRoles = [...tokenRoles].sort()
  return {
    requested_role: auditAuthRole,
    auth_file: authFile,
    storage_state_strategy: 'client-storage-role-override',
    client_storage_role: clientStorageRole,
    token_roles: observedTokenRoles,
    token_role_matches_requested:
      observedTokenRoles.length > 0 ? observedTokenRoles.every(role => role === auditAuthRole) : null,
  }
}

function buildURL(baseURL: string, routePath: string): string {
  return new URL(routePath, baseURL).toString()
}
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function routeTemplateToRegExp(templatePath: string): RegExp {
  const pattern = templatePath
    .split('/')
    .map(segment => {
      if (!segment) return ''
      if (/^\[[^\]/]+\]$/.test(segment)) return '[^/]+'
      return escapeRegExp(segment)
    })
    .join('/')

  return new RegExp(`^${pattern}$`)
}

function fixturePathMatchesTemplate(templatePath: string, fixturePath: string): boolean {
  return routeTemplateToRegExp(templatePath).test(fixturePath)
}

async function waitForVisibleContentToSettle(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText.replace(/\s+/g, ' ').trim()
        const loadingOnly = /^(Загрузка|Loading)\.?/i.test(text) && text.length < 80
        const skeletonCount = Array.from(
          document.querySelectorAll('.animate-pulse, [data-slot="skeleton"], [class*="skeleton"]')
        ).filter(element => {
          if (element.closest('[aria-hidden="true"]')) return false
          const rect = element.getBoundingClientRect()
          return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight
        }).length

        return !loadingOnly && skeletonCount === 0
      },
      undefined,
      { timeout: Number(process.env.ROUTE_AUDIT_CONTENT_TIMEOUT_MS ?? 60000) }
    )
    .catch(() => undefined)
}

async function detectVisibleLoadingState(page: Page): Promise<{
  loadingOnly: boolean
  skeletonCount: number
}> {
  return page.evaluate(() => {
    const text = document.body.innerText.replace(/\s+/g, ' ').trim()
    return {
      loadingOnly: /^(Загрузка|Loading)\.?/i.test(text) && text.length < 80,
      skeletonCount: Array.from(
        document.querySelectorAll('.animate-pulse, [data-slot="skeleton"], [class*="skeleton"]')
      ).filter(element => {
        if (element.closest('[aria-hidden="true"]')) return false
        const rect = element.getBoundingClientRect()
        return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight
      }).length,
    }
  })
}

function inferStatus(record: RouteAuditRecord): RouteAuditRecord['status'] {
  if (record.dynamic && !record.fixture_path) return 'blocked'
  if (record.issues.includes('authenticated-route-redirected-to-auth-page')) return 'failed'
  if (record.issues.includes('loading-state-visible-after-settle')) return 'failed'
  if (record.blocked_requests.length > 0) return 'failed'
  if (record.page_errors.length > 0) return 'failed'
  if (record.http_status && record.http_status >= 500) return 'failed'
  if (record.http_status === 404) return 'failed'
  if (record.warnings.length > 0) return 'warning'
  return 'passed'
}

async function auditRoute(
  route: InventoryRoute,
  baseURL: string,
  browser: Browser
): Promise<RouteAuditRecord> {
  const startedAt = Date.now()
  const dynamicFixture = route.dynamic ? dynamicRouteFixtures.get(route.path) : undefined
  const navigationPath = dynamicFixture?.path ?? route.path
  const { sessionContext, authState } = classifyRoute(route, dynamicFixture)
  const record: RouteAuditRecord = {
    path: route.path,
    source: route.source,
    dynamic: route.dynamic,
    group: route.group,
    session_context: sessionContext,
    auth_state: authState,
    status: route.dynamic && !dynamicFixture ? 'blocked' : 'failed',
    console_errors: [],
    page_errors: [],
    failed_requests: [],
    blocked_requests: [],
    denied_controls: [],
    warnings: [],
    issues: [],
    duration_ms: 0,
  }

  if (route.dynamic && dynamicFixture) {
    record.template_path = route.path
    record.fixture_path = dynamicFixture.path
    record.fixture_source = dynamicFixture.source
  }

  if (route.dynamic && !dynamicFixture) {
    record.issues.push('dynamic-route-blocked-until-safe-fixture-is-explicitly-provided')
    record.duration_ms = Date.now() - startedAt
    return record
  }

  const context = await browser.newContext(contextOptionsFor(sessionContext, authState))
  const page = await context.newPage()
  const guardOptions = {
    baseURL,
    apiURL: process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    allowAuthSetup: false,
    routePath: navigationPath,
    sessionContext,
  }

  page.on('console', message => {
    if (message.type() === 'error') record.console_errors.push(message.text())
  })
  page.on('pageerror', error => record.page_errors.push(error.message))
  attachRequestCollectors(page, record.failed_requests, guardOptions)
  await installReadOnlyNetworkGuard(page, record.blocked_requests, guardOptions)
  const apiFixtures = await installFbsEnhancedReadOnlyApiFixture(
    page,
    navigationPath,
    builtInApiFixturesEnabled
  )
  if (apiFixtures.length > 0) record.api_fixtures = apiFixtures

  try {
    const response = await page.goto(buildURL(baseURL, navigationPath), {
      waitUntil: 'domcontentloaded',
      timeout: Number(process.env.ROUTE_AUDIT_NAV_TIMEOUT_MS ?? 30000),
    })
    record.http_status = response?.status()
    await page.locator('body').waitFor({ state: 'visible', timeout: 15000 })

    // Next.js redirects/client hydration can paint the target page's skeleton after the first
    // body-visible/content-settle check has already passed. Give the hydrated page a short
    // chance to reveal that state, then wait again so the audit validates the final loaded or
    // explicit long-loading UI rather than a transient skeleton frame.
    await page.waitForTimeout(Number(process.env.ROUTE_AUDIT_INITIAL_SETTLE_MS ?? 250))
    await waitForVisibleContentToSettle(page)
    await page.waitForTimeout(Number(process.env.ROUTE_AUDIT_SETTLE_MS ?? 750))
    await waitForVisibleContentToSettle(page)
    const loadingState = await detectVisibleLoadingState(page)
    if (loadingState.loadingOnly || loadingState.skeletonCount > 0) {
      record.issues.push('loading-state-visible-after-settle')
    }
    record.final_url = page.url()
    const finalPath = new URL(record.final_url).pathname
    if (record.session_context === 'authenticated' && ['/login', '/register'].includes(finalPath)) {
      record.issues.push('authenticated-route-redirected-to-auth-page')
      record.auth_state = 'redirected'
    }
    record.title = await page.title()
    record.denied_controls = await findDeniedVisibleControls(page)
    const screenshotPath = path.join(screenshotDir, `${routeArtifactStem(route.path)}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true, caret: 'initial' })
    record.screenshot = path.relative(process.cwd(), screenshotPath)
  } catch (error) {
    record.issues.push(error instanceof Error ? error.message : String(error))
  } finally {
    record.duration_ms = Date.now() - startedAt
    record.warnings = collectOperationalRouteWarnings(record)
    record.status = inferStatus(record)
    await context.close()
  }

  return record
}

function assertRouteRecord(record: RouteAuditRecord): void {
  expect(record.session_context).toMatch(/^(anonymous|onboarding|authenticated|blocked)$/)
  expect(record.auth_state).toMatch(/^(clean|storage-state|fresh-login|redirected|blocked)$/)

  expect(record.blocked_requests, `${record.path} blocked mutation requests`).toHaveLength(0)
  expect(record.page_errors, `${record.path} page errors`).toHaveLength(0)
  if (record.status === 'passed') {
    expect(record.console_errors, `${record.path} console errors`).toHaveLength(0)
    expect(record.failed_requests, `${record.path} failed protected requests`).toHaveLength(0)
    expect(record.denied_controls, `${record.path} visible mutating controls`).toHaveLength(0)
    expect(record.warnings, `${record.path} warnings`).toHaveLength(0)
  }
  if (record.status === 'warning') {
    expect(record.warnings, `${record.path} warning reasons`).not.toHaveLength(0)
  }
  if (record.dynamic && !record.fixture_path) {
    expect(record.status, `${record.path} dynamic status`).toBe('blocked')
    expect(record.session_context, `${record.path} dynamic session_context`).toBe('blocked')
    expect(record.auth_state, `${record.path} dynamic auth_state`).toBe('blocked')
    expect(record.issues, `${record.path} dynamic issue marker`).toContain(
      'dynamic-route-blocked-until-safe-fixture-is-explicitly-provided'
    )
    expect(record.final_url, `${record.path} dynamic final_url`).toBeUndefined()
    expect(record.http_status, `${record.path} dynamic http_status`).toBeUndefined()
    expect(record.title, `${record.path} dynamic title`).toBeUndefined()
    expect(record.screenshot, `${record.path} dynamic screenshot`).toBeUndefined()
    return
  }

  if (record.dynamic) {
    expect(record.template_path, `${record.path} dynamic template_path`).toBe(record.path)
    expect(record.fixture_path, `${record.path} dynamic fixture_path`).toMatch(/^\//)
    expect(record.fixture_source, `${record.path} dynamic fixture_source`).toBeTruthy()
  }

  expect(record.status, `${record.path} route status`).toMatch(/^(passed|warning)$/)
  expect(record.issues, `${record.path} issues`).toHaveLength(0)
  expect(record.final_url, `${record.path} final_url`).toBeTruthy()
  expect(record.http_status, `${record.path} http_status`).toBeLessThan(400)
}

function writeRouteRecord(record: RouteAuditRecord): void {
  fs.writeFileSync(
    path.join(routeDir, `${routeArtifactStem(record.path)}.json`),
    `${JSON.stringify(record, null, 2)}\n`
  )
}

function buildManifest(baseURL: string, inventory: RouteInventory): AuditManifest {
  const failedRoutes = records.filter(record => record.status === 'failed').length
  const warningRoutes = records.filter(record => record.status === 'warning').length
  const dynamicBlockedRoutes = records.filter(
    record => record.dynamic && record.status === 'blocked'
  ).length
  const auditedRoutes = records.filter(
    record => !record.dynamic || record.status !== 'blocked'
  ).length
  const visibleMutatingControlRoutes = records.filter(
    record => record.denied_controls.length > 0
  ).length
  const visibleMutatingControlsObserved = records.reduce(
    (sum, record) => sum + record.denied_controls.length,
    0
  )
  const apiFixtureRoutes = records.filter(record => (record.api_fixtures?.length ?? 0) > 0).length

  return {
    schema_version: 1,
    run_id: runId,
    generated_at: new Date().toISOString(),
    base_url: baseURL,
    inventory_path: inventoryPath ?? '',
    auth_context: buildAuthContext(),
    safety_policy: {
      read_only: true,
      mutation_env_cleared: true,
      blocked_methods: ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      denied_control_patterns: MUTATING_CONTROL_PATTERNS.map(pattern => String(pattern)),
      visible_mutating_controls: 'warning',
    },
    summary: {
      total_routes: inventory.routes.length,
      audited_routes: auditedRoutes,
      dynamic_blocked_routes: dynamicBlockedRoutes,
      failed_routes: failedRoutes,
      warning_routes: warningRoutes,
      blocked_network_requests: records.reduce(
        (sum, record) => sum + record.blocked_requests.length,
        0
      ),
      visible_mutating_control_routes: visibleMutatingControlRoutes,
      visible_mutating_controls_observed: visibleMutatingControlsObserved,
      api_fixture_routes: apiFixtureRoutes,
    },
    records: [...records].sort((a, b) => a.path.localeCompare(b.path)),
  }
}

function writeManifestAndReport(baseURL: string, inventory: RouteInventory): void {
  const manifest = buildManifest(baseURL, inventory)
  const manifestPath = path.join(runDir, 'manifest.json')
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const report = [
    `# Read-only route audit ${runId}`,
    '',
    `- Base URL: ${baseURL}`,
    `- Inventory: ${inventoryPath}`,
    `- Requested auth role: ${manifest.auth_context.requested_role}`,
    `- Storage state strategy: ${manifest.auth_context.storage_state_strategy}`,
    `- Client storage role: ${manifest.auth_context.client_storage_role ?? 'preserve'}`,
    `- Token roles: ${manifest.auth_context.token_roles.join(', ') || 'unverified'}`,
    `- Token roles match requested: ${String(manifest.auth_context.token_role_matches_requested)}`,
    `- Routes: ${manifest.summary.total_routes}`,
    `- Audited: ${manifest.summary.audited_routes}`,
    `- Dynamic blocked: ${manifest.summary.dynamic_blocked_routes}`,
    `- Failed: ${manifest.summary.failed_routes}`,
    `- Warnings: ${manifest.summary.warning_routes}`,
    `- Blocked network requests: ${manifest.summary.blocked_network_requests}`,
    `- Visible mutating control routes: ${manifest.summary.visible_mutating_control_routes}`,
    `- Visible mutating controls observed: ${manifest.summary.visible_mutating_controls_observed}`,
    `- API fixture routes: ${manifest.summary.api_fixture_routes}`,
    '',
    '## Route statuses',
    '',
    '| Status | Route | Context | Auth | Issues / warnings |',
    '| --- | --- | --- | --- | --- |',
    ...manifest.records.map(
      record =>
        `| ${record.status} | ${record.fixture_path ? `${record.path} → ${record.fixture_path}` : record.path} | ${record.session_context} | ${record.auth_state} | ${
          [...record.issues, ...record.warnings].join('<br>') || '—'
        } |`
    ),
    '',
  ].join('\n')

  fs.writeFileSync(path.join(runDir, 'report.md'), report)
}

const inventory = readInventory()
const dynamicRouteFixtures = readDynamicRouteFixtures()

test.describe('read-only full route audit', () => {
  test.describe.configure({ mode: 'serial' })

  for (const route of inventory.routes) {
    test(`read-only audit ${route.path}`, async ({ browser }, testInfo) => {
      const baseURL = String(
        testInfo.project.use.baseURL ?? process.env.E2E_BASE_URL ?? 'http://localhost:3100'
      )
      const record = await auditRoute(route, baseURL, browser)
      records.push(record)
      writeRouteRecord(record)

      assertRouteRecord(record)
    })
  }

  test.afterAll(async ({}, testInfo) => {
    const baseURL = String(
      testInfo.project.use.baseURL ?? process.env.E2E_BASE_URL ?? 'http://localhost:3100'
    )
    writeManifestAndReport(baseURL, inventory)
  })
})
