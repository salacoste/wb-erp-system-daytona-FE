import type { Page, Route } from '@playwright/test'

export type Story1626RouteMode = 'data' | 'empty' | 'error' | 'retry' | 'deferred'

export type Story1626QueryRules = Readonly<{
  required?: Readonly<Record<string, RegExp>>
  optional?: Readonly<Record<string, RegExp>>
}>

export interface Story1626RouteContract {
  name: string
  path: string
  query?: Story1626QueryRules
  validate?: (url: URL) => void
  mode?: Story1626RouteMode
  data: unknown | ((url: URL, attempt: number) => unknown)
  empty?: unknown | ((url: URL, attempt: number) => unknown)
  error?: unknown | ((url: URL, attempt: number) => unknown)
}

export interface Story1626AcceptedRequest {
  name: string
  attempt: number
  url: string
}

/** Outcome a deferred route resolves with once its gate is released. */
export type Story1626ReleaseOutcome = 'data' | 'empty' | 'error'

export interface Story1626RouteController {
  register: (contract: Story1626RouteContract) => Promise<void>
  waitForAttempt: (name: string, attempt?: number) => Promise<Story1626AcceptedRequest>
  attemptCount: (name: string) => number
  acceptedRequests: () => readonly Story1626AcceptedRequest[]
  rejectedRequests: () => readonly string[]
  release: (name: string, outcome?: Story1626ReleaseOutcome) => void
  allowRetrySuccess: (name: string) => void
  assertNoUnexpectedRequests: () => void
}

interface DeferredGate {
  promise: Promise<void>
  release: () => void
}

interface RouteState {
  attempts: number
  retrySuccessAllowed: boolean
  releaseOutcome: Story1626ReleaseOutcome
  gate: DeferredGate
  waiters: Array<{
    attempt: number
    resolve: (request: Story1626AcceptedRequest) => void
  }>
}

function createDeferredGate(): DeferredGate {
  let resolveGate: (() => void) | undefined
  let released = false
  const promise = new Promise<void>(resolve => {
    resolveGate = resolve
  })

  return {
    promise,
    release() {
      if (released) return
      released = true
      resolveGate?.()
    },
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matches(value: string, matcher: RegExp): boolean {
  const flags = matcher.flags.replaceAll('g', '').replaceAll('y', '')
  return new RegExp(matcher.source, flags).test(value)
}

function validateExactRequest(route: Route, contract: Story1626RouteContract): URL {
  const request = route.request()
  const url = new URL(request.url())
  if (request.method() !== 'GET') {
    throw new Error(`${contract.name}: rejected ${request.method()} ${url.pathname}`)
  }
  if (url.pathname !== contract.path) {
    throw new Error(`${contract.name}: rejected pathname ${url.pathname}`)
  }

  const required = contract.query?.required ?? {}
  const optional = contract.query?.optional ?? {}
  const allowed = new Set([...Object.keys(required), ...Object.keys(optional)])

  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key)) throw new Error(`${contract.name}: rejected query key ${key}`)
  }
  for (const [key, matcher] of Object.entries(required)) {
    const value = url.searchParams.get(key)
    if (value === null || !matches(value, matcher)) {
      throw new Error(`${contract.name}: rejected ${key}=${String(value)}`)
    }
  }
  for (const [key, matcher] of Object.entries(optional)) {
    const value = url.searchParams.get(key)
    if (value !== null && !matches(value, matcher)) {
      throw new Error(`${contract.name}: rejected ${key}=${value}`)
    }
  }

  contract.validate?.(url)

  return url
}

function responseBody(
  value: unknown | ((url: URL, attempt: number) => unknown) | undefined,
  url: URL,
  attempt: number
): unknown {
  return typeof value === 'function'
    ? (value as (requestUrl: URL, requestAttempt: number) => unknown)(url, attempt)
    : value
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export function createStory1626RouteController(page: Page): Story1626RouteController {
  const states = new Map<string, RouteState>()
  const accepted: Story1626AcceptedRequest[] = []
  const rejected: string[] = []

  function requireState(name: string): RouteState {
    const state = states.get(name)
    if (!state) throw new Error(`Story 162.6 route is not registered: ${name}`)
    return state
  }

  return {
    async register(contract) {
      if (states.has(contract.name)) {
        throw new Error(`Story 162.6 route is already registered: ${contract.name}`)
      }
      const state: RouteState = {
        attempts: 0,
        retrySuccessAllowed: false,
        releaseOutcome: 'data',
        gate: createDeferredGate(),
        waiters: [],
      }
      states.set(contract.name, state)

      const matcher = new RegExp(`${escapeRegExp(contract.path)}(?:\\?.*)?$`)
      await page.route(matcher, async route => {
        let url: URL
        try {
          url = validateExactRequest(route, contract)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          rejected.push(message)
          await fulfillJson(route, { error: { code: 'STORY_162_6_REJECTED', message } }, 400)
          return
        }

        state.attempts += 1
        const request: Story1626AcceptedRequest = {
          name: contract.name,
          attempt: state.attempts,
          url: url.toString(),
        }
        accepted.push(request)
        const matchingWaiters = state.waiters.filter(waiter => waiter.attempt <= state.attempts)
        state.waiters = state.waiters.filter(waiter => waiter.attempt > state.attempts)
        matchingWaiters.forEach(waiter => waiter.resolve(request))

        const mode = contract.mode ?? 'data'
        if (mode === 'deferred') await state.gate.promise
        const outcome: Story1626RouteMode = mode === 'deferred' ? state.releaseOutcome : mode
        if (outcome === 'error' || (outcome === 'retry' && !state.retrySuccessAllowed)) {
          await fulfillJson(
            route,
            responseBody(
              contract.error ?? {
                error: { code: 'STORY_162_6', message: `${contract.name} fixture error` },
              },
              url,
              state.attempts
            ),
            500
          )
          return
        }

        const body =
          outcome === 'empty' && contract.empty !== undefined ? contract.empty : contract.data
        await fulfillJson(route, responseBody(body, url, state.attempts))
      })
    },
    waitForAttempt(name, attempt = 1) {
      const state = requireState(name)
      const existing = accepted.find(item => item.name === name && item.attempt >= attempt)
      if (existing) return Promise.resolve(existing)
      return new Promise(resolve => state.waiters.push({ attempt, resolve }))
    },
    attemptCount(name) {
      return requireState(name).attempts
    },
    acceptedRequests: () => accepted.map(request => ({ ...request })),
    rejectedRequests: () => [...rejected],
    release(name, outcome = 'data') {
      const state = requireState(name)
      state.releaseOutcome = outcome
      state.gate.release()
    },
    allowRetrySuccess(name) {
      requireState(name).retrySuccessAllowed = true
    },
    assertNoUnexpectedRequests() {
      if (rejected.length > 0) throw new Error(rejected.join('\n'))
    },
  }
}
