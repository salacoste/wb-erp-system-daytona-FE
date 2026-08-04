import { expect as playwrightExpect } from '@playwright/test'
import type {
  APIRequest,
  APIRequestContext,
  APIResponse,
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
  Request,
  Route,
  WebSocketRoute,
} from '@playwright/test'

import {
  assertAllowedTestUrl,
  networkPolicyDeniedError,
} from '../../test-utils/outbound-network-policy'

type PlaywrightRuntime = typeof import('playwright-core')
type BrowserTypeRuntime = PlaywrightRuntime['chromium']

type GuardCallbacks = {
  onAllowed?: () => void
  onDenied?: () => void
}

type GuardedRoute = Pick<Route, 'abort' | 'fallback'> & {
  request(): Pick<Request, 'url'>
}
type RouteGuard = ((route: GuardedRoute) => Promise<void>) & {
  assertTarget(target: string | URL): URL
}
type GuardedWebSocketRoute = Pick<WebSocketRoute, 'close' | 'connectToServer' | 'url'>

const contextInstallations = new WeakMap<object, Promise<void>>()
const guardedApiContexts = new WeakMap<object, APIRequestContext>()
const guardedApiRequests = new WeakMap<object, APIRequest>()
const guardedApiResponses = new WeakMap<object, APIResponse>()
const guardedBrowsers = new WeakMap<object, Browser>()
const guardedBrowserContexts = new WeakMap<object, Promise<BrowserContext>>()
const guardedBrowserContextValues = new WeakMap<object, BrowserContext>()
const guardedBrowserTypes = new WeakMap<object, BrowserTypeRuntime>()
const guardedPages = new WeakMap<object, Page>()
const guardedPageBearingValues = new WeakMap<object, object>()
const guardedPlaywrightRuntimes = new WeakMap<object, PlaywrightRuntime>()
const guardedRoutes = new WeakMap<object, Route>()
const guardedBrowserListeners = new WeakMap<object, Map<string, WeakMap<object, object>>>()
const guardedContextListeners = new WeakMap<object, Map<string, WeakMap<object, object>>>()
const guardedPageListeners = new WeakMap<object, Map<string, WeakMap<object, object>>>()
const rawGuardedValues = new WeakMap<object, object>()
const closedCallableProperties = new WeakMap<object, object>()
const closedCallableTargets = new WeakMap<object, object>()
const closedCallables = new WeakMap<Function, Function>()

const API_REQUEST_METHODS = new Set(['delete', 'fetch', 'get', 'head', 'patch', 'post', 'put'])
const API_RESPONSE_METHODS = new Set([
  'body',
  'dispose',
  'headers',
  'headersArray',
  'json',
  'ok',
  'securityDetails',
  'serverAddr',
  'status',
  'statusText',
  'text',
  'url',
])
const PAGE_SELF_EVENTS = new Set(['close', 'crash', 'domcontentloaded', 'load', 'popup'])
const CONTEXT_PAGE_EVENTS = new Set(['backgroundpage', 'page', 'pageclose', 'pageload'])
const PLAYWRIGHT_EMITTER_METHODS = new Set([
  'addListener',
  'off',
  'on',
  'once',
  'prependListener',
  'prependOnceListener',
  'removeAllListeners',
  'removeListener',
  'setMaxListeners',
])
const PAGE_DIAGNOSTIC_PROPERTIES = new Set(['coverage', 'screencast'])
const PAGE_DIAGNOSTIC_METHODS = new Set([
  'consoleMessages',
  'pdf',
  'requests',
  'routeFromHAR',
  'screenshot',
  'video',
])
const AUTH_STORAGE_STATE_PATHS = new Set(['e2e/.auth/manager.json', 'e2e/.auth/user.json'])

function closeGuardedCallable<T extends Function>(callable: T): T {
  const existing = closedCallables.get(callable)
  if (existing) return existing as T
  closedCallables.set(callable, callable)
  Object.setPrototypeOf(callable, null)
  const closeHelper = <U extends Function>(helper: U): U => {
    Object.setPrototypeOf(helper, null)
    Object.freeze(helper)
    return helper
  }
  const bind = closeHelper((receiver: unknown, ...prefix: unknown[]) =>
    closeGuardedCallable((...suffix: unknown[]) =>
      Reflect.apply(callable, receiver, [...prefix, ...suffix])
    )
  )
  const call = closeHelper((receiver: unknown, ...args: unknown[]) =>
    Reflect.apply(callable, receiver, args)
  )
  const apply = closeHelper((receiver: unknown, args: unknown[] = []) =>
    Reflect.apply(callable, receiver, args)
  )
  Object.defineProperties(callable, {
    apply: { value: apply },
    bind: { value: bind },
    call: { value: call },
  })
  Object.freeze(callable)
  return callable
}

function closeGuardedCallableProperties<T extends object>(target: T): T {
  const existing = closedCallableProperties.get(target)
  if (existing) return existing as T
  const guarded = new Proxy(target, {
    get(inner, property, receiver) {
      const value = Reflect.get(inner, property, receiver)
      return typeof value === 'function' ? closeGuardedCallable(value) : value
    },
  })
  closedCallableProperties.set(target, guarded)
  closedCallableProperties.set(guarded, guarded)
  closedCallableTargets.set(guarded, target)
  return guarded
}

type TestUse = (options: Record<string, unknown>) => unknown

function isPlainDataObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Reflect.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return false
  return Reflect.ownKeys(value).every(key => {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key)
    return typeof key === 'string' && Boolean(descriptor && 'value' in descriptor)
  })
}

function isExactEmptyArray(value: unknown): value is [] {
  return (
    Array.isArray(value) &&
    value.length === 0 &&
    Reflect.ownKeys(value).every(key => key === 'length')
  )
}

function isExactEmptyStorageState(value: unknown): boolean {
  if (!isPlainDataObject(value)) return false
  const keys = Object.keys(value).sort()
  return (
    keys.length === 2 &&
    keys[0] === 'cookies' &&
    keys[1] === 'origins' &&
    isExactEmptyArray(value.cookies) &&
    isExactEmptyArray(value.origins)
  )
}

function snapshotPlaywrightOptions(
  options: unknown,
  onDenied: () => void,
  target = 'https://playwright-options.invalid'
): Record<string, unknown> {
  if (options === undefined) return {}
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    recordPolicyDenial(target, onDenied)
    throw networkPolicyDeniedError()
  }
  let descriptors: PropertyDescriptorMap
  try {
    descriptors = Object.getOwnPropertyDescriptors(options as object)
  } catch {
    recordPolicyDenial(target, onDenied)
    throw networkPolicyDeniedError()
  }
  const snapshot: Record<string, unknown> = {}
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key]
    if (
      typeof key !== 'string' ||
      !descriptor ||
      !descriptor.enumerable ||
      !('value' in descriptor)
    ) {
      recordPolicyDenial(target, onDenied)
      throw networkPolicyDeniedError()
    }
    snapshot[key] = descriptor.value
  }
  return snapshot
}

function validateAllowedBaseURL(
  options: Record<string, unknown>,
  denialTarget: string,
  onDenied: () => void
): void {
  if (!Object.hasOwn(options, 'baseURL')) return
  if (typeof options.baseURL !== 'string') {
    recordPolicyDenial(denialTarget, onDenied)
    throw networkPolicyDeniedError()
  }
  recordPolicyDenial(options.baseURL, onDenied)
}

