/**
 * Returns Summary Cards
 * Epic 70-FE: Total returns, return rate, classification coverage
 */

'use client'

import { useReturnReasons } from '@/hooks/use-return-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RotateCcw, Percent, ShieldCheck, AlertCircle } from 'lucide-react'
import { formatPercentage, formatPercentageInt } from '@/lib/utils'

interface ReturnsSummaryCardsProps {
  from?: string
  to?: string
}

export function ReturnsSummaryCards({ from, to }: ReturnsSummaryCardsProps) {
  const { data, isLoading, isError } = useReturnReasons(from, to)

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  // Defensive Frontend Principle: indicate, don't fabricate. The error and no-data
  // branches (mirroring the sibling ReturnReasonsPieChart) replace the prior
  // `summary?.field ?? 0` fallback, which rendered "0 / 0,0 % / 0 %" — a false
  // "perfect, zero-returns" signal — whenever the request errored or returned empty.
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить сводку возвратов</AlertDescription>
      </Alert>
    )
  }

  const summary = data?.summary
  if (!summary) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных о возвратах за выбранный период</AlertDescription>
      </Alert>
    )
  }

  const cards = [
    {
      label: 'Всего возвратов',
      value: summary.totalReturns,
      icon: RotateCcw,
      color: 'text-red-600',
      format: (n: number) => n.toLocaleString('ru-RU'),
    },
    {
      label: 'Процент возвратов',
      value: summary.overallReturnRate,
      icon: Percent,
      color: 'text-orange-600',
      // Preserve prior 1-decimal precision (was a dot-locale toFixed-1 percent), locale-correct.
      format: (n: number) => formatPercentage(n, 1),
    },
    {
      label: 'Покрытие классификации',
      value: summary.classificationCoverage,
      icon: ShieldCheck,
      color: 'text-green-600',
      format: (n: number) => formatPercentageInt(n),
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
