/** Funnel Summary Cards — Stories 73.2-FE (8 cards), 73.3-FE (WoW comparison) */
'use client'

import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  ShoppingBag,
  ShoppingCart,
  PackageCheck,
  Banknote,
  ArrowRightLeft,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import type { FunnelSummary } from '@/types/analytics-funnel'
import { calculatePreviousPeriod, calculateFunnelDelta } from './funnel-comparison-utils'
import { isFunnelConversionAnomalous } from './funnel-anomaly'
import { FunnelAnomalyIndicator } from './FunnelAnomalyIndicator'
import { formatNumber, formatPercent } from './funnel-summary-formatters'
import { DeltaIndicator } from './FunnelDeltaIndicator'

interface FunnelSummaryCardsProps {
  from: string
  to: string
  compare?: boolean
  nmIds?: number[]
}

type SummaryKey = keyof FunnelSummary

interface CardDef {
  label: string
  field: SummaryKey
  icon: React.ComponentType<{ className?: string }>
  color: string
  format: (n: number) => string
}

const CARDS: CardDef[] = [
  {
    label: 'Просмотры',
    field: 'openCardCount',
    icon: Eye,
    color: 'text-blue-600',
    format: formatNumber,
  },
  {
    label: 'Корзина',
    field: 'addToCartCount',
    icon: ShoppingBag,
    color: 'text-amber-600',
    format: formatNumber,
  },
  {
    label: 'Заказы',
    field: 'ordersCount',
    icon: ShoppingCart,
    color: 'text-orange-600',
    format: formatNumber,
  },
  {
    label: 'Выкупы',
    field: 'buyoutCount',
    icon: PackageCheck,
    color: 'text-green-600',
    format: formatNumber,
  },
  {
    label: 'Сумма выкупов',
    field: 'buyoutSumRub',
    icon: Banknote,
    color: 'text-emerald-600',
    format: formatCurrency,
  },
  {
    label: 'Конв. корзины',
    field: 'cartConversion',
    icon: ArrowRightLeft,
    color: 'text-teal-600',
    format: formatPercent,
  },
  {
    label: 'Сквозная конверсия',
    field: 'totalConversion',
    icon: TrendingUp,
    color: 'text-indigo-600',
    format: formatPercent,
  },
  {
    label: 'Отмены',
    field: 'cancelCount',
    icon: XCircle,
    color: 'text-red-600',
    format: formatNumber,
  },
]

export function FunnelSummaryCards({ from, to, compare, nmIds }: FunnelSummaryCardsProps) {
  const filterParam = nmIds?.length ? nmIds : undefined
  const { data, isLoading } = useFunnelData(from, to, { limit: 1, nmIds: filterParam })

  const prev = compare ? calculatePreviousPeriod(from, to) : null
  const { data: prevData, isLoading: prevLoading } = useFunnelData(
    prev?.prevFrom ?? '',
    prev?.prevTo ?? '',
    { limit: 1, nmIds: filterParam }
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const summary = data?.summary
  const prevSummary = prevData?.summary
  const totalConversionApproximate = data?.meta?.totalConversionApproximate === true

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map(card => {
        const Icon = card.icon
        const value = summary?.[card.field] ?? 0
        const delta =
          compare && prevSummary ? calculateFunnelDelta(value, prevSummary[card.field]) : null
        const anomalous =
          card.field === 'totalConversion' && !!summary && isFunnelConversionAnomalous(summary)
        const approximate = card.field === 'totalConversion' && totalConversionApproximate

        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={card.color}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="flex items-center gap-1.5 text-2xl font-bold">
                  <span
                    className="truncate"
                    title={
                      approximate
                        ? 'Приблизительно: показатель смешивает данные из разных источников'
                        : undefined
                    }
                  >
                    {approximate ? '≈ ' : ''}
                    {card.format(value)}
                  </span>
                  {anomalous && <FunnelAnomalyIndicator />}
                </p>
                {compare && (
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