function normalizeTestUseOptions(options: unknown): Record<string, unknown> {
  if (!isPlainDataObject(options)) throw networkPolicyDeniedError()
  const keys = Object.keys(options)
  if (keys.some(key => key !== 'serviceWorkers' && key !== 'storageState')) {
    throw networkPolicyDeniedError()
  }
  if ('serviceWorkers' in options && options.serviceWorkers !== 'block') {
    throw networkPolicyDeniedError()
  }
  if ('storageState' in options && !isExactEmptyStorageState(options.storageState)) {
    throw networkPolicyDeniedError()
  }
  return { ...options, serviceWorkers: 'block' }
}

function authStorageStatePath(options: unknown, onDenied: () => void): string {
  const deny = (): never => {
    recordPolicyDenial('https://playwright-context-storage-state.invalid', onDenied)
    throw networkPolicyDeniedError()
  }
  if (!isPlainDataObject(options)) return deny()
  const keys = Object.keys(options)
  if (keys.length !== 1 || keys[0] !== 'path' || typeof options.path !== 'string') {
    return deny()
  }
  const normalized = options.path.replaceAll('\\', '/')
  if (!AUTH_STORAGE_STATE_PATHS.has(normalized)) return deny()
  return normalized
}

export function createGuardedTestUse<T extends TestUse>(runnerUse: T, receiver: unknown): T {
  return ((options: Record<string, unknown>) =>
    Reflect.apply(runnerUse, receiver, [normalizeTestUseOptions(options)])) as T
}
function forceBlockedServiceWorkers(
  options: BrowserContextOptions | undefined,
  onDenied: () => void = () => {}
): BrowserContextOptions {
  const snapshot = snapshotPlaywrightOptions(options, onDenied)
  validateProxyOption(snapshot, onDenied)
  validateDiagnosticOptions(snapshot, onDenied)
  for (const denied of ['clientCertificates', 'extraHTTPHeaders', 'httpCredentials']) {
    if (Object.hasOwn(snapshot, denied)) {
      recordPolicyDenial('https://playwright-browser-auth-options.invalid', onDenied)
    }
  }
  validateAllowedBaseURL(snapshot, 'https://playwright-browser-base-url.invalid', onDenied)
  if (Object.hasOwn(snapshot, 'storageState')) {
    const storageState = snapshot.storageState
    const normalizedPath =
      typeof storageState === 'string' ? storageState.replaceAll('\\', '/') : ''
    if (!isExactEmptyStorageState(storageState) && !AUTH_STORAGE_STATE_PATHS.has(normalizedPath)) {
      recordPolicyDenial('https://playwright-browser-storage-state.invalid', onDenied)
      throw networkPolicyDeniedError()
    }
    snapshot.storageState = isExactEmptyStorageState(storageState)
      ? { cookies: [], origins: [] }
      : normalizedPath
  }
  return { ...snapshot, serviceWorkers: 'block' } as BrowserContextOptions
}

function validateDiagnosticOptions(options: unknown, onDenied: () => void): void {
  if (!options || typeof options !== 'object') return
  if (Object.hasOwn(options, 'recordHar') || Object.hasOwn(options, 'recordVideo')) {
    recordPolicyDenial('https://playwright-browser-diagnostic.invalid', onDenied)
  }
}

function validateProxyOption(options: unknown, onDenied: () => void): void {
  if (options && typeof options === 'object' && Object.hasOwn(options, 'proxy')) {
    recordPolicyDenial('https://playwright-proxy-option.invalid', onDenied)
  }
}

function recordPolicyDenial(target: string | URL, onDenied: () => void): URL {
  try {
    return assertAllowedTestUrl(target)
  } catch (error) {
    onDenied()
    throw error
  }
}

function immutableGuardTraps<T extends object>(
  onDenied: () => void
): Pick<
  ProxyHandler<T>,
  | 'defineProperty'
  | 'deleteProperty'
  | 'getPrototypeOf'
  | 'preventExtensions'
  | 'set'
  | 'setPrototypeOf'
> {
  const denyMutation = (): never => {
    recordPolicyDenial('https://playwright-object-mutation.invalid', onDenied)
    throw networkPolicyDeniedError()
  }
  return {
    defineProperty: denyMutation,
    deleteProperty: denyMutation,
    // Reflection receives no raw Playwright prototype or private method graph.
    // Returning null keeps generic assertion libraries usable without exposing internals.
    getPrototypeOf: () => null,
    preventExtensions: denyMutation,
    set: denyMutation,
    setPrototypeOf: denyMutation,
  }
}

function denyPrivateProperty(property: PropertyKey, onDenied: () => void): void {
  if (typeof property === 'string' && property.startsWith('_')) {
    recordPolicyDenial('https://playwright-private-runtime.invalid', onDenied)
  }
}

function guardedOwnPropertyDescriptor(
  rawTarget: object,
  property: PropertyKey,
  guardedTarget: object,
  onDenied: () => void
): PropertyDescriptor | undefined {
  denyPrivateProperty(property, onDenied)
  const descriptor = Reflect.getOwnPropertyDescriptor(rawTarget, property)
  if (!descriptor) return descriptor
  const lookupTarget = closedCallableTargets.get(guardedTarget) ?? guardedTarget
  const value: unknown = Reflect.get(lookupTarget, property)
  const guardedValue = typeof value === 'function' ? closeGuardedCallable(value) : value
  if (!descriptor.configurable) {
    if ('value' in descriptor && descriptor.value !== guardedValue) {
      recordPolicyDenial('https://playwright-reflective-runtime.invalid', onDenied)
    }
    return descriptor
  }
  return 'value' in descriptor
    ? { ...descriptor, value: guardedValue }
    : { ...descriptor, get: () => guardedValue, set: undefined }
}

function canonicalApiRequestTarget(target: unknown): string {
  try {
    if (typeof target === 'string') return target
    if (target instanceof URL) return URL.prototype.toString.call(target)
  } catch {
    throw networkPolicyDeniedError()
  }
  throw networkPolicyDeniedError()
}

async function abortRouteBeforeRejecting(
  route: Pick<Route, 'abort'>,
  policyError: unknown,
  onDenied: () => void
): Promise<never> {
  let abortError: unknown
  let callbackError: unknown
  try {
    await route.abort('blockedbyclient')
  } catch (error) {
    abortError = error
  }
  try {
    onDenied()
  } catch (error) {
    callbackError = error
  }
  throw abortError ?? callbackError ?? policyError
}

function createGuardedRoute(
  route: Route,
  context: BrowserContext,
  callbacks: GuardCallbacks
): Route {
  const existing = guardedRoutes.get(route)
  if (existing) return existing
  const onDenied = callbacks.onDenied ?? (() => {})

  const guardedRoute: Route = closeGuardedCallableProperties(
    new Proxy(route, {
      ...immutableGuardTraps<Route>(onDenied),
      get(target, property) {
        denyPrivateProperty(property, onDenied)
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          return () => recordPolicyDenial('https://playwright-route-emitter.invalid', onDenied)
        }
        const value = Reflect.get(target, property, target)
        if (property === 'request') {
          return () =>
            createGuardedPageBearingValue(Reflect.apply(value, target, []), context, callbacks)
        }
        if (property === 'continue') {
          return async () => abortRouteBeforeRejecting(target, networkPolicyDeniedError(), onDenied)
        }
        if (property === 'fetch') {
          return async (options: Parameters<Route['fetch']>[0] = {}) => {
            let snapshot: Record<string, unknown>
            try {
              snapshot = snapshotPlaywrightOptions(
                options,
                () => {},
                'https://playwright-route-options.invalid'
              )
              if (Object.hasOwn(snapshot, 'url') && typeof snapshot.url !== 'string') {
                throw networkPolicyDeniedError()
              }
              assertAllowedTestUrl((snapshot.url as string | undefined) ?? target.request().url())
            } catch (error) {
              return abortRouteBeforeRejecting(target, error, onDenied)
            }
            return guardPageBoundaryValue(
              await Reflect.apply(value, target, [{ ...snapshot, maxRedirects: 0 }]),
              context,
              callbacks
            )
          }
        }
        if (property === 'fallback') {
          return async (options: Parameters<Route['fallback']>[0] = {}) => {
            let snapshot: Record<string, unknown>
            try {
              snapshot = snapshotPlaywrightOptions(
                options,
                () => {},
                'https://playwright-route-options.invalid'
              )
              if (Object.hasOwn(snapshot, 'url')) {
                if (typeof snapshot.url !== 'string') throw networkPolicyDeniedError()
                assertAllowedTestUrl(snapshot.url)
              }
            } catch (error) {
              return abortRouteBeforeRejecting(target, error, onDenied)
            }
            return Reflect.apply(value, target, [snapshot])
          }
        }
        return typeof value === 'function' ? guardMethodReturn(value, target, guardedRoute) : value
      },
      getOwnPropertyDescriptor: (target, property): PropertyDescriptor | undefined =>
        guardedOwnPropertyDescriptor(target, property, guardedRoute, onDenied),
    })
  )
  guardedRoutes.set(route, guardedRoute)
  guardedRoutes.set(guardedRoute, guardedRoute)
  return guardedRoute
}

