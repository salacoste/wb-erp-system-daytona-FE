import { test as base } from '@playwright/test'
import type { APIRequestContext, Browser, BrowserContext, Page } from '@playwright/test'

import {
  createGuardedApiRequestContext,
  createGuardedBrowser,
  createGuardedBrowserContext,
  createGuardedPage,
  createGuardedPlaywright,
  createGuardedTestUse,
  guardedExpect,
  installPlaywrightContextNetworkGuard,
} from './playwright-network-guard'
import type { GuardCallbacks, PlaywrightRuntime } from './playwright-network-guard'
import { assertAllowedTestUrl } from '../../test-utils/outbound-network-policy'

type NetworkSnapshot = {
  allowed: number
  denied: number
  unexpected: number
}

type NetworkGuard = {
  expectDenied(action: () => Promise<void>): Promise<void>
  snapshot(): NetworkSnapshot
}

type NetworkState = NetworkSnapshot & {
  expected: number
}

type NetworkFixtures = {
  networkGuard: NetworkGuard
  networkState: NetworkState
}

type FixtureValues = Record<string, unknown> & {
  browser?: Browser
  context?: BrowserContext
  page?: Page
  playwright?: PlaywrightRuntime
  request?: APIRequestContext
}

const USER_FIXTURE_KEYS = new Set([
  'browser',
  'context',
  'isMobile',
  'networkGuard',
  'page',
  'playwright',
  'request',
])

let activeNetworkState: NetworkState | undefined
const guardedTestInfos = new WeakMap<object, object>()

function requireNetworkState(): NetworkState {
  if (!activeNetworkState) throw new Error('Playwright network guard state is not active')
  return activeNetworkState
}

function denyTestFacadeAccess(): never {
  throw new Error('The shared guarded Playwright test facade denied this runtime surface')
}

function createGuardedAnnotations(rawAnnotations: unknown[]): object {
  return Object.freeze({
    push(...items: unknown[]): number {
      for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) denyTestFacadeAccess()
        const descriptors = Object.getOwnPropertyDescriptors(item)
        const keys = Object.keys(descriptors)
        if (
          keys.some(key => key !== 'type' && key !== 'description') ||
          keys.some(key => !('value' in descriptors[key]))
        ) {
          denyTestFacadeAccess()
        }
        const type = descriptors.type?.value
        const description = descriptors.description?.value
        if (type !== 'note') denyTestFacadeAccess()
        if (description !== undefined && typeof description !== 'string') denyTestFacadeAccess()
        rawAnnotations.push({
          type,
          ...(description === undefined ? {} : { description: 'sanitized test diagnostic note' }),
        })
      }
      return rawAnnotations.length
    },
  })
}

function createGuardedTestInfo(rawInfo: unknown): object {
  if (!rawInfo || typeof rawInfo !== 'object') denyTestFacadeAccess()
  const existing = guardedTestInfos.get(rawInfo)
  if (existing) return existing
  const info = rawInfo as {
    annotations?: unknown[]
    project?: { name?: unknown; use?: { baseURL?: unknown } }
  }
  const annotations = createGuardedAnnotations(info.annotations ?? [])
  const baseURL = info.project?.use?.baseURL
  if (baseURL !== undefined) assertAllowedTestUrl(String(baseURL))
  const project = Object.freeze({
    name: typeof info.project?.name === 'string' ? info.project.name : '',
    use: Object.freeze({ baseURL }),
  })
  const target = Object.create(null) as object
  const facade = new Proxy(target, {
    defineProperty: denyTestFacadeAccess,
    deleteProperty: denyTestFacadeAccess,
    get(_target, property) {
      if (property === 'annotations') return annotations
      if (property === 'project') return project
      return denyTestFacadeAccess()
    },
    getOwnPropertyDescriptor(_target, property) {
      if (property !== 'annotations' && property !== 'project') return undefined
      return {
        configurable: true,
        enumerable: true,
        value: property === 'annotations' ? annotations : project,
        writable: false,
      }
    },
    getPrototypeOf: () => null,
    preventExtensions: denyTestFacadeAccess,
    set: denyTestFacadeAccess,
    setPrototypeOf: denyTestFacadeAccess,
  })
  guardedTestInfos.set(rawInfo, facade)
  return facade
}

const callbacks: GuardCallbacks = {
  onAllowed() {
    requireNetworkState().allowed += 1
  },
  onDenied() {
    const state = requireNetworkState()
    state.denied += 1
    if (state.expected > 0) state.expected -= 1
    else state.unexpected += 1
  },
}

