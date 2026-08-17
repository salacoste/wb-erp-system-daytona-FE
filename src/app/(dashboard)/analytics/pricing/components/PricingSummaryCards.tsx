'use client'

/**
 * Pricing summary cards: total SKUs, avg gap, below/above target counts
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import { Package, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercentage } from '@/lib/utils'
import type { PriceRecommendation } from '@/types/price-recommendations'

interface PricingSummaryCardsProps {
  items: PriceRecommendation[]
  isLoading: boolean
}

function computeStats(items: PriceRecommendation[]) {
  if (items.length === 0) return null
  const belowTarget = items.filter(i => i.gap !== null && i.gap < 0).length
  const aboveTarget = items.filter(i => i.gap !== null && i.gap >= 0).length
  const gaps = items.filter(i => i.gapPct !== null).map(i => i.gapPct!)
  // BD-37: null (not 0) when no SKU reports a gap — a fabricated "0 %" reads as "no gap",
  // which is different from "unknown". Render "—" instead (anti-pattern #8).
  const avgGapPct = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null
  return { total: items.length, belowTarget, aboveTarget, avgGapPct }
}

export function PricingSummaryCards({ items, isLoading }: PricingSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = computeStats(items)
  if (!stats) return null

  const cards = [
    {
      title: 'Всего SKU',
      value: String(stats.total),
      icon: Package,
      description: 'с рекомендациями',
    },
    {
      title: 'Средний разрыв',
      value: stats.avgGapPct != null ? formatPercentage(stats.avgGapPct) : '—',
      icon: BarChart3,
      description: 'от целевой маржи',
    },
    {
      title: 'Ниже цели',
      value: String(stats.belowTarget),
      icon: TrendingDown,
      description: 'рекомендуется повышение',
      // 168.6: semantic financial token instead of legacy red-600
      valueClass: 'text-financial-negative',
    },
    {
      title: 'Выше цели',
      value: String(stats.aboveTarget),
      icon: TrendingUp,
      description: 'цель достигнута',
      // 168.6: semantic financial token instead of legacy green-600
      valueClass: 'text-financial-positive',
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
              <div className={`text-2xl font-bold ${card.valueClass ?? ''}`}>{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
