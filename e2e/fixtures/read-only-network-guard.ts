import type { Page, Route, Request, Response } from '@playwright/test'
import { emptyFbsEnhancedResponse } from '@/test/fixtures/fbs-enhanced-empty'

export type SessionContext = 'anonymous' | 'onboarding' | 'authenticated' | 'blocked'
export type AuthState = 'clean' | 'storage-state' | 'fresh-login' | 'redirected' | 'blocked'
export type RouteAuditStatus = 'passed' | 'warning' | 'failed' | 'blocked' | 'skipped'

export interface BlockedRequestRecord {
  url: string
  method: string
  resource_type: string
  reason: string
  session_context: SessionContext
  route_path: string
  timestamp: string
}

export interface FailedRequestRecord {
  url: string
  method: string
  resource_type: string
  failure?: string
  status?: number
  status_text?: string
  timestamp: string
}

export interface ApiFixtureRecord {
  route_path: string
  url_pattern: string
  methods: string[]
  source: string
}

export interface RouteAuditRecord {
  path: string
  source: string
  dynamic: boolean
  group: string
  session_context: SessionContext
  auth_state: AuthState
  status: RouteAuditStatus
  final_url?: string
  http_status?: number
  title?: string
  screenshot?: string
  /** Original dynamic route template when a safe fixture path resolves it. */
  template_path?: string
  /** Explicit safe path used to audit a dynamic route template. */
  fixture_path?: string
  /** Human-readable source of the dynamic route fixture map. */
  fixture_source?: string
  /** Built-in API fixtures installed by the audit harness for deterministic route rendering. */
  api_fixtures?: ApiFixtureRecord[]
  console_errors: string[]
  page_errors: string[]
  failed_requests: FailedRequestRecord[]
  blocked_requests: BlockedRequestRecord[]
  denied_controls: string[]
  warnings: string[]
  issues: string[]
  duration_ms: number
}

export interface AuditManifest {
  schema_version: 1
  run_id: string
  generated_at: string
  base_url: string
  inventory_path: string
  auth_context: {
    requested_role: string
    auth_file: string
    storage_state_strategy: 'preserve' | 'client-storage-role-override'
    client_storage_role: string | null
    token_roles: string[]
    token_role_matches_requested: boolean | null
  }
  safety_policy: {
    read_only: true
    mutation_env_cleared: true
    blocked_methods: string[]
    denied_control_patterns: string[]
    visible_mutating_controls: 'warning'
  }
  summary: {
    total_routes: number
    audited_routes: number
    dynamic_blocked_routes: number
    failed_routes: number
    warning_routes: number
    blocked_network_requests: number
    visible_mutating_control_routes: number
    visible_mutating_controls_observed: number
    api_fixture_routes: number
  }
  records: RouteAuditRecord[]
}

export const MUTATION_ENV_KEYS = [
  'E2E_ENABLE_MUTATIONS',
  'E2E_MUTATION_TARGET',
  'E2E_MUTATION_ACK',
] as const

export const MUTATING_CONTROL_PATTERNS = [
  /\b(create|save|assign|sync|start|pause|close|delete|submit|backfill|import|export)\b/i,
  /\b(send|generate|update|remove|recalculate|refresh wb|sync wb)\b/i,
  /\b(token|shipment|supply|tariff|tax|cogs)\b.*\b(save|assign|delete|sync|create|close)\b/i,
  /\b(save|assign|delete|sync|create|close)\b.*\b(token|shipment|supply|tariff|tax|cogs)\b/i,
  /созда(ть|й|ние)|сохран(ить|и)|назнач(ить|ь)|синхрон|запусти(ть|)|удали(ть|)|отправ(ить|ка)/i,
  /закры(ть|тие).*(поставк|отправк|заказ|смен|период|доступ)|(поставк|отправк|заказ|смен|период|доступ).*закры(ть|тие)/i,
]

export const FBS_ENHANCED_API_FIXTURE: ApiFixtureRecord = {
  route_path: '/analytics/fbs-enhanced',
  url_pattern: '**/v1/analytics/fbs/enhanced**',
  methods: ['GET', 'HEAD'],
  source: '@/test/fixtures/fbs-enhanced-empty#emptyFbsEnhancedResponse',
}

