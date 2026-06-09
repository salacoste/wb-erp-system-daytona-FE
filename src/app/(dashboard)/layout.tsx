'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/custom/Sidebar'
import { Navbar } from '@/components/custom/Navbar'
import { TokenHealthBanner } from '@/components/custom/dashboard/TokenHealthBanner'
import { ROUTES } from '@/lib/routes'
import { MobileSidebarSheet } from './layout/MobileSidebarSheet'

/**
 * Dashboard layout for protected routes
 * Story 3.1: Main Dashboard Layout & Navigation
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, token } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist to rehydrate before checking auth
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Client-side auth fallback — covers stale cookie + missing localStorage scenario.
  // Must clear cookie first to prevent redirect loop:
  // dashboard → middleware sees cookie → pass → layout: no localStorage → /login
  // → middleware sees cookie → redirect back to /dashboard → loop
  useEffect(() => {
    if (!isHydrated) return
    if (!isAuthenticated || !token) {
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.replace(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, token, router, pathname, isHydrated])

  // Don't render layout if not hydrated yet (prevents flash of empty page)
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  // Don't render layout if not authenticated (will redirect)
  if (!isAuthenticated || !token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Перенаправление на страницу входа...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Desktop Sidebar - скрыт на мобильных, занимает место в потоке */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area - занимает оставшееся место */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <div className="flex items-center gap-4 border-b bg-card px-4 py-4 lg:px-6">
          {/* Mobile Menu Button and Sheet */}
          <MobileSidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />

          <Navbar />
        </div>

        <TokenHealthBanner />

        {/* Page Content - overscroll-contain prevents elastic scrolling artifacts */}
        <main className="flex-1 overflow-y-auto bg-muted/50 overscroll-y-contain">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
