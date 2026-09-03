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
 * D-2 pass-1 review fixes (2026-09-03) pinned here:
 *   - M1 rotation-cascade gate: a failed request whose wire token DIFFERS from
 *     the current store token must NOT trigger a refresh (a prior rotation
 *     already completed) — recovery replays with the store token directly.
 *   - M2 refresh deadline: a black-holed refresh POST is aborted (10s default,
 *     injectable) and treated as refresh failure — original ApiError surfaces.
 *   - OQ2 durable pinned ops: createCabinet opts out of reactive replay.
 *   - L1+L2: wire-level POST replay pin (method, body byte-parity,
 *     Idempotency-Key, X-Cabinet-Id survive the replay).
 *   - L4: handler asserts moved OUT of MSW handlers (capture + assert after
 *     await).
 *
 * D-2 pass-2 (2026-09-03) pinned here:
 *   - M1 join: a stale-wire 401 arriving DURING a pending rotation JOINS it —
 *     one refresh total; the straggler replays only after settle, with the
 *     rotated token (never with the token the pending rotation revokes).
 *
 * No `as`/`any`; real MSW interception (unhandled requests error out).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/types/api'
import { DEFAULT_REFRESH_DEADLINE_MS, setRefreshDeadlineForTests } from '@/lib/api-client-refresh'
import { createCabinet } from '@/lib/api'
import { setupMockAuth, clearMockAuth } from '@/test/test-utils'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const PROTECTED_URL = `${API}/v1/analytics/weekly/finance-summary`
const REFRESH_URL = `${API}/v1/auth/refresh`
const PROTECTED_ENDPOINT = '/v1/analytics/weekly/finance-summary'

interface ProtectedCapture {
  authHeader: string
  cabinetHeader: string
}

/** Install the 401-once-then-200 protected handler + a counting refresh
 * handler. L4 (D-2 pass-1): the handler CAPTURES the refresh Authorization
 * header into `refreshAuthHeaders` — assertions live in the test AFTER the
 * await, never inside an MSW handler (an in-handler expect failure surfaces
 * as an opaque unhandled rejection, not a test failure). */
