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
  DollarSign,
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
 * Story 44.4: Price Calculator navigation (Epic 44)
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
      label: 'Price Calculator', // Epic 44: Price Calculator UI
      href: '/cogs/price-calculator',
      icon: DollarSign,
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
  ]

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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50',
                  pathname === item.href ? 'bg-accent' : 'transparent',
                  pathname === item.href ? 'text-accent-foreground' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto">
                    <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t p-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
