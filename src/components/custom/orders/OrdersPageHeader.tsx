/**
 * OrdersPageHeader Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Page header with title, subtitle, sync button and status.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC2
 */

'use client'

import { Package, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface OrdersPageHeaderProps {
  /** Last sync timestamp (ISO string) */
  lastSyncAt: string | null
  /** Whether sync is in progress */
  isSyncing: boolean
  /** Callback to trigger sync */
  onSync: () => void
}

/**
 * Format last sync time for display
 */
function formatSyncTime(dateStr: string | null): string {
  if (!dateStr) return 'Не синхронизировано'

  const date = new Date(dateStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `Синхр: ${formatDate(date)} ${hours}:${minutes}`
}

/**
 * OrdersPageHeader - Page header with title and sync controls
 */
export function OrdersPageHeader({ lastSyncAt, isSyncing, onSync }: OrdersPageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      {/* Title section */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Заказы FBS</h1>
          <p className="text-sm text-muted-foreground">
            Управление заказами и отслеживание статусов
          </p>
        </div>
      </div>

      {/* Sync controls */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{formatSyncTime(lastSyncAt)}</span>
        <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>
    </div>
  )
}
