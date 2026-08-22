'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Wallet, Package, Clock, TrendingDown } from 'lucide-react'
import type { LiquiditySummary } from '@/types/liquidity'
import {
  formatCurrency,
  formatTurnoverDays,
  formatFrozenCapitalWarning,
} from '@/lib/liquidity-utils'
import { cn, formatPercentage } from '@/lib/utils'

interface LiquiditySummaryBarProps {
  summary: LiquiditySummary
}

/**
 * Summary metrics bar with key KPIs
 * Shows total inventory, frozen capital, and average turnover
 * Story 7.2: Liquidity Page Structure
 *
 * Story 169.10: icon chips migrated from light-only /100-pastel pairs
 * (bg-blue-100 text-blue-600 etc.) to solid semantic pairs (169.9 canon).
 * The legacy lib helper getFrozenCapitalStatusClass (returns light-only
 * text-*-600 utilities) is no longer applied; the danger tier is mapped
 * locally using the SAME thresholds the lib documents:
 * - liquidity-utils isFrozenCapitalHealthy: pct < 5 = healthy
 * - liquidity-formatters formatFrozenCapitalWarning: pct > 10 critical,
 *   pct > 5 elevated → both danger tiers render text-status-error here.
 *
 * Boundary decision: frozenWarning !== null ⇔ pct > 5 (lib threshold), so the
 * two conditions are equivalent — only the lib-derived one is kept. At exactly
 * pct = 5 the value renders NEUTRAL (foreground), even though lib
 * isFrozenCapitalHealthy counts pct = 5 as unhealthy: this intentionally
 * preserves the legacy visual (error only above the threshold), not a drift.
 */
export function LiquiditySummaryBar({ summary }: LiquiditySummaryBarProps) {
  const frozenWarning = formatFrozenCapitalWarning(summary.frozen_capital_pct)
  const isFrozenDangerous = frozenWarning !== null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Inventory Value */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-information text-status-information-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего на складе</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(summary.total_inventory_value)}
              </p>
            </div>
          </div>

          {/* Total SKU Count */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Артикулов</p>
              <p className="text-lg font-semibold tabular-nums">{summary.total_sku_count}</p>
            </div>
          </div>

          {/* Average Turnover */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-information text-status-information-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Средний оборот</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatTurnoverDays(summary.avg_turnover_days)}
              </p>
            </div>
          </div>

          {/* Frozen Capital */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-error text-status-error-foreground">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Замороженный капитал</p>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums',
                  // Tier mapping per lib thresholds — see component docblock (169.10).
                  isFrozenDangerous ? 'text-status-error' : 'text-foreground'
                )}
              >
                {formatCurrency(summary.frozen_capital)}
                <span className="text-sm font-normal ml-1">
                  ({formatPercentage(summary.frozen_capital_pct)})
                </span>
              </p>
              {frozenWarning && <p className="text-xs text-status-error">{frozenWarning}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
