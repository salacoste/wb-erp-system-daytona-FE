/**
 * Unit Economics Summary Banner Component
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Status counts summary with clickable filters and attention alert.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { type ExtendedProfitabilityStatus, EXTENDED_STATUS_CONFIG } from '@/lib/profitability-utils'

export interface StatusCount {
  status: ExtendedProfitabilityStatus
  count: number
}

export interface UnitEconomicsSummaryBannerProps {
  /** Status counts array */
  statusCounts: StatusCount[]
  /** Callback when status count is clicked */
  onStatusClick: (status: ExtendedProfitabilityStatus) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Unit Economics Summary Banner
 *
 * Displays summary with:
 * - Total product count
 * - Counts by profitability status (clickable)
 * - Attention alert for loss/critical items
 */
export function UnitEconomicsSummaryBanner({
  statusCounts,
  onStatusClick,
  className,
}: UnitEconomicsSummaryBannerProps) {
  const total = statusCounts.reduce((sum, item) => sum + item.count, 0)
  const needsAttention = statusCounts
    .filter(item => item.status === 'loss' || item.status === 'critical')
    .reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Total count */}
          <div className="text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{total}</span> товаров
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Status counts */}
          <div className="flex flex-wrap gap-3">
            {statusCounts
              .filter(item => item.count > 0)
              .map(({ status, count }) => {
                const config = EXTENDED_STATUS_CONFIG[status]
                return (
                  <button
                    key={status}
                    onClick={() => onStatusClick(status)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
                      'hover:bg-accent transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                    aria-label={`Показать ${count} товаров со статусом ${config.label}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{config.label}:</span>
                    <span className="font-medium">{count}</span>
                  </button>
                )
              })}
          </div>

          {/* Attention alert */}
          {needsAttention > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="text-sm">
                <span className="text-red-600 font-medium">
                  {needsAttention} товаров требуют внимания
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
