'use client'

import { logger } from '@/lib/logger'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { refreshToken } from '@/lib/api'
import { isTokenExpired } from '@/lib/auth'

/**
 * Custom hook for authentication management
 * Handles automatic token refresh and session management
 */
export function useAuth() {
  const router = useRouter()
  // D-2 (PB-3, 2026-09-03): alias the STORE `refreshToken` action to avoid
  // the name clash with the `refreshToken()` API function from '@/lib/api'
  // (same-name modules rule, frontend/CLAUDE.md). The store action keeps
  // sessionNonce + user; `login()` would mint a new nonce and break in-flight
  // D-1 (Story 167.9) cabinet-create settlements — contract annex hazard #2
  // in docs/request-backend/230-auth-refresh-endpoint-missing.md.
  const { token, user, logout, refreshToken: refreshTokenStore } = useAuthStore()

  /**
   * Refresh token if it's expired or about to expire
   */
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!token) return false

    // Check if token is expired or about to expire
    if (isTokenExpired(token)) {
      try {
        const response = await refreshToken(token)
        if (!response.user && !user) {
          // No user available, just update token
          // This shouldn't happen, but handle gracefully
          logger.warn('Token refreshed but no user available')
          return false
        }
        // D-2 hazard #2: nonce-preserving store update — NEVER login() here.
        // (`?? undefined` narrows the store's `User | null` to the action's
        // `User | undefined` param; the guard above ensures a user exists.)
        refreshTokenStore(response.token, response.user ?? user ?? undefined)
        return true
      } catch (error) {
        // Refresh failed, logout user
        logger.error('Token refresh failed:', error)
        logout()
        router.push('/login')
        return false
      }
    }
    return true
  }, [token, user, logout, refreshTokenStore, router])

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
