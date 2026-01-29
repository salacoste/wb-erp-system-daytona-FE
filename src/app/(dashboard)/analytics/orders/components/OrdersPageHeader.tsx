/**
 * Orders Analytics Page Header
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Page header with title, description, and breadcrumbs.
 */

'use client'

import Link from 'next/link'
import { ShoppingCart, ChevronRight, Home } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

export function OrdersPageHeader() {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link
          href={ROUTES.DASHBOARD}
          className="hover:text-foreground transition-colors flex items-center"
        >
          <Home className="h-4 w-4 mr-1" />
          Главная
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link href={ROUTES.ANALYTICS.ROOT} className="hover:text-foreground transition-colors">
          Аналитика
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground font-medium">Заказы FBS</span>
      </nav>

      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Аналитика заказов FBS</h1>
          <p className="text-muted-foreground">
            Анализ трендов, сезонности и сравнение периодов по заказам FBS за 365 дней
          </p>
        </div>
      </div>
    </div>
  )
}
