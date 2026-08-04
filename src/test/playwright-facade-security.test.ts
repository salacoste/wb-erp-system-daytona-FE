import { describe, expect, it, vi } from 'vitest'

import type {
  APIRequestContext,
  APIResponse,
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
  Request,
  Route,
} from '@playwright/test'

import {
  createGuardedApiRequestContext,
  createGuardedBrowser,
  createGuardedBrowserContext,
  createGuardedPage,
  createGuardedPlaywright,
  createGuardedTestUse,
  guardedExpect,
} from '../../e2e/fixtures/playwright-network-guard'
import type { PlaywrightRuntime } from '../../e2e/fixtures/playwright-network-guard'
import { createGuardedUserFixtureCallback } from '../../e2e/fixtures/network-test'

function fakeContext(
  request: APIRequestContext = { get: vi.fn() } as unknown as APIRequestContext
) {
  return {
    browser: vi.fn<() => Browser | null>(() => null),
    close: vi.fn(),
    newPage: vi.fn(),
    request,
    route: vi.fn(),
    routeWebSocket: vi.fn(),
  }
}

describe('Playwright assertion and fixture facades', () => {
  it('rejects private and unknown fixture values before user callbacks or factories run', async () => {
    const rawFactory = vi.fn()
    const userCallback = vi.fn(() => rawFactory())
    const guardedCallback = createGuardedUserFixtureCallback(userCallback) as (
      fixtures: Record<string, unknown>
    ) => Promise<unknown>

    await expect(guardedCallback({ _contextFactory: rawFactory })).rejects.toThrow(
      /guarded Playwright test facade denied/i
    )
    await expect(guardedCallback({ unknownFixture: rawFactory })).rejects.toThrow(
      /guarded Playwright test facade denied/i
    )
    await expect(guardedCallback({ networkState: { denied: 0, unexpected: 0 } })).rejects.toThrow(
      /guarded Playwright test facade denied/i
    )
    expect(userCallback).not.toHaveBeenCalled()
    expect(rawFactory).not.toHaveBeenCalled()
  })

  it('passes request and browser factories stable sanitized option snapshots', async () => {
    const requestGet = vi.fn()
    const requestNewContext = vi.fn().mockResolvedValue({ get: requestGet })
    const onDenied = vi.fn()
    const playwright = createGuardedPlaywright(
      { request: { newContext: requestNewContext } } as unknown as PlaywrightRuntime,
      { onDenied }
    )
    let apiBaseURLDescriptorReads = 0
    const changingApiOptions = new Proxy(Object.create(null), {
      getOwnPropertyDescriptor(_target, property) {
        if (property !== 'baseURL') return undefined
        const value =
          apiBaseURLDescriptorReads++ === 0
            ? 'http://localhost:3100/api'
            : 'https://example.invalid/api'
        return { configurable: true, enumerable: true, value, writable: true }
      },
      ownKeys: () => ['baseURL'],
    })

    await playwright.request.newContext(changingApiOptions)
    expect(requestNewContext).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3100/api',
      maxRedirects: 0,
    })
    expect(Reflect.getOwnPropertyDescriptor(changingApiOptions, 'baseURL')?.value).toBe(
      'https://example.invalid/api'
    )

    const rawContext = fakeContext()
    const browserNewContext = vi.fn().mockResolvedValue(rawContext)
    const browser = createGuardedBrowser({ newContext: browserNewContext } as unknown as Browser, {
      onDenied,
    })
    let browserBaseURLDescriptorReads = 0
    const changingBrowserOptions = new Proxy(Object.create(null), {
      getOwnPropertyDescriptor(_target, property) {
        if (property !== 'baseURL') return undefined
        const value =
          browserBaseURLDescriptorReads++ === 0
            ? 'http://localhost:3100/browser'
            : 'https://example.invalid/browser'
        return { configurable: true, enumerable: true, value, writable: true }
      },
      ownKeys: () => ['baseURL'],
    })

    await browser.newContext(changingBrowserOptions as BrowserContextOptions)
    expect(browserNewContext).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3100/browser',
      serviceWorkers: 'block',
    })
    expect(Reflect.getOwnPropertyDescriptor(changingBrowserOptions, 'baseURL')?.value).toBe(
      'https://example.invalid/browser'
    )

    const baseURLGetter = vi.fn(() => 'http://localhost:3100/accessor')
    const proxyGetter = vi.fn(() => ({ server: 'http://localhost:8080' }))
    const accessorOptions = Object.defineProperties(
      {},
      {
        baseURL: { enumerable: true, get: baseURLGetter },
        proxy: { enumerable: true, get: proxyGetter },
      }
    )
    await expect(playwright.request.newContext(accessorOptions)).rejects.toThrow(
      /outbound test request denied/i
    )
    await expect(browser.newContext(accessorOptions)).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(baseURLGetter).not.toHaveBeenCalled()
    expect(proxyGetter).not.toHaveBeenCalled()
    expect(requestNewContext).toHaveBeenCalledOnce()
    expect(browserNewContext).toHaveBeenCalledOnce()
  })

  it('canonicalizes API request URL inputs and rejects Request objects before transport', async () => {
    class OverriddenUrl extends URL {
      override toString(): string {
        return 'https://example.invalid/api-url-subclass'
      }
    }
    class OverriddenRequest extends globalThis.Request {
      override get url(): string {
        return 'http://localhost:3100/api-request-subclass'
      }
    }
    const get = vi.fn().mockResolvedValue({
      body: vi.fn(),
      dispose: vi.fn(),
      headers: vi.fn(),
      headersArray: vi.fn(),
      json: vi.fn(),
      ok: vi.fn(),
      securityDetails: vi.fn(),
      serverAddr: vi.fn(),
      status: vi.fn(),
      statusText: vi.fn(),
      text: vi.fn(),
      url: vi.fn(),
    })
    const request = createGuardedApiRequestContext({ get } as unknown as APIRequestContext)

    await request.get(new OverriddenUrl('http://localhost:3100/api-url-subclass') as never)
    expect(get).toHaveBeenCalledWith('http://localhost:3100/api-url-subclass', {
      maxRedirects: 0,
    })

    const externalRequest = new OverriddenRequest('https://example.invalid/api-request-subclass')
    await expect(request.get(externalRequest as never)).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(get).toHaveBeenCalledOnce()
  })

  it('rejects accessor and Proxy Route options before fetch or fallback transport', async () => {
    const rawContext = fakeContext()
    const rawPage = { context: () => rawContext, route: vi.fn() }
    rawContext.newPage.mockResolvedValue(rawPage as unknown as Page)
    const onDenied = vi.fn()
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext, {
      onDenied,
    })
    const page = await context.newPage()
    const urlGetter = vi.fn(() => 'http://localhost:3100/first-read')
    const accessorOptions = Object.defineProperty({}, 'url', {
      enumerable: true,
      get: urlGetter,
    })
    const proxyGet = vi.fn()
    const proxyOptions = new Proxy(
      {},
      {
        get: proxyGet,
        getOwnPropertyDescriptor: () => ({
          configurable: true,
          enumerable: true,
          get: urlGetter,
        }),
        ownKeys: () => ['url'],
      }
    )
    const request = { url: () => 'http://localhost:3100/original' } as Request

    for (const handler of [
      (route: Route) => route.fetch(accessorOptions as Parameters<Route['fetch']>[0]),
      (route: Route) => route.fallback(proxyOptions as Parameters<Route['fallback']>[0]),
    ]) {
      const abort = vi.fn()
      const fetch = vi.fn()
      const fallback = vi.fn()
      const rawRoute = {
        abort,
        fallback,
        fetch,
        request: () => request,
      } as unknown as Route
      await page.route('**/*', handler)
      const registered = rawPage.route.mock.calls.at(-1)?.[1] as (
        route: Route,
        request: Request
      ) => Promise<unknown>

      await expect(registered(rawRoute, request)).rejects.toThrow(/outbound test request denied/i)
      expect(abort).toHaveBeenCalledWith('blockedbyclient')
      expect(fetch).not.toHaveBeenCalled()
      expect(fallback).not.toHaveBeenCalled()
    }

    expect(urlGetter).not.toHaveBeenCalled()
    expect(proxyGet).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(2)
  })

  it('guards API responses returned by both request-context entry points', async () => {
    const externalTransports: string[] = []
    const rawResponses: APIResponse[] = []
    const responseReceivers: unknown[] = []
    const rawApiContext = {
      get: vi.fn(async (url: string) => {
        if (!url.startsWith('http://localhost:')) externalTransports.push(url)
        const rawResponse = {
          _apiName: 'APIResponse',
          _request: rawApiContext,
          body: vi.fn(async () => Buffer.from('ok')),
          dispose: vi.fn(async function (this: unknown) {
            responseReceivers.push(this)
          }),
          headers: vi.fn(() => ({ 'content-type': 'application/json' })),
          headersArray: vi.fn(() => [{ name: 'content-type', value: 'application/json' }]),
          json: vi.fn(async () => ({ ok: true })),
          ok: vi.fn(() => true),
          securityDetails: vi.fn(function (this: unknown) {
            responseReceivers.push(this)
            return { protocol: 'TLS 1.3' }
          }),
          serverAddr: vi.fn(function (this: unknown) {
            responseReceivers.push(this)
            return { ipAddress: '127.0.0.1', port: 3100 }
          }),
          status: vi.fn(() => 200),
          statusText: vi.fn(() => 'OK'),
          text: vi.fn(async () => 'ok'),
          url: vi.fn(() => url),
        } as unknown as APIResponse
        rawResponses.push(rawResponse)
        return rawResponse
      }),
      storageState: vi.fn(),
      tracing: { start: vi.fn(), stop: vi.fn() },
    } as unknown as APIRequestContext
    const privateRequestKey = ['_', 'request'].join('')

    const requestFixture = createGuardedApiRequestContext(rawApiContext)
    const fixtureResponse = await requestFixture.get('http://localhost:3100/fixture-response')
    await guardedExpect(fixtureResponse).toBeOK()
    expect(await fixtureResponse.body()).toEqual(Buffer.from('ok'))
    expect(fixtureResponse.headers()).toEqual({ 'content-type': 'application/json' })
    expect(fixtureResponse.headersArray()).toEqual([
      { name: 'content-type', value: 'application/json' },
    ])
    expect(await fixtureResponse.json()).toEqual({ ok: true })
    expect(fixtureResponse.ok()).toBe(true)
    expect(fixtureResponse.securityDetails()).toEqual({ protocol: 'TLS 1.3' })
    expect(fixtureResponse.serverAddr()).toEqual({ ipAddress: '127.0.0.1', port: 3100 })
    expect(fixtureResponse.status()).toBe(200)
    expect(fixtureResponse.statusText()).toBe('OK')
    expect(await fixtureResponse.text()).toBe('ok')
    expect(fixtureResponse.url()).toBe('http://localhost:3100/fixture-response')
    await fixtureResponse.dispose()
    expect(rawResponses[0]?.dispose).toHaveBeenCalledOnce()
    expect(responseReceivers).toEqual([rawResponses[0], rawResponses[0], rawResponses[0]])
    expect('status' in fixtureResponse).toBe(true)
    expect(Reflect.ownKeys(fixtureResponse)).toContain('status')
    expect(Reflect.ownKeys(fixtureResponse)).not.toContain(privateRequestKey)
    expect(Object.getPrototypeOf(fixtureResponse)).toBeNull()
    const reflectedStatus = Object.getOwnPropertyDescriptor(fixtureResponse, 'status')
      ?.value as () => number
    expect(reflectedStatus()).toBe(200)
    expect(
      () => (fixtureResponse as unknown as Record<string, unknown>)[privateRequestKey]
    ).toThrow(/outbound test request denied/i)
    expect(() => Object.getOwnPropertyDescriptor(fixtureResponse, privateRequestKey)).toThrow(
      /outbound test request denied/i
    )
    expect(() => privateRequestKey in fixtureResponse).toThrow(/outbound test request denied/i)
    expect(() =>
      (fixtureResponse as unknown as { on(event: string, listener: () => void): void }).on(
        'response',
        () => {}
      )
    ).toThrow(/outbound test request denied/i)
    expect(() => Reflect.set(fixtureResponse, 'status', vi.fn())).toThrow(
      /outbound test request denied/i
    )
    expect(() => Reflect.deleteProperty(fixtureResponse, 'status')).toThrow(
      /outbound test request denied/i
    )
    expect(() => Reflect.defineProperty(fixtureResponse, 'status', { value: vi.fn() })).toThrow(
      /outbound test request denied/i
    )
    expect(() => Object.preventExtensions(fixtureResponse)).toThrow(/outbound test request denied/i)
    expect(() => Object.setPrototypeOf(fixtureResponse, {})).toThrow(
      /outbound test request denied/i
    )

    const rawContext = fakeContext(rawApiContext)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const contextResponse = await context.request.get('http://localhost:3100/context-response')
    await guardedExpect(contextResponse).toBeOK()
    expect(
      () => (contextResponse as unknown as Record<string, unknown>)[privateRequestKey]
    ).toThrow(/outbound test request denied/i)
    await expect(context.request.get('https://example.invalid/response-escape')).rejects.toThrow(
      /outbound test request denied/i
    )

    expect(rawApiContext.get).toHaveBeenCalledTimes(2)
    expect(externalTransports).toEqual([])
    expect(rawApiContext.tracing.start).not.toHaveBeenCalled()
  })

  it('keeps raw unwrapping lexical and closes expect reflection and custom matchers', async () => {
    const guardModule = await import('../../e2e/fixtures/playwright-network-guard')
    expect(Object.keys(guardModule).some(key => /unwrap/i.test(key))).toBe(false)

    const rawContext = fakeContext()
    const rawPage = { context: () => rawContext } as unknown as Page
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = createGuardedPage(rawPage, context)
    let asymmetricActual: unknown
    ;(
      guardedExpect as unknown as (actual: unknown) => {
        toEqual(expected: unknown): void
      }
    )(page).toEqual({
      asymmetricMatch(actual: unknown) {
        asymmetricActual = actual
        return true
      },
    })
    expect(asymmetricActual === rawPage).toBe(false)
    await expect(
      (asymmetricActual as Page).context().request.get('https://example.invalid/asymmetric')
    ).rejects.toThrow(/outbound test request denied/i)

    guardedExpect(1).toBe(1)
    guardedExpect.soft(1).toBe(1)
    guardedExpect.configure({ timeout: 100 })(1).toBe(1)

    const observedActuals: unknown[] = []
    type GenericMatchers = {
      not: GenericMatchers
      rejects: GenericMatchers
      resolves: GenericMatchers
      toEqual(expected: unknown): unknown
    }
    type GenericExpect = ((actual: unknown) => GenericMatchers) & {
      configure(options: { timeout: number }): GenericExpect
      poll(callback: () => unknown, options: { timeout: number }): GenericMatchers
      soft: GenericExpect
    }
    const genericExpect = guardedExpect as unknown as GenericExpect
    const asymmetric = (matches: boolean) => ({
      asymmetricMatch(actual: unknown) {
        observedActuals.push(actual)
        return matches
      },
    })
    genericExpect(page).not.toEqual(asymmetric(false))
    genericExpect.soft(page).toEqual(asymmetric(true))
    genericExpect.configure({ timeout: 100 })(page).toEqual(asymmetric(true))
    await genericExpect(Promise.resolve(page)).resolves.toEqual(asymmetric(true))
    await genericExpect(Promise.reject(page)).rejects.toEqual(asymmetric(true))
    await genericExpect.poll(() => page, { timeout: 100 }).toEqual(asymmetric(true))
    expect(observedActuals.length).toBeGreaterThanOrEqual(6)
    for (const observed of observedActuals) {
      expect(observed === rawPage).toBe(false)
      await expect(
        (observed as Page).context().request.get('https://example.invalid/assertion-chain')
      ).rejects.toThrow(/outbound test request denied/i)
    }

    let customMatcherCalled = false
    expect(() =>
      guardedExpect.extend({
        unsafeMatcher() {
          customMatcherCalled = true
          return { message: () => 'unsafe', pass: true }
        },
      })
    ).toThrow(/does not permit custom matcher extensions/i)
    expect(customMatcherCalled).toBe(false)

    const reflectedExtend = Object.getOwnPropertyDescriptor(guardedExpect, 'extend')
      ?.value as () => void
    expect(() => reflectedExtend()).toThrow(/does not permit custom matcher extensions/i)
    expect(() => Object.defineProperty(guardedExpect, 'soft', { value: vi.fn() })).toThrow(
      /immutable/i
    )
    expect(() => Reflect.set(guardedExpect, 'configure', vi.fn())).toThrow(/immutable/i)
    expect(Object.getPrototypeOf(guardedExpect)).toBeNull()
  })

  it('validates test.use before the runner and permits only exact empty storage state', () => {
    const runnerUse = vi.fn()
    const guardedUse = createGuardedTestUse(runnerUse, null)
    const safe = { storageState: { cookies: [], origins: [] } }
    guardedUse(safe)
    expect(runnerUse).toHaveBeenCalledWith({ ...safe, serviceWorkers: 'block' })

    const getter = vi.fn(() => 'https://example.invalid')
    const accessorOptions = Object.defineProperty({}, 'baseURL', { enumerable: true, get: getter })
    const authorizationHeaderName = ['authoriz', 'ation'].join('')
    const unsafeOptions = [
      { serviceWorkers: 'allow' },
      { baseURL: 'https://example.invalid' },
      { proxy: { server: 'http://localhost:8080' } },
      { extraHTTPHeaders: { [authorizationHeaderName]: 'constructed-value' } },
      { storageState: 'e2e/.auth/user.json' },
      { storageState: { cookies: [{}], origins: [] } },
      { recordHar: { path: 'capture.har' } },
      accessorOptions,
    ]
    for (const options of unsafeOptions) {
      expect(() => guardedUse(options as Record<string, unknown>)).toThrow(
        /outbound test request denied/i
      )
    }
    expect(runnerUse).toHaveBeenCalledOnce()
    expect(getter).not.toHaveBeenCalled()
  })

  it('denies API request storage-state reads and writes before the raw API', async () => {
    const directStorageState = vi.fn()
    const directDenied = vi.fn()
    const requestFixture = createGuardedApiRequestContext(
      { storageState: directStorageState } as unknown as APIRequestContext,
      directDenied
    )
    await expect(requestFixture.storageState()).rejects.toThrow(/outbound test request denied/i)
    await expect(requestFixture.storageState({ path: 'capture.json' })).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(directStorageState).not.toHaveBeenCalled()
    expect(directDenied).toHaveBeenCalledTimes(2)

    const contextStorageState = vi.fn()
    const contextDenied = vi.fn()
    const rawContext = fakeContext({
      storageState: contextStorageState,
    } as unknown as APIRequestContext)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext, {
      onDenied: contextDenied,
    })
    await expect(context.request.storageState()).rejects.toThrow(/outbound test request denied/i)
    await expect(context.request.storageState({ path: 'capture.json' })).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(contextStorageState).not.toHaveBeenCalled()
    expect(contextDenied).toHaveBeenCalledTimes(2)
  })

  it('denies API request tracing through fixtures, contexts, computed keys, and descriptors', async () => {
    const directStart = vi.fn()
    const directTracing = { start: directStart }
    const requestFixture = createGuardedApiRequestContext({
      tracing: directTracing,
    } as unknown as APIRequestContext)
    const tracingKey: 'tracing' = 'tracing'
    expect(() => requestFixture[tracingKey]).toThrow(/outbound test request denied/i)
    expect(() => Object.getOwnPropertyDescriptor(requestFixture, tracingKey)).toThrow(
      /outbound test request denied/i
    )

    const contextStart = vi.fn()
    const rawContext = fakeContext({
      tracing: { start: contextStart },
    } as unknown as APIRequestContext)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    expect(() => context.request[tracingKey]).toThrow(/outbound test request denied/i)
    expect(() => Object.getOwnPropertyDescriptor(context.request, tracingKey)).toThrow(
      /outbound test request denied/i
    )
    expect(directStart).not.toHaveBeenCalled()
    expect(contextStart).not.toHaveBeenCalled()
  })
})
