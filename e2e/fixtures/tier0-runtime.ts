import {
  test as base,
  expect,
  type Page,
  type TestInfo,
  type WebSocketRoute,
} from '@playwright/test'
import {
  assertAllowedURL,
  loadBoundDescriptorSnapshot,
  resolveAllowedURL,
} from '../../scripts/tier0/runtime-safety.mjs'

interface EnvironmentDescriptor {
  allowed_origins: { frontend: string[]; backend: string[] }
  fixtures?: Record<string, unknown>
}

export interface ApiProvenance {
  method: string
  origin: string
  pathname: string
  search?: string
  status?: number
  correlationId?: string
  proof?: 'cleanup-delete-ack' | 'cleanup-absence'
  controlDigest?: string
  run_id: string
  receipt_sha256: string
  row_id: string
  test_id: string
  source: 'browser-response' | 'direct-api'
}

export type ApiProvenanceBinding = Pick<
  ApiProvenance,
  'run_id' | 'receipt_sha256' | 'row_id' | 'test_id'
>

export interface Tier0Runtime {
  descriptor: EnvironmentDescriptor
  apiProvenance: ApiProvenance[]
  provenanceBinding: ApiProvenanceBinding
}

function runtimeContext(testInfo: TestInfo): {
  descriptor: EnvironmentDescriptor
  provenanceBinding: ApiProvenanceBinding
} {
  const bound = loadBoundDescriptorSnapshot(process.env)
  const rowId =
    testInfo.title.match(/\[((?:RT-E|OI-E)\d{2})\]/)?.[1] ||
    (testInfo.project.name === 'tier0-user-auth'
      ? 'PRE-I06'
      : testInfo.project.name === 'tier0-manager-auth'
        ? 'PRE-I07'
        : 'PRE-I05')
  return {
    descriptor: {
      allowed_origins: {
        frontend: [...bound.descriptor.frontendAllowlist],
        backend: [...bound.descriptor.backendAllowlist],
      },
      fixtures: bound.descriptor.fixtures,
    },
    provenanceBinding: {
      run_id: bound.receipt.run_id,
      receipt_sha256: bound.receiptSha256,
      row_id: rowId,
      test_id: testInfo.testId,
    },
  }
}

function exactOrigins(value: string[]): string[] {
  return value.map(origin => new URL(origin).origin)
}

export function controlTier0RequestURL(
  rawURL: string,
  allowedOrigins: string[],
  method: string,
  allowedMethods: string[],
  label = 'Tier-0 request'
): URL {
  const controlled = assertAllowedURL(rawURL, allowedOrigins, label, { method, allowedMethods })
  if (!controlled) throw new Error('Tier-0 URL control returned no destination')
  return controlled
}

export function controlTier0NavigationURL(rawPath: string, frontendOrigins: string[]): URL {
  if (frontendOrigins.length !== 1) {
    throw new Error('Tier-0 navigation requires exactly one frontend origin')
  }
  const controlled = resolveAllowedURL(
    rawPath,
    new URL(frontendOrigins[0]).origin,
    frontendOrigins.map(origin => new URL(origin).origin),
    'signed Tier-0 frontend observation'
  )
  if (!controlled) throw new Error('Tier-0 navigation control returned no destination')
  return controlled
}

export async function enforceTier0WebSocket(
  socket: Pick<WebSocketRoute, 'close' | 'connectToServer' | 'url'>,
  allowedOrigins: string[],
  failures: string[]
): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(socket.url())
  } catch {
    failures.push('invalid-websocket-url')
    await socket.close({ code: 1008, reason: 'Tier-0 origin denied' })
    return
  }
  if (!['ws:', 'wss:'].includes(parsed.protocol)) {
    failures.push(`forbidden-websocket-protocol:${parsed.protocol}`)
    await socket.close({ code: 1008, reason: 'Tier-0 origin denied' })
    return
  }
  const effectiveOrigin = `${parsed.protocol === 'wss:' ? 'https:' : 'http:'}//${parsed.host}`
  if (!allowedOrigins.includes(effectiveOrigin)) {
    failures.push(`non-allowlisted-websocket:${effectiveOrigin}`)
    await socket.close({ code: 1008, reason: 'Tier-0 origin denied' })
    return
  }
  socket.connectToServer()
}

