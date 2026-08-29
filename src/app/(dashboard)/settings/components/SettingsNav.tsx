'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Building2,
  Calculator,
  Database,
  FileText,
  Menu,
  Settings,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  ownerOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.SETTINGS.ROOT, label: 'Обзор', icon: Settings },
  { href: ROUTES.SETTINGS.CABINET, label: 'Кабинет', icon: Building2 },
  { href: ROUTES.SETTINGS.NOTIFICATIONS, label: 'Уведомления', icon: Bell },
  { href: ROUTES.SETTINGS.TAX, label: 'Налоги', icon: Calculator },
  { href: ROUTES.SETTINGS.TARIFFS, label: 'Тарифы', icon: FileText, ownerOnly: true },
  { href: ROUTES.SETTINGS.EXPENSES, label: 'Расходы', icon: Wallet },
  { href: ROUTES.SETTINGS.BACKFILL, label: 'Импорт', icon: Database, ownerOnly: true },
]

const ITEM_CLASS_NAME =
  'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none'

function isItemActive(pathname: string, href: string): boolean {
  if (href === ROUTES.SETTINGS.ROOT) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface SettingsLinksProps {
  pathname: string
  isOwner: boolean
  onNavigate?: () => void
}

function SettingsLinks({ pathname, isOwner, onNavigate }: SettingsLinksProps) {
  return NAV_ITEMS.map(({ href, label, icon: Icon, ownerOnly }) => {
    const isActive = isItemActive(pathname, href)
    const isRestricted = ownerOnly && !isOwner

    if (isRestricted) {
      return (
        <div
          key={href}
          aria-disabled="true"
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            ITEM_CLASS_NAME,
            'cursor-not-allowed',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground/70'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{label}</span>
          <span className="text-right text-xs font-normal">Только для владельца</span>
        </div>
      )
    }

    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          ITEM_CLASS_NAME,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </Link>
    )
  })
}

export function SettingsNav({ className }: { className?: string }): React.ReactElement {
  const pathname = usePathname()
  const role = useAuthStore(state => state.user?.role)
  const [open, setOpen] = useState(false)
  const isOwner = role === 'Owner'

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 64rem)')
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }

    if (open && desktopQuery.matches) setOpen(false)
    desktopQuery.addEventListener('change', closeAtDesktop)

    return () => desktopQuery.removeEventListener('change', closeAtDesktop)
  }, [open])

  return (
    <aside className={cn('min-w-0', className)} aria-label="Навигация по настройкам">
      <nav className="hidden space-y-1 lg:block" aria-label="Разделы настроек">
        <SettingsLinks pathname={pathname} isOwner={isOwner} />
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 lg:hidden"
            aria-label="Открыть разделы настроек"
          >
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(20rem,100vw)] overflow-hidden p-0 motion-reduce:!animate-none motion-reduce:!transition-none"
        >
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="shrink-0 border-b px-4 pb-4 pr-14 pt-4 text-left">
              <SheetTitle>Разделы настроек</SheetTitle>
              <SheetDescription>
                Выберите раздел для настройки рабочего пространства.
              </SheetDescription>
            </SheetHeader>
            <nav
              className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3"
              aria-label="Разделы настроек"
            >
              <SettingsLinks
                pathname={pathname}
                isOwner={isOwner}
                onNavigate={() => setOpen(false)}
              />
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </aside>
  )
}
