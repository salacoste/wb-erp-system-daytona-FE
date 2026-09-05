'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

export function ExpenseSummaryBadge({
  total,
  revenueShare,
  previousTotal,
}: {
  total: number
  revenueShare?: number
  previousTotal?: number
}) {
  const wowChange =
    previousTotal != null && previousTotal > 0
      ? ((total - previousTotal) / previousTotal) * 100
      : undefined

  return (
    // Wave-4 boundary sweep: WoW delta = money-direction (financial valence, NOT status),
    // per wave-1 canon #2/#5. Chips measured over card: finNeg/5 5.20/8.19, finPos/5
    // 4.80/8.72, muted/50 neutrals 7.49/9.12+ — all AA both themes.
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
      </div>
      {revenueShare != null && (
        <div className="flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
          <span className="text-xs text-muted-foreground">% от выручки:</span>
          <span className="text-xs font-semibold text-foreground">
            {formatPercentage(revenueShare, 1)}
          </span>
        </div>
      )}
      {wowChange != null && (
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1 ${
            wowChange > 0
              ? 'bg-financial-negative/5'
              : wowChange < 0
                ? 'bg-financial-positive/5'
                : 'bg-muted/50'
          }`}
        >
          {wowChange > 0 ? (
            <TrendingUp className="h-3 w-3 text-financial-negative" />
          ) : wowChange < 0 ? (
            <TrendingDown className="h-3 w-3 text-financial-positive" />
          ) : null}
          <span
            className={`text-xs font-medium ${
              wowChange > 0
                ? 'text-financial-negative'
                : wowChange < 0
                  ? 'text-financial-positive'
                  : 'text-muted-foreground'
            }`}
          >
            {wowChange > 0 ? '+' : ''}
            {formatPercentage(wowChange, 1)}
          </span>
        </div>
      )}
    </div>
  )
}
