/**
 * D-2 (PB-3) — reactive 401 refresh (pins ACTUAL behavior post-D-2, 2026-09-03).
 *
 * History: this file began as the Story 174.4 G4 contract probe pinning the
 * PRE-D-2 actual behavior — "no reactive refresh, no auto-retry, ZERO
 * /v1/auth/refresh calls". D-2 flipped the contract (BE annex agreed,
 * docs/request-backend/230-auth-refresh-endpoint-missing.md §ANEX): the pins
 * were REWRITTEN to the NEW actual behavior — refresh fires once
 * (single-flight), the original request is replayed ONCE with the rotated
 * store token. The pin flip IS the D-2 deliverable, not a regression; the
 * original G4 intent (no retry storm, no masked errors) survives below.
 *
 * Probed implementation (read before writing this file):
 *   - src/lib/api-client.ts `request()` — 401 on a NON-refresh, AUTHENTICATED
 *     request → single-flight refresh → ONE replay. Replay 401 → surface the
 *     original ApiError (no second refresh, no loop).
 *   - src/lib/api-client-refresh.ts — single-flight core. Reads the token
 *     from the auth STORE at refresh time (hazard #1: the failed request's
 *     own token may be the REVOKED one — never reuse it); updates the store
 *     via the `refreshToken(token, user)` STORE ACTION (hazard #2: keeps
 *     sessionNonce + user; `login()` would mint a new nonce and break
 *     in-flight D-1 / Story 167.9 cabinet-create settlements).
 *   - src/lib/api.ts `refreshToken()` — POST /v1/auth/refresh with skipAuth +
 *     an explicit `Authorization: Bearer <token>` header.
 *
 * Contract annex semantics baked into these tests:
 *   POST /v1/auth/refresh, Bearer of a still-valid JWT, body {} → { token }.
 *   Sliding rotation; the OLD JWT is atomically REVOKED (in-flight requests
 *   carrying it → 401 TOKEN_REVOKED); expired/revoked JWT → 401 from the
 *   refresh endpoint itself (unrecoverable, must not recurse).
 *
 * No `as`/`any`; real MSW interception (unhandled requests error out).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const PROTECTED_URL = `${API}/v1/analytics/weekly/finance-summary`
const REFRESH_URL = `${API}/v1/auth/refresh`
const PROTECTED_ENDPOINT = '/v1/analytics/weekly/finance-summary'

interface ProtectedCapture {
  authHeader: string
  cabinetHeader: string
}

/** Install the 401-once-then-200 protected handler + a counting refresh handler. */
function useTokenRotationHandlers(
  protectedCaptures: ProtectedCapture[],
  refreshCount: { calls: number }
): void {
  server.use(
    http.get(PROTECTED_URL, ({ request }) => {
      protectedCaptures.push({
        authHeader: request.headers.get('Authorization') ?? '',
        cabinetHeader: request.headers.get('X-Cabinet-Id') ?? '',
      })
      if (protectedCaptures.length === 1) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      return HttpResponse.json({ sale_gross: 1000 })
    }),
    http.post(REFRESH_URL, ({ request }) => {
      refreshCount.calls += 1
      // The refresh call authenticates with the CURRENT (stale) token via the
      // explicit header refreshToken() passes — assert it rode on the wire.
      expect(request.headers.get('Authorization')).toBe('Bearer expired-jwt')
      return HttpResponse.json({ token: 'rotated-jwt' })
    })
  )
}

afterEach(() => {
  clearMockAuth()
})

