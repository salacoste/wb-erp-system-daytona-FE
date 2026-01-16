'use client'

import React from 'react'
import Link from 'next/link'
import { Info, History, ChevronRight } from 'lucide-react'
import { cn, formatWeeksAgoShort } from '@/lib/utils'

/**
 * Story 4.9: Historical Margin Context Component Props
 * Reference: docs/stories/4.9.historical-margin-discovery.md
 */
export interface HistoricalMarginContextProps {
  /** Product article ID for navigation */
  nmId: string
  /** Current period (e.g., "W47") for status line */
  currentPeriod: string | null
  /** ISO week of last sale (e.g., "2025-W44") */
  lastSalesWeek: string | null
  /** Margin % from last sales week */
  lastSalesMarginPct: number | null
  /** Units sold in last sales week */
  lastSalesQty: number | null
  /** Weeks since last sale */
  weeksSinceLastSale: number | null
  /** Whether margin display is enabled (include_cogs=true) */
  enableMarginDisplay?: boolean
}

/**
 * Story 4.9: Historical Margin Context Component
 *
 * Shows historical margin data when product has no sales in current period.
 * Renders only when missing_data_reason === "NO_SALES_DATA".
 *
 * UI States:
 * 1. Historical data available → Show last sale week, margin, qty, gap
 * 2. No historical data → Show "No sales in last 12 weeks"
 * 3. Negative margin → Show with red badge
 * 4. Margin display disabled → Show week + qty only (no margin %)
 *
 * Reference: docs/stories/4.9.historical-margin-discovery.md
 */
export function HistoricalMarginContext({
  nmId,
  currentPeriod,
  lastSalesWeek,
  lastSalesMarginPct,
  lastSalesQty,
  weeksSinceLastSale,
  enableMarginDisplay = true,
}: HistoricalMarginContextProps): React.ReactElement {
  // Format week display (e.g., "2025-W44" → "W44")
  const formatWeekShort = (week: string | null): string => {
    if (!week) return ''
    // Extract week part (e.g., "2025-W44" → "W44")
    const match = week.match(/W\d+/)
    return match ? match[0] : week
  }

  // Determine margin color based on value
  const getMarginColorClass = (margin: number | null): string => {
    if (margin === null) return 'text-gray-500'
    if (margin > 0) return 'text-green-600'
    if (margin < 0) return 'text-red-600'
    return 'text-gray-500' // margin === 0
  }

  const hasHistoricalData = lastSalesWeek !== null

  return (
    <div className="space-y-2" role="region" aria-label="Историческая маржа">
      {/* Status Line */}
      <div
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          Нет продаж за {currentPeriod ? formatWeekShort(currentPeriod) : 'текущую неделю'}
        </span>
      </div>

      {/* Historical Badge or No History Message */}
      {hasHistoricalData ? (
        <div
          className="mt-1 text-xs"
          aria-label={`Последняя продажа: неделя ${formatWeekShort(lastSalesWeek)}, ${
            enableMarginDisplay && lastSalesMarginPct !== null
              ? `маржа ${lastSalesMarginPct.toFixed(2)} процента, `
              : ''
          }${lastSalesQty ?? 0} штук, ${formatWeeksAgoShort(weeksSinceLastSale)}`}
        >
          <span className="text-muted-foreground">Последняя продажа: </span>
          <span className="text-foreground font-medium">{formatWeekShort(lastSalesWeek)}</span>
          {/* Show margin % only if enableMarginDisplay is true */}
          {enableMarginDisplay && lastSalesMarginPct !== null && (
            <>
              <span className="text-muted-foreground"> • </span>
              <span className={cn('font-semibold', getMarginColorClass(lastSalesMarginPct))}>
                {lastSalesMarginPct.toFixed(2)}%
              </span>
            </>
          )}
          <span className="text-muted-foreground"> • </span>
          <span className="text-muted-foreground">{lastSalesQty ?? 0} шт</span>
          <span className="text-muted-foreground"> • </span>
          <span className="text-muted-foreground">{formatWeeksAgoShort(weeksSinceLastSale)}</span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground">
          Нет продаж за последние 12 недель
        </div>
      )}

      {/* History Link - PO Decision Q3: Same tab navigation */}
      <Link
        href={`/analytics/sku?nm_id=${nmId}`}
        className={cn(
          'mt-2 inline-flex items-center gap-1.5 text-xs font-medium',
          'text-primary hover:text-primary/80 hover:underline',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
          'transition-colors duration-150 ease-in-out',
          'active:scale-[0.98]'
        )}
        role="link"
        aria-label="История продаж, ссылка"
      >
        <History className="h-3 w-3" aria-hidden="true" />
        <span>История продаж</span>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  )
}

export default HistoricalMarginContext
