'use client'

import { Wallet, TrendingUp, Percent, ShoppingCart, Sprout, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { AdvertisingSummary } from '@/types/advertising-analytics'

/**
 * Props for AdvertisingSummaryCards component
 */
interface AdvertisingSummaryCardsProps {
  /** Summary data from API */
  summary?: AdvertisingSummary
  /** Loading state */
  isLoading: boolean
}

/**
 * Format currency in rubles
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format an ROI percentage (Russian locale).
 * iter-61: `overall_roi` is already in percent units (live e.g. -136.67), so the old
 * `value * 100` rendered it 100× too large ("-13667.0%"). Intl `style:'percent'` multiplies
 * by 100, so format `value / 100` to show the percent as-is ("-136,7 %").
 */
function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Get color class for ROAS value
 * Based on efficiency thresholds from Story 33.4-fe
 */
function getRoasColor(roas: number): string {
  if (roas >= 3.0) return 'text-green-600'
  if (roas >= 2.0) return 'text-yellow-600'
  if (roas >= 1.0) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get color class for ROI value
 * Based on efficiency thresholds from Story 33.4-fe
 */
function getRoiColor(roi: number): string {
  if (roi >= 0.5) return 'text-green-600'
  if (roi >= 0.2) return 'text-yellow-600'
  if (roi >= 0) return 'text-orange-600'
  return 'text-red-600'
}

/** Advertising Summary Cards - Story 33.2-FE, Epic 35: 5 metric cards with tooltips */
export function AdvertisingSummaryCards({ summary, isLoading }: AdvertisingSummaryCardsProps) {
  // Loading state
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

  // No data state
  if (!summary) {
    return null
  }

  const cards = [
    {
      id: 'total_sales',
      label: 'Всего продаж',
      value: formatCurrency(summary.total_sales),
      icon: ShoppingCart,
      colorClass: 'text-indigo-600',
      tooltip: 'Органические + рекламные продажи. Данные из рекламного кабинета WB.',
      subtext:
        summary.total_organic_sales > 0
          ? `${formatCurrency(summary.total_organic_sales)} органика`
          : undefined,
    },
    {
      id: 'ad_revenue',
      label: 'Из рекламы',
      value: formatCurrency(summary.total_revenue),
      icon: Wallet,
      colorClass: 'text-blue-600',
      tooltip:
        'Выручка от заказов, атрибутированных рекламе. WB определяет атрибуцию: клик → заказ.',
    },
    {
      id: 'roas',
      label: 'Общий ROAS',
      // Story 88.2-FE: null when totalSpend = 0 (division undefined) — render as "—"
      value: summary.overall_roas != null ? `${summary.overall_roas.toFixed(1)}x` : '—',
      icon: TrendingUp,
      colorClass:
        summary.overall_roas != null ? getRoasColor(summary.overall_roas) : 'text-gray-400',
      tooltip: 'Выручка от рекламы \u00F7 расход на кампании. Данные из рекламного кабинета WB.',
    },
    {
      id: 'roi',
      label: 'Общий ROI',
      // Story 88.2-FE: null when totalSpend = 0
      value: summary.overall_roi != null ? formatPercent(summary.overall_roi) : '—',
      icon: Percent,
      colorClass: summary.overall_roi != null ? getRoiColor(summary.overall_roi) : 'text-gray-400',
      tooltip:
        '(Прибыль \u2212 расход на рекламу) \u00F7 расход \u00D7 100%. Прибыль из маржинальной аналитики.',
    },
    {
      id: 'organic_contribution',
      label: 'Доля органики',
      value:
        summary.avg_organic_contribution >= 0
          ? // iter-61: was `${value.toFixed(1)}%` (dot-locale). avg_organic_contribution is
            // percent units \u2014 reuse formatPercent (Russian locale, magnitude unchanged).
            formatPercent(summary.avg_organic_contribution)
          : '\u2014',
      icon: Sprout,
      colorClass:
        summary.avg_organic_contribution >= 50
          ? 'text-green-600'
          : summary.avg_organic_contribution >= 20
            ? 'text-yellow-600'
            : 'text-orange-600',
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
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