type PlaywrightRouteHandler = Parameters<Page['route']>[1]

function createGuardedRouteHandler(
  handler: PlaywrightRouteHandler,
  context: BrowserContext,
  callbacks: GuardCallbacks
): PlaywrightRouteHandler {
  return (route, request) =>
    handler(
      createGuardedRoute(route, context, callbacks),
      createGuardedPageBearingValue(request, context, callbacks) as Request
    )
}

function createGuardedEmitterListener(
  listenerMaps: WeakMap<object, Map<string, WeakMap<object, object>>>,
  emitter: object,
  event: string,
  listener: (...args: unknown[]) => unknown,
  guardedEmitter: () => object,
  guardArgs: (args: unknown[]) => unknown[] = args => args
): (...args: unknown[]) => unknown {
  let eventMaps = listenerMaps.get(emitter)
  if (!eventMaps) {
    eventMaps = new Map()
    listenerMaps.set(emitter, eventMaps)
  }
  let listeners = eventMaps.get(event)
  if (!listeners) {
    listeners = new WeakMap()
    eventMaps.set(event, listeners)
  }
  const existing = listeners.get(listener) as ((...args: unknown[]) => unknown) | undefined
  if (existing) return existing

  const guardedListener = function (...args: unknown[]) {
    return Reflect.apply(listener, guardedEmitter(), guardArgs(args))
  }
  listeners.set(listener, guardedListener)
  listeners.set(guardedListener, guardedListener)
  return guardedListener
}

function guardedPageListenerForRemoval(
  listenerMaps: WeakMap<object, Map<string, WeakMap<object, object>>>,
  emitter: object,
  event: string,
  listener: unknown
): unknown {
  if (typeof listener !== 'function') return listener
  return listenerMaps.get(emitter)?.get(event)?.get(listener) ?? listener
}

function guardEventPredicate(
  options: unknown,
  guardedEmitter: () => object,
  guardValue: (value: unknown) => unknown
): unknown {
  const guardPredicate = (predicate: (...args: unknown[]) => unknown) =>
    function (...args: unknown[]) {
      const [value, ...remaining] = args
      return Reflect.apply(predicate, guardedEmitter(), [guardValue(value), ...remaining])
    }

  if (typeof options === 'function') {
    return guardPredicate(options as (...args: unknown[]) => unknown)
  }
  if (
    options &&
    typeof options === 'object' &&
    'predicate' in options &&
    typeof options.predicate === 'function'
  ) {
    return {
      ...options,
      predicate: guardPredicate(options.predicate as (...args: unknown[]) => unknown),
    }
  }
  return options
}

function mapFluentEmitterResult(
  result: unknown,
  rawEmitter: object,
  guardedEmitter: object
): unknown {
  if (result === rawEmitter) return guardedEmitter
  if (
    result &&
    (typeof result === 'object' || typeof result === 'function') &&
    typeof (result as PromiseLike<unknown>).then === 'function'
  ) {
    return Promise.resolve(result).then(value => (value === rawEmitter ? guardedEmitter : value))
  }
  return result
}

function rawPlaywrightValue<T>(value: T): T {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value
  return (rawGuardedValues.get(value as object) ?? value) as T
}

function rawPlaywrightInput(value: unknown): unknown {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value
  const raw = rawGuardedValues.get(value)
  if (raw) return raw
  if (Array.isArray(value)) return value.map(rawPlaywrightInput)
  if (value instanceof Map) {
    return new Map(
      [...value].map(([key, item]) => [rawPlaywrightInput(key), rawPlaywrightInput(item)])
    )
  }
  if (value instanceof Set) return new Set([...value].map(rawPlaywrightInput))
  if (!isPlainDataObject(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, rawPlaywrightInput(item)])
  )
}

function knownGuardedValue(value: object): object | undefined {
  return (
    guardedPages.get(value) ??
    guardedBrowserContextValues.get(value) ??
    guardedBrowsers.get(value) ??
    guardedApiContexts.get(value) ??
    guardedApiRequests.get(value) ??
    guardedApiResponses.get(value) ??
    guardedRoutes.get(value) ??
    guardedBrowserTypes.get(value) ??
    guardedPlaywrightRuntimes.get(value)
  )
}

function isPromiseLike(value: object): value is PromiseLike<unknown> {
  return typeof Reflect.get(value, 'then') === 'function'
}

function isOpaqueDataValue(value: object): boolean {
  return (
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof URL ||
    value instanceof Error
  )
}

function guardPageBoundaryValue(
  value: unknown,
  context: BrowserContext,
  callbacks: GuardCallbacks,
  rawEmitter?: object,
  guardedEmitter?: object
): unknown {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value
  if (rawEmitter && guardedEmitter && value === rawEmitter) return guardedEmitter
  if (rawGuardedValues.has(value)) return value

  const known = knownGuardedValue(value)
  if (known) return known
  if (isPromiseLike(value)) {
    return Promise.resolve(value).then(result =>
      guardPageBoundaryValue(result, context, callbacks, rawEmitter, guardedEmitter)
    )
  }
  if (Array.isArray(value)) {
    return value.map(item => guardPageBoundaryValue(item, context, callbacks))
  }
  if (value instanceof Map) {
    return new Map(
      [...value].map(([key, item]) => [
        guardPageBoundaryValue(key, context, callbacks),
        guardPageBoundaryValue(item, context, callbacks),
      ])
    )
  }
  if (value instanceof Set) {
    return new Set([...value].map(item => guardPageBoundaryValue(item, context, callbacks)))
  }
  if (isOpaqueDataValue(value)) return value
  return createGuardedPageBearingValue(value, context, callbacks)
}

function guardMethodReturn(
  method: (...args: unknown[]) => unknown,
  rawTarget: object,
  guardedTarget: object,
  context?: BrowserContext,
  callbacks: GuardCallbacks = {}
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    const result = Reflect.apply(method, rawTarget, args.map(rawPlaywrightInput))
    if (context) {
      return guardPageBoundaryValue(result, context, callbacks, rawTarget, guardedTarget)
    }
    return mapFluentEmitterResult(result, rawTarget, guardedTarget)
  }
}

