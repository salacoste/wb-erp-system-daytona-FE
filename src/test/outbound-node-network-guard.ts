import { createRequire, syncBuiltinESMExports } from 'node:module'
import net from 'node:net'
import { urlToHttpOptions } from 'node:url'

import {
  assertAllowedSocketHost,
  assertAllowedTestUrl,
  networkPolicyDeniedError,
  TEST_NETWORK_POLICY,
} from '../../test-utils/outbound-network-policy'

type NodeRequest = (...args: unknown[]) => unknown
type Protocol = 'http:' | 'https:'

const require = createRequire(
  typeof __filename === 'string'
    ? __filename
    : `${process.cwd()}/src/test/outbound-node-network-guard.ts`
)
const http = require('node:http') as typeof import('node:http')
const https = require('node:https') as typeof import('node:https')
const nodeNet = require('node:net') as typeof import('node:net')
const tls = require('node:tls') as typeof import('node:tls')
const dns = require('node:dns') as typeof import('node:dns')
const dgram = require('node:dgram') as typeof import('node:dgram')
const http2 = require('node:http2') as typeof import('node:http2')
const workerThreads = require('node:worker_threads') as typeof import('node:worker_threads')
const GUARDED = Symbol.for('epic128.frontend.test-network-guard.guarded')
const deniedNodeConstructors = new WeakMap<Function, Function>()

function isOptions(value: unknown): value is import('node:http').RequestOptions {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function authorityUrl(protocol: string, rawHost: string, port: unknown): URL {
  const bracketedHost = net.isIP(rawHost) === 6 ? `[${rawHost}]` : rawHost
  const url = new URL(`${protocol}//${bracketedHost}/`)
  if (port !== undefined && port !== null && port !== '') url.port = String(port)
  return url
}

function snapshotDataValue(value: unknown, seen: WeakSet<object>): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value
  }
  if (typeof value !== 'object') throw networkPolicyDeniedError()

  const isArray = Array.isArray(value)
  const prototype = Reflect.getPrototypeOf(value)
  if (
    (!isArray && prototype !== Object.prototype && prototype !== null) ||
    (isArray && prototype !== Array.prototype) ||
    seen.has(value)
  ) {
    throw networkPolicyDeniedError()
  }

  seen.add(value)
  const snapshot: Record<PropertyKey, unknown> | unknown[] = isArray ? [] : Object.create(null)
  for (const property of Reflect.ownKeys(value)) {
    if (isArray && property === 'length') continue
    const descriptor = Reflect.getOwnPropertyDescriptor(value, property)
    if (!descriptor || !('value' in descriptor)) throw networkPolicyDeniedError()
    Reflect.defineProperty(snapshot, property, {
      ...descriptor,
      value: snapshotDataValue(descriptor.value, seen),
    })
  }
  if (isArray) {
    const length = Reflect.getOwnPropertyDescriptor(value, 'length')
    if (!length || !('value' in length) || typeof length.value !== 'number') {
      throw networkPolicyDeniedError()
    }
    snapshot.length = length.value
  }
  seen.delete(value)
  return snapshot
}

function snapshotDataOptions<T extends object>(options: T): T {
  return snapshotDataValue(options, new WeakSet()) as T
}

function rejectUnsafeRequestOptions(options: import('node:http').RequestOptions): void {
  if (
    'lookup' in options ||
    'auth' in options ||
    'agent' in options ||
    '_defaultAgent' in options ||
    'createConnection' in options
  ) {
    throw networkPolicyDeniedError()
  }
}