export function clearMutationEnv(): void {
  for (const key of MUTATION_ENV_KEYS) {
    delete process.env[key]
  }
}

export function sanitizeRoutePath(routePath: string): string {
  if (routePath === '/') return 'root'
  return routePath
    .replace(/^\//, '')
    .replace(/\[(.+?)\]/g, 'dynamic-$1')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function routePathHash(routePath: string): string {
  let hash = 0x811c9dc5

  for (const char of routePath) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return hash.toString(36).padStart(7, '0')
}

export function routeArtifactStem(routePath: string): string {
  return `${sanitizeRoutePath(routePath)}-${routePathHash(routePath)}`
}

export function isMutatingControlText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return Boolean(normalized) && MUTATING_CONTROL_PATTERNS.some(pattern => pattern.test(normalized))
}

export function collectOperationalRouteWarnings(
  record: Pick<RouteAuditRecord, 'console_errors' | 'failed_requests' | 'denied_controls'>
): string[] {
  const warnings: string[] = []

  if (record.denied_controls.length > 0) {
    warnings.push(`visible-mutating-controls-observed-only:${record.denied_controls.join(', ')}`)
  }
  if (record.console_errors.length > 0) {
    warnings.push('console-errors-observed')
  }
  if (record.failed_requests.some(request => (request.status ?? 0) >= 500)) {
    warnings.push('protected-read-request-returned-5xx')
  }

  return warnings
}

export async function installFbsEnhancedReadOnlyApiFixture(
  page: Page,
  routePath: string,
  enabled = true
): Promise<ApiFixtureRecord[]> {
  if (!enabled) return []
  if (routePath !== FBS_ENHANCED_API_FIXTURE.route_path) return []

  await page.route(FBS_ENHANCED_API_FIXTURE.url_pattern, async route => {
    const method = route.request().method().toUpperCase()
    if (!FBS_ENHANCED_API_FIXTURE.methods.includes(method)) {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(emptyFbsEnhancedResponse()),
    })
  })

  return [FBS_ENHANCED_API_FIXTURE]
}

export interface ReadOnlyNetworkGuardOptions {
  baseURL?: string
  apiURL?: string
  allowAuthSetup?: boolean
  routePath: string
  sessionContext: SessionContext
}

function safeURL(rawURL: string): URL | null {
  try {
    return new URL(rawURL)
  } catch {
    return null
  }
}

function normalizeOrigin(rawURL?: string): string | null {
  if (!rawURL) return null
  const parsed = safeURL(rawURL)
  return parsed?.origin ?? null
}

function isWbHost(hostname: string): boolean {
  return hostname === 'wildberries.ru' || hostname.endsWith('.wildberries.ru')
}

function isLocalBackendTarget(
  url: URL,
  frontendOrigin: string | null,
  apiOrigin: string | null
): boolean {
  if (apiOrigin && url.origin === apiOrigin) return true

  const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)
  if (!isLocalhost) return false

  if (frontendOrigin && url.origin === frontendOrigin) {
    return url.pathname.startsWith('/api') || url.pathname.startsWith('/trpc')
  }

  return ['3000', '8000', '8001', '8080'].includes(url.port)
}

export function isProtectedBackendOrWbRequest(
  rawURL: string,
  options: ReadOnlyNetworkGuardOptions
): boolean {
  const url = safeURL(rawURL)
  if (!url) return false

  if (isWbHost(url.hostname)) return true

  return isLocalBackendTarget(
    url,
    normalizeOrigin(options.baseURL),
    normalizeOrigin(options.apiURL ?? process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL)
  )
}

function isAllowedAuthSetupRequest(request: Request): boolean {
  const method = request.method().toUpperCase()
  if (method !== 'POST') return false

  const pathname = safeURL(request.url())?.pathname.toLowerCase() ?? ''
  return /\/(auth|login|session|token)(\/|$)/.test(pathname)
}

