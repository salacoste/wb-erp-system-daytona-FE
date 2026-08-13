'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LogoutButton } from '@/components/custom/LogoutButton'
import { SidebarCabinetInfo } from '@/components/custom/SidebarCabinetInfo'
import { ThemeToggle } from '@/components/custom/theme-toggle'
import { isNavigationItemActive, type NavigationItem } from '@/components/custom/sidebar-navigation'
import { cn } from '@/lib/utils'

interface MobileSidebarSheetProps {
  items: NavigationItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Mobile sidebar sheet with navigation items
 * Story 3.1: Main Dashboard Layout & Navigation
 */
export function MobileSidebarSheet({ items, open, onOpenChange }: MobileSidebarSheetProps) {
  const pathname = usePathname()

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 64rem)')
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) onOpenChange(false)
    }

    if (open && desktopQuery.matches) onOpenChange(false)
    desktopQuery.addEventListener('change', closeAtDesktop)

    return () => desktopQuery.removeEventListener('change', closeAtDesktop)
  }, [onOpenChange, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(16rem,100vw)] overflow-hidden bg-card p-0 motion-reduce:!animate-none motion-reduce:!transition-none"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation menu for WB Repricer System
        </SheetDescription>
        <div className="flex h-full min-h-0 flex-col bg-card">
          {/* Logo/Title */}
          <div className="flex h-16 shrink-0 items-center border-b px-4 pr-14 min-[20rem]:px-6">
            <h2 className="min-w-0 truncate text-lg font-semibold text-foreground">WB Repricer</h2>
          </div>

          <aside aria-label="Контекст кабинета">
            <SidebarCabinetInfo onNavigate={() => onOpenChange(false)} />
          </aside>

          {/* Navigation Items */}
          <nav
            className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4"
            aria-label="Main navigation"
          >
            {items.map(item => {
              const Icon = item.icon
              const active = isNavigationItemActive(pathname, item.href, items)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 min-h-[44px] text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="flex shrink-0 flex-col flex-wrap items-end justify-end gap-2 border-t p-3 [&_button]:min-h-11 [&_button]:min-w-11 min-[20rem]:flex-row min-[20rem]:items-center">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
