'use client'

import { cn } from '@/lib/utils'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import { formatStockQty, STOCKOUT_RISK_CONFIG } from '@/lib/supply-planning-utils'
import { STATUS_ICONS } from './supply-planning-row-constants'
import { SUPPLY_RISK_TOKENS } from './supply-risk-tokens'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * Supply Planning Row Cell Components — Part A (Status, ProductName, Stock).
 * Extracted from SupplyPlanningRowCells.tsx for file-size compliance (210 → ~140 lines).
 */

interface CellProps {
  item: SupplyPlanningItem
}

/** Status icon cell with tooltip — chip classes from the token map + sr-only
 *  label (non-color risk marker, Story 169.13; lib bgClass/textClass unused). */
export function StatusCell({ item }: CellProps) {
  const stockoutRisk =
    item.stockout_risk && item.stockout_risk in STATUS_ICONS ? item.stockout_risk : 'unknown'
  const StatusIcon = STATUS_ICONS[stockoutRisk]
  const statusConfig = STOCKOUT_RISK_CONFIG[stockoutRisk]

  return (
    <td className="px-4 py-3 text-center" aria-label={statusConfig?.label ?? 'Неизвестно'}>
      {/* «Риск: » prefix disambiguates the tier label from the zero-stock text
          («Нет в наличии») rendered in the stock column — same lib wording,
          different meaning; prevents duplicate exact-text lookups (e2e 169.13). */}
      <span className="sr-only">{`Риск: ${statusConfig?.label ?? 'Неизвестно'}`}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-full',
                SUPPLY_RISK_TOKENS[stockoutRisk].chip
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
            <span
              className="text-sm text-foreground truncate block max-w-[200px]"
              aria-hidden="true"
            >
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
                'text-sm font-medium tabular-nums cursor-default',
                // Zero stock = explicit error state (distinct from unavailable, AP#8)
                item.current_stock === 0 ? 'text-status-error' : 'text-foreground'
              )}
            >
              {formatStockQty(item.current_stock)}
              {item.warehouses.length > 1 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  +{item.warehouses.length - 1}
                </span>
              )}
            </span>
          </TooltipTrigger>
          {warehouseTooltip && <TooltipContent side="top">{warehouseTooltip}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </td>
  )
}
