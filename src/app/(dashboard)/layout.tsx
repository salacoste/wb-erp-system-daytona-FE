'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/custom/Sidebar'
import { Navbar } from '@/components/custom/Navbar'
import { TokenHealthBanner } from '@/components/custom/dashboard/TokenHealthBanner'
import { ROUTES } from '@/lib/routes'
import { MobileSidebarSheet } from './layout/MobileSidebarSheet'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import { getUrgentSkuCount } from '@/lib/supply-planning-utils'
import { resolveNavigationItems } from '@/components/custom/sidebar-navigation'
import { STORAGE_EVENT_KEY } from '@/stores/authStoreHelpers'

/**
 * Dashboard layout for protected routes
 * Story 3.1: Main Dashboard Layout & Navigation
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, token, user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const hadAuthenticatedSessionRef = useRef(isAuthenticated && Boolean(token))
  const crossTabLogoutRef = useRef(false)
  const { data: supplyData } = useSupplyPlanning(
    {},
    { enabled: isHydrated && isAuthenticated && Boolean(token) }
  )
  const urgentCount = supplyData?.summary ? getUrgentSkuCount(supplyData.summary) : 0
  const navigationItems = resolveNavigationItems({ role: user?.role, urgentCount })

  // Wait for Zustand persist to rehydrate before checking auth
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const markCrossTabLogout = (event: StorageEvent) => {
      if (event.key === STORAGE_EVENT_KEY && !event.newValue) crossTabLogoutRef.current = true
    }

    window.addEventListener('storage', markCrossTabLogout)
    return () => window.removeEventListener('storage', markCrossTabLogout)
  }, [])

  // Client-side auth fallback — covers stale cookie + missing localStorage scenario.
  // Must clear cookie first to prevent redirect loop:
  // dashboard → middleware sees cookie → pass → layout: no localStorage → /login
  // → middleware sees cookie → redirect back to /dashboard → loop
  useEffect(() => {
    if (!isHydrated) return
    const needsShellRedirect =
      (!isAuthenticated || !token) &&
      (!hadAuthenticatedSessionRef.current || crossTabLogoutRef.current)

    if (needsShellRedirect) {
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
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-background px-4 py-3 text-foreground shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Перейти к основному содержимому
      </a>
      {/* Desktop Sidebar - скрыт на мобильных, занимает место в потоке */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar items={navigationItems} />
      </div>

      {/* Main Content Area - занимает оставшееся место */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="flex items-center gap-1 border-b bg-card px-2 py-4 min-[20rem]:gap-4 min-[20rem]:px-4 lg:px-6">
          {/* Mobile Menu Button and Sheet */}
          <MobileSidebarSheet
            items={navigationItems}
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
          />

          <Navbar />
        </header>

        <TokenHealthBanner />

        {/* Page Content - overscroll-contain prevents elastic scrolling artifacts */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-muted/50 overscroll-y-contain"
        >
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
