'use client'

import { Wallet, TrendingUp, Percent, ShoppingCart, Sprout, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatRoas } from '@/lib/utils'
import type { AdvertisingSummary } from '@/types/advertising-analytics'
import type {
  AdvertisingDeltas,
  AdvertisingDelta,
  ComparisonMetricKey,
} from '../utils/comparison-delta-utils'
import { formatAdDelta, isInvertedAdMetric, getAdDeltaColor } from '../utils/comparison-delta-utils'
import {
  formatAdCurrency,
  formatAdPercent,
  getRoasColor,
  getRoiColor,
} from './advertising-card-utils'
import { getOrganicContributionColorClass } from '@/components/custom/advertising-widget/advertising-widget-helpers'

// Re-export for backward compatibility with test imports
export { getRoasColor, getRoiColor } from './advertising-card-utils'

interface AdvertisingSummaryCardsProps {
  summary?: AdvertisingSummary
  isLoading: boolean
  /** Comparison deltas (null/undefined if comparison disabled) */
  deltas?: AdvertisingDeltas | null
  isPrevLoading?: boolean
}

/** Story 33.2-FE, Epic 35: 5 metric cards. Story 127.3-FE: comparison deltas. */
export function AdvertisingSummaryCards({
  summary,
  isLoading,
  deltas,
  isPrevLoading,
}: AdvertisingSummaryCardsProps) {
  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        aria-label="Загрузка метрик..."
      >
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  if (!summary) return null

  const cards = [
    {
      id: 'total_sales',
      dk: 'total_sales' as ComparisonMetricKey,
      label: 'Всего продаж',
      value: formatAdCurrency(summary.total_sales),
      icon: ShoppingCart,
      colorClass: 'text-indigo-600',
      tooltip: 'Органические + рекламные продажи. Данные из рекламного кабинета WB.',
      subtext:
        summary.total_organic_sales > 0
          ? `${formatAdCurrency(summary.total_organic_sales)} органика`
          : undefined,
    },
    {
      id: 'ad_revenue',
      dk: 'total_revenue' as ComparisonMetricKey,
      label: 'Из рекламы',
      value: formatAdCurrency(summary.total_revenue),
      icon: Wallet,
      colorClass: 'text-blue-600',
      tooltip:
        'Выручка от заказов, атрибутированных рекламе. WB определяет атрибуцию: клик → заказ.',
    },
    {
      id: 'roas',
      dk: 'overall_roas' as ComparisonMetricKey,
      label: 'Общий ROAS',
      value: summary.overall_roas != null ? formatRoas(summary.overall_roas) : '—',
      icon: TrendingUp,
      colorClass:
        summary.overall_roas != null ? getRoasColor(summary.overall_roas) : 'text-muted-foreground',
      tooltip: 'Выручка от рекламы ÷ расход на кампании. Данные из рекламного кабинета WB.',
    },
    {
      id: 'roi',
      label: 'Общий ROI',
      value: summary.overall_roi != null ? formatAdPercent(summary.overall_roi) : '—',
      icon: Percent,
      colorClass: summary.overall_roi != null ? getRoiColor(summary.overall_roi) : 'text-muted-foreground',
      tooltip: '(Прибыль − расход на рекламу) ÷ расход × 100%. Прибыль из маржинальной аналитики.',
    },
    {
      id: 'organic_contribution',
      label: 'Доля органики',
      value: formatAdPercent(summary.avg_organic_contribution),
      icon: Sprout,
      colorClass: getOrganicContributionColorClass(summary.avg_organic_contribution),
      tooltip: 'Доля продаж без рекламы. При переатрибуции WB может быть <0%.',
    },
  ]

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      role="region"
      aria-label="Ключевые показатели рекламы"
    >
      {cards.map(card => {
        const Icon = card.icon
        const delta = card.dk ? deltas?.[card.dk] : undefined
        return (
          <Card key={card.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Icon className={cn('h-4 w-4', card.colorClass)} aria-hidden="true" />
                <span>{card.label}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent size="md">{card.tooltip}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className={cn('text-2xl font-bold', card.colorClass)} aria-label={card.tooltip}>
                {card.value}
              </div>
              {card.subtext && <p className="text-sm text-muted-foreground mt-1">{card.subtext}</p>}
              {card.dk && deltas && (
                <AdDeltaLine delta={delta} metricKey={card.dk} loading={!!isPrevLoading} />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/** Compact delta indicator line below a metric card value */
function AdDeltaLine({
  delta,
  metricKey,
  loading,
}: {
  delta: AdvertisingDelta | undefined
  metricKey: ComparisonMetricKey
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-3.5 w-16 mt-1" />
  if (!delta)
    return (
      <p className="text-xs text-muted-foreground mt-1" title="Нет данных за предыдущий период">
        —
      </p>
    )
  const inverted = isInvertedAdMetric(metricKey)
  return (
    <p
      className={`text-xs mt-1 ${getAdDeltaColor(delta.direction, inverted)}`}
      title="По сравнению с предыдущим периодом"
    >
      {formatAdDelta(delta)}
    </p>
  )
}
