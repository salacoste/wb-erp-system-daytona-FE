'use client'

/**
 * Cross-Reference Page Content — Story 73.7-FE + Feature 3.6
 * Merges search orders (groupBy=product) + advertising (view_by=sku) client-side.
 * Feature 3.6 adds ad/search correlation: keyword overlap, position-spend scatter,
 * and cannibalization analysis.
 * Story 170.6-FE (AC-2): per-source error split — one failed source keeps the other
 * source's data rendered (SourceErrorBanner); BOTH failed keeps the full ErrorState
 * (e2e-pinned texts). The THIRD query (groupBy=query) gets a section banner.
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
import {
  LoadingSkeleton,
  ErrorState,
  EmptyState,
  SourceErrorBanner,
  SectionWarningBanner,
} from './CrossReferenceStates'
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
  const searchFailed = searchQuery.isError
  const adFailed = adQuery.isError
  const bothFailed = searchFailed && adFailed
  const oneFailed = searchFailed !== adFailed
  const error = searchQuery.error ?? adQuery.error

  const searchItems = searchQuery.data?.items
  const searchQueryItems = searchByQueryQuery.data?.items
  const adItems = adQuery.data?.data
  // 170.6 AC-2: merge is no longer all-or-nothing — when exactly one source failed,
  // the loaded source merges alone (its rows show their true channel scope; the
  // SourceErrorBanner above forbids cross-channel conclusions from the partial view).
  const mergedData = useMemo(() => {
    if (!searchItems && !adItems) return []
    return mergeSearchAndAdData(searchItems ?? [], adItems ?? [])
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
      {!isLoading && bothFailed && <ErrorState error={error} onRetry={handleRetry} />}
      {!isLoading && oneFailed && (
        <SourceErrorBanner
          failedSource={adFailed ? 'реклама' : 'органический поиск'}
          okSource={adFailed ? 'органический поиск' : 'реклама'}
          onRetry={handleRetry}
        />
      )}
      {/* Round-1 F1: empty check excludes oneFailed — banner + honest EmptyState composite
          (banner's «отображены ниже» only claims data when the working source HAS rows). */}
      {!isLoading && !bothFailed && !oneFailed && mergedData.length === 0 && <EmptyState />}
      {!isLoading && !bothFailed && mergedData.length > 0 && (
        <div className="space-y-6">
          <OverlapSummaryCards summary={overlapSummary} />
          <InsightsCards items={topWastedSpend} />
          <OrganicVsAdScatter items={mergedData} />
          <CrossReferenceTable items={mergedData} />

          {/* Feature 3.6: Ad ↔ Search correlation analyses. The query-level (third)
              query gets its own section banner when it fails (170.6 validator C2). */}
          {searchByQueryQuery.isError ? (
            <SectionWarningBanner onRetry={() => searchByQueryQuery.refetch()} />
          ) : (
            searchQueryItems &&
            adItems && (
              <AdOrganicOverlapTable searchQueryItems={searchQueryItems} adItems={adItems} />
            )
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Кросс-анализ</h1>
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
