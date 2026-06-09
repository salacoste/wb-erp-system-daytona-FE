'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import {
  formatDaysUntilStockout,
  formatReorderValue,
  formatVelocity,
  VELOCITY_TREND_CONFIG,
} from '@/lib/supply-planning-utils'
import { TREND_ICONS, getActionButton } from './supply-planning-row-constants'
import { StatusCell, ProductNameCell, StockCell } from './SupplyPlanningRowCellsA'

/**
 * Supply Planning Row Cell Components — Part B (Velocity, DaysUntilStockout, SellingPrice, Action).
 * Re-exports Part A cells for backward compatibility.
 */

// Re-export Part A cells
export { StatusCell, ProductNameCell, StockCell }

interface CellProps {
  item: SupplyPlanningItem
}

/** Velocity cell with trend icon */
export function VelocityCell({ item }: CellProps) {
  const trend = item.velocity_trend
  const isKnownTrend = trend != null && trend !== 'no_data' && trend in TREND_ICONS
  const TrendIcon = isKnownTrend ? TREND_ICONS[trend] : null
  const trendConfig = isKnownTrend ? VELOCITY_TREND_CONFIG[trend] : null

  return (
    <td className="px-4 py-3 text-right hidden lg:table-cell">
      <span className="text-sm text-foreground flex items-center justify-end gap-1">
        {formatVelocity(item.avg_daily_sales)}
        <span className="text-muted-foreground text-xs">шт/д</span>
        {TrendIcon ? (
          <TrendIcon className={cn('h-3 w-3', trendConfig?.textClass ?? 'text-muted-foreground')} />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-help text-muted-foreground text-xs"
                  aria-label="Нет данных о тренде продаж"
                >
                  —
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                Недостаточно данных о продажах для определения тренда
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
    </td>
  )
}

/** Days until stockout cell with color coding */
export function DaysUntilStockoutCell({ item }: CellProps) {
  return (
    <td className="px-4 py-3 text-right">
      <span
        className={cn(
          'text-sm font-medium',
          item.days_until_stockout !== null && item.days_until_stockout <= 7
            ? 'text-red-600'
            : item.days_until_stockout !== null && item.days_until_stockout <= 14
              ? 'text-orange-600'
              : 'text-foreground'
        )}
      >
        {formatDaysUntilStockout(item.days_until_stockout)}
      </span>
    </td>
  )
}

/** Selling price cell — avg retail price (Request #203). Null when no sales data. */
export function SellingPriceCell({ item }: CellProps) {
  return (
    <td className="px-4 py-3 text-right hidden xl:table-cell">
      <span className="text-sm text-foreground">
        {item.selling_price != null ? formatReorderValue(item.selling_price) : '—'}
      </span>
    </td>
  )
}

/** Action button cell based on stockout risk */
export function ActionCell({ item }: CellProps) {
  const actionConfig = getActionButton(item.stockout_risk)

  return (
    <td className="px-4 py-3 text-center">
      {actionConfig ? (
        <Button
          variant={actionConfig.variant}
          size="sm"
          className={cn('h-8 text-xs', actionConfig.className)}
        >
          <actionConfig.icon className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">{actionConfig.label}</span>
        </Button>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </td>
  )
}
