/**
 * Returns Summary Cards
 * Epic 70-FE: Total returns, return rate, classification coverage
 * Story 127.5-FE: WoW comparison deltas (comparison period from page orchestrator)
 */

'use client'

import { useReturnReasons } from '@/hooks/use-return-analytics'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RotateCcw, Percent, ShieldCheck, AlertCircle } from 'lucide-react'
import { formatPercentage, formatPercentageInt } from '@/lib/utils'
import { calculateReturnsDelta } from './returns-comparison-utils'
import { DeltaIndicator } from './DeltaIndicator'

interface ReturnsSummaryCardsProps {
  from?: string
  to?: string
  /** Whether comparison mode is enabled (page-level state) */
  compareEnabled?: boolean
  /** Comparison period start date (yyyy-MM-dd) */
  compareFrom?: string
  /** Comparison period end date (yyyy-MM-dd) */
  compareTo?: string
}

export function ReturnsSummaryCards({
  from,
  to,
  compareEnabled,
  compareFrom,
  compareTo,
}: ReturnsSummaryCardsProps) {
  const { data, isLoading, isError } = useReturnReasons(from, to)

  // Comparison period data — period dates come from page orchestrator
  const hasCompare = compareEnabled && !!compareFrom && !!compareTo
  const { data: prevData, isLoading: prevLoading } = useReturnReasons(
    hasCompare ? compareFrom : undefined,
    hasCompare ? compareTo : undefined
  )

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

  const prevSummary = prevData?.summary

  // AP#8: overallReturnRate & classificationCoverage may be null — render '—', not "0 %".
  const cards: Array<{
    label: string
    value: number | null
    field: 'totalReturns' | 'overallReturnRate' | 'classificationCoverage'
    icon: typeof RotateCcw
    color: string
    format: (n: number) => string
  }> = [
    {
      label: 'Всего возвратов',
      value: summary.totalReturns,
      field: 'totalReturns',
      icon: RotateCcw,
      // totalReturns is a count, not inherently an error — but its «Всего возвратов»
      // valence is negative (more returns = worse, cf. INVERTED_METRICS), so the
      // Story 169.11 mapping keeps status-error for consistency (documented choice).
      color: 'text-status-error',
      format: (n: number) => n.toLocaleString('ru-RU'),
    },
    {
      label: 'Процент возвратов',
      value: summary.overallReturnRate,
      field: 'overallReturnRate',
      icon: Percent,
      color: 'text-status-warning',
      format: (n: number) => formatPercentage(n, 1),
    },
    {
      label: 'Покрытие классификации',
      value: summary.classificationCoverage,
      field: 'classificationCoverage',
      icon: ShieldCheck,
      color: 'text-status-success',
      format: (n: number) => formatPercentageInt(n),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(card => {
        const Icon = card.icon
        const delta =
          hasCompare && prevSummary
            ? calculateReturnsDelta(
                summary[card.field],
                prevSummary[card.field as keyof typeof prevSummary] as number | null
              )
            : null
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={card.color}>
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">
                  {card.value == null ? '—' : card.format(card.value)}
                </p>
                {hasCompare && (
                  <DeltaIndicator delta={delta} field={card.field} loading={prevLoading} />
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
