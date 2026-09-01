'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { SidebarCabinetInfo } from './SidebarCabinetInfo'
import { ThemeToggle } from './theme-toggle'
import { isNavigationItemActive } from './sidebar-navigation'
import type { NavigationItem } from './sidebar-navigation'

/**
 * Sidebar navigation component
 * Story 3.1: Main Dashboard Layout & Navigation
 * Story 6.2: Supply Planning navigation with badge (Epic 6)
 * Story 44.4: Price Calculator navigation (Epic 44)
 */
interface SidebarProps {
  items: NavigationItem[]
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex h-screen w-64 flex-shrink-0 flex-col border-r bg-card"
      aria-label="Основная навигация"
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Logo/Title */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h2 className="text-lg font-semibold text-foreground">WB Repricer</h2>
          <ThemeToggle />
        </div>

        {/* Cabinet Info: seller name + Jam badge */}
        <aside aria-label="Контекст кабинета">
          <SidebarCabinetInfo />
        </aside>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4" aria-label="Main navigation">
          {items.map(item => {
            const Icon = item.icon
            const active = isNavigationItemActive(pathname, item.href, items)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50',
                  active ? 'bg-accent' : 'transparent',
                  active ? 'text-accent-foreground' : 'text-muted-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-auto">
                    <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
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
