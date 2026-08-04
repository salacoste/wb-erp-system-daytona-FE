import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { request as esmHttpRequest } from 'node:http'
import { connect as esmHttp2Connect } from 'node:http2'
import { connect as esmNetConnect } from 'node:net'
import { Socket } from 'node:net'
import { Socket as DgramSocket } from 'node:dgram'
import { lookup as esmDnsLookup, Resolver, setServers as esmDnsSetServers } from 'node:dns'
import { Resolver as PromisesResolver } from 'node:dns/promises'
import * as callbackDns from 'node:dns'
import * as promiseDns from 'node:dns/promises'
import { Worker as EsmWorker } from 'node:worker_threads'

import { assertAllowedTestUrl, TEST_NETWORK_POLICY } from '../../test-utils/outbound-network-policy'
import { MODULE_EVALUATION_NETWORK_GUARD_VERIFIED } from './fixtures/module-evaluation-network-attempt'
import {
  createGuardedConstructor,
  createGuardedFetch,
  createGuardedXmlHttpRequestOpen,
} from './outbound-network-guard'
import {
  createGuardedDnsResolution,
  createDeniedNodeConstructor,
  createDeniedNodeTransport,
  createDeniedDnsSetServers,
  createDeniedUdpTransport,
  createGuardedNodeRequest,
  createGuardedSocketConnect,
} from './outbound-node-network-guard'

describe('Story 128.10 outbound test policy', () => {
  it('is versioned and contains only explicit local/test-container hosts', () => {
    expect(TEST_NETWORK_POLICY.schemaVersion).toBe('epic128-test-network-policy/v1')
    expect(TEST_NETWORK_POLICY.allowedHosts).toEqual([
      'localhost',
      '127.0.0.1',
      '::1',
      'host.docker.internal',
      'postgres',
      'redis',
    ])
    expect(TEST_NETWORK_POLICY.allowUnixSockets).toBe(false)
  })

  it.each([
    'http://localhost:3000/health',
    'https://127.0.0.1/api',
    'ws://[::1]:3100/socket',
    'wss://host.docker.internal/socket',
    'http://postgres:5432/',
    'http://redis:6379/',
    '/v1/local-api',
  ])('allows local request target %s', target => {
    expect(() => assertAllowedTestUrl(target)).not.toThrow()
  })

  it.each([
    'https://example.invalid/collect',
    'https://wildberries.ru/',
    'ftp://localhost/file',
    'file:///tmp/private',
    'http://user:password@localhost/private',
    'not a valid URL',
  ])('rejects non-local, unsupported, credentialed, or malformed target %s', target => {
    expect(() => assertAllowedTestUrl(target)).toThrow(/outbound test request denied/i)
  })
})

