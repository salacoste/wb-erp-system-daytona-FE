import { describe, expect, it, vi } from 'vitest'

import type {
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
  Request,
  Route,
  WebSocketRoute,
} from '@playwright/test'

import {
  createGuardedApiRequestContext,
  createGuardedBrowser,
  createGuardedBrowserContext,
  createGuardedPlaywright,
  createPlaywrightRouteGuard,
  createPlaywrightWebSocketGuard,
  installPlaywrightContextNetworkGuard,
} from '../../e2e/fixtures/playwright-network-guard'
import type { PlaywrightRuntime } from '../../e2e/fixtures/playwright-network-guard'

function fakeContext(
  request: APIRequestContext = { get: vi.fn() } as unknown as APIRequestContext
) {
  const context = {
    addListener: vi.fn(),
    backgroundPages: vi.fn<() => unknown[]>(() => []),
    browser: vi.fn<() => Browser | null>(() => null),
    close: vi.fn(),
    exposeBinding: vi.fn(),
    newCDPSession: vi.fn(),
    newPage: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    pages: vi.fn(() => []),
    prependListener: vi.fn(),
    prependOnceListener: vi.fn(),
    removeAllListeners: vi.fn(),
    removeListener: vi.fn(),
    request,
    route: vi.fn(),
    routeWebSocket: vi.fn(),
    unroute: vi.fn(),
    unrouteAll: vi.fn(),
    waitForEvent: vi.fn(),
  }
  for (const method of [
    'addListener',
    'off',
    'on',
    'once',
    'prependListener',
    'prependOnceListener',
    'removeAllListeners',
    'removeListener',
  ] as const) {
    context[method].mockReturnValue(context)
  }
  return context
}

function fakePage(context: ReturnType<typeof fakeContext>) {
  const page = {
    addListener: vi.fn(),
    context: () => context,
    exposeBinding: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    opener: vi.fn(),
    prependListener: vi.fn(),
    prependOnceListener: vi.fn(),
    removeAllListeners: vi.fn(),
    removeListener: vi.fn(),
    request: context.request,
    route: vi.fn(),
    routeWebSocket: vi.fn(),
    unroute: vi.fn(),
    unrouteAll: vi.fn(),
    waitForEvent: vi.fn(),
  }
  for (const method of [
    'addListener',
    'off',
    'on',
    'once',
    'prependListener',
    'prependOnceListener',
    'removeAllListeners',
    'removeListener',
  ] as const) {
    page[method].mockReturnValue(page)
  }
  return page
}

