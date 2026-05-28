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
import { ShoppingCart, Percent, AlertCircle } from 'lucide-react'
import type { SearchOrdersSummary } from '@/types/search-analytics'
import { SearchOrdersTable } from './SearchOrdersTable'

interface SearchOrdersOverviewProps {
  from: string
  to: string
}

function formatNumber(n: number | undefined | null): string {
  if (n == null) return '—'
  return n.toLocaleString('ru-RU')
}

// Story 91.1-FE: formatCurrency removed — was only used by the deleted revenue summary card

function formatPercent(n: number | undefined | null): string {
  if (n == null) return '—'
  return `${n.toFixed(1)}%`
}

export function SearchOrdersOverview({ from, to }: SearchOrdersOverviewProps) {
  const { data, isLoading, isError } = useSearchOrders(from, to, { groupBy: 'query' })

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
      {summary && <SummaryCards summary={summary} />}
      <SearchOrdersTable items={items} />
    </div>
  )
}

function SummaryCards({ summary }: { summary: SearchOrdersSummary }) {
  const cards = [
    {
      label: 'Поисковые заказы',
      value: summary.totalSearchOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      fmt: formatNumber,
    },
    // Story 91.1-FE: 'Выручка от поиска' card removed — backend dropped totalSearchRevenue
    {
      label: 'Доля поисковых заказов',
      value: summary.searchOrderShare,
      icon: Percent,
      color: 'text-orange-600',
      fmt: formatPercent,
    },
  ]

  // 2 cards since Story 91.1-FE removed the revenue card; grid-cols-2 avoids an empty 3rd column
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={card.color} aria-hidden="true">
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.fmt(card.value)}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
