'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'

/**
 * Root page - redirects to dashboard if authenticated, otherwise to login
 */
export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    // Wait a bit for Zustand to hydrate
    const timer = setTimeout(() => {
      if (isAuthenticated && token) {
        router.push(ROUTES.DASHBOARD)
      } else {
        router.push(ROUTES.LOGIN)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, token, router])

  // Show loading while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Загрузка...</div>
    </div>
  )
}

