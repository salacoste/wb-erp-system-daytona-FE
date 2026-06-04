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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1">
        <span className="text-sm font-semibold text-gray-800">{formatCurrency(total)}</span>
      </div>
      {revenueShare != null && (
        <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1">
          <span className="text-xs text-gray-500">% от выручки:</span>
          <span className="text-xs font-semibold text-gray-700">
            {formatPercentage(revenueShare, 1)}
          </span>
        </div>
      )}
      {wowChange != null && (
        <div
          className={`flex items-center gap-1 rounded-md px-2 py-1 ${
            wowChange > 0 ? 'bg-red-50' : wowChange < 0 ? 'bg-green-50' : 'bg-gray-50'
          }`}
        >
          {wowChange > 0 ? (
            <TrendingUp className="h-3 w-3 text-red-500" />
          ) : wowChange < 0 ? (
            <TrendingDown className="h-3 w-3 text-green-500" />
          ) : null}
          <span
            className={`text-xs font-medium ${
              wowChange > 0 ? 'text-red-600' : wowChange < 0 ? 'text-green-600' : 'text-gray-500'
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
