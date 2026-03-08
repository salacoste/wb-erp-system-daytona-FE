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

function pct(count: number, total: number): string {
  if (total === 0) return '0%'
  return `${((count / total) * 100).toFixed(1)}%`
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
