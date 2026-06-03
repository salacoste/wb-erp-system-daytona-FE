'use client'

import { Wallet, TrendingUp, Percent, ShoppingCart, Sprout, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatRoas } from '@/lib/utils'
import { getRoasColorClass } from '@/lib/efficiency-utils'
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
 * Get color class for ROAS value.
 *
 * iter-119: delegates to the canonical 5-band getRoasColorClass in efficiency-utils so this
 * page, the dashboard AdvertisingCard, and the advertising widget all agree. Previously this
 * had a local ≥3-green scheme (Story 33.4-FE) that diverged from the canonical bands.
 *
 * roas is a raw MULTIPLIER (e.g. 38.8×, rendered "38,8x" via formatRoas), NOT a percent.
 * Still exported + tested so a future units refactor can't silently re-introduce the
 * fraction-vs-percent trap getRoiColor had.
 *
 * Signature stays `number` (not the delegate's `number | null | undefined`) by design: this
 * page guards null at the call site, rendering 'text-gray-400' for a missing ROAS rather than
 * the delegate's muted no-data branch. Keeping the param non-null preserves that call-site
 * contract (the muted branch is for the unguarded widget/card callers).
 */
export function getRoasColor(roas: number): string {
  return getRoasColorClass(roas)
}

/**
 * Get color class for ROI value. `roi` is in PERCENT units (same value formatPercent renders,
 * e.g. 30 = 30%), so the thresholds are percents — green ≥50%, yellow ≥20%, orange ≥0, red <0
 * (Story 33.4-FE "ROI 50-100% green / 20-50% yellow"). iter-84: the thresholds were FRACTIONS
 * (0.5/0.2) applied to a percent-domain value, so any ROI ≥0.5% showed green (a 30% ROI green,
 * a 1% ROI green) — the colour no longer distinguished ROI health. ×100 to the percent domain.
 */
export function getRoiColor(roi: number): string {
  if (roi >= 50) return 'text-green-600'
  if (roi >= 20) return 'text-yellow-600'
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
      value: summary.overall_roas != null ? formatRoas(summary.overall_roas) : '—',
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
      // avg_organic_contribution is in percent units; WB re-attribution can drive it below
      // zero (see tooltip). Render the real value via formatPercent (Russian locale) \u2014 masking
      // a real negative as a dash erased a meaningful signal (Defensive Frontend: indicate,
      // don't hide). Missing is coerced to 0 by the normalizer, so there is no no-data case.
      value: formatPercent(summary.avg_organic_contribution),
      icon: Sprout,
      colorClass:
        summary.avg_organic_contribution < 0
          ? // a negative organic share is a WB re-attribution anomaly — flag red, not orange
            // (orange = low-but-positive). Mirrors getRoiColor's `< 0 → red` branch.
            'text-red-600'
          : summary.avg_organic_contribution >= 50
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
