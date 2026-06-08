'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Menu,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LogoutButton } from '@/components/custom/LogoutButton'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

/**
 * Navigation items for mobile sidebar sheet
 * Extracted from layout.tsx for file size compliance.
 */
const NAV_ITEMS = [
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
]

interface MobileSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Mobile sidebar sheet with navigation items
 * Story 3.1: Main Dashboard Layout & Navigation
 */
export function MobileSidebarSheet({ open, onOpenChange }: MobileSidebarSheetProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            <h2 className="text-lg font-semibold text-gray-900">WB Repricer</h2>
          </div>

          {/* Navigation Items */}
          <nav
            className="flex-1 space-y-1 px-3 py-4 bg-white overflow-y-auto"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? 'bg-[#C62828] text-white' /* WCAG AA: 5.48:1 contrast */
                      : 'text-gray-700 hover:bg-[#FFCDD2] hover:text-gray-900'
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
  )
}
