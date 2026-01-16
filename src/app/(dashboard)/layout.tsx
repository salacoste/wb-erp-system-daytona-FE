'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar } from '@/components/custom/Sidebar'
import { Navbar } from '@/components/custom/Navbar'
import { ROUTES } from '@/lib/routes'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { LogoutButton } from '@/components/custom/LogoutButton'
import Link from 'next/link'
import {
  Home,
  Package,
  BarChart3,
  Settings,
  Warehouse,
  LayoutDashboard,
  PackageSearch,
  Calculator,
  Droplets,
  Megaphone,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Dashboard layout for protected routes
 * Story 3.1: Main Dashboard Layout & Navigation
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, token } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist to rehydrate before checking auth
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Protect routes - redirect to login if not authenticated
  // Only check after hydration to avoid false redirects
  useEffect(() => {
    if (!isHydrated) return // Wait for hydration
    
    if (!isAuthenticated || !token) {
      const loginUrl = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`
      router.push(loginUrl)
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
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - скрыт на мобильных, занимает место в потоке */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area - занимает оставшееся место */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <div className="flex items-center gap-4 border-b bg-white px-4 py-4 lg:px-6">
          {/* Mobile Menu Button and Sheet */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <span
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Open menu"
                role="button"
                tabIndex={0}
              >
                <Menu className="h-5 w-5" />
              </span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Main navigation menu for WB Repricer System
              </SheetDescription>
              <div className="flex h-full flex-col bg-white">
                {/* Logo/Title */}
                <div className="flex h-16 items-center border-b border-gray-200 px-6 bg-white">
                  <h2 className="text-lg font-semibold text-gray-900">
                    WB Repricer
                  </h2>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1 px-3 py-4 bg-white overflow-y-auto" aria-label="Main navigation">
                  {[
                    { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
                    { label: 'COGS Management', href: ROUTES.COGS.ROOT, icon: Package },
                    { label: 'Cabinet Summary', href: ROUTES.ANALYTICS.DASHBOARD, icon: LayoutDashboard },
                    { label: 'Analytics', href: ROUTES.ANALYTICS.ROOT, icon: BarChart3 },
                    { label: 'Storage', href: ROUTES.ANALYTICS.STORAGE, icon: Warehouse },
                    { label: 'Планирование', href: ROUTES.ANALYTICS.SUPPLY_PLANNING, icon: PackageSearch },
                    { label: 'Юнит-экономика', href: ROUTES.ANALYTICS.UNIT_ECONOMICS, icon: Calculator },
                    { label: 'Ликвидность', href: ROUTES.ANALYTICS.LIQUIDITY, icon: Droplets },
                    { label: 'Реклама', href: ROUTES.ANALYTICS.ADVERTISING, icon: Megaphone },
                    { label: 'Уведомления', href: ROUTES.SETTINGS.NOTIFICATIONS, icon: Bell },
                    { label: 'Settings', href: ROUTES.SETTINGS.ROOT, icon: Settings },
                  ].map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href || pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          active
                            ? 'bg-[#C62828] text-white' /* WCAG AA: 5.48:1 contrast */
                            : 'text-gray-700 hover:bg-[#FFCDD2] hover:text-gray-900',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                {/* Logout Button */}
                <div className="border-t border-gray-200 p-3 bg-white">
                  <LogoutButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Navbar />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