function isAllowedNextDevDiagnosticRequest(
  request: Request,
  options: ReadOnlyNetworkGuardOptions
): boolean {
  if (request.method().toUpperCase() !== 'POST') return false

  const url = safeURL(request.url())
  const frontendOrigin = normalizeOrigin(options.baseURL)
  return url?.origin === frontendOrigin && url.pathname === '/__nextjs_original-stack-frames'
}

export function isAllowedReadOnlyRequest(
  request: Request,
  options: ReadOnlyNetworkGuardOptions
): boolean {
  const method = request.method().toUpperCase()
  if (method === 'GET' || method === 'HEAD') return true
  if (options.allowAuthSetup && isAllowedAuthSetupRequest(request)) return true
  return false
}

export async function installReadOnlyNetworkGuard(
  page: Page,
  blockedRequests: BlockedRequestRecord[],
  options: ReadOnlyNetworkGuardOptions
): Promise<void> {
  await page.route('**/*', async (route: Route) => {
    const request = route.request()

    if (
      isAllowedReadOnlyRequest(request, options) ||
      isAllowedNextDevDiagnosticRequest(request, options)
    ) {
      await route.continue()
      return
    }

    blockedRequests.push({
      url: request.url(),
      method: request.method().toUpperCase(),
      resource_type: request.resourceType(),
      reason: 'read-only-audit-blocked-non-get-head-target-request',
      session_context: options.sessionContext,
      route_path: options.routePath,
      timestamp: new Date().toISOString(),
    })

    await route.abort('blockedbyclient')
  })
}

function isExpectedReadOnlyCancellation(
  request: Request,
  options: ReadOnlyNetworkGuardOptions
): boolean {
  const url = safeURL(request.url())
  return (
    options.routePath === '/analytics/fbs-enhanced' &&
    request.method().toUpperCase() === 'GET' &&
    url?.pathname === '/v1/analytics/fbs/enhanced' &&
    request.failure()?.errorText === 'net::ERR_ABORTED'
  )
}

export function attachRequestCollectors(
  page: Page,
  failedRequests: FailedRequestRecord[],
  options: ReadOnlyNetworkGuardOptions
): void {
  page.on('requestfailed', request => {
    if (!isProtectedBackendOrWbRequest(request.url(), options)) return
    if (isExpectedReadOnlyCancellation(request, options)) return

    failedRequests.push({
      url: request.url(),
      method: request.method().toUpperCase(),
      resource_type: request.resourceType(),
      failure: request.failure()?.errorText,
      timestamp: new Date().toISOString(),
    })
  })

  page.on('response', (response: Response) => {
    if (!isProtectedBackendOrWbRequest(response.url(), options)) return
    if (response.status() < 400) return

    const request = response.request()
    failedRequests.push({
      url: response.url(),
      method: request.method().toUpperCase(),
      resource_type: request.resourceType(),
      status: response.status(),
      status_text: response.statusText(),
      timestamp: new Date().toISOString(),
    })
  })
}

export async function findDeniedVisibleControls(page: Page): Promise<string[]> {
  const controls = await page
    .locator('button, [role="button"], a, input[type="submit"], input[type="button"]')
    .evaluateAll(elements =>
      elements
        .filter(element => {
          if (element.closest('[aria-hidden="true"]')) return false

          const htmlElement = element as HTMLElement
          const rect = htmlElement.getBoundingClientRect()
          const style = window.getComputedStyle(htmlElement)
          const disabled =
            htmlElement.hasAttribute('disabled') ||
            htmlElement.getAttribute('aria-disabled') === 'true'

          return (
            !disabled &&
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
          )
        })
        .map(element => {
          const inputElement = element as HTMLInputElement
          const candidates = [
            element.textContent,
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            inputElement.value,
          ]

          return candidates
            .map(candidate => candidate?.replace(/\s+/g, ' ').trim() ?? '')
            .find(Boolean)
        })
        .filter((value): value is string => Boolean(value))
    )

  return Array.from(new Set(controls.filter(isMutatingControlText))).sort((a, b) =>
    a.localeCompare(b)
  )
}