function createGuardedPageBearingValue(
  value: unknown,
  context: BrowserContext,
  callbacks: GuardCallbacks
): unknown {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value
  const existing = guardedPageBearingValues.get(value)
  if (existing) return existing

  const guardedValue: object = closeGuardedCallableProperties(
    new Proxy(value as object, {
      ...immutableGuardTraps<object>(callbacks.onDenied ?? (() => {})),
      get(target, property) {
        if (typeof property === 'string' && property.startsWith('_')) {
          denyPrivateProperty(property, callbacks.onDenied ?? (() => {}))
        }
        const member = Reflect.get(target, property, target)
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          return () =>
            recordPolicyDenial(
              'https://playwright-page-bearing-emitter.invalid',
              callbacks.onDenied ?? (() => {})
            )
        }
        if (typeof member !== 'function') {
          return guardPageBoundaryValue(member, context, callbacks)
        }

        if (property === 'screenshot' || property === 'pdf') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-wrapper-screenshot.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }

        if (property === 'page') {
          return (...args: unknown[]) => {
            const page = Reflect.apply(member, target, args) as Page | null
            return page ? createGuardedPage(page, context, callbacks) : null
          }
        }
        return guardMethodReturn(member, target, guardedValue, context, callbacks)
      },
      getOwnPropertyDescriptor: (target, property) =>
        guardedOwnPropertyDescriptor(
          target,
          property,
          guardedValue,
          callbacks.onDenied ?? (() => {})
        ),
    })
  )
  guardedPageBearingValues.set(value, guardedValue)
  guardedPageBearingValues.set(guardedValue, guardedValue)
  rawGuardedValues.set(guardedValue, value as object)
  return guardedValue
}

export function createPlaywrightRouteGuard(onDenied: () => void = () => {}): RouteGuard {
  const guard = async (route: GuardedRoute) => {
    try {
      assertAllowedTestUrl(route.request().url())
    } catch {
      let abortError: unknown
      let callbackError: unknown
      try {
        await route.abort('blockedbyclient')
      } catch (error) {
        abortError = error
      }
      try {
        onDenied()
      } catch (error) {
        callbackError = error
      }
      if (abortError) throw abortError
      if (callbackError) throw callbackError
      return
    }
    await route.fallback()
  }
  guard.assertTarget = assertAllowedTestUrl
  return guard
}

export function createPlaywrightWebSocketGuard(
  onDenied: () => void = () => {},
  onAllowed: () => void = () => {}
): (route: GuardedWebSocketRoute) => Promise<void> {
  return async route => {
    try {
      assertAllowedTestUrl(route.url())
    } catch {
      let closeError: unknown
      let callbackError: unknown
      try {
        await route.close({ code: 1008, reason: 'Test network policy denied' })
      } catch (error) {
        closeError = error
      }
      try {
        onDenied()
      } catch (error) {
        callbackError = error
      }
      if (closeError) throw closeError
      if (callbackError) throw callbackError
      return
    }
    route.connectToServer()
    onAllowed()
  }
}

export async function installPlaywrightContextNetworkGuard(
  context: BrowserContext,
  onDenied: () => void = () => {},
  onAllowed: () => void = () => {}
): Promise<void> {
  const existing = contextInstallations.get(context)
  if (existing) return existing

  const installation = (async () => {
    await context.routeWebSocket(
      '**/*',
      createPlaywrightWebSocketGuard(onDenied, onAllowed) as Parameters<
        BrowserContext['routeWebSocket']
      >[1]
    )
    await context.route('**/*', async route => {
      let denied = false
      const routeGuard = createPlaywrightRouteGuard(() => {
        denied = true
        onDenied()
      })
      await routeGuard(route)
      if (!denied) onAllowed()
    })
  })()
  contextInstallations.set(context, installation)
  return installation
}

export function createGuardedApiRequestContext(
  context: APIRequestContext,
  onDenied: () => void = () => {}
): APIRequestContext {
  const existing = guardedApiContexts.get(context)
  if (existing) return existing

  const guardedContext: APIRequestContext = closeGuardedCallableProperties(
    new Proxy(context, {
      ...immutableGuardTraps<APIRequestContext>(onDenied),
      get(target, property) {
        denyPrivateProperty(property, onDenied)
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          return () =>
            recordPolicyDenial('https://playwright-api-context-emitter.invalid', onDenied)
        }
        if (property === 'tracing') {
          recordPolicyDenial('https://playwright-api-tracing.invalid', onDenied)
        }
        const value = Reflect.get(target, property, target)
        if (typeof property === 'string' && API_REQUEST_METHODS.has(property)) {
          return async (url: unknown, options: Record<string, unknown> | undefined = {}) => {
            let canonicalUrl: string
            let snapshot: Record<string, unknown>
            try {
              canonicalUrl = canonicalApiRequestTarget(url)
              snapshot = snapshotPlaywrightOptions(
                options,
                () => {},
                'https://playwright-api-request-options.invalid'
              )
              assertAllowedTestUrl(canonicalUrl)
            } catch (error) {
              try {
                onDenied()
              } catch (callbackError) {
                throw callbackError
              }
              throw error
            }
            const response = (await Reflect.apply(value, target, [
              canonicalUrl,
              { ...snapshot, maxRedirects: 0 },
            ])) as APIResponse
            return createGuardedApiResponse(response, onDenied)
          }
        }
        if (property === 'storageState') {
          return async () => {
            recordPolicyDenial('https://playwright-api-storage-state.invalid', onDenied)
          }
        }
        return typeof value === 'function'
          ? guardMethodReturn(value, target, guardedContext)
          : value
      },
      getOwnPropertyDescriptor: (target, property): PropertyDescriptor | undefined =>
        guardedOwnPropertyDescriptor(target, property, guardedContext, onDenied),
    })
  )
  guardedApiContexts.set(context, guardedContext)
  guardedApiContexts.set(guardedContext, guardedContext)
  rawGuardedValues.set(guardedContext, context)
  return guardedContext
}

function createGuardedApiResponse(
  response: APIResponse,
  onDenied: () => void = () => {}
): APIResponse {
  if (!response || (typeof response !== 'object' && typeof response !== 'function')) {
    return response
  }
  const existing = guardedApiResponses.get(response)
  if (existing) return existing

  let guardedResponse: APIResponse
  guardedResponse = closeGuardedCallableProperties(
    new Proxy(response, {
      ...immutableGuardTraps<APIResponse>(onDenied),
      get(target, property) {
        denyPrivateProperty(property, onDenied)
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          return () =>
            recordPolicyDenial('https://playwright-api-response-emitter.invalid', onDenied)
        }
        if (property === 'valueOf') return () => guardedResponse
        // Promise assimilation probes `then` on every resolved object.
        if (property === 'then') return undefined
        if (property === Symbol.asyncDispose) {
          return async () => Reflect.apply(target.dispose, target, [])
        }
        if (property === Symbol.toStringTag) return 'APIResponse'
        if (typeof property !== 'string' || !API_RESPONSE_METHODS.has(property)) {
          recordPolicyDenial('https://playwright-api-response-surface.invalid', onDenied)
        }
        const value = Reflect.get(target, property, target)
        return typeof value === 'function'
          ? (...args: unknown[]) => Reflect.apply(value, target, args.map(rawPlaywrightInput))
          : value
      },
      getOwnPropertyDescriptor(target, property): PropertyDescriptor | undefined {
        denyPrivateProperty(property, onDenied)
        return guardedOwnPropertyDescriptor(target, property, guardedResponse, onDenied)
      },
      has(_target, property) {
        denyPrivateProperty(property, onDenied)
        return typeof property === 'string' && API_RESPONSE_METHODS.has(property)
      },
      ownKeys(target) {
        return Reflect.ownKeys(target).filter(
          key => typeof key === 'string' && API_RESPONSE_METHODS.has(key)
        )
      },
    })
  )
  guardedApiResponses.set(response, guardedResponse)
  guardedApiResponses.set(guardedResponse, guardedResponse)
  rawGuardedValues.set(guardedResponse, response)
  return guardedResponse
}

