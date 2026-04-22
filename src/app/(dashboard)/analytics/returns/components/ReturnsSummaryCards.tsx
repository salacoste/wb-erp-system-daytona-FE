/**
 * Returns Summary Cards
 * Epic 70-FE: Total returns, return rate, classification coverage
 */

'use client'

import { useReturnReasons } from '@/hooks/use-return-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RotateCcw, Percent, ShieldCheck } from 'lucide-react'

interface ReturnsSummaryCardsProps {
  from?: string
  to?: string
}

export function ReturnsSummaryCards({ from, to }: ReturnsSummaryCardsProps) {
  const { data, isLoading } = useReturnReasons(from, to)

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const summary = data?.summary

  const cards = [
    {
      label: 'Всего возвратов',
      value: summary?.totalReturns ?? 0,
      icon: RotateCcw,
      color: 'text-red-600',
      format: (n: number) => n.toLocaleString('ru-RU'),
    },
    {
      label: 'Процент возвратов',
      value: summary?.overallReturnRate ?? 0,
      icon: Percent,
      color: 'text-orange-600',
      format: (n: number) => `${n.toFixed(1)}%`,
    },
    {
      label: 'Покрытие классификации',
      value: summary?.classificationCoverage ?? 0,
      icon: ShieldCheck,
      color: 'text-green-600',
      format: (n: number) => `${n.toFixed(0)}%`,
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
                <p className="text-2xl font-bold">{card.format(card.value)}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
