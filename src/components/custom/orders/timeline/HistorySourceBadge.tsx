/**
 * HistorySourceBadge Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Badge indicating whether a history entry is from WB or local tracking.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC5
 */

import { Truck, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HistorySource = 'wb_native' | 'local'

export interface HistorySourceBadgeProps {
  /** Source of the history entry */
  source: HistorySource
  /** Additional CSS classes */
  className?: string
}

/**
 * Story 172.14-FE (wave 2): WB (special external source, legacy purple) uses
 * the theme's purpose-built hue-277 token status-pending; local (internal
 * system, legacy blue) stays the muted neutral — natively distinct sources.
 */
const SOURCE_CONFIG = {
  wb_native: {
    label: 'WB',
    ariaLabel: 'Источник: Wildberries',
    icon: Truck,
    color: 'text-status-pending',
    bgColor: 'bg-status-pending/10',
  },
  local: {
    label: 'Локальная',
    ariaLabel: 'Источник: Локальная система',
    icon: Database,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
}

/**
 * HistorySourceBadge - Shows source badge (WB or Local)
 */
export function HistorySourceBadge({ source, className }: HistorySourceBadgeProps) {
  const config = SOURCE_CONFIG[source]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium',
        config.color,
        config.bgColor,
        className
      )}
      aria-label={config.ariaLabel}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  )
}
