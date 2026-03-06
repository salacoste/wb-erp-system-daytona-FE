'use client'

/**
 * Search Orders Tab - Summary cards + sortable table orchestrator
 * Story 71.5-FE: Search Orders Tab
 */

import { useSearchOrders } from '@/hooks/use-search-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShoppingCart, DollarSign, Percent, AlertCircle } from 'lucide-react'
import type { SearchOrdersSummary } from '@/types/search-analytics'
import { SearchOrdersTable } from './SearchOrdersTable'

interface SearchOrdersTabProps {
  from: string
  to: string
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function formatCurrency(n: number): string {
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

export function SearchOrdersTab({ from, to }: SearchOrdersTabProps) {
  const { data, isLoading, isError } = useSearchOrders(from, to, { groupBy: 'query' })

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="pt-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить данные поисковых заказов. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const items = data?.items ?? []
  const summary = data?.summary

  if (items.length === 0) {
    return (
      <div className="pt-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Нет данных за выбранный период</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">
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
    {
      label: 'Выручка от поиска',
      value: summary.totalSearchRevenue,
      icon: DollarSign,
      color: 'text-green-600',
      fmt: formatCurrency,
    },
    {
      label: 'Доля поисковых заказов',
      value: summary.searchOrderShare,
      icon: Percent,
      color: 'text-orange-600',
      fmt: formatPercent,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={card.color}>
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
