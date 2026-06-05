'use client'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import {
  formatDaysUntilStockout,
  formatReorderValue,
  formatStockQty,
  formatVelocity,
  STOCKOUT_RISK_CONFIG,
  VELOCITY_TREND_CONFIG,
} from '@/lib/supply-planning-utils'
import { STATUS_ICONS, TREND_ICONS, getActionButton } from './supply-planning-row-constants'

/**
 * Supply Planning Row Cell Components
 * Extracted from SupplyPlanningRow.tsx (Epic 74 - file size compliance)
 *
 * Presentational sub-components for individual table cells.
 */

interface CellProps {
  item: SupplyPlanningItem
}

/** Status icon cell with tooltip */
export function StatusCell({ item }: CellProps) {
  const stockoutRisk =
    item.stockout_risk && item.stockout_risk in STATUS_ICONS ? item.stockout_risk : 'healthy'
  const StatusIcon = STATUS_ICONS[stockoutRisk]
  const statusConfig = STOCKOUT_RISK_CONFIG[stockoutRisk]

  return (
    <td className="px-4 py-3 text-center" aria-label={statusConfig?.label ?? 'Неизвестно'}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-full',
                statusConfig?.bgClass ?? 'bg-gray-100',
                statusConfig?.textClass ?? 'text-gray-600'
              )}
            >
              <StatusIcon className="h-4 w-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusConfig?.label ?? 'Неизвестно'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </td>
  )
}

/** Product name cell with truncation tooltip */
export function ProductNameCell({ item }: CellProps) {
  return (
    <td className="px-4 py-3" aria-label={item.product_name}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-gray-900 truncate block max-w-[200px]" aria-hidden="true">
              {item.product_name}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px]">
            <p>{item.product_name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </td>
  )
}

/** Current stock cell with per-warehouse tooltip */
export function StockCell({ item }: CellProps) {
  const warehouseTooltip =
    item.warehouses.length > 1 ? (
      <div className="space-y-1">
        {item.warehouses.map((wh, i) => (
          <div key={i} className="flex justify-between gap-4 text-xs">
            <span>{wh.name}:</span>
            <span className="font-medium">{formatStockQty(wh.stock)} шт</span>
          </div>
        ))}
      </div>
    ) : null

  return (
    <td
      className="px-4 py-3 text-right"
      aria-label={`Остаток: ${formatStockQty(item.current_stock)} шт`}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'text-sm font-medium cursor-default',
                item.current_stock === 0 ? 'text-red-600' : 'text-gray-900'
              )}
            >
              {formatStockQty(item.current_stock)}
              {item.warehouses.length > 1 && (
                <span className="ml-1 text-xs text-gray-400">+{item.warehouses.length - 1}</span>
              )}
            </span>
          </TooltipTrigger>
          {warehouseTooltip && <TooltipContent side="top">{warehouseTooltip}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </td>
  )
}

/** Velocity cell with trend icon */
export function VelocityCell({ item }: CellProps) {
  const trend = item.velocity_trend
  // Only growing/stable/declining are renderable trends; no_data/null → no fabricated icon.
  const isKnownTrend = trend != null && trend !== 'no_data' && trend in TREND_ICONS
  const TrendIcon = isKnownTrend ? TREND_ICONS[trend] : null
  const trendConfig = isKnownTrend ? VELOCITY_TREND_CONFIG[trend] : null

  return (
    <td className="px-4 py-3 text-right hidden lg:table-cell">
      <span className="text-sm text-gray-900 flex items-center justify-end gap-1">
        {formatVelocity(item.avg_daily_sales)}
        <span className="text-gray-400 text-xs">шт/д</span>
        {TrendIcon ? (
          <TrendIcon className={cn('h-3 w-3', trendConfig?.textClass ?? 'text-gray-500')} />
        ) : (
          // Defensive Frontend: backend velocity_trend 'no_data'/null → indicate unknown,
          // never the Minus icon (which means a real 'stable' trend).
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-help text-gray-300 text-xs"
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
              : 'text-gray-900'
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
      <span className="text-sm text-gray-900">
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
        <span className="text-gray-400">—</span>
      )}
    </td>
  )
}
