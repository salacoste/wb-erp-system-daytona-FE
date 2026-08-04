import { expect, test } from './fixtures/network-test'
import { createPlaywrightRouteGuard } from './fixtures/playwright-network-guard'
import { request as workerHttpRequest } from 'node:http'
import { lookup as workerDnsLookup } from 'node:dns'

import { createGuardedFetch } from '../src/test/outbound-network-guard'

test.use({ storageState: { cookies: [], origins: [] } })

let reflectedBeforeAllDiscoveredPlaywright = false
let reflectedBeforeAllDeniedDiagnostics = false
let slowPredicatePage: Parameters<Parameters<typeof test.slow>[0]>[0]['page'] | undefined
let slowPredicateRequest: Parameters<Parameters<typeof test.slow>[0]>[0]['request'] | undefined
const reflectedBeforeAll = Object.getOwnPropertyDescriptor(test, 'beforeAll')?.value as
  typeof test.beforeAll | undefined
if (!reflectedBeforeAll) throw new Error('Guarded beforeAll registration is unavailable')
reflectedBeforeAll(async ({ playwright }, testInfo) => {
  reflectedBeforeAllDiscoveredPlaywright = typeof playwright.request.newContext === 'function'
  expect(() => (playwright as unknown as Record<string, unknown>)['_allPages']).toThrow()
  expect(() => testInfo.attach('runtime', { body: 'constructed-value' })).toThrow(
    /guarded Playwright test facade denied/i
  )
  reflectedBeforeAllDeniedDiagnostics = true
})

test.slow(({ page, request }) => {
  slowPredicatePage = page
  slowPredicateRequest = request
  return false
}, 'guarded fixture callback regression')

test('rejects a non-local browser request before transport', async ({ networkGuard, page }) => {
  await page.setContent('<main>guarded matcher</main>')
  await expect(page.locator('main')).toBeVisible()
  await expect.soft(page.locator('main')).toBeVisible()
  await expect.configure({ timeout: 1_000 })(page.locator('main')).toBeVisible()

  await networkGuard.expectDenied(async () => {
    await expect(page.goto('https://example.invalid/private')).rejects.toThrow()
  })

  expect(networkGuard.snapshot()).toMatchObject({ denied: 1, unexpected: 0 })
})

test('allows localhost and relative targets while rejecting malformed URLs', async () => {
  const fallback = async () => undefined
  const abort = async () => undefined
  const localRoute = {
    request: () => ({ url: () => 'http://localhost:3100/health' }),
    fallback,
    abort,
  }
  const guard = createPlaywrightRouteGuard()

  await guard(localRoute)
  expect(() => guard.assertTarget('/relative')).not.toThrow()
  expect(() => guard.assertTarget('not a valid URL')).toThrow(/outbound test request denied/i)

  const reflectedExtend = Object.getOwnPropertyDescriptor(test, 'extend')?.value
  expect(() => (reflectedExtend as (fixtures: object) => unknown)({})).toThrow(
    /test\.extend is not permitted/i
  )
  expect(() => Object.defineProperty(test, 'beforeAll', { value: reflectedBeforeAll })).toThrow(
    /immutable/i
  )
  expect(() => Object.setPrototypeOf(test, {})).toThrow(/immutable/i)
  expect(Object.getPrototypeOf(test)).toBeNull()
  expect(Object.getPrototypeOf(reflectedBeforeAll)).toBeNull()
  const constructorKey = ['con', 'structor'].join('')
  expect(() => (test as unknown as Record<string, unknown>)[constructorKey]).toThrow(
    /guarded Playwright test facade denied/i
  )

  const useKey: 'use' = 'use'
  const reflectedUse = Object.getOwnPropertyDescriptor(test, useKey)?.value as (
    options: Record<string, unknown>
  ) => void
  expect(reflectedUse === test[useKey]).toBe(true)
  expect(Object.getPrototypeOf(reflectedUse)).toBeNull()
  expect(() => reflectedUse({ serviceWorkers: 'allow' })).toThrow(/outbound test request denied/i)
  expect(() => reflectedUse({ baseURL: 'https://example.invalid' })).toThrow(
    /outbound test request denied/i
  )
})

test('closes raw test facade and both TestInfo diagnostic entry points', async ({}, testInfo) => {
  const nestedTestKey: 'test' = 'test'
  const reflectedTest = test as unknown as Record<string, typeof test>
  expect(reflectedTest[nestedTestKey] === test).toBe(true)
  expect(Object.getOwnPropertyDescriptor(test, nestedTestKey)?.value === test).toBe(true)
  expect(() => reflectedTest.test.extend({})).toThrow(/test\.extend is not permitted/i)

  for (const property of ['chromium', 'request', 'expect', 'mergeTests', 'mergeExpects'] as const) {
    expect(() => (test as unknown as Record<string, unknown>)[property]).toThrow(
      /guarded Playwright test facade denied/i
    )
    expect(() => Object.getOwnPropertyDescriptor(test, property)).toThrow(
      /guarded Playwright test facade denied/i
    )
  }

  const runtimeValue = ['runtime', 'credential', '12810'].join('')
  const assertGuardedInfo = (info: typeof testInfo) => {
    expect(() => info.attach('diagnostic', { body: runtimeValue })).toThrow(
      /guarded Playwright test facade denied/i
    )
    expect(() => info.outputPath(runtimeValue)).toThrow(/guarded Playwright test facade denied/i)
    expect(() => info.snapshotPath(runtimeValue)).toThrow(/guarded Playwright test facade denied/i)
    expect(() => info.attachments).toThrow(/guarded Playwright test facade denied/i)

    const before = info.annotations.push({ type: 'note', description: runtimeValue })
    expect(() => info.annotations.push({ type: runtimeValue, description: runtimeValue })).toThrow(
      /guarded Playwright test facade denied/i
    )
    const after = info.annotations.push({ type: 'note', description: runtimeValue })
    expect(after).toBe(before + 1)
    expect(info.project.use.baseURL).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/)
  }

  assertGuardedInfo(test.info())
  assertGuardedInfo(testInfo)
})