function useTokenRotationHandlers(
  protectedCaptures: ProtectedCapture[],
  refreshCount: { calls: number },
  refreshAuthHeaders: string[]
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
      refreshAuthHeaders.push(request.headers.get('Authorization') ?? '')
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
    const refreshAuthHeaders: string[] = []
    useTokenRotationHandlers(protectedCaptures, refreshCount, refreshAuthHeaders)

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    // Pre-D-2 this rejected with ApiError(401); post-D-2 the interceptor
    // refreshes + replays and the caller sees clean data.
    const result = await apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT)
    expect(result.sale_gross).toBe(1000)

    // Exactly one refresh for the whole recovery, exactly one replay.
    expect(refreshCount.calls).toBe(1)
    // L4 pin: the refresh authenticated with the CURRENT (stale) token via
    // the explicit header refreshToken() passes — asserted after the await.
    expect(refreshAuthHeaders).toEqual(['Bearer expired-jwt'])
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

  it('rotation-cascade gate (M1): failed wire token ≠ store token (prior rotation completed) → ZERO refresh, replay rides the store token', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

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
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    // The store ALREADY holds a newer token (a prior rotation just completed),
    // while this request was initiated with the now-revoked old token via
    // the Story 167.9 immutable-initiating-token override.
    setupMockAuth({ token: 'newer-store-jwt', cabinetId: 'cab-909' })

    const result = await apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT, {
      authToken: 'old-revoked-jwt',
    })
    expect(result.sale_gross).toBe(1000)

    // M1 cascade-gate pin: the failed request's wire token DIFFERS from the
    // store token ⇒ the store already moved on (a prior rotation completed) —
    // a new refresh would burn the just-minted JWT. The recovery replays with
    // the CURRENT store token directly, proven on the wire: the replay rides
    // the STORE token, NOT the refresh handler's rotated-jwt (which never
    // fired — refreshCount is 0).
    expect(refreshCount.calls).toBe(0)
    expect(protectedCaptures).toHaveLength(2)
    expect(protectedCaptures[0].authHeader).toBe('Bearer old-revoked-jwt')
    expect(protectedCaptures[1].authHeader).toBe('Bearer newer-store-jwt')
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

  it('cascade gate e2e (M1): stale-wire-token 401 arriving AFTER a completed rotation → zero extra refresh, replay succeeds with the store token', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    // Determinism: B's original request goes out PRE-rotation (wire token =
    // stale-wire-jwt), but its 401 is HELD on the wire until A's recovery has
    // fully settled — so B's 401 is PROCESSED after the single flight cleared
    // (inflightRefresh === null), exercising the M1 comparison, not the join.
    let releaseStale!: () => void
    const staleGate = new Promise<void>(resolve => {
      releaseStale = resolve
    })
    let seenAOriginal!: () => void
    const aOriginalSeen = new Promise<void>(resolve => {
      seenAOriginal = resolve
    })
    let seenBOriginal!: () => void
    const bOriginalSeen = new Promise<void>(resolve => {
      seenBOriginal = resolve
    })

    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        const auth = request.headers.get('Authorization') ?? ''
        protectedCaptures.push({ authHeader: auth, cabinetHeader: '' })
        // The pre-rotation token is REVOKED server-side (annex hazard #1).
        if (auth !== 'Bearer stale-wire-jwt') {
          return HttpResponse.json({ sale_gross: 1000 })
        }
        if (protectedCaptures.length === 1) {
          seenAOriginal()
          return HttpResponse.json({ message: 'TOKEN_REVOKED' }, { status: 401 })
        }
        // B's original: hold the 401 until A's rotation completed.
        seenBOriginal()
        return staleGate.then(() => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    setupMockAuth({ token: 'stale-wire-jwt', cabinetId: 'cab-909' })

    // A: 401 → refresh → rotation completes (store → rotated-jwt) → replay.
    const requestA = apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT)
    await aOriginalSeen
    // B: issued pre-rotation, so its wire token is the stale one; its 401 is
    // held by the handler above.
    const requestB = apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT)
    await bOriginalSeen

    // A settles completely: exactly one refresh POST, store rotated, replay OK.
    const resultA = await requestA
    expect(resultA.sale_gross).toBe(1000)

    // NOW B's held 401 is processed — after the completed rotation.
    releaseStale()
    const resultB = await requestB
    expect(resultB.sale_gross).toBe(1000)

    // B's stale-wire 401 arrived AFTER the rotation completed → the cascade
    // gate blocked any second refresh: A's rotation is the ONLY refresh POST.
    expect(refreshCount.calls).toBe(1)
    expect(protectedCaptures).toHaveLength(4)
    expect(protectedCaptures[0].authHeader).toBe('Bearer stale-wire-jwt') // A original
    expect(protectedCaptures[1].authHeader).toBe('Bearer stale-wire-jwt') // B original
    expect(protectedCaptures[2].authHeader).toBe('Bearer rotated-jwt') // A replay
    expect(protectedCaptures[3].authHeader).toBe('Bearer rotated-jwt') // B replay (store token)
  })

  it('cascade gate JOIN (D-2 pass-2): stale-wire 401 arriving DURING a pending rotation joins it → one refresh total, straggler replays after settle', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    // Determinism: A's rotation POST is HELD until the straggler's gate check
    // has run, so `inflightRefresh` is guaranteed non-null when the straggler
    // 401s — exercising the gate JOIN, not the post-settle comparison.
    let releaseRotation!: () => void
    const rotationGate = new Promise<void>(resolve => {
      releaseRotation = resolve
    })
    let seenRefreshPost!: () => void
    const refreshPostSeen = new Promise<void>(resolve => {
      seenRefreshPost = resolve
    })
    let seenStragglerOriginal!: () => void
    const stragglerOriginalSeen = new Promise<void>(resolve => {
      seenStragglerOriginal = resolve
    })

    server.use(
      http.get(PROTECTED_URL, ({ request }) => {
        const auth = request.headers.get('Authorization') ?? ''
        protectedCaptures.push({ authHeader: auth, cabinetHeader: '' })
        if (auth === 'Bearer stale-wire-jwt') {
          seenStragglerOriginal()
        }
        // Annex hazard #1: both the pre-rotation store token and the older
        // stale wire token are REVOKED server-side; only the rotated token
        // (post-settle) succeeds.
        if (auth !== 'Bearer rotated-jwt') {
          return HttpResponse.json({ message: 'TOKEN_REVOKED' }, { status: 401 })
        }
        return HttpResponse.json({ sale_gross: 1000 })
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        seenRefreshPost()
        return rotationGate.then(() => HttpResponse.json({ token: 'rotated-jwt' }))
      })
    )

    setupMockAuth({ token: 'store-jwt', cabinetId: 'cab-909' })

    // A: store-authenticated 401 → starts the (held) rotation.
    const requestA = apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT)
    await refreshPostSeen

    // B (straggler): stale wire token 401s WHILE the rotation is pending —
    // gate compares 'stale-wire-jwt' ≠ 'store-jwt' with a flight in progress.
    const requestB = apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT, {
      authToken: 'stale-wire-jwt',
    })
    await stragglerOriginalSeen
    // Flush macrotask turns so B's 401 processing (gate → join) has run
    // before the rotation is released.
    for (let turn = 0; turn < 10; turn += 1) {
      await new Promise<void>(resolve => {
        setTimeout(resolve, 0)
      })
    }

    releaseRotation()

    const [resultA, resultB] = await Promise.all([requestA, requestB])
    expect(resultA.sale_gross).toBe(1000)
    expect(resultB.sale_gross).toBe(1000)

    // ONE refresh total — the straggler joined A's pending rotation.
    expect(refreshCount.calls).toBe(1)
    // Wire pin: the straggler NEVER replayed with 'store-jwt' — the token the
    // pending rotation was about to revoke. Order: A original, B original,
    // then both replays riding the rotated token AFTER the settle.
    expect(protectedCaptures).toHaveLength(4)
    expect(protectedCaptures[0].authHeader).toBe('Bearer store-jwt') // A original
    expect(protectedCaptures[1].authHeader).toBe('Bearer stale-wire-jwt') // B original
    expect(protectedCaptures[2].authHeader).toBe('Bearer rotated-jwt') // A replay
    expect(protectedCaptures[3].authHeader).toBe('Bearer rotated-jwt') // B replay (joined)
  })

  it('refresh deadline (M2): never-responding refresh + 10ms injected deadline → recovery false, original ApiError, no hang', async () => {
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
      // Black-holed refresh: the handler NEVER responds.
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return new Promise<never>(() => undefined)
      })
    )

    setRefreshDeadlineForTests(10)
    try {
      setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

      const started = Date.now()
      let thrown: unknown
      try {
        await apiClient.get(PROTECTED_ENDPOINT)
      } catch (error) {
        thrown = error
      }
      const elapsed = Date.now() - started

      // The PROTECTED request's original ApiError surfaces unmasked.
      expect(thrown).toBeInstanceOf(ApiError)
      const apiError = thrown instanceof ApiError ? thrown : null
      expect(apiError?.status).toBe(401)
      expect(apiError?.message).toBe('Unauthorized')
      // The abort was treated as refresh failure → no replay, one attempt.
      expect(protectedCaptures).toHaveLength(1)
      expect(refreshCount.calls).toBe(1)
      // No hang: the deadline freed the single flight (not the 5s test cap).
      expect(elapsed).toBeLessThan(3000)
    } finally {
      setRefreshDeadlineForTests(DEFAULT_REFRESH_DEADLINE_MS)
    }
  })

  it('durable pinned op opt-out (OQ2): createCabinet 401 → ZERO refresh, ApiError surfaces (no auto-replay)', async () => {
    const refreshCount = { calls: 0 }
    const cabinetCaptures: ProtectedCapture[] = []

    server.use(
      http.post(`${API}/v1/cabinets`, ({ request }) => {
        cabinetCaptures.push({
          authHeader: request.headers.get('Authorization') ?? '',
          cabinetHeader: request.headers.get('X-Cabinet-Id') ?? '',
        })
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    setupMockAuth({ token: 'store-jwt', cabinetId: 'cab-909' })

    let thrown: unknown
    try {
      // The REAL production call-site shape (src/lib/api.ts createCabinet):
      // immutable initiating token + Story 167.8 Idempotency-Key, scoped to
      // the initiating session.
      await createCabinet(
        { name: 'Pinned Cabinet' },
        { token: 'initiator-jwt', idempotencyKey: '11111111-2222-3333-4444-555555555555' }
      )
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    const apiError = thrown instanceof ApiError ? thrown : null
    expect(apiError?.status).toBe(401)
    // OQ2 pin: the explicit initiating-token pin means NO reactive refresh
    // and NO auto-replay — the durable account-scoped create owns its retry
    // via Story 167.8 reconciliation (cross-session pin-drop defense).
    expect(refreshCount.calls).toBe(0)
    expect(cabinetCaptures).toHaveLength(1)
    expect(cabinetCaptures[0].authHeader).toBe('Bearer initiator-jwt')
    // Account-scoped create: no X-Cabinet-Id participates (Story 167.8).
    expect(cabinetCaptures[0].cabinetHeader).toBe('')
  })

  it('wire-level POST replay pin (L1+L2): method, byte-parity body, Idempotency-Key, X-Cabinet-Id survive the replay', async () => {
    interface PostCapture {
      method: string
      body: string
      idempotencyKey: string
      cabinetHeader: string
      authHeader: string
    }
    const postCaptures: PostCapture[] = []
    const refreshCount = { calls: 0 }
    const requestPayload = { items: [{ nm_id: 1001, cogs: 250 }] }
    const expectedBody = JSON.stringify(requestPayload)

    server.use(
      http.post(`${API}/v1/products/bulk-cogs`, async ({ request }) => {
        postCaptures.push({
          method: request.method,
          body: await request.text(),
          idempotencyKey: request.headers.get('Idempotency-Key') ?? '',
          cabinetHeader: request.headers.get('X-Cabinet-Id') ?? '',
          authHeader: request.headers.get('Authorization') ?? '',
        })
        if (postCaptures.length === 1) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({ updated: 1 })
      }),
      http.post(REFRESH_URL, () => {
        refreshCount.calls += 1
        return HttpResponse.json({ token: 'rotated-jwt' })
      })
    )

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'store-cab' })

    const result = await apiClient.post<{ updated: number }>(
      '/v1/products/bulk-cogs',
      requestPayload,
      { headers: { 'Idempotency-Key': 'idem-123' }, cabinetIdOverride: 'override-cab' }
    )
    expect(result.updated).toBe(1)

    expect(refreshCount.calls).toBe(1)
    expect(postCaptures).toHaveLength(2)
    const [original, replay] = postCaptures
    // L1: the replay is a POST, not a silently-upgraded GET.
    expect(original.method).toBe('POST')
    expect(replay.method).toBe('POST')
    // L1: body byte parity across the replay.
    expect(original.body).toBe(expectedBody)
    expect(replay.body).toBe(expectedBody)
    // L1: the custom header rides the replay untouched.
    expect(original.idempotencyKey).toBe('idem-123')
    expect(replay.idempotencyKey).toBe('idem-123')
    // L2: X-Cabinet-Id PRESENT on the replay capture (the pinned override
    // survives rotation — the cabinet context is not dropped).
    expect(original.cabinetHeader).toBe('override-cab')
    expect(replay.cabinetHeader).toBe('override-cab')
    // And the replay rode the rotated token.
    expect(original.authHeader).toBe('Bearer expired-jwt')
    expect(replay.authHeader).toBe('Bearer rotated-jwt')
  })
})
