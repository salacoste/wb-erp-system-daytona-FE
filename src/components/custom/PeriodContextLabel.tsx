/**
 * PeriodContextLabel Component
 * Story 60.7-FE: Period Context Label
 *
 * Displays the current period and last refresh time.
 * Supports week and month formats with Russian locale.
 * Auto-updates relative time every 60 seconds.
 *
 * @see docs/stories/epic-60/story-60.7-fe-period-context-label.md
 */

'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { formatWeekLabel, formatMonthLabel } from '@/lib/period-helpers'

export interface PeriodContextLabelProps {
  /** Period type: 'week' or 'month' */
  periodType: 'week' | 'month'
  /** ISO week string, e.g., "2026-W05" */
  week?: string
  /** ISO month string, e.g., "2026-01" */
  month?: string
  /** Last data refresh timestamp */
  lastRefresh?: Date
  /** Show refresh time (default: true) */
  showRefreshTime?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Format relative time in Russian locale
 * @param date - Date to format relative to now
 * @returns Russian relative time string (e.g., "5 минут назад")
 */
function formatLastRefresh(date: Date): string {
  return formatDistanceToNow(date, {
    locale: ru,
    addSuffix: true,
  })
}

export function PeriodContextLabel({
  periodType,
  week,
  month,
  lastRefresh,
  showRefreshTime = true,
  className,
}: PeriodContextLabelProps): React.ReactElement {
  // Tick state to force re-render for relative time update
  const [, setTick] = useState(0)

  // Auto-update refresh time every 60 seconds
  useEffect(() => {
    if (!showRefreshTime || !lastRefresh) return

    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [lastRefresh, showRefreshTime])

  // Determine period label based on type
  const periodLabel =
    periodType === 'week' && week
      ? formatWeekLabel(week)
      : periodType === 'month' && month
        ? formatMonthLabel(month)
        : null

  // Calculate refresh text
  const refreshText = lastRefresh ? formatLastRefresh(lastRefresh) : null

  return (
    <div
      data-testid="period-context-label"
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2',
        'text-sm text-muted-foreground',
        className
      )}
    >
      {periodLabel && (
        <span>
          Обзор за: <span className="font-medium text-foreground">{periodLabel}</span>
        </span>
      )}

      {showRefreshTime && refreshText && (
        <>
          <span className="hidden sm:inline" aria-hidden="true">
            &bull;
          </span>
          <span>Обновлено: {refreshText}</span>
        </>
      )}
    </div>
  )
}