describe('D-2 (PB-3) — reactive 401 refresh (actual behavior, MSW + real apiClient)', () => {
  it('401 → ONE refresh + ONE replay with the rotated token → caller sees data (no ApiError)', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }
    useTokenRotationHandlers(protectedCaptures, refreshCount)

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    // Pre-D-2 this rejected with ApiError(401); post-D-2 the interceptor
    // refreshes + replays and the caller sees clean data.
    const result = await apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT)
    expect(result.sale_gross).toBe(1000)

    // Exactly one refresh for the whole recovery, exactly one replay.
    expect(refreshCount.calls).toBe(1)
    expect(protectedCaptures).toHaveLength(2)
    // The failed attempt carried the stale session token on the wire.
    expect(protectedCaptures[0].authHeader).toBe('Bearer expired-jwt')
    expect(protectedCaptures[0].cabinetHeader).toBe('cab-909')
    // The replay authenticated with the NEW (rotated) token; the cabinet
    // context survives the token rotation untouched.
    expect(protectedCaptures[1].authHeader).toBe('Bearer rotated-jwt')
    expect(protectedCaptures[1].cabinetHeader).toBe('cab-909')
  })

  it('single-flight: 3 concurrent 401s → exactly ONE refresh → all 3 replay with the new token and succeed', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    // Serialize handler runs (issuance order) + gate the refresh response on
    // the 3rd 401 being served — makes single-flight deterministic: all three
    // interceptors provably join the SAME in-flight refresh, whatever the
    // event-loop interleaving.
    let releaseRefresh!: () => void
    const refreshGate = new Promise<void>(resolve => {
      releaseRefresh = resolve
    })
    let chain: Promise<unknown> = Promise.resolve()
    const enqueue = <T>(run: () => Promise<T>): Promise<T> => {
      const next = chain.then(run, run)
      chain = next.then(
        () => undefined,
        () => undefined
      )
      return next
    }

    server.use(
      http.get(PROTECTED_URL, ({ request }) =>
        enqueue(async () => {
          protectedCaptures.push({
            authHeader: request.headers.get('Authorization') ?? '',
            cabinetHeader: '',
          })
          // First 3 calls (the original concurrent burst) → 401; replays → 200.
          if (protectedCaptures.length <= 3) {
            if (protectedCaptures.length === 3) releaseRefresh()
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json({ sale_gross: 1000 })
        })
      ),
      http.post(REFRESH_URL, () =>
        enqueue(async () => {
          refreshCount.calls += 1
          await refreshGate
          return HttpResponse.json({ token: 'rotated-jwt' })
        })
      )
    )

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    const outcomes = await Promise.allSettled([
      apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT),
      apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT),
      apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT),
    ])

    // Every concurrent caller recovers with clean data — no ApiError anywhere.
    for (const outcome of outcomes) {
      expect(outcome.status).toBe('fulfilled')
      if (outcome.status !== 'fulfilled') continue
      expect(outcome.value.sale_gross).toBe(1000)
    }

    // No retry storm: 3 originals + 3 replays, never more.
    expect(protectedCaptures).toHaveLength(6)
    for (let i = 0; i < 3; i += 1) {
      expect(protectedCaptures[i].authHeader).toBe('Bearer expired-jwt')
    }
    // All 3 replays rode the SAME rotated token.
    for (let i = 3; i < 6; i += 1) {
      expect(protectedCaptures[i].authHeader).toBe('Bearer rotated-jwt')
    }
    // THE single-flight pin: one refresh total for the whole burst.
    expect(refreshCount.calls).toBe(1)
  })

  it('replay once only: replayed request 401s again → original ApiError surfaces; NO second refresh, NO loop', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    // The rotated token is ALSO rejected — recovery is impossible.
    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        protectedCaptures.push({
          authHeader: request.headers.get('Authorization') ?? '',
          cabinetHeader: '',
        })
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    let thrown: unknown
    try {
      await apiClient.get(PROTECTED_ENDPOINT)
    } catch (error) {
      thrown = error
    }

    // AP#3: real ApiError instance; 401 status surfaces unmasked.
    expect(thrown).toBeInstanceOf(ApiError)
    const apiError = thrown instanceof ApiError ? thrown : null
    expect(apiError?.status).toBe(401)
    expect(apiError?.message).toBe('Unauthorized')

    // Original + exactly ONE replay; the replay's 401 is terminal.
    expect(protectedCaptures).toHaveLength(2)
    expect(protectedCaptures[0].authHeader).toBe('Bearer expired-jwt')
    expect(protectedCaptures[1].authHeader).toBe('Bearer rotated-jwt')
    // No second refresh within the same request's recovery.
    expect(refreshCount.calls).toBe(1)
  })

  it('refresh endpoint 401 (expired/revoked JWT) → NO replay, original ApiError, no interceptor recursion', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        protectedCaptures.push({
          authHeader: request.headers.get('Authorization') ?? '',
          cabinetHeader: '',
        })
        return HttpResponse.json({ message: 'Protected unauthorized' }, { status: 401 })
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ message: 'Refresh rejected' }, { status: 401 })
      })
    )

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    let thrown: unknown
    try {
      await apiClient.get(PROTECTED_ENDPOINT)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    const apiError = thrown instanceof ApiError ? thrown : null
    expect(apiError?.status).toBe(401)
    // The PROTECTED request's error surfaces — not the refresh endpoint's.
    expect(apiError?.message).toBe('Protected unauthorized')

    // NO replay (the recovery failed before replaying) and exactly ONE
    // refresh (the refresh's own 401 was not itself intercepted-and-refreshed
    // — that would recurse).
    expect(protectedCaptures).toHaveLength(1)
    expect(refreshCount.calls).toBe(1)
  })

  it('store-token hazard: refresh authenticates with the STORE token, never the failed request token', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }
    let refreshAuthHeader = ''

    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        protectedCaptures.push({
          authHeader: request.headers.get('Authorization') ?? '',
          cabinetHeader: '',
        })
        // Contract annex hazard #1: the OLD token is REVOKED server-side.
        if (request.headers.get('Authorization') === 'Bearer old-revoked-jwt') {
          return HttpResponse.json({ message: 'TOKEN_REVOKED' }, { status: 401 })
        }
        return HttpResponse.json({ sale_gross: 1000 })
      }),
      http.post(REFRESH_URL, ({ request }) => {
        refreshCount.calls += 1
        refreshAuthHeader = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    // The store ALREADY holds a newer token (a rotation just completed),
    // while this request was initiated with the now-revoked old token via
    // the Story 167.9 immutable-initiating-token override.
    setupMockAuth({ token: 'newer-store-jwt', cabinetId: 'cab-909' })

    const result = await apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT, {
      authToken: 'old-revoked-jwt',
    })
    expect(result.sale_gross).toBe(1000)

    // Hazard #1 pin: the refresh rode the STORE token, not the failed
    // request's revoked one.
    expect(refreshAuthHeader).toBe('Bearer newer-store-jwt')
    // The failed attempt carried the revoked initiating token…
    expect(protectedCaptures[0].authHeader).toBe('Bearer old-revoked-jwt')
    // …and the replay dropped the override and rode the rotated STORE token.
    expect(protectedCaptures).toHaveLength(2)
    expect(protectedCaptures[1].authHeader).toBe('Bearer rotated-jwt')
    expect(refreshCount.calls).toBe(1)
  })

  it('no store token → NO refresh attempt at all (logged-out 401s stay terminal)', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        protectedCaptures.push({
          authHeader: request.headers.get('Authorization') ?? '',
          cabinetHeader: '',
        })
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    clearMockAuth()

    let thrown: unknown
    try {
      await apiClient.get(PROTECTED_ENDPOINT)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    expect(protectedCaptures).toHaveLength(1)
    // Without a store session there is nothing to rotate — no refresh POST.
    expect(refreshCount.calls).toBe(0)
  })

  it('skipAuth 401 (credential failure, e.g. login) → NO refresh, original ApiError', async () => {
    const refreshCount = { calls: 0 }

    server.use(
      http.post(`${API}/v1/auth/login`, () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      ),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    let thrown: unknown
    try {
      await apiClient.post(
        '/v1/auth/login',
        { email: 'x@x.io', password: 'nope' },
        {
          skipAuth: true,
        }
      )
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    const apiError = thrown instanceof ApiError ? thrown : null
    expect(apiError?.status).toBe(401)
    expect(apiError?.message).toBe('Invalid credentials')
    // A skipAuth 401 is a credential failure — nothing to rotate.
    expect(refreshCount.calls).toBe(0)
  })
})
