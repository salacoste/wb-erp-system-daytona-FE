'use client'

/**
 * OrderSyncStatus Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays sync status indicator with relative time.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md#AC4
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SyncStatusResponse } from '@/types/orders'

interface OrderSyncStatusProps {
  status?: SyncStatusResponse
  isLoading?: boolean
}

/** Get sync health based on minutes since last sync */
function getSyncHealth(lastSyncAt: string | null): {
  health: 'healthy' | 'degraded' | 'stale' | 'unhealthy'
  color: string
  label: string
} {
  if (!lastSyncAt) {
    return { health: 'unhealthy', color: 'bg-gray-400', label: 'Никогда' }
  }

  const lastSync = new Date(lastSyncAt)
  const now = new Date()
  const minutesSince = Math.floor((now.getTime() - lastSync.getTime()) / 60000)

  if (minutesSince < 5) {
    return { health: 'healthy', color: 'bg-green-500', label: 'Синхронизировано' }
  }
  if (minutesSince < 15) {
    return { health: 'degraded', color: 'bg-yellow-500', label: 'Давно' }
  }
  if (minutesSince < 30) {
    return { health: 'stale', color: 'bg-orange-500', label: 'Устарело' }
  }
  return { health: 'unhealthy', color: 'bg-red-500', label: 'Проблема' }
}

/** Format relative time in Russian */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'никогда'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин назад`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} ч назад`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} д назад`
}

/** Format future time in Russian */
function formatNextSync(dateStr: string | null): string {
  if (!dateStr) return 'не запланировано'

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()

  if (diffMs < 0) return 'просрочено'

  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'сейчас'
  if (diffMin < 60) return `через ${diffMin} мин`

  const diffHours = Math.floor(diffMin / 60)
  return `через ${diffHours} ч`
}

/**
 * OrderSyncStatus - Displays sync status with health indicator
 */
export function OrderSyncStatus({ status, isLoading }: OrderSyncStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2" data-testid="sync-status-skeleton">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        <span>Статус недоступен</span>
      </div>
    )
  }

  const { color, label } = getSyncHealth(status.lastSyncAt)
  const relativeTime = formatRelativeTime(status.lastSyncAt)
  const nextSyncTime = formatNextSync(status.nextSyncAt)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex cursor-help items-center gap-2 text-sm text-gray-500">
            <div className={cn('h-2 w-2 rounded-full', color)} aria-label={label} />
            <span>{relativeTime}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent size="md">
          <div className="space-y-1">
            <p>
              <strong>Статус:</strong> {label}
            </p>
            <p>
              <strong>Следующая:</strong> {nextSyncTime}
            </p>
            <p className="text-xs text-gray-400">{status.schedule}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
