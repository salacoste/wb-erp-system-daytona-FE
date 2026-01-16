'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Wallet, Package, Clock, TrendingDown } from 'lucide-react'
import type { LiquiditySummary } from '@/types/liquidity'
import {
  formatCurrency,
  formatPercentage,
  formatTurnoverDays,
  formatFrozenCapitalWarning,
  getFrozenCapitalStatusClass,
} from '@/lib/liquidity-utils'
import { cn } from '@/lib/utils'

interface LiquiditySummaryBarProps {
  summary: LiquiditySummary
}

/**
 * Summary metrics bar with key KPIs
 * Shows total inventory, frozen capital, and average turnover
 * Story 7.2: Liquidity Page Structure
 */
export function LiquiditySummaryBar({ summary }: LiquiditySummaryBarProps) {
  const frozenWarning = formatFrozenCapitalWarning(summary.frozen_capital_pct)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Inventory Value */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего на складе</p>
              <p className="text-lg font-semibold">
                {formatCurrency(summary.total_inventory_value)}
              </p>
            </div>
          </div>

          {/* Total SKU Count */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Артикулов</p>
              <p className="text-lg font-semibold">
                {summary.total_sku_count}
              </p>
            </div>
          </div>

          {/* Average Turnover */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Средний оборот</p>
              <p className="text-lg font-semibold">
                {formatTurnoverDays(summary.avg_turnover_days)}
              </p>
            </div>
          </div>

          {/* Frozen Capital */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Замороженный капитал</p>
              <p className={cn('text-lg font-semibold', getFrozenCapitalStatusClass(summary.frozen_capital_pct))}>
                {formatCurrency(summary.frozen_capital)}
                <span className="text-sm font-normal ml-1">
                  ({formatPercentage(summary.frozen_capital_pct)})
                </span>
              </p>
              {frozenWarning && (
                <p className="text-xs text-red-600">{frozenWarning}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
