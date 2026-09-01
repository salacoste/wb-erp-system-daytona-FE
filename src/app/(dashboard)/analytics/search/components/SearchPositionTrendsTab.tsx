'use client'

/**
 * SearchPositionTrendsTab — position trend analytics for search analytics page.
 * Shows week-over-week movers, close-to-page-one opportunities, and summary.
 * Clicking a table row shows daily position history chart for that SKU.
 * Backend: commit 3f29d8ca (2026-06-07)
 */

import { useState } from 'react'
import { usePositionTrends } from '@/hooks/use-search-position-trends'
import { SearchPositionSummaryCards } from './SearchPositionSummaryCards'
import { SearchPositionMoversTable } from './SearchPositionMoversTable'
import { SearchPositionOpportunitiesTable } from './SearchPositionOpportunitiesTable'
import { PositionHistoryChart } from './PositionHistoryChart'

/**
 * Story 170.7 Task 3 Pattern-1: the former whole-tab destructive error/skeleton
 * split into per-section chrome (summary cards / movers / opportunities each
 * render their OWN error chrome) over the SHARED usePositionTrends fetch.
 * Residual (documented): a fetch-level failure still degrades all three shared
 * sections together — the fetch is shared by design. PositionHistoryChart keeps
 * its OWN independent usePositionHistory fetch and is never blanked by it.
 */
export function SearchPositionTrendsTab() {
  const { data, isLoading, isError } = usePositionTrends()
  const [selectedNmId, setSelectedNmId] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <SearchPositionSummaryCards summary={data?.summary} isLoading={isLoading} isError={isError} />
      <SearchPositionMoversTable
        movers={data?.movers ?? []}
        isLoading={isLoading}
        isError={isError}
        onSelectSku={setSelectedNmId}
        selectedNmId={selectedNmId}
      />
      <SearchPositionOpportunitiesTable
        items={data?.closeToPageOne ?? []}
        isLoading={isLoading}
        isError={isError}
        onSelectSku={setSelectedNmId}
        selectedNmId={selectedNmId}
      />
      <PositionHistoryChart nmId={selectedNmId} />
    </div>
  )
}
