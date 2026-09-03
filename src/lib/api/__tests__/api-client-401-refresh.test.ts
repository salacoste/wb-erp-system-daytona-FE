/**
 * Story 174.4 — G4 contract probe: mid-session 401 refresh (pins ACTUAL behavior).
 *
 * Probed implementation (read before writing this file):
 *   - src/lib/api-client.ts — `request()` throws ApiError(status) on !ok. There
 *     is NO reactive 401 interceptor: no auto refresh call, no request replay.
 *   - src/lib/api.ts `refreshToken()` — POST /v1/auth/refresh with skipAuth +
 *     an explicit `Authorization: Bearer <current>` header.
 *   - src/hooks/useAuth.ts — refresh is PROACTIVE (mount + 5-min interval,
 *     gated on isTokenExpired), then `authStore.refreshToken(newToken)` updates
 *     the store so subsequent requests pick up the new token.
 *
 * Therefore these tests pin what the system ACTUALLY does (defensive-frontend:
 * never mask; the gap itself is a filed finding, not a src fix here):
 *   1. 401 → real ApiError(401), exactly ONE protected request, ZERO
 *      /v1/auth/refresh calls (no reactive refresh, no retry storm).
 *   2. The app-level recovery path works end-to-end through the real client:
 *      refresh(stale) → store update → the ORIGINAL endpoint re-sent with the
 *      NEW Authorization header → 200 resolves.
 *   3. Concurrent 401s: each call fails exactly once (3 requests total, zero
 *      refreshes) — there is no interceptor-level dedupe primitive to exercise.
 *
 * No `as`/`any`; real MSW interception (unhandled requests error out).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { apiClient } from '@/lib/api-client'
import { refreshToken as refreshTokenApi } from '@/lib/api'
import { ApiError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'
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

describe('G4 — mid-session 401 refresh (actual behavior, MSW + real apiClient)', () => {
  it('401 → real ApiError(401); ONE protected request; ZERO /v1/auth/refresh calls', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }
    useTokenRotationHandlers(protectedCaptures, refreshCount)

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    let thrown: unknown
    try {
      await apiClient.get(PROTECTED_ENDPOINT)
    } catch (error) {
      thrown = error
    }

    // AP#3: real ApiError instance; 401 status surfaces unmasked to the caller.
    expect(thrown).toBeInstanceOf(ApiError)
    const apiError = thrown instanceof ApiError ? thrown : null
    expect(apiError?.status).toBe(401)
    expect(apiError?.message).toBe('Unauthorized')

    // The failed attempt carried the stale session context on the wire.
    expect(protectedCaptures[0].authHeader).toBe('Bearer expired-jwt')
    expect(protectedCaptures[0].cabinetHeader).toBe('cab-909')

    // Pinned actual behavior: no reactive refresh, no auto-retry of the original.
    expect(protectedCaptures).toHaveLength(1)
    expect(refreshCount.calls).toBe(0)
  })

  it('app-level recovery: refresh → store update → original re-sent with NEW token → 200', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }
    useTokenRotationHandlers(protectedCaptures, refreshCount)

    setupMockAuth({ token: 'expired-jwt', cabinetId: 'cab-909' })

    // Attempt 1 fails 401 (asserted in the sibling test; here drive the flow).
    await expect(apiClient.get(PROTECTED_ENDPOINT)).rejects.toBeInstanceOf(ApiError)

    // App-level recovery, exactly as useAuth.refreshTokenIfNeeded orchestrates:
    // call the refresh API, then persist the rotated token in the auth store.
    const refreshed = await refreshTokenApi('expired-jwt')
    expect(refreshCount.calls).toBe(1)
    expect(refreshed.token).toBe('rotated-jwt')

    useAuthStore.getState().refreshToken('rotated-jwt')

    // The ORIGINAL request re-issued now authenticates with the NEW token and
    // succeeds — proving the store → header injection → wire chain.
    const retried = await apiClient.get<{ sale_gross: number }>(PROTECTED_ENDPOINT)
    expect(retried.sale_gross).toBe(1000)

    expect(protectedCaptures).toHaveLength(2)
    expect(protectedCaptures[0].authHeader).toBe('Bearer expired-jwt')
    expect(protectedCaptures[1].authHeader).toBe('Bearer rotated-jwt')
    // The cabinet context survives the token rotation untouched.
    expect(protectedCaptures[1].cabinetHeader).toBe('cab-909')
    // Exactly one refresh for the whole recovery sequence.
    expect(refreshCount.calls).toBe(1)
  })

  it('concurrent 401s: each call fails exactly once (3 requests, 0 refreshes, no dedupe primitive)', async () => {
    const protectedCaptures: ProtectedCapture[] = []
    const refreshCount = { calls: 0 }

    // All concurrent attempts answer 401 (the token is expired for all of them).
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

    const outcomes = await Promise.allSettled([
      apiClient.get(PROTECTED_ENDPOINT),
      apiClient.get(PROTECTED_ENDPOINT),
      apiClient.get(PROTECTED_ENDPOINT),
    ])

    // Every concurrent 401 surfaces as a real ApiError(401) to its caller.
    for (const outcome of outcomes) {
      expect(outcome.status).toBe('rejected')
      if (outcome.status !== 'rejected') continue
      expect(outcome.reason).toBeInstanceOf(ApiError)
      const apiError = outcome.reason instanceof ApiError ? outcome.reason : null
      expect(apiError?.status).toBe(401)
    }

    // No retry storm: exactly one request per call, none replayed.
    expect(protectedCaptures).toHaveLength(3)
    for (const capture of protectedCaptures) {
      expect(capture.authHeader).toBe('Bearer expired-jwt')
    }
    // Pinned actual behavior: no refresh dedupe exists because no reactive
    // refresh exists at the client layer at all (finding G4-A).
    expect(refreshCount.calls).toBe(0)
  })
})
