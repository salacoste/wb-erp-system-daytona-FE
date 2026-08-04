import { describe, expect, it, vi } from 'vitest'

import type {
  APIRequest,
  APIRequestContext,
  Browser,
  BrowserContext,
  Page,
  Request,
  Route,
} from '@playwright/test'

import {
  createGuardedApiRequest,
  createGuardedApiRequestContext,
  createGuardedBrowser,
  createGuardedBrowserContext,
  createGuardedPage,
  createGuardedPlaywright,
} from '../../e2e/fixtures/playwright-network-guard'
import type { PlaywrightRuntime } from '../../e2e/fixtures/playwright-network-guard'

function fakeContext(
  request: APIRequestContext = { get: vi.fn() } as unknown as APIRequestContext
) {
  const context = {
    browser: vi.fn<() => Browser | null>(() => null),
    close: vi.fn(),
    newPage: vi.fn(),
    request,
    route: vi.fn(),
    routeWebSocket: vi.fn(),
    tracing: { start: vi.fn() },
    valueOf: vi.fn(),
  }
  context.valueOf.mockReturnValue(context)
  return context
}

function fakePage(context: ReturnType<typeof fakeContext>) {
  const page = {
    context: () => context,
    evaluateHandle: vi.fn(),
    frame: vi.fn(),
    frames: vi.fn(),
    mainFrame: vi.fn(),
    locator: vi.fn(),
    pdf: vi.fn(),
    pickLocator: vi.fn(),
    request: context.request,
    route: vi.fn(),
    screenshot: vi.fn(),
    valueOf: vi.fn(),
    waitForEvent: vi.fn(),
  }
  page.valueOf.mockReturnValue(page)
  return page
}

