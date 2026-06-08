'use client'

/**
 * SearchPositionTrendsTab — position trend analytics for search analytics page.
 * Shows week-over-week movers, close-to-page-one opportunities, and summary.
 * Clicking a table row shows daily position history chart for that SKU.
 * Backend: commit 3f29d8ca (2026-06-07)
 */

import { useState } from 'react'
import { usePositionTrends } from '@/hooks/use-search-position-trends'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { SearchPositionSummaryCards } from './SearchPositionSummaryCards'
import {
  SearchPositionMoversTable,
  SearchPositionOpportunitiesTable,
} from './SearchPositionMoversTable'
import { PositionHistoryChart } from './PositionHistoryChart'

export function SearchPositionTrendsTab() {
  const { data, isLoading, isError } = usePositionTrends()
  const [selectedNmId, setSelectedNmId] = useState<number | null>(null)

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить данные по позициям</AlertDescription>
      </Alert>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SearchPositionSummaryCards summary={data.summary} />
      <SearchPositionMoversTable
        movers={data.movers}
        onSelectSku={setSelectedNmId}
        selectedNmId={selectedNmId}
      />
      <SearchPositionOpportunitiesTable
        items={data.closeToPageOne}
        onSelectSku={setSelectedNmId}
        selectedNmId={selectedNmId}
      />
      <PositionHistoryChart nmId={selectedNmId} />
    </div>
  )
}
