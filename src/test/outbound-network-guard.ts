import {
  assertAllowedTestUrl,
  networkPolicyDeniedError,
} from '../../test-utils/outbound-network-policy'
import { installNodeOutboundNetworkGuard } from './outbound-node-network-guard'

type FetchTransport = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
type UrlConstructor = new (url: string | URL, ...args: never[]) => unknown
type XhrOpen = (
  this: XMLHttpRequest,
  method: string,
  url: string | URL,
  ...args: unknown[]
) => unknown

const GUARDED = Symbol.for('epic128.frontend.test-network-guard.guarded')

function markGuarded<T extends object>(value: T): T {
  Object.defineProperty(value, GUARDED, { value: true })
  return value
}

function isGuarded(value: unknown): boolean {
  return Boolean((value as { [GUARDED]?: true } | undefined)?.[GUARDED])
}

function canonicalFetchInput(input: string | URL | Request): {
  input: string | Request
  target: string
} {
  try {
    if (typeof input === 'string') return { input, target: input }
    if (input instanceof URL) {
      const target = URL.prototype.toString.call(input)
      return { input: target, target }
    }
    if (input instanceof Request) {
      const canonicalRequest = new Request(input)
      const target = Reflect.getOwnPropertyDescriptor(Request.prototype, 'url')?.get?.call(
        canonicalRequest
      ) as unknown
      if (typeof target !== 'string') throw networkPolicyDeniedError()
      return { input: canonicalRequest, target }
    }
  } catch {
    throw networkPolicyDeniedError()
  }
  throw networkPolicyDeniedError()
}

export function createGuardedFetch(transport: FetchTransport): FetchTransport {
  return markGuarded(async (input, init) => {
    const canonical = canonicalFetchInput(input)
    assertAllowedTestUrl(canonical.target)
    return transport(canonical.input, { ...init, redirect: 'manual' })
  })
}

export function createGuardedConstructor<T extends UrlConstructor>(
  Transport: T,
  _transportName: string
): T {
  return markGuarded(
    new Proxy(Transport, {
      construct() {
        // Browser-managed streaming transports can follow redirects internally.
        // Vitest therefore denies them entirely instead of allowing a redirect escape.
        throw networkPolicyDeniedError()
      },
    })
  )
}

export function createGuardedXmlHttpRequestOpen(_transport: XhrOpen): XhrOpen {
  return markGuarded(function () {
    // XHR redirects are performed below the JavaScript open() seam.
    throw networkPolicyDeniedError()
  })
}

function guardXmlHttpRequest(): void {
  if (typeof XMLHttpRequest === 'undefined' || isGuarded(XMLHttpRequest.prototype.open)) return
  XMLHttpRequest.prototype.open = createGuardedXmlHttpRequestOpen(
    XMLHttpRequest.prototype.open as XhrOpen
  ) as typeof XMLHttpRequest.prototype.open
}

function guardBrowserConstructors(): void {
  if (typeof WebSocket !== 'undefined' && !isGuarded(WebSocket)) {
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: createGuardedConstructor(WebSocket as unknown as UrlConstructor, 'WebSocket'),
    })
  }
  if (typeof EventSource !== 'undefined' && !isGuarded(EventSource)) {
    Object.defineProperty(globalThis, 'EventSource', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: createGuardedConstructor(EventSource as unknown as UrlConstructor, 'EventSource'),
    })
  }
}

export function installOutboundNetworkGuard(): void {
  if (typeof fetch === 'function' && !isGuarded(fetch)) {
    globalThis.fetch = createGuardedFetch(fetch.bind(globalThis))
  }
  guardXmlHttpRequest()
  guardBrowserConstructors()
  installNodeOutboundNetworkGuard()
}
