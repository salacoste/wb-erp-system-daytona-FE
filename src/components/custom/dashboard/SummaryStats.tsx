/**
 * Summary Stats Component
 * Story 63.6-FE: Storage Trends Chart Enhancement (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Displays min, max, avg summary statistics for chart data.
 *
 * @see docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md
 */

'use client'

import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface SummaryStatsProps {
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Average value */
  avg: number
  /** Additional CSS classes */
  className?: string
}

export function SummaryStats({ min, max, avg, className }: SummaryStatsProps) {
  return (
    <div className={cn('flex flex-wrap gap-4 text-sm', className)}>
      <div>
        <span className="text-muted-foreground">Мин: </span>
        <span className="font-medium">{formatCurrency(min)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Макс: </span>
        <span className="font-medium">{formatCurrency(max)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Среднее: </span>
        <span className="font-medium">{formatCurrency(avg)}</span>
      </div>
    </div>
  )
}