test('guards fixtures passed to the test.slow predicate', async ({ networkGuard }) => {
  expect(slowPredicatePage).toBeDefined()
  expect(slowPredicateRequest).toBeDefined()
  expect(Object.getPrototypeOf(slowPredicatePage as object)).toBeNull()
  expect(Object.getPrototypeOf(slowPredicateRequest as object)).toBeNull()

  await networkGuard.expectDenied(async () => {
    await expect(
      (slowPredicatePage as NonNullable<typeof slowPredicatePage>).context().unrouteAll()
    ).rejects.toThrow(/outbound test request denied/i)
  })
  await networkGuard.expectDenied(async () => {
    await expect(
      (slowPredicateRequest as NonNullable<typeof slowPredicateRequest>).storageState()
    ).rejects.toThrow(/outbound test request denied/i)
  })
  expect(networkGuard.snapshot()).toMatchObject({ denied: 2, unexpected: 0 })
})

test('guards Playwright worker fetch, Node HTTP, and DNS before transport', async () => {
  const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
  const guardedFetchInstalled = Boolean(
    (globalThis.fetch as unknown as Record<symbol, unknown>)[guarded]
  )
  const guardedHttpInstalled = Boolean(
    (workerHttpRequest as unknown as Record<symbol, unknown>)[guarded]
  )
  const guardedDnsInstalled = Boolean(
    (workerDnsLookup as unknown as Record<symbol, unknown>)[guarded]
  )
  if (!guardedFetchInstalled || !guardedHttpInstalled || !guardedDnsInstalled) {
    throw new Error('Playwright worker network guard was not installed before spec evaluation')
  }

  await expect(fetch('https://example.invalid/worker-fetch')).rejects.toThrow(
    /outbound test request denied/i
  )
  expect(() => workerHttpRequest('https://example.invalid/worker-http')).toThrow(
    /outbound test request denied/i
  )
  expect(() => workerDnsLookup('example.invalid', () => undefined)).toThrow(
    /outbound test request denied/i
  )

  const transport = async (_input: string | URL | Request, _init?: RequestInit) =>
    new Response(null, { status: 204 })
  let transportCalls = 0
  const guardedLocalFetch = createGuardedFetch(async (...args) => {
    transportCalls += 1
    return transport(...args)
  })
  await expect(guardedLocalFetch('http://localhost:3100/worker-local')).resolves.toHaveProperty(
    'status',
    204
  )
  await expect(guardedLocalFetch('https://example.invalid/worker-denied')).rejects.toThrow(
    /outbound test request denied/i
  )
  expect(transportCalls).toBe(1)
})

test('guards raw browser, Playwright request factory, and request fixture paths', async ({
  browser,
  networkGuard,
  page,
  playwright,
  request,
}) => {
  expect(reflectedBeforeAllDiscoveredPlaywright).toBe(true)
  expect(reflectedBeforeAllDeniedDiagnostics).toBe(true)

  const context = await browser.newContext({
    serviceWorkers: 'allow',
    storageState: { cookies: [], origins: [] },
  })
  try {
    const page = await context.newPage()
    await networkGuard.expectDenied(async () => {
      await expect(page.goto('https://example.invalid/manual-context')).rejects.toThrow()
    })
  } finally {
    await context.close()
  }

  const apiContext = await playwright.request.newContext()
  try {
    await networkGuard.expectDenied(async () => {
      await expect(apiContext.get('https://example.invalid/api-context')).rejects.toThrow(
        /outbound test request denied/i
      )
    })
  } finally {
    await apiContext.dispose()
  }

  await networkGuard.expectDenied(async () => {
    await expect(request.get('https://example.invalid/request-fixture')).rejects.toThrow(
      /outbound test request denied/i
    )
  })

  await networkGuard.expectDenied(async () => {
    await expect(request.storageState({ path: 'capture.json' })).rejects.toThrow(
      /outbound test request denied/i
    )
  })

  await networkGuard.expectDenied(async () => {
    await expect(page.context().request.storageState()).rejects.toThrow(
      /outbound test request denied/i
    )
  })

  for (const key of ['_allPages', '_allContexts', '_instrumentation'] as const) {
    await networkGuard.expectDenied(async () => {
      expect(() => (playwright as unknown as Record<string, unknown>)[key]).toThrow(
        /outbound test request denied/i
      )
    })
  }

  expect(networkGuard.snapshot()).toMatchObject({ denied: 8, unexpected: 0 })
})
