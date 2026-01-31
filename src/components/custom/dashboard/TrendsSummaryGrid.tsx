/**
 * Trends Summary Grid Component
 * Story 63.12-FE: Historical Trends Dashboard Section
 *
 * Grid of summary statistics cards for visible metrics.
 *
 * @see docs/stories/epic-63/story-63.12-fe-historical-trends-section.md
 */

'use client'

import { TrendsSummaryCard } from './TrendsSummaryCard'
import { TRENDS_METRIC_MAP, type TrendsMetricKey } from './trends-config'
import { cn } from '@/lib/utils'
import type { TrendMetricSummary } from '@/types/api'

/** API metric keys differ slightly from our config */
const API_KEY_MAP: Record<TrendsMetricKey, string> = {
  wb_sales_gross: 'wb_sales_gross',
  payout_total: 'payout_total',
  margin_pct: 'margin_pct',
  logistics_cost: 'logistics_cost',
  storage_cost: 'storage_cost',
}

export interface TrendsSummaryGridProps {
  /** Summary data from API */
  summary: Record<string, TrendMetricSummary> | undefined
  /** Set of visible metrics */
  visibleMetrics: Set<TrendsMetricKey>
  /** Additional CSS classes */
  className?: string
}

/**
 * Parse trend string to number
 */
function parseTrendPct(trend: string | undefined): number {
  if (!trend) return 0
  const match = trend.match(/[+-]?\d+\.?\d*/)
  return match ? parseFloat(match[0]) : 0
}

/**
 * Grid of summary cards for visible metrics
 */
export function TrendsSummaryGrid({
  summary,
  visibleMetrics,
  className,
}: TrendsSummaryGridProps): React.ReactElement | null {
  if (!summary) return null

  // Get visible metrics that have summary data
  const visibleWithSummary = Array.from(visibleMetrics)
    .map(key => {
      const apiKey = API_KEY_MAP[key]
      const metricSummary = summary[apiKey]
      const config = TRENDS_METRIC_MAP[key]

      if (!metricSummary || !config) return null

      return {
        key,
        config,
        summary: metricSummary,
      }
    })
    .filter(Boolean)

  if (!visibleWithSummary.length) return null

  return (
    <div className={cn('grid gap-3', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', className)}>
      {visibleWithSummary.map(item => {
        if (!item) return null
        const { key, config, summary: metricSummary } = item

        return (
          <TrendsSummaryCard
            key={key}
            title={config.label}
            min={{ value: metricSummary.min, week: '' }}
            max={{ value: metricSummary.max, week: '' }}
            avg={metricSummary.avg}
            trendPct={parseTrendPct(metricSummary.trend)}
            format={config.format}
            color={config.color}
          />
        )
      })}
    </div>
  )
}