const networkTest = base.extend<NetworkFixtures>({
  networkState: [
    async ({}, use) => {
      const state = { allowed: 0, denied: 0, unexpected: 0, expected: 0 }
      if (activeNetworkState) throw new Error('Playwright network guard state leaked across tests')
      activeNetworkState = state
      try {
        await use(state)
        if (state.unexpected > 0) {
          throw new Error(
            `Playwright network guard blocked ${state.unexpected} unexpected non-local request(s)`
          )
        }
      } finally {
        activeNetworkState = undefined
      }
    },
    { auto: true },
  ],
  networkGuard: [
    async ({ context, networkState }, use) => {
      await installPlaywrightContextNetworkGuard(context, callbacks.onDenied, callbacks.onAllowed)

      await use({
        async expectDenied(action) {
          const before = networkState.denied
          networkState.expected += 1
          try {
            await action()
          } finally {
            if (networkState.denied !== before + 1 || networkState.expected !== 0) {
              networkState.expected = 0
              throw new Error('Expected exactly one fail-before-I/O network denial')
            }
          }
        },
        snapshot() {
          return {
            allowed: networkState.allowed,
            denied: networkState.denied,
            unexpected: networkState.unexpected,
          }
        },
      })
    },
    { auto: true },
  ],
})

export function createGuardedUserFixtureCallback(callback: unknown): unknown {
  if (typeof callback !== 'function') return callback
  const guardedCallback = async function (
    this: unknown,
    fixtureValues: FixtureValues,
    ...remaining: unknown[]
  ) {
    const fixtureKeys = Reflect.ownKeys(fixtureValues)
    if (
      fixtureKeys.some(
        key => typeof key !== 'string' || key.startsWith('_') || !USER_FIXTURE_KEYS.has(key)
      )
    ) {
      denyTestFacadeAccess()
    }
    const guardedValues = Object.fromEntries(
      fixtureKeys.map(key => [key, Reflect.get(fixtureValues, key, fixtureValues)])
    ) as FixtureValues
    if (fixtureValues.playwright) {
      guardedValues.playwright = createGuardedPlaywright(fixtureValues.playwright, callbacks)
    }
    if (fixtureValues.browser) {
      guardedValues.browser = createGuardedBrowser(fixtureValues.browser, callbacks)
    }
    let guardedContext: BrowserContext | undefined
    if (fixtureValues.context) {
      guardedContext = await createGuardedBrowserContext(fixtureValues.context, callbacks)
      guardedValues.context = guardedContext
    }
    if (fixtureValues.page) {
      guardedContext ??= await createGuardedBrowserContext(fixtureValues.page.context(), callbacks)
      guardedValues.page = createGuardedPage(fixtureValues.page, guardedContext, callbacks)
    }
    if (fixtureValues.request) {
      guardedValues.request = createGuardedApiRequestContext(
        fixtureValues.request,
        callbacks.onDenied
      )
    }
    const guardedRemaining = [...remaining]
    if (guardedRemaining[0] && typeof guardedRemaining[0] === 'object') {
      guardedRemaining[0] = createGuardedTestInfo(guardedRemaining[0])
    }
    return Reflect.apply(callback, undefined, [guardedValues, ...guardedRemaining])
  }
  Object.defineProperty(guardedCallback, 'toString', {
    configurable: false,
    value: () => Function.prototype.toString.call(callback),
  })
  return guardedCallback
}

function wrapFixtureCallbackArgument(args: unknown[]): unknown[] {
  const callbackIndex = args.findLastIndex(argument => typeof argument === 'function')
  if (callbackIndex === -1) return args
  const guardedArgs = [...args]
  guardedArgs[callbackIndex] = createGuardedUserFixtureCallback(guardedArgs[callbackIndex])
  return guardedArgs
}

const USER_FIXTURE_REGISTRATION_METHODS = new Set([
  'afterAll',
  'afterEach',
  'beforeAll',
  'beforeEach',
  'fail',
  'fixme',
  'only',
  'skip',
])

const guardedRegistrationMethods = new Map<PropertyKey, (...args: unknown[]) => unknown>()
const guardedDescribeMethods = new WeakMap<object, (...args: unknown[]) => unknown>()
const closedTestCallables = new WeakMap<object, (...args: never[]) => unknown>()
const denyTestFacadeMutation = () => {
  throw new Error('The shared guarded Playwright test facade is immutable')
}
const denyTestExtension = () => {
  throw new Error('Use the shared guarded Playwright fixtures; test.extend is not permitted')
}

function closeTestCallable<T extends (...args: never[]) => unknown>(callable: T): T {
  const existing = closedTestCallables.get(callable)
  if (existing) return existing as unknown as T
  const closed = new Proxy(callable, {
    defineProperty: denyTestFacadeMutation,
    deleteProperty: denyTestFacadeMutation,
    get(target, property) {
      if (property === 'length' || property === 'name') return Reflect.get(target, property)
      if (
        typeof property === 'symbol' ||
        property === '$$typeof' ||
        property === 'asymmetricMatch' ||
        property === 'toJSON'
      ) {
        return undefined
      }
      return denyTestFacadeAccess()
    },
    getOwnPropertyDescriptor(target, property) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property)
      if (descriptor && !descriptor.configurable) return descriptor
      return undefined
    },
    getPrototypeOf: () => null,
    preventExtensions: denyTestFacadeMutation,
    set: denyTestFacadeMutation,
    setPrototypeOf: denyTestFacadeMutation,
  })
  closedTestCallables.set(callable, closed)
  closedTestCallables.set(closed, closed)
  return closed
}

