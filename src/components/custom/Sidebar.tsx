'use client'

import { usePathname } from 'next/navigation'
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
import { ROUTES } from '@/lib/routes'
import { LogoutButton } from './LogoutButton'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import { getUrgentSkuCount } from '@/lib/supply-planning-utils'

/**
 * Sidebar navigation component
 * Story 3.1: Main Dashboard Layout & Navigation
 * Story 6.2: Supply Planning navigation with badge (Epic 6)
 */
export function Sidebar() {
  const pathname = usePathname()

  // Fetch supply planning summary for urgent badge count (Story 6.2)
  const { data: supplyData } = useSupplyPlanning({})
  const urgentCount = supplyData?.summary ? getUrgentSkuCount(supplyData.summary) : 0

  const navigationItems = [
    {
      label: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: Home,
    },
    {
      label: 'COGS Management',
      href: ROUTES.COGS.ROOT,
      icon: Package,
    },
    {
      label: 'Cabinet Summary', // Story 6.4-FE: Cabinet Summary Dashboard
      href: ROUTES.ANALYTICS.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      label: 'Analytics',
      href: ROUTES.ANALYTICS.ROOT,
      icon: BarChart3,
    },
    {
      label: 'Storage', // Epic 24: Paid Storage Analytics
      href: ROUTES.ANALYTICS.STORAGE,
      icon: Warehouse,
    },
    {
      label: 'Планирование', // Epic 6: Supply Planning & Stockout Prevention
      href: ROUTES.ANALYTICS.SUPPLY_PLANNING,
      icon: PackageSearch,
      badge: urgentCount > 0 ? urgentCount : undefined,
    },
    {
      label: 'Юнит-экономика', // Epic 5: Unit Economics Analytics
      href: ROUTES.ANALYTICS.UNIT_ECONOMICS,
      icon: Calculator,
    },
    {
      label: 'Ликвидность', // Epic 7: Liquidity Analysis
      href: ROUTES.ANALYTICS.LIQUIDITY,
      icon: Droplets,
    },
    {
      label: 'Реклама', // Epic 33: Advertising Analytics
      href: ROUTES.ANALYTICS.ADVERTISING,
      icon: Megaphone,
    },
    {
      label: 'Уведомления', // Epic 34-FE: Telegram Notifications
      href: ROUTES.SETTINGS.NOTIFICATIONS,
      icon: Bell,
    },
    {
      label: 'Settings',
      href: ROUTES.SETTINGS.ROOT,
      icon: Settings,
    },
  ] as const

  const isActive = (href: string) => {
    // Dashboard: exact match only
    if (href === ROUTES.DASHBOARD) {
      return pathname === ROUTES.DASHBOARD
    }

    // Cabinet Summary: exact match for /analytics/dashboard (Story 6.4-FE)
    if (href === ROUTES.ANALYTICS.DASHBOARD) {
      return pathname.startsWith(ROUTES.ANALYTICS.DASHBOARD)
    }

    // Storage: exact match or starts with /analytics/storage
    if (href === ROUTES.ANALYTICS.STORAGE) {
      return pathname.startsWith(ROUTES.ANALYTICS.STORAGE)
    }

    // Supply Planning: prefix match for /analytics/supply-planning (Epic 6)
    if (href === ROUTES.ANALYTICS.SUPPLY_PLANNING) {
      return pathname.startsWith(ROUTES.ANALYTICS.SUPPLY_PLANNING)
    }

    // Unit Economics: prefix match for /analytics/unit-economics (Epic 5)
    if (href === ROUTES.ANALYTICS.UNIT_ECONOMICS) {
      return pathname.startsWith(ROUTES.ANALYTICS.UNIT_ECONOMICS)
    }

    // Liquidity: prefix match for /analytics/liquidity (Epic 7)
    if (href === ROUTES.ANALYTICS.LIQUIDITY) {
      return pathname.startsWith(ROUTES.ANALYTICS.LIQUIDITY)
    }

    // Advertising: prefix match for /analytics/advertising (Epic 33)
    if (href === ROUTES.ANALYTICS.ADVERTISING) {
      return pathname.startsWith(ROUTES.ANALYTICS.ADVERTISING)
    }

    // Analytics: match /analytics but NOT child routes (storage, dashboard, supply-planning, unit-economics, liquidity, advertising)
    if (href === ROUTES.ANALYTICS.ROOT) {
      return pathname.startsWith(ROUTES.ANALYTICS.ROOT) &&
             !pathname.startsWith(ROUTES.ANALYTICS.STORAGE) &&
             !pathname.startsWith(ROUTES.ANALYTICS.DASHBOARD) &&
             !pathname.startsWith(ROUTES.ANALYTICS.SUPPLY_PLANNING) &&
             !pathname.startsWith(ROUTES.ANALYTICS.UNIT_ECONOMICS) &&
             !pathname.startsWith(ROUTES.ANALYTICS.LIQUIDITY) &&
             !pathname.startsWith(ROUTES.ANALYTICS.ADVERTISING)
    }

    // Notifications: prefix match for /settings/notifications (Epic 34-FE)
    if (href === ROUTES.SETTINGS.NOTIFICATIONS) {
      return pathname.startsWith(ROUTES.SETTINGS.NOTIFICATIONS)
    }

    // Settings: match /settings but NOT child routes (notifications)
    if (href === ROUTES.SETTINGS.ROOT) {
      return pathname === ROUTES.SETTINGS.ROOT ||
             (pathname.startsWith(ROUTES.SETTINGS.ROOT) &&
              !pathname.startsWith(ROUTES.SETTINGS.NOTIFICATIONS))
    }

    // Default: prefix match
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r bg-white">
      <div className="flex h-full flex-col">
        {/* Logo/Title */}
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold text-gray-900">WB Repricer</h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const badge = 'badge' in item ? item.badge : undefined

            return (
              <Link
                key={item.href}
                href={item.href}
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
                <span className="flex-1">{item.label}</span>
                {/* Badge for urgent count (Story 6.2: Supply Planning) */}
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      'ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold',
                      active
                        ? 'bg-white text-red-600'
                        : 'bg-red-600 text-white'
                    )}
                    aria-label={`${badge} urgent items`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t p-3">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}

