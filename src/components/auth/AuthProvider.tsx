'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Auth provider component
 * Handles automatic token refresh and session management
 * Should be used in the root layout
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuth() // This hook handles token refresh automatically

  return <>{children}</>
}

