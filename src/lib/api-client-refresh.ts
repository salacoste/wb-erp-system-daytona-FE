/**
 * D-2 (PB-3, 2026-09-03): reactive 401 token refresh — single-flight core.
 *
 * Contract: docs/request-backend/230-auth-refresh-endpoint-missing.md §ANEX.
 * `POST /v1/auth/refresh` with the Bearer of a STILL-VALID access JWT, body
 * `{}` → `{ "token": "<new>" }`. Sliding rotation — the OLD JWT is atomically
 * REVOKED, so any in-flight request still carrying it gets 401 TOKEN_REVOKED.
 *
 * Hazard #1 (single-use revocation): the refresh call MUST read the token
 * from the auth STORE at refresh time (already rotated if a concurrent
 * refresh won the race) — NEVER reuse the failed request's original token,
 * which is revoked and would fail the refresh itself.
 *
 * Hazard #2 (sessionNonce preservation): the store update goes through the
 * `refreshToken(token, user)` STORE ACTION — it keeps sessionNonce and the
 * existing user. `login()` would mint a new nonce and break in-flight D-1
 * (Story 167.9) cabinet-create settlements.
 */

import { useAuthStore } from '@/stores/authStore'
// Type-only import — erased at compile time, so it does NOT close the
// api-client.ts ↔ api.ts module cycle (api.ts statically imports api-client).
import type { RefreshTokenResponse } from './api'

/** The refresh endpoint never triggers the interceptor itself: its own 401
 * (expired/revoked JWT — unrecoverable per the contract annex) must not be
 * intercepted-and-refreshed, or the client would recurse. */
export const AUTH_REFRESH_ENDPOINT = '/v1/auth/refresh'

export function isRefreshEndpoint(endpoint: string): boolean {
  return endpoint === AUTH_REFRESH_ENDPOINT || endpoint.startsWith(`${AUTH_REFRESH_ENDPOINT}?`)
}

/** Single-flight promise: concurrent 401s all join the SAME refresh (one
 * POST total). Cleared on settlement so a LATER 401 may start a fresh
 * recovery — per-request "replay once" is enforced by api-client, not here. */
let inflightRefresh: Promise<boolean> | null = null

/** Extract the raw JWT from a `Bearer <token>` wire header; null when the
 * header is absent or not Bearer-shaped (no cascade comparison possible). */
function bearerTokenOf(header: string): string | null {
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

/** D-2 pass-1 (M2): deadline (ms) for the refresh POST — a black-holed
 * refresh must not wedge every 401 on the single flight. Default 10s;
 * injectable for tests via `setRefreshDeadlineForTests` (a getFreshToken
 * parameter cannot reach the REACTIVE path — api-client passes none). */
export const DEFAULT_REFRESH_DEADLINE_MS = 10_000
let refreshDeadlineMs = DEFAULT_REFRESH_DEADLINE_MS

/** Test-only seam for the refresh deadline (D-2 pass-1, M2). */
export function setRefreshDeadlineForTests(ms: number): void {
  refreshDeadlineMs = ms
}

/** Join the in-flight refresh, or start one. Resolves true when the store
 * now holds a rotated token (safe to replay); false when recovery failed
 * (the caller must surface its original ApiError). Never rejects.
 *
 * `failedAuthHeader` is the FAILED request's Authorization header (D-2
 * pass-1, M1 rotation-cascade gate): when its wire token DIFFERS from the
 * current store token, a prior rotation already completed and the store
 * moved on — do NOT refresh; resolve true so the caller replays with the
 * store token directly. Omit it on paths with no wire token (proactive). */
export function getFreshToken(failedAuthHeader?: string): Promise<boolean> {
  // M1 rotation-cascade gate: the wire token is a snapshot; the store is
  // freshest. Difference ⇒ the store token can only be NEWER (rotations are
  // monotonic), so refreshing would burn the just-minted JWT.
  if (failedAuthHeader) {
    const wireToken = bearerTokenOf(failedAuthHeader)
    const storeToken = useAuthStore.getState().token
    if (wireToken && storeToken && wireToken !== storeToken) {
      // D-2 pass-2 (2026-09-03): a straggler whose wire token is stale should
      // ride a pending rotation rather than replay with the token that
      // rotation is about to revoke.
      return inflightRefresh ?? Promise.resolve(true)
    }
  }

  if (!inflightRefresh) {
    inflightRefresh = performRefresh().finally(() => {
      inflightRefresh = null
    })
  }
  return inflightRefresh
}

async function performRefresh(): Promise<boolean> {
  // Hazard #1: the STORE token is the freshest rotation; the failed request's
  // own token may be the revoked one. No store session → nothing to rotate —
  // returning here also guarantees no refresh POST fires for logged-out 401s
  // (keeps them terminal; MSW unhandled-request strictness relies on it).
  const storeToken = useAuthStore.getState().token
  if (!storeToken) return false

  try {
    // Lazy import breaks the load-time cycle api-client.ts → this module →
    // api.ts → api-client.ts. The runtime function is `refreshToken()` from
    // '@/lib/api' (POSTs /v1/auth/refresh, skipAuth + explicit Bearer header).
    // M2: AbortSignal.timeout rides ApiRequestOptions (extends RequestInit) →
    // apiClient option spread → fetch; on abort the refresh POST rejects and
    // the catch below treats it like any other refresh failure (false).
    const { refreshToken } = await import('./api')
    const response: RefreshTokenResponse = await refreshToken(storeToken, {
      signal: AbortSignal.timeout(refreshDeadlineMs),
      // D-2 pass-3: a deadline abort rejects into apiClient's network-error
      // logger — suppress it (the recovery catch below is the owner of this
      // failure; no value in a raw abort-reason line per request).
      suppressNetworkErrorLog: true,
    })

    // Hazard #2: store action keeps sessionNonce + user, sets the auth cookie.
    useAuthStore.getState().refreshToken(response.token, response.user)
    return true
  } catch {
    // Refresh endpoint 401 (expired/revoked JWT) or network/throttle failure
    // — unrecoverable here. api-client surfaces the ORIGINAL ApiError to the
    // caller; nothing is logged here so the redacting logApiError path in
    // api-client stays the single 401 log site (PR #382 redact layer).
    return false
  }
}