export async function installTier0EgressEnforcement(
  page: Page,
  allowedOrigins: string[],
  backendOrigins: string[],
  provenance: ApiProvenance[],
  failures: string[],
  options: { allowAuthPost?: boolean; provenanceBinding: ApiProvenanceBinding }
): Promise<void> {
  await page.route('**/*', async route => {
    const request = route.request()
    let url: URL
    try {
      url = new URL(request.url())
    } catch {
      failures.push('invalid-request-url')
      await route.abort('blockedbyclient')
      return
    }
    if (['data:', 'blob:'].includes(url.protocol)) {
      await route.continue()
      return
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      failures.push(`forbidden-protocol:${url.protocol}`)
      await route.abort('blockedbyclient')
      return
    }
    const method = request.method().toUpperCase()
    const authPost =
      options.allowAuthPost === true &&
      method === 'POST' &&
      /\/(auth|login|session|token)(\/|$)/i.test(url.pathname)
    try {
      url = controlTier0RequestURL(
        request.url(),
        allowedOrigins,
        method,
        authPost ? ['GET', 'HEAD', 'OPTIONS', 'POST'] : ['GET', 'HEAD', 'OPTIONS']
      )
    } catch (error) {
      failures.push(`destination-control:${error instanceof Error ? error.name : 'unknown'}`)
      await route.abort('blockedbyclient')
      return
    }
    await route.continue()
  })

  await page.routeWebSocket('**/*', socket =>
    enforceTier0WebSocket(socket, allowedOrigins, failures)
  )

  page.on('response', response => {
    let url: URL
    try {
      url = controlTier0RequestURL(response.url(), allowedOrigins, response.request().method(), [
        'GET',
        'HEAD',
        'OPTIONS',
        'POST',
      ])
    } catch {
      failures.push('unsafe-effective-destination')
      return
    }
    if (backendOrigins.includes(url.origin)) {
      provenance.push({
        ...options.provenanceBinding,
        method: response.request().method(),
        origin: url.origin,
        pathname: url.pathname,
        status: response.status(),
        correlationId:
          response.headers()['x-correlation-id'] || response.headers()['x-request-id'] || undefined,
        source: 'browser-response',
      })
    }
  })
}

export const test = base.extend<{ tier0Runtime: Tier0Runtime }>({
  tier0Runtime: [
    async ({ page }, use, testInfo: TestInfo) => {
      const { descriptor: environment, provenanceBinding } = runtimeContext(testInfo)
      const backendOrigins = exactOrigins(environment.allowed_origins.backend)
      const allowedOrigins = exactOrigins([
        ...environment.allowed_origins.frontend,
        ...backendOrigins,
      ])
      const apiProvenance: ApiProvenance[] = []
      const failures: string[] = []
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      const credentialValues = [
        process.env.E2E_TEST_EMAIL,
        process.env.E2E_TEST_PASSWORD,
        process.env.E2E_MANAGER_EMAIL,
        process.env.E2E_MANAGER_PASSWORD,
        process.env.E2E_RESTRICTED_EMAIL,
        process.env.E2E_RESTRICTED_PASSWORD,
      ].filter((value): value is string => Boolean(value && value.length >= 6))

      page.on('console', message => {
        const body = message.text()
        if (message.type() === 'error') consoleErrors.push('console-error-observed')
        if (
          credentialValues.some(value => body.includes(value)) ||
          /\bBearer\s+[A-Za-z0-9._~+/-]+=*\b/i.test(body) ||
          /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/.test(body)
        ) {
          failures.push('secret-like-console-output')
        }
      })
      page.on('pageerror', error => pageErrors.push(error.name))
      await installTier0EgressEnforcement(
        page,
        allowedOrigins,
        backendOrigins,
        apiProvenance,
        failures,
        {
          allowAuthPost:
            testInfo.project.name === 'tier0-user-auth' ||
            testInfo.project.name === 'tier0-manager-auth' ||
            testInfo.title.includes('[RT-E05]') ||
            (testInfo.title.includes('[OI-E02]') &&
              Boolean(process.env.E2E_RESTRICTED_EMAIL && process.env.E2E_RESTRICTED_PASSWORD)),
          provenanceBinding,
        }
      )
      page.on('requestfailed', request => {
        const url = new URL(request.url())
        if (backendOrigins.includes(url.origin)) failures.push('backend-request-failed')
      })
      page.on('response', response => {
        const url = new URL(response.url())
        const expectedErrorControl =
          testInfo.title.includes('[OI-E06]') || testInfo.title.includes('[RT-E10]')
        if (
          backendOrigins.includes(url.origin) &&
          response.status() >= 500 &&
          !expectedErrorControl
        ) {
          failures.push(`unexpected-backend-5xx:${url.pathname}`)
        }
      })
      await use({ descriptor: environment, apiProvenance, provenanceBinding })

      const infrastructureFailure =
        failures.length > 0 || pageErrors.length > 0 || consoleErrors.length > 0
      if (
        infrastructureFailure ||
        (testInfo.status && testInfo.status !== testInfo.expectedStatus)
      ) {
        const declaredProductContract = testInfo.annotations.some(
          annotation => annotation.type === 'tier0-product-contract'
        )
        const failureClass = infrastructureFailure
          ? 'infrastructure'
          : testInfo.status === 'timedOut' || testInfo.status === 'interrupted'
            ? 'runner'
            : declaredProductContract
              ? 'product'
              : 'runner'
        testInfo.annotations.push({ type: 'tier0-failure-class', description: failureClass })
      }

      await testInfo.attach('tier0-api-provenance.json', {
        body: Buffer.from(JSON.stringify(apiProvenance, null, 2)),
        contentType: 'application/json',
      })
      expect.soft(failures, 'all browser destinations must be exactly allowlisted').toEqual([])
      expect.soft(pageErrors, 'page must not emit unhandled errors').toEqual([])
      expect.soft(consoleErrors, 'page must not emit console errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