describe('fail-before-I/O transport wrappers', () => {
  it('boots the guard before module-evaluation and general/MSW setup imports', () => {
    const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
    expect((esmHttpRequest as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    expect((esmNetConnect as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    expect((esmDnsLookup as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    expect((esmHttp2Connect as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    expect((EsmWorker as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    expect(MODULE_EVALUATION_NETWORK_GUARD_VERIFIED).toEqual({
      externalRequestDenied: true,
      namedConnectGuarded: true,
      namedLookupGuarded: true,
      namedRequestGuarded: true,
    })
    const configSource = readFileSync('vitest.config.ts', 'utf8')
    const setupEntries = [
      './src/test/network-guard-bootstrap.ts',
      './src/test/fixtures/module-evaluation-network-attempt.ts',
      './src/test/localStorage-polyfill.ts',
      './src/test/setup.ts',
    ]
    const setupIndexes = setupEntries.map(entry => configSource.indexOf(`'${entry}'`))
    expect(setupIndexes.every(index => index >= 0)).toBe(true)
    expect(setupIndexes).toEqual([...setupIndexes].sort((left, right) => left - right))
    expect(configSource).toMatch(/setupFiles:\s*\[\.\.\.VITEST_SETUP_FILES\]/)
    expect(configSource).toMatch(/sequence:\s*{\s*setupFiles:\s*'list'/)
    const playwrightConfigSource = readFileSync('playwright.config.ts', 'utf8')
    expect(playwrightConfigSource.indexOf("import './src/test/network-guard-bootstrap'")).toBe(0)
    expect(playwrightConfigSource.indexOf("from '@playwright/test'")).toBeGreaterThan(
      playwrightConfigSource.indexOf("import './src/test/network-guard-bootstrap'")
    )
  })

  it('rejects fetch before invoking the underlying transport', async () => {
    const transport = vi.fn()
    const guardedFetch = createGuardedFetch(transport)

    await expect(guardedFetch('https://example.invalid/private')).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(transport).not.toHaveBeenCalled()
  })

  it('allows relative fetch through the configured local origin', async () => {
    const transport = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const guardedFetch = createGuardedFetch(transport)

    await expect(guardedFetch('/health')).resolves.toHaveProperty('status', 204)
    expect(transport).toHaveBeenCalledOnce()
  })

  it('forces manual redirects and never follows a local response to a non-local target', async () => {
    const redirectResponse = new Response(null, {
      status: 302,
      headers: { location: 'https://example.invalid/redirect-target' },
    })
    const transport = vi.fn().mockResolvedValue(redirectResponse)
    const guardedFetch = createGuardedFetch(transport)

    await expect(
      guardedFetch('http://localhost:3100/redirect', { redirect: 'follow' })
    ).resolves.toBe(redirectResponse)
    expect(transport).toHaveBeenCalledOnce()
    expect(transport).toHaveBeenCalledWith('http://localhost:3100/redirect', {
      redirect: 'manual',
    })

    await expect(guardedFetch('https://example.invalid/direct')).rejects.toThrow(
      /outbound test request denied/i
    )
    expect(transport).toHaveBeenCalledOnce()
  })

  it('canonicalizes URL and Request subclasses before fetch transport', async () => {
    class OverriddenUrl extends URL {
      override toString(): string {
        return 'https://example.invalid/url-subclass'
      }
    }
    class OverriddenRequest extends Request {
      override get url(): string {
        return 'http://localhost:3100/request-subclass'
      }
    }
    const transport = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    const guardedFetch = createGuardedFetch(transport)
    const localUrl = new OverriddenUrl('http://localhost:3100/url-subclass')

    await expect(guardedFetch(localUrl)).resolves.toHaveProperty('status', 204)
    expect(transport).toHaveBeenCalledWith('http://localhost:3100/url-subclass', {
      redirect: 'manual',
    })

    const externalRequest = new OverriddenRequest('https://example.invalid/request-subclass')
    await expect(guardedFetch(externalRequest)).rejects.toThrow(/outbound test request denied/i)
    expect(transport).toHaveBeenCalledOnce()
  })

  it.each(['/health', 'https://example.invalid/private'])(
    'rejects XMLHttpRequest target %s before invoking open',
    target => {
      const transport = vi.fn()
      const guardedOpen = createGuardedXmlHttpRequestOpen(transport)
      const receiver = {} as XMLHttpRequest

      expect(() => guardedOpen.call(receiver, 'GET', target)).toThrow(
        /outbound test request denied/i
      )
      expect(transport).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['WebSocket', 'ws://localhost:3100/socket'],
    ['WebSocket', 'wss://example.invalid/socket'],
    ['EventSource', 'http://localhost:3100/events'],
    ['EventSource', 'https://example.invalid/events'],
  ])('%s rejects redirect-capable target %s before constructor I/O', (transportName, target) => {
    const transport = vi.fn()
    const GuardedTransport = createGuardedConstructor(transport, transportName)

    expect(() => new GuardedTransport(target)).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it('uses the effective Node request destination after options overrides', () => {
    const transport = vi.fn()
    const guardedRequest = createGuardedNodeRequest('http:', transport)

    expect(() =>
      guardedRequest('http://localhost/health', {
        hostname: 'example.invalid',
        port: 80,
      })
    ).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it('allows Node request overloads whose effective destination is local', () => {
    const result = { end: vi.fn() }
    const transport = vi.fn(() => result)
    const guardedRequest = createGuardedNodeRequest('https:', transport)

    expect(guardedRequest({ hostname: 'localhost', port: 3443, path: '/health' })).toBe(result)
    expect(transport).toHaveBeenCalledOnce()
  })

  it.each([
    ['http URL overload', 'http:', ['http://localhost/health', { lookup: vi.fn() }]],
    ['https options overload', 'https:', [{ hostname: 'localhost', lookup: vi.fn() }]],
  ] as const)(
    'rejects custom lookup for the %s before request transport',
    (_name, protocol, args) => {
      const transport = vi.fn()
      const guardedRequest = createGuardedNodeRequest(protocol, transport)

      expect(() => guardedRequest(...args)).toThrow(/outbound test request denied/i)
      expect(transport).not.toHaveBeenCalled()
    }
  )

  it.each([
    ['credentialed URL', ['http://user:password@localhost/private']],
    ['URL auth override', ['http://localhost/private', { auth: 'user:password' }]],
    ['options auth', [{ hostname: 'localhost', auth: 'user:password' }]],
  ] as const)('rejects Node request %s before transport', (_name, args) => {
    const transport = vi.fn()
    const guardedRequest = createGuardedNodeRequest('http:', transport)

    expect(() => guardedRequest(...args)).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it.each([
    ['custom connection factory', { hostname: 'localhost', createConnection: vi.fn() }],
    ['custom agent', { hostname: 'localhost', agent: { addRequest: vi.fn() } }],
    ['custom default agent', { hostname: 'localhost', _defaultAgent: { addRequest: vi.fn() } }],
  ])('rejects Node request %s before transport', (_name, options) => {
    const transport = vi.fn()
    const guardedRequest = createGuardedNodeRequest('http:', transport)

    expect(() => guardedRequest(options)).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it('copies URL inputs through built-in URL state without evaluating overridden accessors', () => {
    const transport = vi.fn(() => ({ end: vi.fn() }))
    const guardedRequest = createGuardedNodeRequest('http:', transport)
    const hostnameGetter = vi.fn(() => 'example.invalid')
    const target = new URL('http://localhost:3100/health')
    Object.defineProperty(target, 'hostname', { configurable: true, get: hostnameGetter })

    expect(guardedRequest(target)).toEqual({ end: expect.any(Function) })
    expect(hostnameGetter).not.toHaveBeenCalled()
    expect(transport).toHaveBeenCalledOnce()
  })

  it('rejects nested accessors and custom coercion without evaluating user code', () => {
    const transport = vi.fn()
    const guardedRequest = createGuardedNodeRequest('http:', transport)
    const headerGetter = vi.fn(() => 'runtime-value')
    const headers = {} as Record<string, unknown>
    Object.defineProperty(headers, 'x-runtime', { enumerable: true, get: headerGetter })
    const coercion = vi.fn(() => 'localhost')

    expect(() => guardedRequest({ hostname: 'localhost', headers })).toThrow(
      /outbound test request denied/i
    )
    expect(() => guardedRequest({ hostname: { toString: coercion } })).toThrow(
      /outbound test request denied/i
    )
    expect(headerGetter).not.toHaveBeenCalled()
    expect(coercion).not.toHaveBeenCalled()
    expect(transport).not.toHaveBeenCalled()
  })

  it('rejects request option accessors without evaluating them', () => {
    const transport = vi.fn()
    const guardedRequest = createGuardedNodeRequest('http:', transport)
    const hostnameGetter = vi.fn(() => 'example.invalid')
    const options = { port: 80 } as Record<string, unknown>
    Object.defineProperty(options, 'hostname', { enumerable: true, get: hostnameGetter })

    expect(() => guardedRequest(options)).toThrow(/outbound test request denied/i)
    expect(hostnameGetter).not.toHaveBeenCalled()
    expect(transport).not.toHaveBeenCalled()
  })

  it('rejects non-local and Unix socket connections before transport', () => {
    const transport = vi.fn()
    const guardedConnect = createGuardedSocketConnect(transport)

    expect(() => guardedConnect({ host: 'example.invalid', port: 443 })).toThrow(
      /outbound test request denied/i
    )
    expect(() => guardedConnect('/tmp/frontend-test.sock')).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it('guards Socket.prototype.connect and denies before the native socket transport', () => {
    const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
    expect((Socket.prototype.connect as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    const socket = new Socket()
    try {
      expect(() => socket.connect({ host: 'example.invalid', port: 443 })).toThrow(
        /outbound test request denied/i
      )
      expect(socket.connecting).toBe(false)
      expect(socket.remoteAddress).toBeUndefined()
    } finally {
      socket.destroy()
    }
  })

  it('denies UDP connect and send before transport and installs both prototype guards', () => {
    const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
    const connect = vi.fn()
    const send = vi.fn()

    expect(() => createDeniedUdpTransport(connect)('203.0.113.10', 53)).toThrow(
      /outbound test request denied/i
    )
    expect(() => createDeniedUdpTransport(send)(new Uint8Array([1]), 53, '203.0.113.10')).toThrow(
      /outbound test request denied/i
    )
    expect(connect).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect((DgramSocket.prototype.connect as unknown as Record<symbol, unknown>)[guarded]).toBe(
      true
    )
    expect((DgramSocket.prototype.send as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
  })

  it('denies HTTP/2 sessions and fresh worker isolates before raw constructors or transports', () => {
    const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
    const rawConnect = vi.fn()
    const rawWorker = vi.fn()
    const deniedConnect = createDeniedNodeTransport(rawConnect)
    const DeniedWorker = createDeniedNodeConstructor(rawWorker)
    const RepeatedWorker = createDeniedNodeConstructor(rawWorker)

    expect(() => deniedConnect('https://example.invalid')).toThrow(/outbound test request denied/i)
    expect(() => new DeniedWorker('unguarded-test.js')).toThrow(/outbound test request denied/i)
    expect(rawConnect).not.toHaveBeenCalled()
    expect(rawWorker).not.toHaveBeenCalled()
    expect(RepeatedWorker).toBe(DeniedWorker)
    expect((rawWorker as unknown as Record<symbol, unknown>)[guarded]).toBeUndefined()
    expect(() => new RepeatedWorker('unguarded-test.js')).toThrow(/outbound test request denied/i)
    expect(rawWorker).not.toHaveBeenCalled()
  })

  it('allows local socket connections', () => {
    const transport = vi.fn(() => ({ destroy: vi.fn() }))
    const guardedConnect = createGuardedSocketConnect(transport)

    expect(guardedConnect({ host: '127.0.0.1', port: 3100 })).toEqual({
      destroy: expect.any(Function),
    })
    expect(transport).toHaveBeenCalledOnce()
  })

  it.each([
    ['net', { host: 'localhost', port: 3100, lookup: vi.fn() }],
    ['TLS', { host: 'localhost', port: 3443, lookup: vi.fn() }],
  ])('rejects custom lookup on %s socket options before transport', (_name, options) => {
    const transport = vi.fn()
    const guardedConnect = createGuardedSocketConnect(transport)

    expect(() => guardedConnect(options)).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it('rejects socket option accessors without evaluating them', () => {
    const transport = vi.fn()
    const guardedConnect = createGuardedSocketConnect(transport)
    const hostGetter = vi.fn(() => 'example.invalid')
    const options = { port: 3100 } as Record<string, unknown>
    Object.defineProperty(options, 'host', { enumerable: true, get: hostGetter })

    expect(() => guardedConnect(options)).toThrow(/outbound test request denied/i)
    expect(hostGetter).not.toHaveBeenCalled()
    expect(transport).not.toHaveBeenCalled()
  })

  it('denies all public DNS resolution before the underlying resolver', () => {
    const transport = vi.fn(() => 'resolved')
    const guardedResolve = createGuardedDnsResolution(transport)

    expect(() => guardedResolve('example.invalid', vi.fn())).toThrow(
      /outbound test request denied/i
    )
    expect(() => guardedResolve('localhost', vi.fn())).toThrow(/outbound test request denied/i)
    expect(transport).not.toHaveBeenCalled()
  })

  it('covers every Node 24 resolve method, including TLSA, on all DNS surfaces', () => {
    const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
    const surfaces = [
      callbackDns,
      promiseDns,
      Resolver.prototype,
      PromisesResolver.prototype,
    ] as Array<Record<PropertyKey, unknown>>
    for (const surface of surfaces) {
      for (const key of Reflect.ownKeys(surface)) {
        if (
          typeof key === 'string' &&
          (key === 'lookup' ||
            key === 'lookupService' ||
            key === 'reverse' ||
            key.startsWith('resolve')) &&
          typeof surface[key] === 'function'
        ) {
          expect((surface[key] as unknown as Record<symbol, unknown>)[guarded], key).toBe(true)
        }
      }
      const resolveTlsa = surface.resolveTlsa as
        ((hostname: string, callback?: (...args: unknown[]) => void) => unknown) | undefined
      expect(resolveTlsa, 'Node 24 resolveTlsa surface').toBeTypeOf('function')
      expect(() => resolveTlsa?.('localhost', vi.fn())).toThrow(/outbound test request denied/i)
    }
  })

  it('denies DNS resolver reconfiguration on module and Resolver surfaces before mutation', () => {
    const guarded = Symbol.for('epic128.frontend.test-network-guard.guarded')
    expect((esmDnsSetServers as unknown as Record<symbol, unknown>)[guarded]).toBe(true)
    expect((Resolver.prototype.setServers as unknown as Record<symbol, unknown>)[guarded]).toBe(
      true
    )
    expect(
      (PromisesResolver.prototype.setServers as unknown as Record<symbol, unknown>)[guarded]
    ).toBe(true)

    const callbackMutation = vi.fn()
    const promiseMutation = vi.fn()
    const callbackSetServers = createDeniedDnsSetServers(callbackMutation)
    const promiseSetServers = createDeniedDnsSetServers(promiseMutation)
    expect(() => callbackSetServers(['8.8.8.8'])).toThrow(/outbound test request denied/i)
    expect(() => promiseSetServers(['8.8.8.8'])).toThrow(/outbound test request denied/i)
    expect(callbackMutation).not.toHaveBeenCalled()
    expect(promiseMutation).not.toHaveBeenCalled()

    const callbackResolver = new Resolver()
    const promiseResolver = new PromisesResolver()
    expect(() => callbackResolver.setServers(['8.8.8.8'])).toThrow(/outbound test request denied/i)
    expect(() => promiseResolver.setServers(['8.8.8.8'])).toThrow(/outbound test request denied/i)

    const source = readFileSync('src/test/outbound-node-network-guard.ts', 'utf8')
    expect(source).toMatch(/installDnsGuards\(dns\)/)
    expect(source).toMatch(/installDnsGuards\(dns\.promises\)/)
    expect(source).toMatch(/installDnsGuards\(dns\.Resolver\.prototype\)/)
    expect(source).toMatch(/installDnsGuards\(dns\.promises\.Resolver\.prototype\)/)
  })
})
