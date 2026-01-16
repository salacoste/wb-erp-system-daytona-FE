'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAdvertisingSyncStatus } from '@/hooks/useAdvertisingAnalytics'
import {
  deriveHealthStatus,
  type HealthStatus,
  type SyncTaskStatus,
} from '@/types/advertising-analytics'

// ============================================================================
// Health Status Configuration
// ============================================================================

interface HealthStatusConfig {
  /** Russian label for the status */
  label: string
  /** Dot color class (Tailwind) */
  dotColor: string
  /** Description text */
  description: string
}

/**
 * Health status configuration.
 *
 * Note: Backend marks sync as "stale" after 26 hours (not 24h).
 * Rationale: 24h daily sync schedule + 2h buffer for network delays and retry attempts.
 */
const healthStatusConfig: Record<HealthStatus, HealthStatusConfig> = {
  healthy: {
    label: 'Синхронизировано',
    dotColor: 'bg-green-500',
    description: 'Данные актуальны',
  },
  degraded: {
    label: 'Частичная синхронизация',
    dotColor: 'bg-yellow-500',
    description: 'Есть ошибки, но синхронизация работает',
  },
  unhealthy: {
    label: 'Ошибка синхронизации',
    dotColor: 'bg-red-500',
    description: 'Синхронизация не работает',
  },
  stale: {
    label: 'Данные устарели',
    dotColor: 'bg-orange-500',
    // 26h = 24h daily sync + 2h buffer for delays
    description: 'Нет синхронизации более 26 часов',
  },
}

/**
 * Sync task status configuration.
 * @see Request #72 backend-response for status values
 */
const syncTaskStatusConfig: Record<SyncTaskStatus, string> = {
  syncing: 'Синхронизация...',
  completed: 'Завершено',
  failed: 'Ошибка',
  idle: 'Ожидание',
}

// ============================================================================
// Sync Status Indicator Component
// ============================================================================

/**
 * Sync Status Indicator Component
 * Story 33.6-FE: Sync Status Display
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Health status colored dot (AC1)
 * - Last sync relative time (AC2)
 * - Tooltip with sync details (AC3)
 * - Auto-refresh every 60s (AC4)
 * - Accessible (AC5)
 *
 * Updated for backend response format (Request #72):
 * - Uses deriveHealthStatus() to calculate health from response
 * - Handles camelCase field names from backend
 */
export function SyncStatusIndicator() {
  // Fetch sync status with 60s polling (AC4)
  const { data, isLoading, error } = useAdvertisingSyncStatus({
    refetchInterval: 60000, // 1 minute
    refetchIntervalInBackground: false, // Stop polling when tab is hidden
  })

  // Loading state
  if (isLoading) {
    return <Skeleton className="w-32 h-5" />
  }

  // Error state - show gracefully without blocking page
  if (error || !data) {
    return (
      <span className="text-sm text-muted-foreground">
        Статус недоступен
      </span>
    )
  }

  // Derive health status from response (backend doesn't return health_status directly)
  const healthStatus = deriveHealthStatus(data)
  const config = healthStatusConfig[healthStatus]

  // Format relative time for last sync
  const lastSyncText = data.lastSyncAt
    ? formatDistanceToNow(new Date(data.lastSyncAt), {
        addSuffix: true,
        locale: ru,
      })
    : 'никогда'

  // Format next sync time
  const nextSyncText = data.nextScheduledSync
    ? format(new Date(data.nextScheduledSync), 'HH:mm', { locale: ru })
    : '—'

  // Get task status label
  const taskStatusLabel = syncTaskStatusConfig[data.status] || data.status

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            aria-label={`Статус синхронизации: ${config.label}. Обновлено ${lastSyncText}`}
          >
            <span
              className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dotColor)}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              Обновлено {lastSyncText}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-64" align="end">
          <div className="space-y-2">
            {/* Status header */}
            <div className="flex items-center gap-2 font-medium">
              <span
                className={cn('w-2 h-2 rounded-full', config.dotColor)}
                aria-hidden="true"
              />
              {config.label}
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>

            {/* Sync statistics */}
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус задачи:</span>
                <span>{taskStatusLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Кампаний:</span>
                <span>{data.campaignsSynced.toLocaleString('ru-RU')}</span>
              </div>
              {data.dataAvailableFrom && data.dataAvailableTo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Данные:</span>
                  <span className="text-right">
                    {data.dataAvailableFrom} — {data.dataAvailableTo}
                  </span>
                </div>
              )}
            </div>

            {/* Last task error (if any) */}
            {data.lastTask?.error && (
              <div className="border-t pt-2 text-sm text-red-600">
                Ошибка: {data.lastTask.error}
              </div>
            )}

            {/* Next sync time */}
            <div className="border-t pt-2 text-sm text-muted-foreground">
              След. синхронизация: {nextSyncText}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
