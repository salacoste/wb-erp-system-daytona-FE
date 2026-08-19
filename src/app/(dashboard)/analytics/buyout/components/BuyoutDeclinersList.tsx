/**
 * Buyout Top Decliners List
 * Extracted from BuyoutSummaryWidget.tsx for file size compliance
 */

'use client'

import { TrendingDown } from 'lucide-react'
import { formatPercentageInt } from '@/lib/utils'
import type { BuyoutSummaryResponse } from '@/types/analytics-buyout'

type DeclinerItem = NonNullable<BuyoutSummaryResponse['topDecliners']>[number]

interface BuyoutDeclinersListProps {
  decliners: DeclinerItem[]
}

export function BuyoutDeclinersList({ decliners }: BuyoutDeclinersListProps) {
  if (decliners.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-financial-negative">
        <TrendingDown className="h-4 w-4" />
        Снижение выкупа
      </div>
      <div className="space-y-1">
        {decliners.map(d => (
          <div
            key={d.nmId}
            className="flex items-center justify-between text-sm text-muted-foreground"
          >
            <span className="font-mono text-xs">#{d.nmId}</span>
            <span>
              {d.buyoutRatePct != null ? formatPercentageInt(d.buyoutRatePct) : '—'}
              {/* AP#8: null trend delta renders '—', never a fabricated "0 п.п." */}
              <span className="text-financial-negative ml-1">
                {d.trendDelta == null
                  ? '(— п.п.)'
                  : `(${d.trendDelta < 0 ? '' : '+'}${d.trendDelta.toFixed(0)} п.п.)`}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
