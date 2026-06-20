'use client'

/**
 * Cross-Reference Page Content — Story 73.7-FE + Feature 3.6
 * Merges search orders (groupBy=product) + advertising (view_by=sku) client-side.
 * Feature 3.6 adds ad/search correlation: keyword overlap, position-spend scatter,
 * and cannibalization analysis.
 */

import { useState, useMemo, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { RequireJam } from '@/components/custom/jam/RequireJam'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { ExportCsvButton } from '@/components/custom/ai/ExportCsvButton'
import { exportCrossReferenceToCsv } from '@/lib/csv/cross-reference-csv-export'
import { useSearchOrders } from '@/hooks/use-search-analytics'
import { useAdvertisingAnalytics } from '@/hooks/advertising/hooks'
import {
  mergeSearchAndAdData,
  computeOverlapSummary,
  getTopWastedSpend,
} from '../utils/cross-reference-utils'
import { OverlapSummaryCards } from './OverlapSummaryCards'
import { CrossReferenceTable } from './CrossReferenceTable'
import { InsightsCards } from './InsightsCards'
import { OrganicVsAdScatter } from './OrganicVsAdScatter'
import { AdOrganicOverlapTable } from './AdOrganicOverlapTable'
import { PositionSpendChart } from './PositionSpendChart'
import { CannibalizationAnalysis } from './CannibalizationAnalysis'
import { LoadingSkeleton, ErrorState, EmptyState } from './CrossReferenceStates'
import type { DateRange } from '@/types/date-range'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 13)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

interface CrossReferenceDataContentProps {
  apiFrom: string
  apiTo: string
}

function CrossReferenceDataContent({ apiFrom, apiTo }: CrossReferenceDataContentProps) {
  const searchQuery = useSearchOrders(apiFrom, apiTo, { groupBy: 'product' })
  // Feature 3.6: keyword-level search data for overlap analysis
  const searchByQueryQuery = useSearchOrders(apiFrom, apiTo, { groupBy: 'query' })
  const adQuery = useAdvertisingAnalytics({
    from: apiFrom,
    to: apiTo,
    view_by: 'sku',
    sort_by: 'spend',
    sort_order: 'desc',
    limit: 500,
  })

  const isLoading = searchQuery.isLoading || adQuery.isLoading
  const isError = searchQuery.isError || adQuery.isError
  const error = searchQuery.error || adQuery.error

  const searchItems = searchQuery.data?.items
  const searchQueryItems = searchByQueryQuery.data?.items
  const adItems = adQuery.data?.data
  const mergedData = useMemo(() => {
    if (!searchItems || !adItems) return []
    return mergeSearchAndAdData(searchItems, adItems)
  }, [searchItems, adItems])

  const overlapSummary = useMemo(() => computeOverlapSummary(mergedData), [mergedData])
  const topWastedSpend = useMemo(() => getTopWastedSpend(mergedData), [mergedData])

  // CSV export is gated with the data it exports.
  const csvContent = useMemo(() => exportCrossReferenceToCsv(mergedData), [mergedData])
  const csvFileName = `cross-reference-${apiFrom}-${apiTo}.csv`

  const handleRetry = () => {
    searchQuery.refetch()
    adQuery.refetch()
  }

  return (
    <div className="space-y-6">
      <ExportCsvButton
        csvContent={csvContent}
        fileName={csvFileName}
        label="Скачать CSV"
        disabled={mergedData.length === 0}
      />

      {isLoading && <LoadingSkeleton />}
      {isError && <ErrorState error={error} onRetry={handleRetry} />}
      {!isLoading && !isError && mergedData.length === 0 && <EmptyState />}
      {!isLoading && !isError && mergedData.length > 0 && (
        <div className="space-y-6">
          <OverlapSummaryCards summary={overlapSummary} />
          <InsightsCards items={topWastedSpend} />
          <OrganicVsAdScatter items={mergedData} />
          <CrossReferenceTable items={mergedData} />

          {/* Feature 3.6: Ad ↔ Search correlation analyses */}
          {searchQueryItems && adItems && (
            <AdOrganicOverlapTable searchQueryItems={searchQueryItems} adItems={adItems} />
          )}
          <PositionSpendChart items={mergedData} />
          <CannibalizationAnalysis items={mergedData} />
        </div>
      )}
    </div>
  )
}

export function CrossReferencePageContent() {
  // Hydration-safe: initialize dateRange after mount to avoid server/client date drift.
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    setDateRange(getDefaultRange())
  }, [])
  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Кросс-анализ</h1>
        <p className="text-muted-foreground mt-1">Сравнение органики и рекламы по товарам</p>
      </div>

      <DateRangePickerExtended
        value={dateRange}
        onChange={setDateRange}
        maxDays={365}
        placeholder="Выберите период"
        id="cross-ref-date-range"
      />

      <RequireJam requiredTier="standard">
        {dateRange ? (
          <CrossReferenceDataContent apiFrom={apiFrom} apiTo={apiTo} />
        ) : (
          <LoadingSkeleton />
        )}
      </RequireJam>
    </div>
  )
}
