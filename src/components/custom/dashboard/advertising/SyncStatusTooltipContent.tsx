/**
 * SyncStatusTooltipContent Component
 * Story 63.3-FE: Advertising Sync Status Badge - Tooltip Content
 *
 * Extracted from AdvertisingSyncStatusBadge to maintain file size limits.
 * Contains tooltip content with full sync details.
 *
 * @see docs/stories/epic-63/story-63.3-fe-advertising-sync-status.md
 */

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSyncStatusConfig } from '@/lib/sync-status-config'
import type { ExtendedSyncStatusResponse } from '@/types/advertising-sync-status'

/**
 * Props for SyncStatusTooltipContent component.
 */
export interface SyncStatusTooltipContentProps {
  /** Sync status data from API */
  data: ExtendedSyncStatusResponse
  /** Status configuration with colors and labels */
  config: ReturnType<typeof getSyncStatusConfig>
  /** Icon component to display */
  Icon: typeof Clock
}

/**
 * Tooltip content with full sync details.
 * AC3: Shows timestamp, next sync, campaigns, data period.
 */
export function SyncStatusTooltipContent({ data, config, Icon }: SyncStatusTooltipContentProps) {
  return (
    <div className="p-3 space-y-2">
      {/* Status Header */}
      <div className="flex items-center gap-2 font-medium">
        <Icon className={cn('w-4 h-4', config.color)} aria-hidden="true" />
        <span>{config.label}</span>
      </div>
      <p className="text-sm text-muted-foreground">{config.description}</p>

      {/* Sync Details */}
      <div className="border-t pt-2 space-y-1 text-sm">
        <DetailRow
          label="Последняя синхр."
          value={
            data.lastSyncAt
              ? format(new Date(data.lastSyncAt), 'dd.MM.yyyy HH:mm', { locale: ru })
              : '—'
          }
        />
        <DetailRow
          label="Следующая"
          value={format(new Date(data.nextScheduledSync), 'HH:mm', { locale: ru })}
        />
        <DetailRow label="Кампаний" value={String(data.campaignsSynced)} />
      </div>

      {/* Data Availability Period */}
      {data.dataAvailableFrom && data.dataAvailableTo && (
        <div className="border-t pt-2 text-sm">
          <span className="text-muted-foreground">Данные доступны:</span>
          <div className="mt-1">
            {format(new Date(data.dataAvailableFrom), 'dd.MM.yyyy', { locale: ru })} —{' '}
            {format(new Date(data.dataAvailableTo), 'dd.MM.yyyy', { locale: ru })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Props for DetailRow component.
 */
export interface DetailRowProps {
  /** Label text for the row */
  label: string
  /** Value text for the row */
  value: string
}

/**
 * Helper component for detail rows in tooltip.
 * Displays a label-value pair in a justified layout.
 */
export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
    </div>
  )
}
