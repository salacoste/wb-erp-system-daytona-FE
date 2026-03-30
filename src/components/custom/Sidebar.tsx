'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { SidebarCabinetInfo } from './SidebarCabinetInfo'
import { useSupplyPlanning } from '@/hooks/useSupplyPlanning'
import { getUrgentSkuCount } from '@/lib/supply-planning-utils'
import { useAuth } from '@/hooks/useAuth'
import { NAVIGATION_ITEMS } from './sidebar-navigation'
import type { NavigationItem } from './sidebar-navigation'

/**
 * Sidebar navigation component
 * Story 3.1: Main Dashboard Layout & Navigation
 * Story 6.2: Supply Planning navigation with badge (Epic 6)
 * Story 44.4: Price Calculator navigation (Epic 44)
 */
export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Fetch supply planning summary for urgent badge count (Story 6.2)
  const { data: supplyData } = useSupplyPlanning({})
  const urgentCount = supplyData?.summary ? getUrgentSkuCount(supplyData.summary) : 0

  // Check if user is admin (Owner role) for admin-only menu items (Epic 52-FE)
  const isAdmin = user?.role === 'Owner'

  // Build runtime navigation: filter admin items, patch dynamic badges
  const items: NavigationItem[] = NAVIGATION_ITEMS.filter(item => !item.adminOnly || isAdmin).map(
    item => {
      if (item.href === '/analytics/supply-planning' && urgentCount > 0) {
        return { ...item, badge: urgentCount }
      }
      return item
    }
  )

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r bg-white">
      <div className="flex h-full min-h-0 flex-col">
        {/* Logo/Title */}
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold text-gray-900">WB Repricer</h2>
        </div>

        {/* Cabinet Info: seller name + Jam badge */}
        <SidebarCabinetInfo />

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4" aria-label="Main navigation">
          {items.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50',
                  pathname === item.href ? 'bg-accent' : 'transparent',
                  pathname === item.href ? 'text-accent-foreground' : 'text-muted-foreground'
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