describe('Playwright guarded object graph', () => {
  it('wraps both Route Request paths through computed Frame.page access', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = fakePage(rawContext)
    const rawFrame = { page: () => rawPage }
    const rawRequest = { frame: () => rawFrame } as unknown as Request
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()
    const computedPageKey: 'page' = 'page'

    for (const handler of [
      (_route: Route, request: Request) =>
        request.frame()[computedPageKey]().context().request.get('https://example.invalid/arg'),
      (route: Route) =>
        route
          .request()
          .frame()
          [computedPageKey]()
          .context()
          .request.get('https://example.invalid/route'),
    ]) {
      await page.route('**/*', handler)
      const guardedHandler = rawPage.route.mock.calls.at(-1)?.[1] as (
        route: Route,
        request: Request
      ) => Promise<unknown>
      const rawRoute = {
        request: () => rawRequest,
        valueOf() {
          return this
        },
      } as unknown as Route
      await expect(guardedHandler(rawRoute, rawRequest)).rejects.toThrow(
        /outbound test request denied/i
      )
    }
    expect(requestGet).not.toHaveBeenCalled()
  })

  it('wraps Page frame methods and nested wrapper-to-ElementHandle frame chains', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = fakePage(rawContext)
    const rawFrame = { page: () => rawPage }
    const rawElement = { ownerFrame: () => rawFrame }
    const rawJsElement = { asElement: () => rawElement }
    const rawFileChooser = { element: () => rawElement }
    const rawLocator = {
      _withElement: vi.fn(),
      and: vi.fn(),
      describe: vi.fn(),
      filter: vi.fn(),
      first: vi.fn(),
      last: vi.fn(),
      normalize: vi.fn(),
      nth: vi.fn(),
      or: vi.fn(),
      page: () => rawPage,
      screenshot: vi.fn(),
    }
    for (const method of [
      'and',
      'describe',
      'filter',
      'first',
      'last',
      'normalize',
      'nth',
      'or',
    ] as const) {
      rawLocator[method].mockReturnValue(rawLocator)
    }
    const rawHandle = {
      getProperties: vi.fn().mockResolvedValue(new Map([['element', rawJsElement]])),
      getProperty: vi.fn().mockResolvedValue(rawJsElement),
    }
    rawPage.frame.mockReturnValue(rawFrame)
    rawPage.frames.mockReturnValue([rawFrame])
    rawPage.locator.mockReturnValue(rawLocator)
    rawPage.mainFrame.mockReturnValue(rawFrame)
    rawPage.pickLocator.mockResolvedValue(rawLocator)
    rawPage.evaluateHandle.mockResolvedValue(rawHandle)
    const rawPrivatePageMethod = vi.fn()
    ;(rawPage as unknown as Record<string, unknown>)._unsafePageCallback = rawPrivatePageMethod
    rawPage.waitForEvent.mockImplementation(async (_event, predicate) => {
      await predicate(rawFileChooser)
      return rawFileChooser
    })
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()

    for (const frame of [page.frame({ url: /./ }), page.mainFrame(), ...page.frames()]) {
      await expect(
        frame?.page().context().request.get('https://example.invalid/frame-chain')
      ).rejects.toThrow(/outbound test request denied/i)
    }

    const locator = page.locator('body')
    await expect(
      locator.page().context().request.get('https://example.invalid/locator-page')
    ).rejects.toThrow(/outbound test request denied/i)
    await expect(locator.screenshot()).rejects.toThrow(/outbound test request denied/i)
    expect(rawLocator.screenshot).not.toHaveBeenCalled()

    const privateLocatorKey = ['_with', 'Element'].join('')
    const privatePageKey = ['_unsafe', 'PageCallback'].join('')
    const rawHandleCallback = vi.fn()
    expect(() =>
      (locator as unknown as Record<string, (callback: () => void) => unknown>)[privateLocatorKey](
        rawHandleCallback
      )
    ).toThrow(/outbound test request denied/i)
    expect(() =>
      (page as unknown as Record<string, (callback: () => void) => unknown>)[privatePageKey](
        rawHandleCallback
      )
    ).toThrow(/outbound test request denied/i)
    expect(rawLocator._withElement).not.toHaveBeenCalled()
    expect(rawPrivatePageMethod).not.toHaveBeenCalled()
    expect(rawHandleCallback).not.toHaveBeenCalled()

    const locatorVariants = [
      locator.first(),
      locator.last(),
      locator.nth(0),
      locator.filter({ hasText: 'safe' }),
      locator.and(locator),
      locator.or(locator),
      locator.describe('safe'),
      await locator.normalize(),
      await page.pickLocator(),
    ]
    for (const guardedLocator of locatorVariants) {
      await expect(
        guardedLocator.page().context().request.get('https://example.invalid/locator-chain')
      ).rejects.toThrow(/outbound test request denied/i)
    }

    const handle = await page.evaluateHandle(() => null)
    const property = await handle.getProperty('element')
    const propertyFrame = await property.asElement()?.ownerFrame()
    await expect(
      propertyFrame?.page().context().request.get('https://example.invalid/handle-property')
    ).rejects.toThrow(/outbound test request denied/i)
    const properties = await handle.getProperties()
    const propertiesFrame = await properties.get('element')?.asElement()?.ownerFrame()
    await expect(
      propertiesFrame?.page().context().request.get('https://example.invalid/handle-properties')
    ).rejects.toThrow(/outbound test request denied/i)

    const eventValue = await (
      page.waitForEvent as unknown as (
        event: string,
        predicate: (value: unknown) => Promise<boolean>
      ) => Promise<unknown>
    )('filechooser', async value => {
      const chooser = value as { element(): { ownerFrame(): { page(): Page } } }
      await expect(
        chooser
          .element()
          .ownerFrame()
          .page()
          .context()
          .request.get('https://example.invalid/element-chain')
      ).rejects.toThrow(/outbound test request denied/i)
      return true
    })
    expect(eventValue).toBeDefined()
    expect(requestGet).not.toHaveBeenCalled()
    expect(rawFileChooser).toBeDefined()
  })

  it('recursively guards navigation, request, and response return graphs and predicates', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawUnrouteAll = vi.fn()
    Object.assign(rawContext, { unrouteAll: rawUnrouteAll })
    const rawPage = fakePage(rawContext)
    const rawFrame = { page: () => rawPage }
    const rawRequest = { frame: () => rawFrame }
    const rawResponse = { request: () => rawRequest }
    const waitForResponse = vi.fn(async (predicate: (response: unknown) => Promise<boolean>) => {
      await predicate(rawResponse)
      return rawResponse
    })
    const waitForRequest = vi.fn(async (predicate: (request: unknown) => Promise<boolean>) => {
      await predicate(rawRequest)
      return rawRequest
    })
    const goto = vi.fn().mockResolvedValue(rawResponse)
    Object.assign(rawPage, { goto, waitForRequest, waitForResponse })
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = createGuardedPage(rawPage as unknown as Page, context)

    let predicateThis: unknown
    let predicateValue: unknown
    const waitedResponse = await (
      page.waitForResponse as unknown as (
        predicate: (this: Page, response: typeof rawResponse) => Promise<boolean>
      ) => Promise<typeof rawResponse>
    )(async function (response) {
      predicateThis = this
      predicateValue = response
      await expect(
        (response.request().frame().page().context() as unknown as BrowserContext).unrouteAll()
      ).rejects.toThrow(/outbound test request denied/i)
      return true
    })
    let requestPredicateValue: unknown
    const waitedRequest = await (
      page.waitForRequest as unknown as (
        predicate: (this: Page, request: typeof rawRequest) => Promise<boolean>
      ) => Promise<typeof rawRequest>
    )(async function (request) {
      requestPredicateValue = request
      await expect(
        (request.frame().page().context() as unknown as BrowserContext).unrouteAll()
      ).rejects.toThrow(/outbound test request denied/i)
      return true
    })

    for (const response of [waitedResponse, await page.goto('/local')]) {
      await expect(
        response?.request().frame().page().context().request.get('https://example.invalid/graph')
      ).rejects.toThrow(/outbound test request denied/i)
      await expect(
        (response?.request().frame().page().context() as unknown as BrowserContext).unrouteAll()
      ).rejects.toThrow(/outbound test request denied/i)
    }
    expect(predicateThis === page).toBe(true)
    expect(predicateValue === rawResponse).toBe(false)
    expect(requestPredicateValue === rawRequest).toBe(false)
    await expect(
      waitedRequest.frame().page().context().request.get('https://example.invalid/request-graph')
    ).rejects.toThrow(/outbound test request denied/i)
    expect(rawUnrouteAll).not.toHaveBeenCalled()
    expect(requestGet).not.toHaveBeenCalled()
    expect(waitForResponse).toHaveBeenCalledOnce()
    expect(waitForRequest).toHaveBeenCalledOnce()
    expect(goto).toHaveBeenCalledWith('/local')
  })

  it('guards public Page and Context object properties and denies diagnostic capture APIs', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    const rawKeyboard = { _page: rawPage, press: vi.fn() }
    const rawClock = { _browserContext: rawContext, fastForward: vi.fn() }
    const coverageStart = vi.fn()
    const screencastStart = vi.fn()
    const video = vi.fn()
    const consoleMessages = vi.fn()
    const requests = vi.fn()
    const routeFromHAR = vi.fn()
    Object.assign(rawPage, {
      consoleMessages,
      coverage: { startJSCoverage: coverageStart },
      keyboard: rawKeyboard,
      requests,
      routeFromHAR,
      screencast: { start: screencastStart },
      video,
    })
    const cookies = vi.fn().mockResolvedValue([{ name: 'private', value: 'not-exposed' }])
    const storageState = vi.fn().mockResolvedValue({
      cookies: [{ name: 'private', value: 'not-exposed' }],
      origins: [],
    })
    Object.assign(rawContext, { clock: rawClock, cookies, routeFromHAR: vi.fn(), storageState })
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()

    const privatePageKey = ['_', 'page'].join('')
    const privateContextKey = ['_', 'browserContext'].join('')
    expect(() => (page.keyboard as unknown as Record<string, unknown>)[privatePageKey]).toThrow(
      /outbound test request denied/i
    )
    expect(() => (context.clock as unknown as Record<string, unknown>)[privateContextKey]).toThrow(
      /outbound test request denied/i
    )
    expect(() => page.coverage).toThrow(/outbound test request denied/i)
    expect(() => page.screencast).toThrow(/outbound test request denied/i)
    for (const capture of [
      () => page.video(),
      () => page.consoleMessages(),
      () => page.requests(),
      () => page.routeFromHAR('capture.har'),
      () => context.routeFromHAR('capture.har'),
      () => context.cookies(),
      () => context.storageState(),
      () => context.storageState({ path: 'capture.json' }),
    ]) {
      await expect(capture()).rejects.toThrow(/outbound test request denied/i)
    }
    expect(coverageStart).not.toHaveBeenCalled()
    expect(screencastStart).not.toHaveBeenCalled()
    expect(video).not.toHaveBeenCalled()
    expect(consoleMessages).not.toHaveBeenCalled()
    expect(requests).not.toHaveBeenCalled()
    expect(routeFromHAR).not.toHaveBeenCalled()
    expect(cookies).not.toHaveBeenCalled()
    expect(storageState).not.toHaveBeenCalled()

    await expect(context.storageState({ path: 'e2e/.auth/user.json' })).resolves.toEqual({
      cookies: [],
      origins: [],
    })
    expect(storageState).toHaveBeenCalledWith({ path: 'e2e/.auth/user.json' })
  })

  it('deeply unwraps only guarded Playwright input values for locator composition', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    const rawLeft = { and: vi.fn(), filter: vi.fn(), or: vi.fn() }
    const rawRight = { and: vi.fn(), filter: vi.fn(), or: vi.fn() }
    const addLocatorHandler = vi.fn()
    rawLeft.and.mockReturnValue(rawLeft)
    rawLeft.or.mockReturnValue(rawLeft)
    rawLeft.filter.mockReturnValue(rawLeft)
    Object.assign(rawPage, { addLocatorHandler })
    rawPage.locator.mockImplementation((selector: string) =>
      selector === 'left' ? rawLeft : rawRight
    )
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()
    const left = page.locator('left')
    const right = page.locator('right')

    left.or(right)
    left.and(right)
    left.filter({ has: right, hasNot: right })
    let callbackThis: unknown
    let callbackLocator: unknown
    await page.addLocatorHandler(left, async function (this: unknown, locator) {
      callbackThis = this
      callbackLocator = locator
    })
    const rawHandler = addLocatorHandler.mock.calls[0]?.[1] as (locator: unknown) => Promise<void>
    await rawHandler(rawLeft)

    expect(rawLeft.or).toHaveBeenCalledWith(rawRight)
    expect(rawLeft.and).toHaveBeenCalledWith(rawRight)
    expect(rawLeft.filter).toHaveBeenCalledWith({ has: rawRight, hasNot: rawRight })
    expect(addLocatorHandler.mock.calls[0]?.[0]).toBe(rawLeft)
    expect(callbackThis === page).toBe(true)
    expect(callbackLocator === rawLeft).toBe(false)
    expect(
      () => (callbackLocator as unknown as Record<string, unknown>)[['_', 'withElement'].join('')]
    ).toThrow(/outbound test request denied/i)
    expect((left as unknown) === rawLeft).toBe(false)
    expect((right as unknown) === rawRight).toBe(false)
  })

  it('denies raw browser diagnostic capture before capture APIs are called', async () => {
    const rawContext = fakeContext()
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const newContext = vi.fn().mockResolvedValue(rawContext)
    const newPage = vi.fn().mockResolvedValue(rawPage)
    const startTracing = vi.fn()
    const stopTracing = vi.fn()
    const onDenied = vi.fn()
    const browser = createGuardedBrowser(
      { newContext, newPage, startTracing, stopTracing } as unknown as Browser,
      { onDenied }
    )

    await expect(browser.newContext({ recordHar: { path: 'unsafe.har' } })).rejects.toThrow(
      /outbound test request denied/i
    )
    await expect(browser.newPage({ recordVideo: { dir: 'unsafe-video' } })).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(newContext).not.toHaveBeenCalled()
    expect(newPage).not.toHaveBeenCalled()

    const context = await browser.newContext()
    const guardedPage = await context.newPage()
    expect(() => context.tracing).toThrow(/outbound test request denied/i)
    await expect(guardedPage.screenshot()).rejects.toThrow(/outbound test request denied/i)
    await expect(guardedPage.pdf()).rejects.toThrow(/outbound test request denied/i)
    await expect(browser.startTracing(guardedPage)).rejects.toThrow(/outbound test request denied/i)
    await expect(browser.stopTracing()).rejects.toThrow(/outbound test request denied/i)
    expect(rawContext.tracing.start).not.toHaveBeenCalled()
    expect(rawPage.screenshot).not.toHaveBeenCalled()
    expect(rawPage.pdf).not.toHaveBeenCalled()
    expect(startTracing).not.toHaveBeenCalled()
    expect(stopTracing).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(7)
  })

  it('never returns a raw guarded target through valueOf', async () => {
    const rawApiContext = {
      get: vi.fn(),
      valueOf() {
        return this
      },
    } as unknown as APIRequestContext
    const apiContext = createGuardedApiRequestContext(rawApiContext)
    expect(apiContext.valueOf()).toBe(apiContext)

    const rawApiRequest = {
      newContext: vi.fn(),
      valueOf() {
        return this
      },
    } as unknown as APIRequest
    const apiRequest = createGuardedApiRequest(rawApiRequest)
    expect(apiRequest.valueOf()).toBe(apiRequest)

    const rawContext = fakeContext()
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    expect(context.valueOf()).toBe(context)
    const rawPage = fakePage(rawContext)
    rawContext.newPage.mockResolvedValue(rawPage)
    const page = await context.newPage()
    expect(page.valueOf()).toBe(page)

    const rawBrowser = {
      valueOf() {
        return this
      },
    } as unknown as Browser
    const browser = createGuardedBrowser(rawBrowser)
    expect(browser.valueOf()).toBe(browser)

    const rawBrowserType = {
      valueOf() {
        return this
      },
    }
    const rawPlaywright = {
      chromium: rawBrowserType,
      valueOf() {
        return this
      },
    } as unknown as PlaywrightRuntime
    const playwright = createGuardedPlaywright(rawPlaywright)
    expect(playwright.valueOf()).toBe(playwright)
    expect(playwright.chromium.valueOf()).toBe(playwright.chromium)
  })

  it('keeps Playwright own-property descriptors guarded and private channels denied', async () => {
    const newContext = vi.fn()
    const electronLaunch = vi.fn()
    const onDenied = vi.fn()
    const rawPlaywright = {
      _electron: { launch: electronLaunch },
      _initializer: { chromium: { connectOverCDP: vi.fn() } },
      _version: '1.61.1',
      request: { newContext },
      chromium: { connect: vi.fn() },
    } as unknown as PlaywrightRuntime
    const playwright = createGuardedPlaywright(rawPlaywright, { onDenied })

    const guardedRequest = Object.getOwnPropertyDescriptor(playwright, 'request')
      ?.value as APIRequest
    await expect(
      guardedRequest.newContext({ baseURL: 'https://example.invalid/descriptor' })
    ).rejects.toThrow(/outbound test request denied/i)
    expect(newContext).not.toHaveBeenCalled()
    expect(() => Object.getOwnPropertyDescriptor(playwright, '_electron')).toThrow(
      /outbound test request denied/i
    )
    expect(() => Object.getOwnPropertyDescriptor(playwright, '_version')).toThrow(
      /outbound test request denied/i
    )
    expect(() => (playwright as unknown as Record<string, unknown>)._initializer).toThrow(
      /outbound test request denied/i
    )
    expect(electronLaunch).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(4)
  })

  it('denies computed Playwright internals without returning raw graph values', () => {
    const rawPage = fakePage(fakeContext())
    const rawContext = fakeContext()
    const rawInstrumentation = { addListener: vi.fn() }
    const rawAllContexts = vi.fn(() => [rawContext])
    const rawAllPages = vi.fn(() => [rawPage])
    const rawPlaywright = {
      _allContexts: rawAllContexts,
      _allPages: rawAllPages,
      _instrumentation: rawInstrumentation,
    } as unknown as PlaywrightRuntime
    const onDenied = vi.fn()
    const playwright = createGuardedPlaywright(rawPlaywright, { onDenied })

    for (const key of ['_allPages', '_allContexts', '_instrumentation'] as const) {
      expect(() => (playwright as unknown as Record<string, unknown>)[key]).toThrow(
        /outbound test request denied/i
      )
    }

    expect(rawAllPages).not.toHaveBeenCalled()
    expect(rawAllContexts).not.toHaveBeenCalled()
    expect(rawInstrumentation.addListener).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(3)
  })

  it('denies the selectors registry before its raw context graph is exposed', () => {
    const transport = vi.fn()
    const rawContext = fakeContext({ get: transport } as unknown as APIRequestContext)
    const rawSelectors = { _contextsForSelectors: new Set([rawContext]) }
    const playwright = createGuardedPlaywright({
      selectors: rawSelectors,
    } as unknown as PlaywrightRuntime)
    const selectorsKey: 'selectors' = 'selectors'

    expect(() => playwright[selectorsKey]).toThrow(/outbound test request denied/i)
    expect(() => Object.getOwnPropertyDescriptor(playwright, selectorsKey)).toThrow(
      /outbound test request denied/i
    )
    expect(transport).not.toHaveBeenCalled()
  })

  it('returns stable proxies for repeated wrapping of original and guarded objects', async () => {
    const firstDenied = vi.fn()
    const secondDenied = vi.fn()
    const transport = vi.fn()
    const rawContext = { get: transport } as unknown as APIRequestContext
    const firstContext = createGuardedApiRequestContext(rawContext, firstDenied)
    expect(createGuardedApiRequestContext(rawContext, secondDenied)).toBe(firstContext)
    expect(createGuardedApiRequestContext(firstContext, secondDenied)).toBe(firstContext)

    await expect(firstContext.get('https://example.invalid/idempotent')).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(firstDenied).toHaveBeenCalledOnce()
    expect(secondDenied).not.toHaveBeenCalled()
    expect(transport).not.toHaveBeenCalled()

    const rawRequest = { newContext: vi.fn() } as unknown as APIRequest
    const firstRequest = createGuardedApiRequest(rawRequest, firstDenied)
    expect(createGuardedApiRequest(rawRequest, secondDenied)).toBe(firstRequest)
    expect(createGuardedApiRequest(firstRequest, secondDenied)).toBe(firstRequest)

    const rawBrowser = { newContext: vi.fn() } as unknown as Browser
    const firstBrowser = createGuardedBrowser(rawBrowser, { onDenied: firstDenied })
    expect(createGuardedBrowser(rawBrowser, { onDenied: secondDenied })).toBe(firstBrowser)
    expect(createGuardedBrowser(firstBrowser, { onDenied: secondDenied })).toBe(firstBrowser)

    const rawBrowserContext = fakeContext() as unknown as BrowserContext
    const firstBrowserContext = await createGuardedBrowserContext(rawBrowserContext, {
      onDenied: firstDenied,
    })
    expect(await createGuardedBrowserContext(rawBrowserContext, { onDenied: secondDenied })).toBe(
      firstBrowserContext
    )
    expect(await createGuardedBrowserContext(firstBrowserContext, { onDenied: secondDenied })).toBe(
      firstBrowserContext
    )

    const rawPlaywright = {} as PlaywrightRuntime
    const firstPlaywright = createGuardedPlaywright(rawPlaywright, { onDenied: firstDenied })
    expect(createGuardedPlaywright(rawPlaywright, { onDenied: secondDenied })).toBe(firstPlaywright)
    expect(createGuardedPlaywright(firstPlaywright, { onDenied: secondDenied })).toBe(
      firstPlaywright
    )
  })

  it('denies every raw BrowserType construction path before transport', async () => {
    const browserContext = fakeContext()
    const rawBrowser = {
      close: vi.fn(),
      contexts: () => [],
      newContext: vi.fn().mockResolvedValue(browserContext),
    }
    const launch = vi.fn().mockResolvedValue(rawBrowser)
    const connect = vi.fn().mockResolvedValue(rawBrowser)
    const connectOverCDP = vi.fn().mockResolvedValue(rawBrowser)
    const launchPersistentContext = vi.fn().mockResolvedValue(fakeContext())
    const launchServer = vi.fn()
    const onDenied = vi.fn()
    const playwright = createGuardedPlaywright(
      {
        chromium: { connect, connectOverCDP, launch, launchPersistentContext, launchServer },
      } as unknown as PlaywrightRuntime,
      { onDenied }
    )

    await expect(
      playwright.chromium.launch({ proxy: { server: 'https://example.invalid:8443' } })
    ).rejects.toThrow(/outbound test request denied/i)
    expect(onDenied).toHaveBeenCalledOnce()
    expect(launch).not.toHaveBeenCalled()

    const launchKey: 'launch' = 'launch'
    await expect(playwright.chromium[launchKey]()).rejects.toThrow(/outbound test request denied/i)
    const reflectedLaunch = Object.getOwnPropertyDescriptor(playwright.chromium, launchKey)
      ?.value as () => Promise<Browser>
    await expect(reflectedLaunch()).rejects.toThrow(/outbound test request denied/i)
    expect(launch).not.toHaveBeenCalled()
    expect(rawBrowser.newContext).not.toHaveBeenCalled()

    const connectAlias = playwright.chromium['connect'].bind(playwright.chromium)
    await expect(connectAlias('ws://localhost:9222')).rejects.toThrow(
      /outbound test request denied/i
    )
    const { connectOverCDP: connectOverCdpAlias } = playwright.chromium
    await expect(connectOverCdpAlias('http://localhost:9222')).rejects.toThrow(
      /outbound test request denied/i
    )
    await expect(
      playwright.chromium.launchPersistentContext('/tmp/profile', {
        serviceWorkers: 'allow',
      })
    ).rejects.toThrow(/outbound test request denied/i)
    expect(connect).not.toHaveBeenCalled()
    expect(connectOverCDP).not.toHaveBeenCalled()
    expect(launchPersistentContext).not.toHaveBeenCalled()

    await expect(playwright.chromium.launchServer()).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(launchServer).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(7)
  })

  it('denies auxiliary Playwright runtimes and fluent emitters before raw access', () => {
    const electronLaunch = vi.fn()
    const androidConnect = vi.fn()
    const rawOn = vi.fn()
    const onDenied = vi.fn()
    const playwright = createGuardedPlaywright(
      {
        _android: { connect: androidConnect },
        _electron: { launch: electronLaunch },
        on: rawOn,
      } as unknown as PlaywrightRuntime,
      { onDenied }
    )

    expect(() => playwright._electron).toThrow(/outbound test request denied/i)
    expect(() => playwright._android).toThrow(/outbound test request denied/i)
    expect(() =>
      (playwright as unknown as { on: (event: string, listener: () => void) => unknown }).on(
        'transport',
        vi.fn()
      )
    ).toThrow(/outbound test request denied/i)

    expect(electronLaunch).not.toHaveBeenCalled()
    expect(androidConnect).not.toHaveBeenCalled()
    expect(rawOn).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledTimes(3)
  })

  it('never invokes launch even when a raw launch result would contain contexts', async () => {
    const close = vi.fn()
    const rawBrowser = {
      close,
      contexts: () => [fakeContext()],
    }
    const launch = vi.fn().mockResolvedValue(rawBrowser)
    const onDenied = vi.fn()
    const playwright = createGuardedPlaywright(
      { chromium: { launch } } as unknown as PlaywrightRuntime,
      { onDenied }
    )

    await expect(playwright.chromium.launch()).rejects.toThrow(/outbound test request denied/i)
    expect(launch).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
    expect(onDenied).toHaveBeenCalledOnce()
  })

  it('rejects reflective mutation and prototype access across every guarded proxy', async () => {
    const transport = vi.fn()
    const rawApiContext = { get: transport } as unknown as APIRequestContext
    const apiContext = createGuardedApiRequestContext(rawApiContext)
    const rawApiRequest = { newContext: vi.fn() } as unknown as APIRequest
    const apiRequest = createGuardedApiRequest(rawApiRequest)

    const rawContext = fakeContext(rawApiContext)
    const rawPage = fakePage(rawContext)
    const rawLocator = { page: () => rawPage }
    rawPage.locator.mockReturnValue(rawLocator)
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()
    const locator = page.locator('body')

    const rawBrowser = { newContext: vi.fn() } as unknown as Browser
    const browser = createGuardedBrowser(rawBrowser)
    const rawBrowserType = { launch: vi.fn() }
    const rawPlaywright = { chromium: rawBrowserType } as unknown as PlaywrightRuntime
    const playwright = createGuardedPlaywright(rawPlaywright)

    let route: Route | undefined
    await page.route('**/*', guardedRoute => {
      route = guardedRoute
    })
    const rawRoute = { request: () => ({ url: () => 'http://localhost:3100' }) } as Route
    const registeredRoute = rawPage.route.mock.calls.at(-1)?.[1] as (
      route: Route,
      request: Request
    ) => Promise<void>
    await registeredRoute(rawRoute, rawRoute.request())

    for (const guarded of [
      apiContext,
      apiRequest,
      context,
      page,
      locator,
      browser,
      playwright.chromium,
      playwright,
      route,
    ]) {
      expect(() =>
        Object.defineProperty(guarded, 'leak', {
          configurable: true,
          get() {
            return this
          },
        })
      ).toThrow(/outbound test request denied/i)
      expect(() => Reflect.set(guarded as object, 'leak', rawPlaywright)).toThrow(
        /outbound test request denied/i
      )
      expect(() => Reflect.deleteProperty(guarded as object, 'leak')).toThrow(
        /outbound test request denied/i
      )
      expect(() => Object.setPrototypeOf(guarded, { leak: rawPlaywright })).toThrow(
        /outbound test request denied/i
      )
      expect(Object.getPrototypeOf(guarded)).toBeNull()
      expect(() => Object.preventExtensions(guarded)).toThrow(/outbound test request denied/i)
    }

    expect(transport).not.toHaveBeenCalled()
    expect(Object.isExtensible(rawPlaywright)).toBe(true)
    expect(Object.isExtensible(rawBrowserType)).toBe(true)
  })

  it('closes every callable returned from the guarded Page graph', async () => {
    const requestGet = vi.fn()
    const rawContext = fakeContext({ get: requestGet } as unknown as APIRequestContext)
    const rawPage = fakePage(rawContext)
    rawPage.pickLocator.mockResolvedValue({ page: () => rawPage })
    rawContext.newPage.mockResolvedValue(rawPage)
    const context = await createGuardedBrowserContext(rawContext as unknown as BrowserContext)
    const page = await context.newPage()
    const method = page.pickLocator
    const constructorKey = ['con', 'structor'].join('')

    expect(Object.getPrototypeOf(method)).toBeNull()
    expect((method as unknown as Record<string, unknown>)[constructorKey]).toBeUndefined()
    expect(Object.getOwnPropertyDescriptor(method, constructorKey)).toBeUndefined()
    expect(Object.getPrototypeOf(method.bind(page))).toBeNull()
    expect(Reflect.set(method as unknown as object, 'leak', requestGet)).toBe(false)
    await expect(method()).resolves.toBeDefined()
    expect(requestGet).not.toHaveBeenCalled()
  })
})
