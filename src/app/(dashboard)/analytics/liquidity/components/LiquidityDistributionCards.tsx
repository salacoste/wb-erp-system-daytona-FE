'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { LiquidityCategory, LiquidityDistribution } from '@/types/liquidity'
import {
  getLiquidityCategoryConfig,
  formatCurrency,
  formatPercentage,
} from '@/lib/liquidity-utils'
import { cn } from '@/lib/utils'

interface LiquidityDistributionCardsProps {
  distribution: LiquidityDistribution
  activeFilter: LiquidityCategory | null
  onCardClick: (category: LiquidityCategory) => void
}

const CATEGORY_ORDER: LiquidityCategory[] = [
  'highly_liquid',
  'medium_liquid',
  'low_liquid',
  'illiquid',
]

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CATEGORY_ORDER.map((category) => {
        const item = distribution[category]
        const config = getLiquidityCategoryConfig(category)
        const isActive = activeFilter === category
        const isFiltered = activeFilter !== null && !isActive

        return (
          <Card
            key={category}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-md',
              isActive && 'ring-2 ring-offset-2',
              isFiltered && 'opacity-50',
            )}
            style={{
              borderColor: isActive ? config.color : undefined,
              '--tw-ring-color': config.color,
            } as React.CSSProperties}
            onClick={() => onCardClick(category)}
          >
            <CardContent className="p-4">
              {/* Header with icon and label */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{config.icon}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                  }}
                >
                  {config.targetShare}
                </span>
              </div>

              {/* Main value - percentage */}
              <div className="mb-2">
                <span
                  className="text-3xl font-bold"
                  style={{ color: config.color }}
                >
                  {formatPercentage(item.pct)}
                </span>
              </div>

              {/* Secondary metrics */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{item.count} SKU</span>
                <span>{formatCurrency(item.value)}</span>
              </div>

              {/* Average turnover days */}
              <div className="mt-2 text-xs text-muted-foreground">
                Ср. оборот: {item.avg_turnover_days} дней
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