const guardedUse = closeTestCallable(createGuardedTestUse(networkTest.use, networkTest))

function createGuardedDescribe(
  rawDescribe: (...args: unknown[]) => unknown
): (...args: unknown[]) => unknown {
  const existing = guardedDescribeMethods.get(rawDescribe)
  if (existing) return existing
  const callDescribe = (...args: unknown[]) => Reflect.apply(rawDescribe, networkTest, args)
  const allowedProperties = new Set(['configure', 'fixme', 'only', 'parallel', 'serial', 'skip'])
  let guardedDescribe: (...args: unknown[]) => unknown
  guardedDescribe = new Proxy(callDescribe, {
    defineProperty: denyTestFacadeMutation,
    deleteProperty: denyTestFacadeMutation,
    get(_target, property) {
      if (property === 'length' || property === 'name') return Reflect.get(callDescribe, property)
      if (typeof property !== 'string' || !allowedProperties.has(property)) {
        return denyTestFacadeAccess()
      }
      const value: unknown = Reflect.get(rawDescribe, property, rawDescribe)
      if (typeof value !== 'function') return denyTestFacadeAccess()
      return createGuardedDescribe(value as (...args: unknown[]) => unknown)
    },
    getOwnPropertyDescriptor(target, property): PropertyDescriptor | undefined {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property)
      if (descriptor && !descriptor.configurable) return descriptor
      const value = Reflect.get(guardedDescribe, property, guardedDescribe)
      return { configurable: true, enumerable: true, value, writable: false }
    },
    getPrototypeOf: () => null,
    preventExtensions: denyTestFacadeMutation,
    set: denyTestFacadeMutation,
    setPrototypeOf: denyTestFacadeMutation,
  })
  guardedDescribeMethods.set(rawDescribe, guardedDescribe)
  guardedDescribeMethods.set(guardedDescribe, guardedDescribe)
  return guardedDescribe
}

let guardedTestFacade: typeof networkTest
const testCall = ((...args: unknown[]) =>
  Reflect.apply(networkTest, networkTest, wrapFixtureCallbackArgument(args))) as typeof networkTest

function testFacadeValue(property: PropertyKey): unknown {
  if (typeof property === 'string' && property.startsWith('_')) {
    throw new Error('Private Playwright test runtime access is not permitted')
  }
  if (property === 'extend') return closeTestCallable(denyTestExtension)
  if (property === 'use') return guardedUse
  if (property === 'test') return guardedTestFacade
  if (property === 'info') {
    return closeTestCallable(() => createGuardedTestInfo(networkTest.info()))
  }
  if (property === 'describe') {
    return createGuardedDescribe(networkTest.describe as (...args: unknown[]) => unknown)
  }
  if (property === 'setTimeout') {
    const value = Reflect.get(networkTest, property, networkTest)
    return closeTestCallable((...args: unknown[]) => Reflect.apply(value, networkTest, args))
  }
  if (property === 'slow') {
    const value = Reflect.get(networkTest, property, networkTest)
    return closeTestCallable((...args: unknown[]) =>
      Reflect.apply(value, networkTest, wrapFixtureCallbackArgument(args))
    )
  }
  if (property === 'length' || property === 'name') return Reflect.get(testCall, property)

  const value = Reflect.get(networkTest, property, networkTest)
  if (
    typeof value === 'function' &&
    typeof property === 'string' &&
    USER_FIXTURE_REGISTRATION_METHODS.has(property)
  ) {
    const existing = guardedRegistrationMethods.get(property)
    if (existing) return existing
    const guardedRegistration = closeTestCallable((...args: unknown[]) =>
      Reflect.apply(value, networkTest, wrapFixtureCallbackArgument(args))
    )
    guardedRegistrationMethods.set(property, guardedRegistration)
    return guardedRegistration
  }
  return denyTestFacadeAccess()
}

guardedTestFacade = new Proxy(testCall, {
  apply(_target, _thisArg, args: unknown[]) {
    return Reflect.apply(testCall, undefined, args)
  },
  defineProperty: denyTestFacadeMutation,
  deleteProperty: denyTestFacadeMutation,
  get(_target, property) {
    return testFacadeValue(property)
  },
  getOwnPropertyDescriptor(target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, property)
    if (descriptor && !descriptor.configurable) return descriptor
    return {
      configurable: true,
      enumerable: true,
      value: testFacadeValue(property),
      writable: false,
    }
  },
  getPrototypeOf: () => null,
  preventExtensions: denyTestFacadeMutation,
  set: denyTestFacadeMutation,
  setPrototypeOf: denyTestFacadeMutation,
}) as typeof networkTest

export const test = guardedTestFacade

export const expect = guardedExpect

export type * from '@playwright/test'