function normalizeNodeRequest(
  defaultProtocol: Protocol,
  args: readonly unknown[]
): { args: unknown[]; target: URL | null } {
  const input = args[0]
  let options: import('node:http').RequestOptions
  let callback: unknown

  if (input instanceof URL || typeof input === 'string') {
    let url: URL
    try {
      url = input instanceof URL ? new URL(URL.prototype.toString.call(input)) : new URL(input)
    } catch {
      throw networkPolicyDeniedError()
    }
    assertAllowedTestUrl(url)
    const overrides = isOptions(args[1]) ? snapshotDataOptions(args[1]) : undefined
    options = Object.assign(Object.create(null), urlToHttpOptions(url), overrides)
    callback = overrides ? args[2] : args[1]
  } else if (isOptions(input)) {
    options = snapshotDataOptions(input)
    callback = args[1]
  } else {
    throw networkPolicyDeniedError()
  }
  rejectUnsafeRequestOptions(options)

  if (options.socketPath) {
    if (!TEST_NETWORK_POLICY.allowUnixSockets) throw networkPolicyDeniedError()
    return { args: callback === undefined ? [options] : [options, callback], target: null }
  }
  const protocol = String(options.protocol ?? defaultProtocol)
  const host = String(options.hostname ?? options.host ?? 'localhost')
  return {
    args: callback === undefined ? [options] : [options, callback],
    target: authorityUrl(protocol, host, options.port),
  }
}

export function resolveNodeRequestTarget(
  defaultProtocol: Protocol,
  args: readonly unknown[]
): URL | null {
  return normalizeNodeRequest(defaultProtocol, args).target
}

export function createGuardedNodeRequest(
  protocol: Protocol,
  transport: NodeRequest,
  receiver?: unknown
): NodeRequest {
  if ((transport as NodeRequest & { [GUARDED]?: true })[GUARDED]) return transport
  const wrapped = function (this: unknown, ...args: unknown[]) {
    const normalized = normalizeNodeRequest(protocol, args)
    const target = normalized.target
    if (target) assertAllowedTestUrl(target)
    return Reflect.apply(transport, receiver === undefined ? this : receiver, normalized.args)
  } as NodeRequest & { [GUARDED]?: true }
  wrapped[GUARDED] = true
  return wrapped
}

function normalizeSocketRequest(args: readonly unknown[]): {
  args: unknown[]
  host: string | null
} {
  const input = args[0]
  if (typeof input === 'number') {
    return { args: [...args], host: typeof args[1] === 'string' ? args[1] : 'localhost' }
  }
  if (typeof input === 'string') {
    if (!TEST_NETWORK_POLICY.allowUnixSockets) throw networkPolicyDeniedError()
    return { args: [...args], host: null }
  }
  if (input && typeof input === 'object') {
    const options = snapshotDataOptions(input) as import('node:net').NetConnectOpts
    if ('lookup' in options) throw networkPolicyDeniedError()
    if ('path' in options && options.path) {
      if (!TEST_NETWORK_POLICY.allowUnixSockets) throw networkPolicyDeniedError()
      return { args: [options, ...args.slice(1)], host: null }
    }
    return {
      args: [options, ...args.slice(1)],
      host: 'host' in options && options.host ? String(options.host) : 'localhost',
    }
  }
  return { args: [...args], host: 'localhost' }
}

function guardFunction<T extends NodeRequest>(
  transport: T,
  guard: (args: unknown[]) => unknown[] | void
): T {
  if ((transport as T & { [GUARDED]?: true })[GUARDED]) return transport
  const wrapped = function (this: unknown, ...args: unknown[]) {
    const guardedArgs = guard(args)
    return Reflect.apply(transport, this, guardedArgs ?? args)
  } as T & { [GUARDED]?: true }
  wrapped[GUARDED] = true
  return wrapped
}

export function createGuardedSocketConnect(transport: NodeRequest): NodeRequest {
  return guardFunction(transport, args => {
    const normalized = normalizeSocketRequest(args)
    if (normalized.host) assertAllowedSocketHost(normalized.host)
    return normalized.args
  })
}

export function createDeniedUdpTransport(transport: NodeRequest): NodeRequest {
  return guardFunction(transport, () => {
    throw networkPolicyDeniedError()
  })
}

