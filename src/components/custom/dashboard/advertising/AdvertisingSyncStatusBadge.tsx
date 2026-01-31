/**
 * AdvertisingSyncStatusBadge Component
 * Story 63.3-FE: Advertising Sync Status Badge
 *
 * Displays sync status indicator for advertising data in dashboard widget.
 *
 * Features:
 * - Status color coding (5 states)
 * - Tooltip with sync details
 * - Auto-refresh with polling
 * - Responsive (icon-only on mobile)
 * - Accessible (aria-label, keyboard focus)
 *
 * @see docs/stories/epic-63/story-63.3-fe-advertising-sync-status.md
 */

'use client'

import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Clock, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAdvertisingSyncStatusBadge } from '@/hooks/useAdvertisingSyncStatusBadge'
import { getSyncStatusConfig } from '@/lib/sync-status-config'
import { SyncStatusTooltipContent } from './SyncStatusTooltipContent'
import type {
  ExtendedSyncTaskStatus,
  ExtendedSyncStatusResponse,
} from '@/types/advertising-sync-status'

/**
 * Props for AdvertisingSyncStatusBadge component.
 */
export interface AdvertisingSyncStatusBadgeProps {
  /** Custom class name for the badge */
  className?: string
  /** Whether to enable auto-refresh polling (default: true) */
  enablePolling?: boolean
  /** Polling interval in milliseconds (default: 60000) */
  pollingInterval?: number
}

/** Icon mapping for each sync status */
const statusIcons: Record<ExtendedSyncTaskStatus, typeof Clock> = {
  idle: Clock,
  syncing: Loader2,
  completed: CheckCircle2,
  partial_success: AlertTriangle,
  failed: XCircle,
}

/**
 * AdvertisingSyncStatusBadge displays the current sync status
 * of advertising data in a compact badge format.
 *
 * AC1: Badge in widget header with relative time
 * AC2: Color-coded status (5 states)
 * AC3: Tooltip with full details
 * AC4: Auto-refresh every 60s
 * AC5: API integration with caching
 * AC6: Accessible with aria-label
 */
export function AdvertisingSyncStatusBadge({
  className,
  enablePolling = true,
  pollingInterval = 60000,
}: AdvertisingSyncStatusBadgeProps) {
  const { data, isLoading, error } = useAdvertisingSyncStatusBadge({
    enabled: enablePolling,
    refetchInterval: pollingInterval,
  })

  // AC4: Loading skeleton during initial fetch
  if (isLoading) {
    return <Skeleton className="w-32 h-6 rounded-full" />
  }

  // AC5: Graceful fallback if API unavailable
  if (error || !data) {
    return (
      <span className="text-xs text-muted-foreground" role="status">
        Статус недоступен
      </span>
    )
  }

  return <SyncStatusBadgeContent data={data} className={className} />
}

/**
 * Internal component for badge content (separated for readability).
 */
function SyncStatusBadgeContent({
  data,
  className,
}: {
  data: ExtendedSyncStatusResponse
  className?: string
}) {
  const config = getSyncStatusConfig(data.status)
  const Icon = statusIcons[data.status] ?? Clock

  // Format relative time for badge display
  const lastSyncText = data.lastSyncAt
    ? formatDistanceToNow(new Date(data.lastSyncAt), { addSuffix: true, locale: ru })
    : 'никогда'

  // Build aria-label for accessibility (AC6)
  const ariaLabel = `Статус синхронизации: ${config.label}. Последняя синхронизация ${lastSyncText}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary',
            'transition-colors duration-150',
            config.bgColor,
            config.color,
            className
          )}
          aria-label={ariaLabel}
          type="button"
        >
          <Icon className={cn('w-3 h-3', config.animate && 'animate-spin')} aria-hidden="true" />
          {/* AC1: Responsive - icon only on mobile */}
          <span className="hidden sm:inline">{lastSyncText}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-64 p-0" side="bottom" size="lg">
        <SyncStatusTooltipContent data={data} config={config} Icon={Icon} />
      </TooltipContent>
    </Tooltip>
  )
}
