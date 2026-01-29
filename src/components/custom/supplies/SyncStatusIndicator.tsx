/**
 * SyncStatusIndicator Component
 * Story 53.7-FE: Status Polling & Sync
 * Epic 53-FE: Supply Management UI
 *
 * Displays last sync time, countdown to next sync, and manual sync button.
 * Rate limited: 1 manual sync per 5 minutes.
 */

'use client'

import { RefreshCw, Clock, Check, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface SyncStatusIndicatorProps {
  /** Last sync timestamp (ISO string or Date) */
  lastSyncAt: string | Date | null
  /** Next available sync time (ISO string, for rate limit) */
  nextSyncAt?: string | null
  /** Whether sync is in progress */
  isLoading?: boolean
  /** Whether manual sync can be triggered */
  canSync?: boolean
  /** Seconds until manual sync is available */
  rateLimitCountdown?: number
  /** Seconds until next auto-poll */
  nextPollIn?: number
  /** Last sync result - success/error */
  syncResult?: 'success' | 'error' | null
  /** Number of status changes in last sync */
  changesCount?: number
  /** Callback for manual sync button */
  onSync?: () => void
  /** Show compact version without button */
  compact?: boolean
}

/**
 * Format countdown seconds as MM:SS
 */
function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format last sync time as relative string
 */
function formatLastSync(dateInput: string | Date | null): string {
  if (!dateInput) return 'Не синхронизировано'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return formatDistanceToNow(date, { locale: ru, addSuffix: true })
}

/**
 * SyncStatusIndicator - Shows sync status with manual sync button
 */
export function SyncStatusIndicator({
  lastSyncAt,
  nextSyncAt: _nextSyncAt,
  isLoading = false,
  canSync = true,
  rateLimitCountdown = 0,
  nextPollIn,
  syncResult,
  changesCount,
  onSync,
  compact = false,
}: SyncStatusIndicatorProps) {
  const showRateLimitCountdown = rateLimitCountdown > 0
  const showNextPollCountdown =
    !showRateLimitCountdown && nextPollIn !== undefined && nextPollIn > 0

  // Determine countdown to display (rate limit takes priority)
  const countdownSeconds = showRateLimitCountdown ? rateLimitCountdown : (nextPollIn ?? 0)
  const countdownLabel = showRateLimitCountdown
    ? 'Следующее обновление через'
    : 'Авто-обновление через'

  return (
    <div className="flex items-center gap-3">
      {/* Sync status indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        ) : syncResult === 'success' ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : syncResult === 'error' ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}

        <span className="hidden sm:inline">Синхронизировано: {formatLastSync(lastSyncAt)}</span>
        <span className="sm:hidden">{formatLastSync(lastSyncAt)}</span>

        {/* Changes count badge */}
        {changesCount !== undefined && changesCount > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {changesCount} изм.
          </span>
        )}
      </div>

      {/* Countdown display */}
      {(showRateLimitCountdown || showNextPollCountdown) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                <Clock className="h-3 w-3" />
                <span>{formatCountdown(countdownSeconds)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{countdownLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Manual sync button */}
      {!compact && onSync && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={!canSync || isLoading}
                className="h-8 gap-1.5"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                <span className="hidden sm:inline">Обновить статусы</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!canSync && rateLimitCountdown > 0 ? (
                <p>Доступно через {formatCountdown(rateLimitCountdown)}</p>
              ) : (
                <p>Синхронизировать статусы поставок с WB</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export default SyncStatusIndicator
