'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
// D-2 pass-1 (OQ1, 2026-09-03): the proactive path routes through the SAME
// single-flight rotation core as the reactive 401 interceptor — one rotation
// engine kills the dual-rotation class (two independent refresh flows could
// race and mint two rotations for one session). Import safety: this module
// imports authStore only at load time (the api.ts import inside it is lazy +
// type-only), so no new module cycle.
import { getFreshToken } from '@/lib/api-client-refresh'
import { isTokenExpired } from '@/lib/auth'

/**
 * Custom hook for authentication management
 * Handles automatic token refresh and session management
 */
export function useAuth() {
  const router = useRouter()
  // D-2 (PB-3, 2026-09-03): the store update itself happens INSIDE
  // getFreshToken via the nonce-preserving `refreshToken(token, user)` STORE
  // ACTION — it keeps sessionNonce + user; `login()` would mint a new nonce
  // and break in-flight D-1 (Story 167.9) cabinet-create settlements —
  // contract annex hazard #2 in docs/request-backend/230-auth-refresh-endpoint-missing.md.
  const { token, user, logout } = useAuthStore()

  /**
   * Refresh token if it's expired or about to expire
   */
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!token) return false

    // Check if token is expired or about to expire
    if (isTokenExpired(token)) {
      // OQ1: no failed-header arg — proactive has no wire token to compare
      // against the store (the M1 cascade gate only applies to reactive 401s).
      // On true, the store already holds the rotated token (the update
      // happened inside getFreshToken; the hook must NOT re-update it).
      const refreshed = await getFreshToken()
      if (refreshed) return true
      // Recovery failed (refresh 401 / network / M2 deadline abort) → logout.
      logout()
      router.push('/login')
      return false
    }
    return true
  }, [token, logout, router])

  /**
   * Check and refresh token on mount and periodically
   */
  useEffect(() => {
    if (!token) return

    // Check token immediately
    refreshTokenIfNeeded()

    // Set up interval to check token every 5 minutes
    const interval = setInterval(
      () => {
        refreshTokenIfNeeded()
      },
      5 * 60 * 1000
    ) // 5 minutes

    return () => clearInterval(interval)
  }, [token, refreshTokenIfNeeded])

  return {
    isAuthenticated: !!token && !isTokenExpired(token),
    token,
    user,
    refreshToken: refreshTokenIfNeeded,
  }
}