export function createGuardedApiRequest(
  request: APIRequest,
  onDenied: () => void = () => {}
): APIRequest {
  const existing = guardedApiRequests.get(request)
  if (existing) return existing

  const guardedRequest: APIRequest = closeGuardedCallableProperties(
    new Proxy(request, {
      ...immutableGuardTraps<APIRequest>(onDenied),
      get(target, property) {
        denyPrivateProperty(property, onDenied)
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          return () =>
            recordPolicyDenial('https://playwright-api-request-emitter.invalid', onDenied)
        }
        const value = Reflect.get(target, property, target)
        if (property === 'newContext') {
          return async (options: Parameters<APIRequest['newContext']>[0] = {}) => {
            const snapshot = snapshotPlaywrightOptions(options, onDenied)
            validateProxyOption(snapshot, onDenied)
            for (const denied of [
              'clientCertificates',
              'extraHTTPHeaders',
              'httpCredentials',
              'storageState',
            ]) {
              if (Object.hasOwn(snapshot, denied)) {
                recordPolicyDenial('https://playwright-api-auth-options.invalid', onDenied)
              }
            }
            validateAllowedBaseURL(snapshot, 'https://playwright-api-base-url.invalid', onDenied)
            const context = (await Reflect.apply(value, target, [
              { ...snapshot, maxRedirects: 0 },
            ])) as APIRequestContext
            return createGuardedApiRequestContext(context, onDenied)
          }
        }
        return typeof value === 'function'
          ? guardMethodReturn(value, target, guardedRequest)
          : value
      },
      getOwnPropertyDescriptor: (target, property): PropertyDescriptor | undefined =>
        guardedOwnPropertyDescriptor(target, property, guardedRequest, onDenied),
    })
  )
  guardedApiRequests.set(request, guardedRequest)
  guardedApiRequests.set(guardedRequest, guardedRequest)
  rawGuardedValues.set(guardedRequest, request)
  return guardedRequest
}

export async function createGuardedApiContext(
  request: APIRequest,
  options: Parameters<APIRequest['newContext']>[0] = {},
  onDenied: () => void = () => {}
): Promise<APIRequestContext> {
  return createGuardedApiRequest(request, onDenied).newContext(options)
}

