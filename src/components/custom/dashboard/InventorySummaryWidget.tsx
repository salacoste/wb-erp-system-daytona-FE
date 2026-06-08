'use client'

/**
 * Inventory Summary Widget — stock snapshot with capitalization
 * Displays on the main Dashboard page via useInventorySummary hook.
 * GET /v1/inventory/summary
 */

import { Warehouse, ArrowRight, ArrowLeft, Coins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInventorySummary } from '@/hooks/useInventorySummary'
import { formatCurrency, formatNumber } from '@/lib/utils'

function InventorySummaryLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function InventorySummaryWidget() {
  const { data, isLoading, isError } = useInventorySummary()

  if (isLoading) return <InventorySummaryLoading />

  if (isError || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Warehouse className="h-4 w-4" />
              <span>Остатки</span>
            </div>
            <p className="text-xs text-muted-foreground">Не удалось загрузить данные</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cards = [
    {
      title: 'Всего на складе',
      value: formatNumber(data.totalStock),
      icon: Warehouse,
      description: `${formatNumber(data.uniqueSkus)} SKU`,
    },
    {
      title: 'В пути к клиенту',
      value: formatNumber(data.inWayToClient),
      icon: ArrowRight,
      description: 'ед.',
    },
    {
      title: 'В пути от клиента',
      value: formatNumber(data.inWayFromClient),
      icon: ArrowLeft,
      description: 'ед.',
    },
    {
      title: 'Капитализация (себестоимость)',
      value: data.capitalizationByCogs != null ? formatCurrency(data.capitalizationByCogs) : '—',
      icon: Coins,
      description: `покрытие COGS: ${formatNumber(data.cogsCoveragePct)} %`,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <span>{card.title}</span>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
