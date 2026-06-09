/**
 * DataAvailabilityBadge Component
 * Dashboard Data Availability Indicators
 *
 * Displays visual indicator showing data availability status for metrics.
 * Used to inform users which data is available in real-time vs pending weekly report.
 *
 * @see docs/request-backend/136-DAILY-DATA-AVAILABILITY-GUIDE.md
 */

'use client'

import { Clock, Loader2, Circle, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { DataAvailability } from '@/lib/week-report-utils'
import { getAvailabilityDisplayInfo } from '@/lib/week-report-utils'

/**
 * Props for DataAvailabilityBadge component
 */
export interface DataAvailabilityBadgeProps {
  /** Data availability status */
  status: DataAvailability
  /** Expected date for pending_week status */
  expectedDate?: Date
  /** Whether to show label text (default: true) */
  showLabel?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional className */
  className?: string
}

/** Icon mapping for each availability status */
const statusIcons: Record<DataAvailability, typeof Clock> = {
  realtime: Circle,
  delayed: Loader2,
  pending_week: Clock,
  unavailable: AlertCircle,
}

/** Color classes for each status */
const statusColors: Record<DataAvailability, { icon: string; bg: string; text: string }> = {
  realtime: {
    icon: 'text-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  delayed: {
    icon: 'text-yellow-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
  },
  pending_week: {
    icon: 'text-gray-400',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
  unavailable: {
    icon: 'text-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
}

/**
 * DataAvailabilityBadge displays the availability status of a metric.
 *
 * Visual design:
 * - `realtime`: Green dot with "В реальном времени"
 * - `delayed`: Yellow loader with "Задержка 1-2 дня"
 * - `pending_week`: Gray clock with "Ожидание отчёта (~{date})"
 * - `unavailable`: Red alert with "Недоступно"
 */
export function DataAvailabilityBadge({
  status,
  expectedDate,
  showLabel = true,
  size = 'sm',
  className,
}: DataAvailabilityBadgeProps): React.ReactElement {
  const Icon = statusIcons[status]
  const colors = statusColors[status]
  const displayInfo = getAvailabilityDisplayInfo(status, expectedDate)

  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  const ariaLabel = `${displayInfo.label}: ${displayInfo.description}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            'focus-visible:ring-primary transition-colors duration-150',
            colors.bg,
            colors.text,
            textSize,
            padding,
            className
          )}
          role="status"
          aria-label={ariaLabel}
          tabIndex={0}
        >
          <Icon
            className={cn(iconSize, colors.icon, status === 'delayed' && 'animate-spin')}
            aria-hidden="true"
          />
          {showLabel && <span>{displayInfo.label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" size="md">
        <div className="space-y-1">
          <div className="font-medium">{displayInfo.label}</div>
          <div className="text-xs text-gray-300">{displayInfo.description}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default DataAvailabilityBadge
