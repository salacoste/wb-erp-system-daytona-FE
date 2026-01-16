'use client'

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
  const { token, user, login, logout } = useAuthStore()

  /**
   * Refresh token if it's expired or about to expire
   */
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!token) return false

    // Check if token is expired or about to expire
    if (isTokenExpired(token)) {
      try {
        const response = await refreshToken(token)
        // Update token in store
        if (response.user) {
          login(response.user, response.token)
        } else if (user) {
          // Keep existing user, just update token
          login(user, response.token)
        } else {
          // No user available, just update token
          // This shouldn't happen, but handle gracefully
          console.warn('Token refreshed but no user available')
          return false
        }
        return true
      } catch (error) {
        // Refresh failed, logout user
        console.error('Token refresh failed:', error)
        logout()
        router.push('/login')
        return false
      }
    }
    return true
  }, [token, user, login, logout, router])

  /**
   * Check and refresh token on mount and periodically
   */
  useEffect(() => {
    if (!token) return

    // Check token immediately
    refreshTokenIfNeeded()

    // Set up interval to check token every 5 minutes
    const interval = setInterval(() => {
      refreshTokenIfNeeded()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [token, refreshTokenIfNeeded])

  return {
    isAuthenticated: !!token && !isTokenExpired(token),
    token,
    user,
    refreshToken: refreshTokenIfNeeded,
  }
}