export function createGuardedPage(
  page: Page,
  context: BrowserContext,
  callbacks: GuardCallbacks = {}
): Page {
  const existing = guardedPages.get(page)
  if (existing) return existing

  let guardedPage: Page
  guardedPage = closeGuardedCallableProperties(
    new Proxy(page, {
      ...immutableGuardTraps<Page>(callbacks.onDenied ?? (() => {})),
      get(target, property) {
        if (property === 'context') return () => context
        if (property === 'request') return context.request
        if (typeof property === 'string' && property.startsWith('_')) {
          denyPrivateProperty(property, callbacks.onDenied ?? (() => {}))
        }
        if (typeof property === 'string' && PAGE_DIAGNOSTIC_PROPERTIES.has(property)) {
          recordPolicyDenial(
            `https://playwright-page-${property.toLowerCase()}.invalid`,
            callbacks.onDenied ?? (() => {})
          )
        }
        const value = Reflect.get(target, property, target)
        if (property === 'waitForEvent') {
          return async (...args: unknown[]) => {
            const event = String(args[0])
            const guardValue = (result: unknown) =>
              PAGE_SELF_EVENTS.has(event)
                ? createGuardedPage(result as Page, context, callbacks)
                : createGuardedPageBearingValue(result, context, callbacks)
            args[1] = guardEventPredicate(args[1], () => guardedPage, guardValue)
            const result = await Reflect.apply(value, target, args)
            return guardValue(result)
          }
        }
        if (property === 'waitForRequest' || property === 'waitForResponse') {
          return (...args: unknown[]) => {
            args[0] = guardEventPredicate(
              args[0],
              () => guardedPage,
              result => guardPageBoundaryValue(result, context, callbacks)
            )
            return guardPageBoundaryValue(Reflect.apply(value, target, args), context, callbacks)
          }
        }
        if (property === 'addLocatorHandler') {
          return (...args: unknown[]) => {
            args[0] = rawPlaywrightInput(args[0])
            if (typeof args[1] === 'function') {
              const handler = args[1] as (...handlerArgs: unknown[]) => unknown
              args[1] = function (...handlerArgs: unknown[]) {
                return Reflect.apply(handler, guardedPage, [
                  ...handlerArgs.map(item => guardPageBoundaryValue(item, context, callbacks)),
                ])
              }
            }
            return guardPageBoundaryValue(
              Reflect.apply(value, target, args),
              context,
              callbacks,
              target,
              guardedPage
            )
          }
        }
        if (property === 'opener') {
          return async (): Promise<Page | null> => {
            const opener = (await Reflect.apply(value, target, [])) as Page | null
            return opener ? createGuardedPage(opener, context, callbacks) : null
          }
        }
        if (
          property === 'on' ||
          property === 'once' ||
          property === 'addListener' ||
          property === 'prependListener' ||
          property === 'prependOnceListener'
        ) {
          return (...args: unknown[]) => {
            const event = String(args[0])
            if (typeof args[1] === 'function') {
              args[1] = createGuardedEmitterListener(
                guardedPageListeners,
                target,
                event,
                args[1] as (...listenerArgs: unknown[]) => unknown,
                () => guardedPage,
                listenerArgs => {
                  const [emittedPage, ...remaining] = listenerArgs
                  const guardedArgument = PAGE_SELF_EVENTS.has(event)
                    ? createGuardedPage(emittedPage as Page, context, callbacks)
                    : createGuardedPageBearingValue(emittedPage, context, callbacks)
                  return [
                    guardedArgument,
                    ...remaining.map(item => guardPageBoundaryValue(item, context, callbacks)),
                  ]
                }
              )
            }
            const result = Reflect.apply(value, target, args)
            return mapFluentEmitterResult(result, target, guardedPage)
          }
        }
        if (property === 'off' || property === 'removeListener') {
          return (...args: unknown[]) => {
            args[1] = guardedPageListenerForRemoval(
              guardedPageListeners,
              target,
              String(args[0]),
              args[1]
            )
            const result = Reflect.apply(value, target, args)
            return mapFluentEmitterResult(result, target, guardedPage)
          }
        }
        if (property === 'removeAllListeners') {
          return (...args: unknown[]) => {
            const result = Reflect.apply(value, target, args)
            return mapFluentEmitterResult(result, target, guardedPage)
          }
        }
        if (property === 'route') {
          return (...args: Parameters<Page['route']>) => {
            const [url, handler, options] = args
            return Reflect.apply(value, target, [
              url,
              createGuardedRouteHandler(handler, context, callbacks),
              options,
            ])
          }
        }
        if (property === 'routeWebSocket' || property === 'exposeBinding') {
          return async () => {
            recordPolicyDenial(
              `https://playwright-page-${String(property).toLowerCase()}.invalid`,
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (typeof property === 'string' && PAGE_DIAGNOSTIC_METHODS.has(property)) {
          return async () => {
            recordPolicyDenial(
              `https://playwright-page-${property.toLowerCase()}.invalid`,
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (property === 'unroute' || property === 'unrouteAll') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-route-removal.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        return typeof value === 'function'
          ? guardMethodReturn(value, target, guardedPage, context, callbacks)
          : guardPageBoundaryValue(value, context, callbacks)
      },
      getOwnPropertyDescriptor: (target, property) =>
        guardedOwnPropertyDescriptor(
          target,
          property,
          guardedPage,
          callbacks.onDenied ?? (() => {})
        ),
    })
  )
  guardedPages.set(page, guardedPage)
  guardedPages.set(guardedPage, guardedPage)
  rawGuardedValues.set(guardedPage, page)
  return guardedPage
}

export async function createGuardedBrowserContext(
  context: BrowserContext,
  callbacks: GuardCallbacks = {}
): Promise<BrowserContext> {
  const existing = guardedBrowserContexts.get(context)
  if (existing) return existing

  const guarding = (async () => {
    try {
      await installPlaywrightContextNetworkGuard(context, callbacks.onDenied, callbacks.onAllowed)
      let guardedContext: BrowserContext
      guardedContext = closeGuardedCallableProperties(
        new Proxy(context, {
          ...immutableGuardTraps<BrowserContext>(callbacks.onDenied ?? (() => {})),
          get(target, property) {
            denyPrivateProperty(property, callbacks.onDenied ?? (() => {}))
            const value = Reflect.get(target, property, target)
            if (property === 'request') {
              return createGuardedApiRequestContext(value as APIRequestContext, callbacks.onDenied)
            }
            if (property === 'tracing') {
              recordPolicyDenial(
                'https://playwright-context-tracing.invalid',
                callbacks.onDenied ?? (() => {})
              )
            }
            if (property === 'cookies') {
              return async () => {
                recordPolicyDenial(
                  'https://playwright-context-cookie-capture.invalid',
                  callbacks.onDenied ?? (() => {})
                )
              }
            }
            if (property === 'storageState') {
              return async (options: unknown) => {
                const path = authStorageStatePath(options, callbacks.onDenied ?? (() => {}))
                await Reflect.apply(value, target, [{ path }])
                return { cookies: [], origins: [] }
              }
            }
            if (property === 'browser') {
              return (): Browser | null => {
                const browser = Reflect.apply(value, target, []) as Browser | null
                return browser ? createGuardedBrowser(browser, callbacks) : null
              }
            }
            if (property === 'newPage') {
              return async (): Promise<Page> =>
                createGuardedPage(
                  (await Reflect.apply(value, target, [])) as Page,
                  guardedContext,
                  callbacks
                )
            }
            if (property === 'waitForEvent') {
              return async (...args: unknown[]) => {
                const event = String(args[0])
                const guardValue = (result: unknown) => {
                  if (CONTEXT_PAGE_EVENTS.has(event)) {
                    return createGuardedPage(result as Page, guardedContext, callbacks)
                  }
                  return event === 'close'
                    ? guardedContext
                    : createGuardedPageBearingValue(result, guardedContext, callbacks)
                }
                args[1] = guardEventPredicate(args[1], () => guardedContext, guardValue)
                const result = await Reflect.apply(value, target, args)
                return guardValue(result)
              }
            }
            if (
              property === 'on' ||
              property === 'once' ||
              property === 'addListener' ||
              property === 'prependListener' ||
              property === 'prependOnceListener'
            ) {
              return (...args: unknown[]) => {
                const event = String(args[0])
                if (typeof args[1] === 'function') {
                  args[1] = createGuardedEmitterListener(
                    guardedContextListeners,
                    target,
                    event,
                    args[1] as (...listenerArgs: unknown[]) => unknown,
                    () => guardedContext,
                    listenerArgs => {
                      const [emittedValue, ...remaining] = listenerArgs
                      if (CONTEXT_PAGE_EVENTS.has(event)) {
                        return [
                          createGuardedPage(emittedValue as Page, guardedContext, callbacks),
                          ...remaining,
                        ]
                      }
                      return event === 'close'
                        ? [
                            guardedContext,
                            ...remaining.map(item =>
                              guardPageBoundaryValue(item, guardedContext, callbacks)
                            ),
                          ]
                        : [
                            createGuardedPageBearingValue(emittedValue, guardedContext, callbacks),
                            ...remaining.map(item =>
                              guardPageBoundaryValue(item, guardedContext, callbacks)
                            ),
                          ]
                    }
                  )
                }
                const result = Reflect.apply(value, target, args)
                return mapFluentEmitterResult(result, target, guardedContext)
              }
            }
            if (property === 'off' || property === 'removeListener') {
              return (...args: unknown[]) => {
                args[1] = guardedPageListenerForRemoval(
                  guardedContextListeners,
                  target,
                  String(args[0]),
                  args[1]
                )
                const result = Reflect.apply(value, target, args)
                return mapFluentEmitterResult(result, target, guardedContext)
              }
            }
            if (property === 'removeAllListeners') {
              return (...args: unknown[]) => {
                const result = Reflect.apply(value, target, args)
                return mapFluentEmitterResult(result, target, guardedContext)
              }
            }
            if (property === 'newCDPSession') {
              return async () => {
                recordPolicyDenial(
                  'https://playwright-cdp-session.invalid',
                  callbacks.onDenied ?? (() => {})
                )
              }
            }
            if (property === 'pages' || property === 'backgroundPages') {
              return (): Page[] =>
                (Reflect.apply(value, target, []) as Page[]).map(page =>
                  createGuardedPage(page, guardedContext, callbacks)
                )
            }
            if (property === 'route') {
              return (...args: Parameters<BrowserContext['route']>) => {
                const [url, handler, options] = args
                return Reflect.apply(value, target, [
                  url,
                  createGuardedRouteHandler(handler, guardedContext, callbacks),
                  options,
                ])
              }
            }
            if (property === 'routeFromHAR') {
              return async () => {
                recordPolicyDenial(
                  'https://playwright-context-route-from-har.invalid',
                  callbacks.onDenied ?? (() => {})
                )
              }
            }
            if (property === 'routeWebSocket' || property === 'exposeBinding') {
              return async () => {
                recordPolicyDenial(
                  `https://playwright-context-${String(property).toLowerCase()}.invalid`,
                  callbacks.onDenied ?? (() => {})
                )
              }
            }
            if (property === 'unroute' || property === 'unrouteAll') {
              return async () => {
                recordPolicyDenial(
                  'https://playwright-route-removal.invalid',
                  callbacks.onDenied ?? (() => {})
                )
              }
            }
            return typeof value === 'function'
              ? guardMethodReturn(value, target, guardedContext, guardedContext, callbacks)
              : guardPageBoundaryValue(value, guardedContext, callbacks)
          },
          getOwnPropertyDescriptor: (target, property) =>
            guardedOwnPropertyDescriptor(
              target,
              property,
              guardedContext,
              callbacks.onDenied ?? (() => {})
            ),
        })
      )
      const installed = contextInstallations.get(context)
      if (installed) contextInstallations.set(guardedContext, installed)
      guardedBrowserContextValues.set(context, guardedContext)
      guardedBrowserContextValues.set(guardedContext, guardedContext)
      guardedBrowserContexts.set(guardedContext, Promise.resolve(guardedContext))
      rawGuardedValues.set(guardedContext, context)
      return guardedContext
    } catch (error) {
      await context.close()
      throw error
    }
  })()
  guardedBrowserContexts.set(context, guarding)
  return guarding
}

export function createGuardedBrowser(browser: Browser, callbacks: GuardCallbacks = {}): Browser {
  const existing = guardedBrowsers.get(browser)
  if (existing) return existing

  let guardedBrowser: Browser
  guardedBrowser = closeGuardedCallableProperties(
    new Proxy(browser, {
      ...immutableGuardTraps<Browser>(callbacks.onDenied ?? (() => {})),
      get(target, property) {
        denyPrivateProperty(property, callbacks.onDenied ?? (() => {}))
        const value = Reflect.get(target, property, target)
        if (property === 'newContext') {
          return async (options?: BrowserContextOptions) => {
            const context = (await Reflect.apply(value, target, [
              forceBlockedServiceWorkers(options, callbacks.onDenied ?? (() => {})),
            ])) as BrowserContext
            return createGuardedBrowserContext(context, callbacks)
          }
        }
        if (property === 'newPage') {
          return async (options?: BrowserContextOptions): Promise<Page> => {
            const page = (await Reflect.apply(value, target, [
              forceBlockedServiceWorkers(options, callbacks.onDenied ?? (() => {})),
            ])) as Page
            const context = await createGuardedBrowserContext(page.context(), callbacks)
            return createGuardedPage(page, context, callbacks)
          }
        }
        if (property === 'contexts') {
          return (): BrowserContext[] =>
            (Reflect.apply(value, target, []) as BrowserContext[]).map(context => {
              const guarded = guardedBrowserContextValues.get(context)
              if (!guarded) {
                throw new Error('Playwright network guard rejected an unguarded BrowserContext')
              }
              return guarded
            })
        }
        if (property === 'browserType') {
          return (): BrowserTypeRuntime =>
            createGuardedBrowserType(
              Reflect.apply(value, target, []) as BrowserTypeRuntime,
              callbacks
            )
        }
        if (property === 'newBrowserCDPSession') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-browser-cdp-session.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (property === 'bind') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-browser-bind.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (property === 'startTracing' || property === 'stopTracing') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-browser-tracing.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (
          property === 'on' ||
          property === 'once' ||
          property === 'addListener' ||
          property === 'prependListener' ||
          property === 'prependOnceListener'
        ) {
          return (...args: unknown[]) => {
            const event = String(args[0])
            if (event === 'context') {
              recordPolicyDenial(
                'https://playwright-browser-context-event.invalid',
                callbacks.onDenied ?? (() => {})
              )
            }
            if (typeof args[1] === 'function') {
              args[1] = createGuardedEmitterListener(
                guardedBrowserListeners,
                target,
                event,
                args[1] as (...listenerArgs: unknown[]) => unknown,
                () => guardedBrowser,
                listenerArgs => {
                  if (event !== 'disconnected') return listenerArgs
                  const [, ...remaining] = listenerArgs
                  return [guardedBrowser, ...remaining]
                }
              )
            }
            const result = Reflect.apply(value, target, args)
            return mapFluentEmitterResult(result, target, guardedBrowser)
          }
        }
        if (property === 'off' || property === 'removeListener') {
          return (...args: unknown[]) => {
            args[1] = guardedPageListenerForRemoval(
              guardedBrowserListeners,
              target,
              String(args[0]),
              args[1]
            )
            const result = Reflect.apply(value, target, args)
            return mapFluentEmitterResult(result, target, guardedBrowser)
          }
        }
        if (property === 'removeAllListeners') {
          return (...args: unknown[]) => {
            const result = Reflect.apply(value, target, args)
            return mapFluentEmitterResult(result, target, guardedBrowser)
          }
        }
        return typeof value === 'function'
          ? guardMethodReturn(value, target, guardedBrowser)
          : value
      },
      getOwnPropertyDescriptor: (target, property) =>
        guardedOwnPropertyDescriptor(
          target,
          property,
          guardedBrowser,
          callbacks.onDenied ?? (() => {})
        ),
    })
  )
  guardedBrowsers.set(browser, guardedBrowser)
  guardedBrowsers.set(guardedBrowser, guardedBrowser)
  rawGuardedValues.set(guardedBrowser, browser)
  return guardedBrowser
}

function createGuardedBrowserType(
  browserType: BrowserTypeRuntime,
  callbacks: GuardCallbacks
): BrowserTypeRuntime {
  const existing = guardedBrowserTypes.get(browserType)
  if (existing) return existing

  const guardedBrowserType: BrowserTypeRuntime = closeGuardedCallableProperties(
    new Proxy(browserType, {
      ...immutableGuardTraps<BrowserTypeRuntime>(callbacks.onDenied ?? (() => {})),
      get(target, property) {
        denyPrivateProperty(property, callbacks.onDenied ?? (() => {}))
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          return () =>
            recordPolicyDenial(
              'https://playwright-browser-type-emitter.invalid',
              callbacks.onDenied ?? (() => {})
            )
        }
        const value = Reflect.get(target, property, target)
        if (property === 'launch') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-browser-launch.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (property === 'connect' || property === 'connectOverCDP') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-browser-attach.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (property === 'launchPersistentContext') {
          return async () => {
            recordPolicyDenial(
              'https://playwright-persistent-context.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        if (property === 'launchServer') {
          return async () => {
            recordPolicyDenial(
              'ws://playwright-launch-server.invalid',
              callbacks.onDenied ?? (() => {})
            )
          }
        }
        return typeof value === 'function'
          ? guardMethodReturn(value, target, guardedBrowserType)
          : value
      },
      getOwnPropertyDescriptor: (target, property): PropertyDescriptor | undefined =>
        guardedOwnPropertyDescriptor(
          target,
          property,
          guardedBrowserType,
          callbacks.onDenied ?? (() => {})
        ),
    })
  )
  guardedBrowserTypes.set(browserType, guardedBrowserType)
  guardedBrowserTypes.set(guardedBrowserType, guardedBrowserType)
  rawGuardedValues.set(guardedBrowserType, browserType)
  return guardedBrowserType
}

export function createGuardedPlaywright(
  playwright: PlaywrightRuntime,
  callbacks: GuardCallbacks = {}
): PlaywrightRuntime {
  const existing = guardedPlaywrightRuntimes.get(playwright)
  if (existing) return existing

  const guardedValues = new Map<PropertyKey, unknown>()
  const guardedPlaywright: PlaywrightRuntime = closeGuardedCallableProperties(
    new Proxy(playwright, {
      ...immutableGuardTraps<PlaywrightRuntime>(callbacks.onDenied ?? (() => {})),
      get(target, property) {
        const cached = guardedValues.get(property)
        if (cached) return cached

        if (typeof property === 'string' && property.startsWith('_')) {
          denyPrivateProperty(property, callbacks.onDenied ?? (() => {}))
        }
        if (typeof property === 'string' && PLAYWRIGHT_EMITTER_METHODS.has(property)) {
          const deniedEmitterMethod = () =>
            recordPolicyDenial(
              'https://playwright-runtime-emitter.invalid',
              callbacks.onDenied ?? (() => {})
            )
          guardedValues.set(property, deniedEmitterMethod)
          return deniedEmitterMethod
        }

        const value = Reflect.get(target, property, target)
        let guarded = value
        if (property === 'request') {
          guarded = createGuardedApiRequest(value as APIRequest, callbacks.onDenied)
        } else if (property === 'selectors') {
          recordPolicyDenial(
            'https://playwright-selectors-runtime.invalid',
            callbacks.onDenied ?? (() => {})
          )
        } else if (property === 'chromium' || property === 'firefox' || property === 'webkit') {
          guarded = createGuardedBrowserType(value as BrowserTypeRuntime, callbacks)
        } else if (typeof value === 'function') {
          guarded = guardMethodReturn(value, target, guardedPlaywright)
        }
        guardedValues.set(property, guarded)
        return guarded
      },
      getOwnPropertyDescriptor: (target, property) =>
        guardedOwnPropertyDescriptor(
          target,
          property,
          guardedPlaywright,
          callbacks.onDenied ?? (() => {})
        ),
    })
  )
  guardedPlaywrightRuntimes.set(playwright, guardedPlaywright)
  guardedPlaywrightRuntimes.set(guardedPlaywright, guardedPlaywright)
  rawGuardedValues.set(guardedPlaywright, playwright)
  return guardedPlaywright
}

type PlaywrightExpect = typeof playwrightExpect

const guardedExpectFacades = new WeakMap<object, PlaywrightExpect>()
const EXPECT_CHAIN_PROPERTIES = new Set(['not', 'rejects', 'resolves'])
const PLAYWRIGHT_WEB_FIRST_MATCHERS = new Set([
  'toBeAttached',
  'toBeChecked',
  'toBeDisabled',
  'toBeEditable',
  'toBeEmpty',
  'toBeEnabled',
  'toBeFocused',
  'toBeHidden',
  'toBeInViewport',
  'toBeOK',
  'toBeVisible',
  'toContainClass',
  'toContainText',
  'toHaveAccessibleDescription',
  'toHaveAccessibleErrorMessage',
  'toHaveAccessibleName',
  'toHaveAttribute',
  'toHaveClass',
  'toHaveCount',
  'toHaveCSS',
  'toHaveId',
  'toHaveJSProperty',
  'toHaveRole',
  'toHaveText',
  'toHaveTitle',
  'toHaveURL',
  'toHaveValue',
  'toHaveValues',
])
const DENIED_DIAGNOSTIC_MATCHERS = new Set([
  'toHaveScreenshot',
  'toMatchAriaSnapshot',
  'toMatchSnapshot',
])

function denyExpectExtension(): never {
  throw new Error('The guarded Playwright expect facade does not permit custom matcher extensions')
}

function denyExpectMutation(): never {
  throw new Error('The guarded Playwright expect facade is immutable')
}

type MatcherFactory = (useRawActual: boolean) => object
const assertionSafeViews = new WeakMap<object, object>()

function genericAssertionValue(value: unknown): unknown {
  if (value instanceof Promise) return value.then(genericAssertionValue)
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return value
  if (!rawGuardedValues.has(value)) return value
  const existing = assertionSafeViews.get(value)
  if (existing) return existing

  const target = Object.create(null) as object
  const view = new Proxy(target, {
    defineProperty: denyExpectMutation,
    deleteProperty: denyExpectMutation,
    get(_target, property) {
      if (property === '_apiName') return undefined
      if (typeof property === 'string' && property.startsWith('_')) return denyExpectExtension()
      return Reflect.get(value, property, value)
    },
    getOwnPropertyDescriptor(_target, property) {
      if (typeof property === 'string' && property.startsWith('_')) return undefined
      return {
        configurable: true,
        enumerable: true,
        value: Reflect.get(value, property, value),
        writable: false,
      }
    },
    getPrototypeOf: () => null,
    ownKeys() {
      return Reflect.ownKeys(value).filter(key => typeof key !== 'string' || !key.startsWith('_'))
    },
    preventExtensions: denyExpectMutation,
    set: denyExpectMutation,
    setPrototypeOf: denyExpectMutation,
  })
  assertionSafeViews.set(value, view)
  return view
}

function createClosedMatcherFacade(
  matcherFactory: MatcherFactory,
  chain: readonly string[] = []
): object {
  const matcherAtChain = (useRawActual: boolean): object => {
    let matcher = matcherFactory(useRawActual)
    for (const property of chain) matcher = Reflect.get(matcher, property, matcher) as object
    return matcher
  }
  const target = Object.create(null) as object
  let facade: object
  const facadeValue = (property: PropertyKey): unknown => {
    if (typeof property === 'string' && property.startsWith('_')) return denyExpectExtension()
    if (typeof property === 'string' && EXPECT_CHAIN_PROPERTIES.has(property)) {
      return createClosedMatcherFacade(matcherFactory, [...chain, property])
    }
    if (typeof property === 'string' && DENIED_DIAGNOSTIC_MATCHERS.has(property)) {
      return denyExpectExtension
    }
    const useRawActual = typeof property === 'string' && PLAYWRIGHT_WEB_FIRST_MATCHERS.has(property)
    const matcher = matcherAtChain(useRawActual)
    const value = Reflect.get(matcher, property, matcher)
    if (typeof value !== 'function') return value
    return (...args: unknown[]) => Reflect.apply(value, matcher, args)
  }
  facade = new Proxy(target, {
    defineProperty: denyExpectMutation,
    deleteProperty: denyExpectMutation,
    get(_target, property) {
      return facadeValue(property)
    },
    getOwnPropertyDescriptor(_target, property) {
      return {
        configurable: true,
        enumerable: true,
        value: facadeValue(property),
        writable: false,
      }
    },
    getPrototypeOf: () => null,
    preventExtensions: denyExpectMutation,
    set: denyExpectMutation,
    setPrototypeOf: denyExpectMutation,
  })
  return facade
}

function createClosedGuardedExpect(expectImplementation: PlaywrightExpect): PlaywrightExpect {
  const existing = guardedExpectFacades.get(expectImplementation)
  if (existing) return existing

  const callExpect = ((actual: unknown, ...remaining: unknown[]) =>
    createClosedMatcherFacade(useRawActual => {
      let selectedActual = actual
      if (useRawActual) {
        selectedActual = rawPlaywrightValue(actual)
        if (actual instanceof Promise) {
          selectedActual = actual.then(rawPlaywrightValue)
        }
      } else {
        selectedActual = genericAssertionValue(actual)
      }
      return Reflect.apply(expectImplementation, undefined, [
        selectedActual,
        ...remaining,
      ]) as object
    })) as PlaywrightExpect

  let guardedExpect: PlaywrightExpect
  const facadeValue = (property: PropertyKey): unknown => {
    if (typeof property === 'string' && property.startsWith('_')) return denyExpectExtension()
    if (property === 'extend') return denyExpectExtension
    if (property === 'soft') {
      return createClosedGuardedExpect(
        Reflect.get(expectImplementation, property, expectImplementation) as PlaywrightExpect
      )
    }
    if (property === 'configure') {
      return (...args: unknown[]) =>
        createClosedGuardedExpect(
          Reflect.apply(
            Reflect.get(expectImplementation, property, expectImplementation),
            expectImplementation,
            args
          ) as PlaywrightExpect
        )
    }
    if (property === 'poll') {
      return (callback: () => unknown, ...args: unknown[]) =>
        createClosedMatcherFacade(
          useRawActual =>
            Reflect.apply(
              Reflect.get(expectImplementation, property, expectImplementation),
              expectImplementation,
              [
                useRawActual
                  ? async () => rawPlaywrightValue(await callback())
                  : async () => genericAssertionValue(await callback()),
                ...args,
              ]
            ) as object
        )
    }

    const ownValue = Reflect.get(callExpect, property, callExpect)
    if (ownValue !== undefined) return ownValue
    const value = Reflect.get(expectImplementation, property, expectImplementation)
    if (typeof value === 'function') {
      return () => {
        throw new Error(
          `Playwright expect.${String(property)} is not exposed by the guarded facade`
        )
      }
    }
    return value
  }

  guardedExpect = new Proxy(callExpect, {
    apply(_target, _thisArg, args: unknown[]) {
      return Reflect.apply(callExpect, undefined, args)
    },
    defineProperty: denyExpectMutation,
    deleteProperty: denyExpectMutation,
    get(_target, property) {
      return facadeValue(property)
    },
    getOwnPropertyDescriptor(target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property)
      if (descriptor && !descriptor.configurable) return descriptor
      const value = facadeValue(property)
      return {
        configurable: true,
        enumerable: property === 'soft' || property === 'configure' || property === 'poll',
        value,
        writable: false,
      }
    },
    getPrototypeOf: () => null,
    preventExtensions: denyExpectMutation,
    set: denyExpectMutation,
    setPrototypeOf: denyExpectMutation,
  }) as PlaywrightExpect
  guardedExpectFacades.set(expectImplementation, guardedExpect)
  guardedExpectFacades.set(guardedExpect, guardedExpect)
  return guardedExpect
}

// This closed adapter is the only assertion boundary exported to E2E code.
// Raw guarded values remain lexical to this module and custom matchers are denied.
export const guardedExpect = createClosedGuardedExpect(playwrightExpect)

export type { BrowserContextOptions, GuardCallbacks, PlaywrightRuntime }
