'use client'

/**
 * Marketing widgets row for the Analytics Hub.
 * Story 120.3-FE: Search Performance mini-widget.
 * Story 120.4-FE: Marketing Summary KPI card.
 *
 * Pattern 1 graceful degradation (Epic 92-FE): each widget self-fetches
 * and renders null on its own error/empty source. If only one degrades,
 * the grid shows a single column -- a supplementary failure must never
 * blank the hub.
 */

import { SearchPerformanceWidget } from './SearchPerformanceWidget'
import { MarketingKpiCard } from './MarketingKpiCard'

interface AnalyticsMarketingWidgetsProps {
  selectedWeek: string | null
}

export function AnalyticsMarketingWidgets({ selectedWeek }: AnalyticsMarketingWidgetsProps) {
  if (!selectedWeek) return null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SearchPerformanceWidget from={selectedWeek} to={selectedWeek} />
      <MarketingKpiCard from={selectedWeek} to={selectedWeek} />
    </div>
  )
}
