'use client'

import Link from 'next/link'
import { Megaphone, ChevronRight } from 'lucide-react'
import { SyncStatusIndicator } from './SyncStatusIndicator'

/**
 * Advertising Analytics Page Header
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Story 33.6-FE: Sync Status Display
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Includes:
 * - Breadcrumbs: Главная > Аналитика > Реклама
 * - Title with Megaphone icon
 * - Sync status indicator with health dot and tooltip
 */
export function AdvertisingPageHeader() {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs (AC1) */}
      <nav
        className="flex items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Главная
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link
          href="/analytics"
          className="hover:text-foreground transition-colors"
        >
          Аналитика
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-foreground font-medium">Реклама</span>
      </nav>

      {/* Title Row (AC2) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Рекламная аналитика
            </h1>
            <p className="text-sm text-muted-foreground">
              Анализ эффективности рекламных кампаний
            </p>
          </div>
        </div>

        {/* Sync Status Indicator (Story 33.6-fe) */}
        <SyncStatusIndicator />
      </div>
    </div>
  )
}
