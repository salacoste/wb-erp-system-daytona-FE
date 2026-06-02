'use client'

/**
 * Overlap Summary Cards — Story 73.7-FE
 * Venn-style 3-card summary: organic-only, ad-only, both channels
 */

import { Card, CardContent } from '@/components/ui/card'
import { Search, Megaphone, Layers } from 'lucide-react'
import type { OverlapSummary } from '../utils/cross-reference-utils'

interface OverlapSummaryCardsProps {
  summary: OverlapSummary
}

// iter-62: Russian locale — was `${(...).toFixed(1)}%` → "87.5%" (dot, no separator).
// Inline Intl style:'percent' over value/100, pinned to 1 decimal to preserve the original
// precision (the canonical @/lib/utils formatPercentage allows 2 decimals → "55,56 %").
function pct(count: number, total: number): string {
  const value = total === 0 ? 0 : (count / total) * 100
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function OverlapSummaryCards({ summary }: OverlapSummaryCardsProps) {
  const cards = [
    {
      label: 'Только органика',
      count: summary.organicOnly,
      icon: Search,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Только реклама',
      count: summary.adOnly,
      icon: Megaphone,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Оба канала',
      count: summary.both,
      icon: Layers,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-2 ${card.bg}`} aria-hidden="true">
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.count}</p>
                <p className="text-xs text-muted-foreground">
                  {pct(card.count, summary.total)} от всех
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