describe('Playwright network route guard', () => {
  it('propagates allowed-route fallback errors without reporting or aborting a denial', async () => {
    const fallbackError = new Error('route fallback lifecycle failed')
    const onDenied = vi.fn()
    const abort = vi.fn()
    const guard = createPlaywrightRouteGuard(onDenied)

    await expect(
      guard({
        request: () => ({ url: () => 'http://localhost:3100/health' }),
        fallback: vi.fn().mockRejectedValue(fallbackError),
        abort,
      })
    ).rejects.toBe(fallbackError)

    expect(onDenied).not.toHaveBeenCalled()
    expect(abort).not.toHaveBeenCalled()
  })

  it('blocks HTTP and WebSocket transport even when denial accounting throws', async () => {
    const stateError = new Error('network guard state unavailable')
    const abort = vi.fn()
    const fallback = vi.fn()
    const httpGuard = createPlaywrightRouteGuard(() => {
      throw stateError
    })

    await expect(
      httpGuard({
        request: () => ({ url: () => 'https://example.invalid/no-state' }),
        fallback,
        abort,
      })
    ).rejects.toBe(stateError)
    expect(abort).toHaveBeenCalledOnce()
    expect(fallback).not.toHaveBeenCalled()

    const close = vi.fn()
    const connectToServer = vi.fn()
    const webSocketGuard = createPlaywrightWebSocketGuard(() => {
      throw stateError
    })
    await expect(
      webSocketGuard({
        url: () => 'wss://example.invalid/no-state',
        close,
        connectToServer,
      })
    ).rejects.toBe(stateError)
    expect(close).toHaveBeenCalledOnce()
    expect(connectToServer).not.toHaveBeenCalled()
  })

  it('guards the raw built-in request fixture before its transport', async () => {
    const get = vi.fn()
    const onDenied = vi.fn()
    const request = createGuardedApiRequestContext(
      { get } as unknown as APIRequestContext,
      onDenied
    )

    await expect(request.get('https://example.invalid/request-fixture')).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(onDenied).toHaveBeenCalledOnce()
    expect(get).not.toHaveBeenCalled()
  })

  it('guards raw request contexts against external targets, proxies, and redirects', async () => {
    const get = vi.fn()
    const newContext = vi.fn().mockResolvedValue({ get })
    const onDenied = vi.fn()
    const playwright = createGuardedPlaywright(
      { request: { newContext } } as unknown as PlaywrightRuntime,
      { onDenied }
    )

    const context = await playwright.request.newContext({ maxRedirects: 20 })
    expect(newContext).toHaveBeenCalledWith({ maxRedirects: 0 })
    await context.get('http://localhost:3100/redirect', { maxRedirects: 20 })
    expect(get).toHaveBeenCalledWith('http://localhost:3100/redirect', { maxRedirects: 0 })

    await expect(context.get('https://example.invalid/api-context')).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(get).toHaveBeenCalledOnce()

    await expect(
      playwright.request.newContext({ baseURL: 'https://example.invalid/api-base' })
    ).rejects.toThrow(/outbound test request denied/i)
    await expect(
      playwright.request.newContext({ proxy: { server: 'https://example.invalid:8443' } })
    ).rejects.toThrow(/outbound test request denied/i)
    expect(newContext).toHaveBeenCalledOnce()
    expect(onDenied).toHaveBeenCalledTimes(3)
  })

  it('guards raw browser.newContext, forces service workers off, and installs routes once', async () => {
    const contextRequestGet = vi.fn()
    const context = fakeContext({ get: contextRequestGet } as unknown as APIRequestContext)
    const newContext = vi.fn().mockResolvedValue(context)
    const onDenied = vi.fn()
    const browser = createGuardedBrowser({ newContext } as unknown as Browser, { onDenied })

    const guardedContext = await browser.newContext({ serviceWorkers: 'allow' })
    await installPlaywrightContextNetworkGuard(guardedContext, onDenied)

    expect(newContext).toHaveBeenCalledWith({ serviceWorkers: 'block' })
    expect(context.route).toHaveBeenCalledOnce()
    expect(context.routeWebSocket).toHaveBeenCalledOnce()
    await expect(
      guardedContext.request.get('https://example.invalid/context-request')
    ).rejects.toThrow(/outbound test request denied/i)
    expect(contextRequestGet).not.toHaveBeenCalled()

    const concurrentlyInstalled = fakeContext()
    await Promise.all([
      installPlaywrightContextNetworkGuard(
        concurrentlyInstalled as unknown as BrowserContext,
        onDenied
      ),
      installPlaywrightContextNetworkGuard(
        concurrentlyInstalled as unknown as BrowserContext,
        onDenied
      ),
    ])
    expect(concurrentlyInstalled.route).toHaveBeenCalledOnce()
    expect(concurrentlyInstalled.routeWebSocket).toHaveBeenCalledOnce()

    const handler = context.route.mock.calls[0][1]
    const fallback = vi.fn()
    const abort = vi.fn()
    await handler({
      request: () => ({ url: () => 'https://example.invalid/manual-context' }),
      fallback,
      abort,
    })
    expect(onDenied).toHaveBeenCalledTimes(2)
    expect(abort).toHaveBeenCalledOnce()
    expect(fallback).not.toHaveBeenCalled()

    await expect(
      browser.newContext({ proxy: { server: 'https://example.invalid:8443' } })
    ).rejects.toThrow(/outbound test request denied/i)
    expect(newContext).toHaveBeenCalledOnce()
  })

  it('guards raw browser.newPage before returning its page or associated context', async () => {
    const requestGet = vi.fn()
    const context = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = { context: () => context }
    const newPage = vi.fn().mockResolvedValue(rawPage)
    const browser = createGuardedBrowser({ newPage } as unknown as Browser)

    const page = await browser.newPage({ serviceWorkers: 'allow' })
    const guardedContext = page.context()

    expect(newPage).toHaveBeenCalledWith({ serviceWorkers: 'block' })
    expect(context.route).toHaveBeenCalledOnce()
    expect(context.routeWebSocket).toHaveBeenCalledOnce()
    expect(guardedContext).not.toBe(context)
    await expect(
      guardedContext.request.get('https://example.invalid/new-page-context')
    ).rejects.toThrow(/outbound test request denied/i)
    expect(requestGet).not.toHaveBeenCalled()
  })

  it('wraps dynamic Page and BrowserContext event paths without exposing a raw Page', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = fakePage(rawContext)
    const rawPopup = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    rawContext.waitForEvent.mockResolvedValue(rawPopup)
    rawPage.waitForEvent.mockResolvedValue(rawPopup)
    rawPage.opener.mockResolvedValue(rawPopup)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()
    const popupEvent: string = 'popup'
    const pageEvent: string = 'page'
    type ListenerMethod = (event: string, listener: (emittedPage: Page) => void) => unknown

    for (const method of [
      'on',
      'once',
      'addListener',
      'prependListener',
      'prependOnceListener',
    ] as const) {
      let emitted: Page | undefined
      const listener = (emittedPage: Page) => {
        emitted = emittedPage
      }
      const result = (page as unknown as Record<string, ListenerMethod>)[method](
        popupEvent,
        listener
      )
      expect(result).toBe(page)
      const guardedListener = rawPage[method].mock.calls.at(-1)?.[1] as (popup: Page) => void
      guardedListener(rawPopup as unknown as Page)
      expect(emitted).toBeDefined()
      await expect(
        emitted?.context().request.get('https://example.invalid/popup-request')
      ).rejects.toThrow(/outbound test request denied/i)
      expect(requestGet).not.toHaveBeenCalled()

      ;(page.off as unknown as ListenerMethod)(popupEvent, listener)
      expect(rawPage.off).toHaveBeenLastCalledWith(popupEvent, guardedListener)
      ;(page.removeListener as unknown as ListenerMethod)(popupEvent, listener)
      expect(rawPage.removeListener).toHaveBeenLastCalledWith(popupEvent, guardedListener)
    }

    for (const method of [
      'on',
      'once',
      'addListener',
      'prependListener',
      'prependOnceListener',
    ] as const) {
      let emitted: Page | undefined
      const listener = (emittedPage: Page) => {
        emitted = emittedPage
      }
      const result = (context as unknown as Record<string, ListenerMethod>)[method](
        pageEvent,
        listener
      )
      expect(result).toBe(context)
      const guardedListener = rawContext[method].mock.calls.at(-1)?.[1] as (newPage: Page) => void
      guardedListener(rawPopup as unknown as Page)
      await expect(
        emitted?.context().request.get('https://example.invalid/context-page-request')
      ).rejects.toThrow(/outbound test request denied/i)
      expect(requestGet).not.toHaveBeenCalled()

      ;(context.off as unknown as ListenerMethod)(pageEvent, listener)
      expect(rawContext.off).toHaveBeenLastCalledWith(pageEvent, guardedListener)
      ;(context.removeListener as unknown as ListenerMethod)(pageEvent, listener)
      expect(rawContext.removeListener).toHaveBeenLastCalledWith(pageEvent, guardedListener)
    }

    const waitedPopup = await page.waitForEvent(popupEvent as 'popup')
    const opener = await page.opener()
    const waitedPage = await context.waitForEvent(pageEvent as 'page')
    for (const returnedPage of [waitedPopup, opener, waitedPage]) {
      await expect(
        returnedPage?.context().request.get('https://example.invalid/returned-page-request')
      ).rejects.toThrow(/outbound test request denied/i)
    }

    const assertGuardedPredicatePage = async (candidate: Page) => {
      await expect(
        candidate.context().request.get('https://example.invalid/predicate-page-request')
      ).rejects.toThrow(/outbound test request denied/i)
      return true
    }
    rawPage.waitForEvent.mockImplementation(async (_event, options) => {
      const predicate =
        typeof options === 'function'
          ? options
          : (options as { predicate?: (candidate: Page) => boolean | Promise<boolean> })?.predicate
      expect(await predicate?.(rawPopup as unknown as Page)).toBe(true)
      return rawPopup
    })
    rawContext.waitForEvent.mockImplementation(async (_event, options) => {
      const predicate =
        typeof options === 'function'
          ? options
          : (options as { predicate?: (candidate: Page) => boolean | Promise<boolean> })?.predicate
      expect(await predicate?.(rawPopup as unknown as Page)).toBe(true)
      return rawPopup
    })
    await page.waitForEvent('popup', assertGuardedPredicatePage)
    await page.waitForEvent('popup', { predicate: assertGuardedPredicatePage })
    await context.waitForEvent('page', assertGuardedPredicatePage)
    await context.waitForEvent('page', { predicate: assertGuardedPredicatePage })
    expect(requestGet).not.toHaveBeenCalled()
  })

  it('guards Page and BrowserContext listener and predicate this for every event', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()

    const pageListener = function (this: Page) {
      return this.context().request.get('https://example.invalid/page-listener-this')
    }
    page.on('request', pageListener)
    const guardedPageListener = rawPage.on.mock.calls.at(-1)?.[1] as (
      this: Page,
      request: Request
    ) => Promise<unknown>
    await expect(
      guardedPageListener.call(rawPage as unknown as Page, {} as Request)
    ).rejects.toThrow(/outbound test request denied/i)
    page.off('request', pageListener)
    expect(rawPage.off).toHaveBeenLastCalledWith('request', guardedPageListener)

    const contextListener = function (this: BrowserContext) {
      return this.request.get('https://example.invalid/context-listener-this')
    }
    context.on('request', contextListener)
    const guardedContextListener = rawContext.on.mock.calls.at(-1)?.[1] as (
      this: BrowserContext,
      request: Request
    ) => Promise<unknown>
    await expect(
      guardedContextListener.call(rawContext as unknown as BrowserContext, {} as Request)
    ).rejects.toThrow(/outbound test request denied/i)
    context.off('request', contextListener)
    expect(rawContext.off).toHaveBeenLastCalledWith('request', guardedContextListener)

    rawPage.waitForEvent.mockImplementation(async (_event, options) => {
      const predicate =
        typeof options === 'function'
          ? options
          : (options as { predicate?: (request: Request) => boolean | Promise<boolean> })?.predicate
      expect(await Reflect.apply(predicate ?? (() => false), rawPage, [{} as Request])).toBe(true)
      return {} as Request
    })
    rawContext.waitForEvent.mockImplementation(async (_event, options) => {
      const predicate =
        typeof options === 'function'
          ? options
          : (options as { predicate?: (request: Request) => boolean | Promise<boolean> })?.predicate
      expect(await Reflect.apply(predicate ?? (() => false), rawContext, [{} as Request])).toBe(
        true
      )
      return {} as Request
    })
    await page.waitForEvent('request', async function (this: Page) {
      await expect(
        this.context().request.get('https://example.invalid/page-predicate-this')
      ).rejects.toThrow(/outbound test request denied/i)
      return true
    })
    await context.waitForEvent('request', async function (this: BrowserContext) {
      await expect(
        this.request.get('https://example.invalid/context-predicate-this')
      ).rejects.toThrow(/outbound test request denied/i)
      return true
    })

    expect(page.removeAllListeners()).toBe(page)
    expect(context.removeAllListeners()).toBe(context)
    expect(requestGet).not.toHaveBeenCalled()
  })

  it('guards every Page-valued Page and BrowserContext event result and argument', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = fakePage(rawContext)
    const rawEmittedPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    rawContext.backgroundPages.mockReturnValue([rawEmittedPage])
    rawPage.waitForEvent.mockResolvedValue(rawEmittedPage)
    rawContext.waitForEvent.mockImplementation(async event =>
      event === 'close' ? rawContext : rawEmittedPage
    )
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()

    for (const event of ['close', 'crash', 'domcontentloaded', 'load', 'popup']) {
      const returned = await (page.waitForEvent as (event: string) => Promise<Page>)(event)
      await expect(
        returned.context().request.get('https://example.invalid/page-event-result')
      ).rejects.toThrow(/outbound test request denied/i)

      let emitted: Page | undefined
      ;(page.on as (event: string, listener: (value: Page) => void) => Page)(event, value => {
        emitted = value
      })
      const listener = rawPage.on.mock.calls.at(-1)?.[1] as (value: Page) => void
      listener.call(rawPage, rawEmittedPage as unknown as Page)
      await expect(
        emitted?.context().request.get('https://example.invalid/page-event-argument')
      ).rejects.toThrow(/outbound test request denied/i)
    }

    for (const event of ['backgroundpage', 'page', 'pageclose', 'pageload']) {
      const returned = await (context.waitForEvent as (event: string) => Promise<Page>)(event)
      await expect(
        returned.context().request.get('https://example.invalid/context-event-result')
      ).rejects.toThrow(/outbound test request denied/i)

      let emitted: Page | undefined
      ;(context.on as (event: string, listener: (value: Page) => void) => BrowserContext)(
        event,
        value => {
          emitted = value
        }
      )
      const listener = rawContext.on.mock.calls.at(-1)?.[1] as (value: Page) => void
      listener.call(rawContext, rawEmittedPage as unknown as Page)
      await expect(
        emitted?.context().request.get('https://example.invalid/context-event-argument')
      ).rejects.toThrow(/outbound test request denied/i)
    }

    const closedContext = await context.waitForEvent('close')
    expect(closedContext).toBe(context)
    expect(context.backgroundPages()).toHaveLength(1)
    await expect(
      context.backgroundPages()[0].context().request.get('https://example.invalid/background-page')
    ).rejects.toThrow(/outbound test request denied/i)
    expect(requestGet).not.toHaveBeenCalled()
  })

  it('denies user WebSocket routes and exposed bindings before registration', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const onDenied = vi.fn()
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext, {
      onDenied,
    })
    const page = await context.newPage()
    const connectToServer = vi.fn()
    const handler = (route: WebSocketRoute) => {
      connectToServer()
      return route.connectToServer()
    }

    await expect(page.routeWebSocket('**/*', handler)).rejects.toThrow(
      /outbound test request denied/i
    )
    await expect(context.routeWebSocket('**/*', handler)).rejects.toThrow(
      /outbound test request denied/i
    )
    await expect(page.exposeBinding('unsafePage', vi.fn())).rejects.toThrow(
      /outbound test request denied/i
    )
    await expect(context.exposeBinding('unsafeContext', vi.fn())).rejects.toThrow(
      /outbound test request denied/i
    )

    expect(rawPage.routeWebSocket).not.toHaveBeenCalled()
    expect(rawContext.routeWebSocket).toHaveBeenCalledOnce()
    expect(rawPage.exposeBinding).not.toHaveBeenCalled()
    expect(rawContext.exposeBinding).not.toHaveBeenCalled()
    expect(connectToServer).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(4)
  })

  it('runtime-guards every page.route handler shape and disables Route.fetch redirects', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const onDenied = vi.fn()
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext, {
      onDenied,
    })
    const page = await context.newPage()
    const externalUrl = 'https://example.invalid/route-fetch'
    const namedHandler = (route: Route) => route.fetch({ url: externalUrl })
    const makeHandler = () => namedHandler
    const importedHandlers = { member: namedHandler }
    const computedHandler = (route: Route) => route['fetch']({ url: externalUrl })
    const boundFetchHandler = (route: Route) => {
      const send = route.fetch.bind(route)
      return send({ url: externalUrl })
    }
    const reassignedHandler = (route: Route) => {
      let send = route.fetch
      send = route.fetch
      return send({ url: externalUrl })
    }
    const destructuredAssignmentHandler = (route: Route) => {
      let send = route.fetch
      ;({ fetch: send } = route)
      return send({ url: externalUrl })
    }
    const handlerForms = [
      namedHandler.bind(undefined),
      makeHandler(),
      importedHandlers.member,
      computedHandler,
      boundFetchHandler,
      reassignedHandler,
      destructuredAssignmentHandler,
    ]

    for (const handler of handlerForms) {
      const abort = vi.fn()
      const fetch = vi.fn()
      const request = { url: () => 'http://localhost:3100/original' } as Request
      const rawRoute = {
        abort,
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
    }
    expect(onDenied).toHaveBeenCalledTimes(handlerForms.length)

    const allowedFetch = vi.fn().mockResolvedValue({ status: 204 })
    const allowedAbort = vi.fn()
    const allowedRequest = { url: () => 'http://localhost:3100/original' } as Request
    const allowedRoute = {
      abort: allowedAbort,
      fetch: allowedFetch,
      request: () => allowedRequest,
    } as unknown as Route
    await page.route('**/*', route =>
      route.fetch({ url: 'http://localhost:3100/fixture', maxRedirects: 20 })
    )
    const allowedHandler = rawPage.route.mock.calls.at(-1)?.[1] as (
      route: Route,
      request: Request
    ) => Promise<unknown>
    await expect(allowedHandler(allowedRoute, allowedRequest)).resolves.toEqual({ status: 204 })
    expect(allowedFetch).toHaveBeenCalledWith({
      url: 'http://localhost:3100/fixture',
      maxRedirects: 0,
    })
    expect(allowedAbort).not.toHaveBeenCalled()
  })

  it('blocks Route.continue and non-local fallback overrides before transport', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const onDenied = vi.fn()
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext, {
      onDenied,
    })
    const page = await context.newPage()
    const request = { url: () => 'http://localhost:3100/original' } as Request

    for (const handler of [
      (route: Route) => route.continue(),
      (route: Route) => route.fallback({ url: 'https://example.invalid/fallback' }),
    ]) {
      const abort = vi.fn()
      const continueTransport = vi.fn()
      const fallbackTransport = vi.fn()
      const rawRoute = {
        abort,
        continue: continueTransport,
        fallback: fallbackTransport,
        request: () => request,
      } as unknown as Route
      await page.route('**/*', handler)
      const registered = rawPage.route.mock.calls.at(-1)?.[1] as (
        route: Route,
        request: Request
      ) => Promise<unknown>

      await expect(registered(rawRoute, request)).rejects.toThrow(/outbound test request denied/i)
      expect(abort).toHaveBeenCalledWith('blockedbyclient')
      expect(continueTransport).not.toHaveBeenCalled()
      expect(fallbackTransport).not.toHaveBeenCalled()
    }
    await expect(page.unroute('**/*')).rejects.toThrow(/outbound test request denied/i)
    await expect(context.unrouteAll()).rejects.toThrow(/outbound test request denied/i)
    expect(rawPage.unroute).not.toHaveBeenCalled()
    expect(rawContext.unrouteAll).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(4)
  })

  it('reuses one guarded Route proxy and aborts before a missing-state callback can throw', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const stateError = new Error('network guard state unavailable')
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext, {
      onDenied: () => {
        throw stateError
      },
    })
    const page = await context.newPage()
    const seenRoutes: Route[] = []
    await page.route('**/*', route => {
      seenRoutes.push(route)
    })
    await page.route('**/*', route => {
      seenRoutes.push(route)
    })
    const request = { url: () => 'http://localhost:3100/original' } as Request
    const abort = vi.fn()
    const fetch = vi.fn()
    const rawRoute = { abort, fetch, request: () => request } as unknown as Route
    for (const call of rawPage.route.mock.calls) {
      await call[1](rawRoute, request)
    }
    expect(seenRoutes[0]).toBe(seenRoutes[1])

    await page.route('**/*', route =>
      route.fetch({ url: 'https://example.invalid/no-active-state' })
    )
    const rejectingHandler = rawPage.route.mock.calls.at(-1)?.[1] as (
      route: Route,
      request: Request
    ) => Promise<unknown>
    await expect(rejectingHandler(rawRoute, request)).rejects.toBe(stateError)
    expect(abort).toHaveBeenCalledWith('blockedbyclient')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('denies Browser and BrowserContext CDP sessions before target or navigation commands', async () => {
    const send = vi.fn()
    const rawSession = { send }
    const rawContext = fakeContext()
    rawContext.newCDPSession.mockResolvedValue(rawSession)
    const newBrowserCDPSession = vi.fn().mockResolvedValue(rawSession)
    const rawBrowser = {
      newBrowserCDPSession,
      newContext: vi.fn().mockResolvedValue(rawContext),
    }
    const onDenied = vi.fn()
    const browser = createGuardedBrowser(rawBrowser as unknown as Browser, { onDenied })
    const context = await browser.newContext()
    const page = {} as Page

    await expect(
      browser
        .newBrowserCDPSession()
        .then(session => session.send('Target.createTarget', { url: 'https://example.invalid' }))
    ).rejects.toThrow(/outbound test request denied/i)
    await expect(
      context
        .newCDPSession(page)
        .then(session => session.send('Page.navigate', { url: 'https://example.invalid' }))
    ).rejects.toThrow(/outbound test request denied/i)

    expect(newBrowserCDPSession).not.toHaveBeenCalled()
    expect(rawContext.newCDPSession).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(2)
  })

  it('keeps browser, context, page, and BrowserType references inside the guarded graph', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawBrowserType = { launchServer: vi.fn() }
    const rawBrowser = {
      browserType: () => rawBrowserType,
      contexts: () => [rawContext],
      newContext: vi.fn().mockResolvedValue(rawContext),
    }
    rawContext.browser.mockReturnValue(rawBrowser as unknown as Browser)
    const browser = createGuardedBrowser(rawBrowser as unknown as Browser)
    const context = await browser.newContext()
    const rawPage = { context: () => rawContext }
    rawContext.newPage.mockResolvedValue(rawPage)
    const page = await context.newPage()

    expect(context.browser()).toBe(browser)
    expect(browser.contexts()).toEqual([context])
    expect(page.context()).toBe(context)
    expect(page.request).toBe(context.request)
    await expect(
      page.request.get('https://example.invalid/page-request', { maxRedirects: 20 })
    ).rejects.toThrow(/outbound test request denied/i)
    expect(requestGet).not.toHaveBeenCalled()
    await expect(browser.browserType().launchServer()).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(rawBrowserType.launchServer).not.toHaveBeenCalled()

    const unknownContext = fakeContext()
    const browserWithUnknownContext = createGuardedBrowser({
      contexts: () => [unknownContext],
    } as unknown as Browser)
    expect(() => browserWithUnknownContext.contexts()).toThrow(/unguarded BrowserContext/i)
  })

  it('keeps Browser emitter returns, callback this, and arguments inside the guarded graph', async () => {
    const rawBrowser = {
      addListener: vi.fn(),
      bind: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      prependListener: vi.fn(),
      prependOnceListener: vi.fn(),
      removeAllListeners: vi.fn(),
      removeListener: vi.fn(),
    }
    for (const method of [
      'addListener',
      'off',
      'on',
      'once',
      'prependListener',
      'prependOnceListener',
      'removeAllListeners',
      'removeListener',
    ] as const) {
      rawBrowser[method].mockReturnValue(rawBrowser)
    }
    const onDenied = vi.fn()
    const browser = createGuardedBrowser(rawBrowser as unknown as Browser, { onDenied })
    let callbackThis: Browser | undefined
    let callbackBrowser: Browser | undefined
    const listener = function (this: Browser, emittedBrowser: Browser) {
      callbackThis = this
      callbackBrowser = emittedBrowser
    }

    expect(browser.on('disconnected', listener)).toBe(browser)
    const guardedListener = rawBrowser.on.mock.calls.at(-1)?.[1] as (
      this: Browser,
      emittedBrowser: Browser
    ) => void
    guardedListener.call(rawBrowser as unknown as Browser, rawBrowser as unknown as Browser)
    expect(callbackThis).toBe(browser)
    expect(callbackBrowser).toBe(browser)
    expect(browser.off('disconnected', listener)).toBe(browser)
    expect(rawBrowser.off).toHaveBeenLastCalledWith('disconnected', guardedListener)
    expect(browser.removeAllListeners()).toBe(browser)

    expect(() =>
      browser.on('context', () => {
        throw new Error('raw context callback must not register')
      })
    ).toThrow(/outbound test request denied/i)
    await expect(browser.bind('unsafe-browser-server')).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(rawBrowser.on).toHaveBeenCalledOnce()
    expect(rawBrowser.bind).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(2)
  })

  it('denies WebSockets without connecting and connects only allowed local sockets', async () => {
    const onDenied = vi.fn()
    const onAllowed = vi.fn()
    const guard = createPlaywrightWebSocketGuard(onDenied, onAllowed)
    const close = vi.fn()
    const connectToServer = vi.fn()

    await guard({
      url: () => 'wss://example.invalid/socket',
      close,
      connectToServer,
    } as unknown as WebSocketRoute)
    expect(close).toHaveBeenCalledWith({ code: 1008, reason: 'Test network policy denied' })
    expect(connectToServer).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledOnce()

    await guard({
      url: () => 'ws://localhost:3100/socket',
      close,
      connectToServer,
    } as unknown as WebSocketRoute)
    expect(connectToServer).toHaveBeenCalledOnce()
    expect(onAllowed).toHaveBeenCalledOnce()
  })
})
