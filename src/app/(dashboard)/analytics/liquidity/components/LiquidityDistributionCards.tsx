'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { LiquidityCategory, LiquidityDistribution } from '@/types/liquidity'
import {
  getLiquidityCategoryConfig,
  formatCurrency,
  formatTurnoverDays,
} from '@/lib/liquidity-utils'
import { cn, formatPercentage } from '@/lib/utils'
import { LIQUIDITY_CATEGORY_TOKENS } from './liquidity-category-tokens'

interface LiquidityDistributionCardsProps {
  distribution: LiquidityDistribution
  activeFilter: LiquidityCategory | null
  onCardClick: (category: LiquidityCategory) => void
}

const CATEGORY_ORDER: LiquidityCategory[] = ['highly_liquid', 'medium', 'low', 'illiquid']

// Story 169.10: category → token map lives in ./liquidity-category-tokens
// (single source shared with the distribution chart + table badges).
// lib config.color/bgColor (legacy hex) are intentionally NOT used.

/**
 * 4-card distribution dashboard
 * Shows SKU count, value, and percentage for each liquidity category
 * Clickable for filtering - Story 7.2
 */
export function LiquidityDistributionCards({
  distribution,
  activeFilter,
  onCardClick,
}: LiquidityDistributionCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch [&>*]:h-full">
      {CATEGORY_ORDER.map(category => {
        const item = distribution[category]
        const config = getLiquidityCategoryConfig(category)
        // 169.10: token color from route config (chart roles), not lib legacy hex
        const color = LIQUIDITY_CATEGORY_TOKENS[category]
        const isActive = activeFilter === category
        const isFiltered = activeFilter !== null && !isActive

        return (
          <Card
            key={category}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              isActive && 'ring-2 ring-offset-2',
              isFiltered && 'opacity-50'
            )}
            style={
              {
                borderColor: isActive ? color : undefined,
                '--tw-ring-color': color,
              } as React.CSSProperties
            }
            onClick={() => onCardClick(category)}
          >
            <CardContent className="p-4">
              {/* Header with icon and label */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  {/* Story 174.2 (C16): chart-N tokens are fill/stroke roles only —
                      text labels use muted (chart-3 as text measured a marginal
                      4.52:1, failing AA headroom in one theme). */}
                  <span className="text-sm font-medium text-muted-foreground">{config.label}</span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    // 169.10: token-tinted badge bg (replaces legacy hex bgColor).
                    // Text = var(--color-foreground): chart-N as chip text on a
                    // 15% tint measures 3.71–4.19:1 (AA fail in light) — see review.
                    backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                    color: 'var(--color-foreground)',
                  }}
                >
                  {config.targetShare}
                </span>
              </div>

              {/* Main value - percentage (or neutral "no sales" when all SKUs zero-sales).
                  BD-14: `pct` is the share of total inventory VALUE (capital), not SKU count —
                  label it so it isn't misread as "% of SKUs". */}
              <div className="mb-2 flex min-h-[2.5rem] items-baseline gap-2">
                {item.count > 0 && item.avg_turnover_days >= 999 ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    Нет продаж за период
                  </span>
                ) : (
                  <>
                    {/* 174.2 (C16): headline value uses default foreground (KPI-value
                        canon) — the chart token stays on ring/border/tint fills only. */}
                    <span className="text-3xl font-bold">{formatPercentage(item.pct)}</span>
                    <span className="text-xs text-muted-foreground">от стоимости запасов</span>
                  </>
                )}
              </div>

              {/* Secondary metrics */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{item.count} SKU</span>
                <span>{formatCurrency(item.value)}</span>
              </div>

              {/* Average turnover days */}
              <div className="mt-2 text-xs text-muted-foreground">
                Ср. оборот: {formatTurnoverDays(item.avg_turnover_days)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
