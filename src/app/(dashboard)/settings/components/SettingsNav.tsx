'use client'

/**
 * SettingsNav — 2-col nav rail for the /settings/* pages (TZ-13).
 * Shows on the left (desktop) / top-scroll (mobile) with active-page highlighting.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Building2, Calculator, Database, Wallet, FileText } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.SETTINGS.CABINET, label: 'Кабинет', icon: Building2 },
  { href: ROUTES.SETTINGS.NOTIFICATIONS, label: 'Уведомления', icon: Bell },
  { href: ROUTES.SETTINGS.TAX, label: 'Налоги', icon: Calculator },
  { href: ROUTES.SETTINGS.TARIFFS, label: 'Тарифы', icon: FileText },
  { href: ROUTES.SETTINGS.EXPENSES, label: 'Расходы', icon: Wallet },
  { href: ROUTES.SETTINGS.BACKFILL, label: 'Импорт', icon: Database },
]

export function SettingsNav({ className }: { className?: string }): React.ReactElement {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-wrap gap-1 lg:flex-col', className)} aria-label="Настройки">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
