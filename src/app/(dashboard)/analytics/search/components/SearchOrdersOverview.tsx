'use client'

/**
 * Search Orders Overview — summary cards + sortable table (groupBy='query')
 * Story 71.5-FE: Search Orders Tab (original body)
 * Story 117.1-FE: extracted from SearchOrdersTab so the time-series chart can mount
 * as an INDEPENDENT state machine alongside it (Pattern 1) — a failure of this
 * query-grouped fetch must not blank the chart, and vice versa.
 */

import { useSearchOrders } from '@/hooks/use-search-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
// Story 91.1-FE: DollarSign removed — was only used by the deleted 'Выручка от поиска' card
import { ShoppingCart, AlertCircle } from 'lucide-react'
import type { SearchOrdersSummary } from '@/types/search-analytics'
import { SearchOrdersTable } from './SearchOrdersTable'
import { SearchShareCard } from './SearchShareCard'
import { calculateSearchDelta, formatDelta, getDeltaColor } from './search-comparison-utils'

// F-6 (Request #176 / Story 111.6 AC8): a >100% search-order share is EXPECTED —
// WB attributes one order to several search queries (an interaction rate, "by
// design" per the backend). So this is an Info affordance, NOT a warning; the raw
// value is preserved (never clamped) per the Defensive Frontend Principle.
// Single source of truth for tooltip + aria-label (per OrdersTableRow.tsx #165 convention).
const INFLATED_SHARE_MESSAGE =
  'Доля >100% — это норма: WB засчитывает один заказ нескольким поисковым запросам ' +
  '(показатель интенсивности поиска). Значение показано как есть, без округления.'

interface SearchOrdersOverviewProps {
  from: string
  to: string
  compareEnabled?: boolean
  compareFrom?: string
  compareTo?: string
}

function formatNumber(n: number | undefined | null): string {
  if (n == null) return '—'
  return n.toLocaleString('ru-RU')
}

// Story 91.1-FE: formatCurrency removed — was only used by the deleted revenue summary card

// iter-59: Russian locale — was `${n.toFixed(1)}%` → "188.6%" (dot, no separator), violating
// the documented rule (frontend/CLAUDE.md: "15,5 %"). `n` is already in percent units (0-100,
// e.g. searchOrderShare 188.55, avgCtr 11.9), so Intl style:'percent' over n/100 yields "188,6 %".
function formatPercent(n: number | undefined | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n / 100)
}

export function SearchOrdersOverview({
  from,
  to,
  compareEnabled,
  compareFrom,
  compareTo,
}: SearchOrdersOverviewProps) {
  const { data, isLoading, isError } = useSearchOrders(from, to, { groupBy: 'query' })
  const { data: compareData } = useSearchOrders(
    compareEnabled && compareFrom && compareTo ? compareFrom : '',
    compareEnabled && compareFrom && compareTo ? compareTo : '',
    { groupBy: 'query' }
  )

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить данные поисковых заказов. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    )
  }

  const items = data?.items ?? []
  const summary = data?.summary

  if (items.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных за выбранный период</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {summary && (
        <SummaryCards
          summary={summary}
          compareSummary={compareEnabled ? compareData?.summary : undefined}
        />
      )}
      <SearchOrdersTable items={items} />
    </div>
  )
}

function SummaryCards({
  summary,
  compareSummary,
}: {
  summary: SearchOrdersSummary
  compareSummary?: SearchOrdersSummary
}) {
  const ordersDelta = calculateSearchDelta(
    summary.totalSearchOrders,
    compareSummary?.totalSearchOrders ?? null
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="text-blue-600" aria-hidden="true">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Поисковые заказы</p>
            <p className="text-2xl font-bold">{formatNumber(summary.totalSearchOrders)}</p>
            {ordersDelta && (
              <p className={`text-xs font-medium ${getDeltaColor(ordersDelta.direction)}`}>
                {formatDelta(ordersDelta)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <SearchShareCard
        summary={summary}
        formatPercent={formatPercent}
        inflatedMessage={INFLATED_SHARE_MESSAGE}
      />
    </div>
  )
}
