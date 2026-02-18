/**
 * Funnel Summary Cards
 * Epic 68: 4 metric cards — total views, orders, buyouts, avg conversion
 */

'use client'

import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, ShoppingCart, PackageCheck, TrendingUp } from 'lucide-react'

interface FunnelSummaryCardsProps {
  from: string
  to: string
}

export function FunnelSummaryCards({ from, to }: FunnelSummaryCardsProps) {
  const { data, isLoading } = useFunnelData(from, to, { limit: 1 })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const summary = data?.summary

  const cards = [
    {
      label: 'Просмотры',
      value: summary?.totalOpenCards ?? 0,
      icon: Eye,
      color: 'text-blue-600',
      format: formatNumber,
    },
    {
      label: 'Заказы',
      value: summary?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: 'text-orange-600',
      format: formatNumber,
    },
    {
      label: 'Выкупы',
      value: summary?.totalBuyouts ?? 0,
      icon: PackageCheck,
      color: 'text-green-600',
      format: formatNumber,
    },
    {
      label: 'Сквозная конверсия',
      value: summary?.avgTotalConversion ?? 0,
      icon: TrendingUp,
      color: 'text-indigo-600',
      format: formatPercent,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                <p className="text-2xl font-bold">{card.format(card.value)}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}
