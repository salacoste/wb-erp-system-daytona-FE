'use client'

/**
 * SearchPositionTrendsTab — position trend analytics for search analytics page.
 * Shows week-over-week movers, close-to-page-one opportunities, and summary.
 * Backend: commit 3f29d8ca (2026-06-07)
 */

import { usePositionTrends } from '@/hooks/use-search-position-trends'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { SearchPositionSummaryCards } from './SearchPositionSummaryCards'
import {
  SearchPositionMoversTable,
  SearchPositionOpportunitiesTable,
} from './SearchPositionMoversTable'

export function SearchPositionTrendsTab() {
  const { data, isLoading, isError } = usePositionTrends()

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
      <SearchPositionMoversTable movers={data.movers} />
      <SearchPositionOpportunitiesTable items={data.closeToPageOne} />
    </div>
  )
}