export const createDeniedNodeTransport = createDeniedUdpTransport

export function createDeniedNodeConstructor<T extends Function>(transport: T): T {
  const existing = deniedNodeConstructors.get(transport)
  if (existing) return existing as T
  const deny = () => {
    throw networkPolicyDeniedError()
  }
  const wrapped = new Proxy(transport, {
    apply: deny,
    construct: deny,
    get(target, property, receiver) {
      return property === GUARDED ? true : Reflect.get(target, property, receiver)
    },
  }) as T & { [GUARDED]?: true }
  deniedNodeConstructors.set(transport, wrapped)
  deniedNodeConstructors.set(wrapped, wrapped)
  return wrapped
}

function isDnsResolutionMethod(property: PropertyKey): property is string {
  return (
    typeof property === 'string' &&
    (property === 'lookup' ||
      property === 'lookupService' ||
      property === 'reverse' ||
      property.startsWith('resolve'))
  )
}

function installDnsGuards(owner: object): void {
  const methods = owner as Record<string, unknown>
  for (const method of Reflect.ownKeys(owner).filter(isDnsResolutionMethod)) {
    const transport = methods[method]
    if (typeof transport !== 'function') continue
    methods[method] = createGuardedDnsResolution(transport as NodeRequest)
  }
  if (typeof methods.setServers === 'function') {
    methods.setServers = createDeniedDnsSetServers(methods.setServers as NodeRequest)
  }
}

export function createGuardedDnsResolution(transport: NodeRequest): NodeRequest {
  return guardFunction(transport, () => {
    // Even a local hostname can make the platform resolver contact a non-local
    // configured server. Playwright/Vitest tests must use literal local IPs or
    // an already-guarded HTTP transport instead of public DNS APIs.
    throw networkPolicyDeniedError()
  })
}

export function createDeniedDnsSetServers(transport: NodeRequest): NodeRequest {
  return guardFunction(transport, () => {
    throw networkPolicyDeniedError()
  })
}

export function installNodeOutboundNetworkGuard(): void {
  http.request = createGuardedNodeRequest(
    'http:',
    http.request as NodeRequest,
    http
  ) as typeof http.request
  http.get = createGuardedNodeRequest('http:', http.get as NodeRequest, http) as typeof http.get
  https.request = createGuardedNodeRequest(
    'https:',
    https.request as NodeRequest,
    https
  ) as typeof https.request
  https.get = createGuardedNodeRequest(
    'https:',
    https.get as NodeRequest,
    https
  ) as typeof https.get

  nodeNet.connect = createGuardedSocketConnect(
    nodeNet.connect as NodeRequest
  ) as typeof nodeNet.connect
  nodeNet.createConnection = createGuardedSocketConnect(
    nodeNet.createConnection as NodeRequest
  ) as typeof nodeNet.createConnection
  nodeNet.Socket.prototype.connect = createGuardedSocketConnect(
    nodeNet.Socket.prototype.connect as NodeRequest
  ) as typeof nodeNet.Socket.prototype.connect
  tls.connect = createGuardedSocketConnect(tls.connect as NodeRequest) as typeof tls.connect
  dgram.Socket.prototype.connect = createDeniedUdpTransport(
    dgram.Socket.prototype.connect as NodeRequest
  ) as typeof dgram.Socket.prototype.connect
  dgram.Socket.prototype.send = createDeniedUdpTransport(
    dgram.Socket.prototype.send as NodeRequest
  ) as typeof dgram.Socket.prototype.send
  http2.connect = createDeniedNodeTransport(http2.connect as NodeRequest) as typeof http2.connect
  workerThreads.Worker = createDeniedNodeConstructor(workerThreads.Worker)
  installDnsGuards(dns)
  installDnsGuards(dns.promises)
  installDnsGuards(dns.Resolver.prototype)
  installDnsGuards(dns.promises.Resolver.prototype)
  syncBuiltinESMExports()
}
