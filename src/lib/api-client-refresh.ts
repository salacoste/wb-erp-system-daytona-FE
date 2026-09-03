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

/** Join the in-flight refresh, or start one. Resolves true when the store
 * now holds a rotated token (safe to replay); false when recovery failed
 * (the caller must surface its original ApiError). Never rejects. */
export function getFreshToken(): Promise<boolean> {
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
    const { refreshToken } = await import('./api')
    const response: RefreshTokenResponse = await refreshToken(storeToken)

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
