'use client'

import { Wallet, TrendingUp, Percent, Target, ShoppingCart, Sprout } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
 * Format percentage value
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
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

/**
 * Advertising Summary Cards Component
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Epic 33: Advertising Analytics (Frontend)
 * Epic 35: Total Sales & Organic Split
 *
 * Displays 6 summary metric cards (Epic 35 updated):
 * - Total Sales (NEW: Epic 35 - organic + ad revenue)
 * - Ad Revenue (ad-attributed only)
 * - Overall ROAS
 * - Overall ROI
 * - Organic Contribution % (NEW: Epic 35)
 * - Active Campaigns
 *
 * Features:
 * - Loading skeleton state
 * - Color-coded ROAS/ROI values
 * - Epic 35: Organic vs advertising split visualization
 * - Responsive grid (AC6)
 * - Accessible (AC8)
 */
export function AdvertisingSummaryCards({
  summary,
  isLoading,
}: AdvertisingSummaryCardsProps) {
  // Loading state (Epic 35: now 6 cards)
  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Загрузка метрик..."
      >
        {[...Array(6)].map((_, i) => (
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
    // Epic 35: Total Sales (organic + ad revenue)
    {
      id: 'total_sales',
      label: 'Всего продаж',
      value: formatCurrency(summary.total_sales),
      icon: ShoppingCart,
      colorClass: 'text-indigo-600',
      description: 'Общая выручка (органика + реклама)',
      subtext: summary.total_organic_sales > 0
        ? `${formatCurrency(summary.total_organic_sales)} органика`
        : undefined,
    },
    // Epic 35: Ad Revenue (renamed from Total Revenue)
    {
      id: 'ad_revenue',
      label: 'Из рекламы',
      value: formatCurrency(summary.total_revenue),
      icon: Wallet,
      colorClass: 'text-blue-600',
      description: 'Выручка только из рекламных кампаний',
    },
    {
      id: 'roas',
      label: 'Общий ROAS',
      value: `${summary.overall_roas.toFixed(1)}x`,
      icon: TrendingUp,
      colorClass: getRoasColor(summary.overall_roas),
      description: 'Возврат на рекламные расходы (выручка / расходы)',
    },
    {
      id: 'roi',
      label: 'Общий ROI',
      value: formatPercent(summary.overall_roi),
      icon: Percent,
      colorClass: getRoiColor(summary.overall_roi),
      description: 'Рентабельность инвестиций в рекламу',
    },
    // Epic 35: Organic Contribution %
    {
      id: 'organic_contribution',
      label: 'Доля органики',
      value: summary.avg_organic_contribution >= 0
        ? `${summary.avg_organic_contribution.toFixed(1)}%`  // Backend returns percentage already
        : '—',
      icon: Sprout,
      colorClass: summary.avg_organic_contribution >= 50  // Compare with 50% not 0.5
        ? 'text-green-600'
        : summary.avg_organic_contribution >= 20  // Compare with 20% not 0.2
        ? 'text-yellow-600'
        : 'text-orange-600',
      description: 'Средний процент органических продаж',
    },
    {
      id: 'campaigns',
      label: 'Активных кампаний',
      value: summary.active_campaigns.toString(),
      icon: Target,
      colorClass: 'text-purple-600',
      subtext: `из ${summary.campaign_count}`,
      description: `${summary.active_campaigns} активных из ${summary.campaign_count} всего`,
    },
  ]

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      role="region"
      aria-label="Ключевые показатели рекламы"
    >
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Icon
                  className={cn('h-4 w-4', card.colorClass)}
                  aria-hidden="true"
                />
                <span>{card.label}</span>
              </div>
              <div
                className={cn('text-2xl font-bold', card.colorClass)}
                aria-label={card.description}
              >
                {card.value}
              </div>
              {card.subtext && (
                <p className="text-sm text-muted-foreground mt-1">
                  {card.subtext}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
