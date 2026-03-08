'use client'

/**
 * Cross-Reference Page Content — Story 73.7-FE
 * Merges search orders (groupBy=product) + advertising (view_by=sku) client-side
 */

import { useState, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { RequireJam } from '@/components/custom/jam/RequireJam'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export function CrossReferencePageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const searchQuery = useSearchOrders(apiFrom, apiTo, { groupBy: 'product' })
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
  const adItems = adQuery.data?.data
  const mergedData = useMemo(() => {
    if (!searchItems || !adItems) return []
    return mergeSearchAndAdData(searchItems, adItems)
  }, [searchItems, adItems])

  const overlapSummary = useMemo(() => computeOverlapSummary(mergedData), [mergedData])
  const topWastedSpend = useMemo(() => getTopWastedSpend(mergedData), [mergedData])

  const handleRetry = () => {
    searchQuery.refetch()
    adQuery.refetch()
  }

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
        {isLoading && <LoadingSkeleton />}
        {isError && <ErrorState error={error} onRetry={handleRetry} />}
        {!isLoading && !isError && mergedData.length === 0 && <EmptyState />}
        {!isLoading && !isError && mergedData.length > 0 && (
          <div className="space-y-6">
            <OverlapSummaryCards summary={overlapSummary} />
            <InsightsCards items={topWastedSpend} />
            <CrossReferenceTable items={mergedData} />
          </div>
        )}
      </RequireJam>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (error) console.error('[CrossReference] Load error:', error)
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{'Не удалось загрузить данные. Попробуйте снова.'}</span>
        <Button variant="outline" size="sm" onClick={onRetry} className="ml-4 shrink-0">
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function EmptyState() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Нет данных за выбранный период</AlertDescription>
    </Alert>
  )
}
