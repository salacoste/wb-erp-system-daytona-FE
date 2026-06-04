'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { UnitEconomicsItem } from '@/types/unit-economics'
import {
  formatCurrency,
  formatPercentage,
  getProfitabilityColor,
  getProfitabilityLabel,
  getProfitabilityBgClass,
} from '@/lib/unit-economics-utils'
import { MarginIndicator, CostCell } from './unit-economics-table-utils'

/** Props for a single unit economics table row. */
export interface UnitEconomicsTableRowProps {
  item: UnitEconomicsItem
  isSelected: boolean
  onSelect: () => void
}

/**
 * H2-1: Single helper that produces consistent label strings for BOTH the
 * tooltip body and the aria-label — screen-reader and sighted users share
 * the same mental model.
 * Returns null-safe results: when latestDcu/latestFcu are absent the
 * corresponding label properties are undefined.
 */
function formatDeliveryDisclosure(item: UnitEconomicsItem): {
  ariaLabel: string
  dcuLabel: string | undefined
  fcuLabel: string | undefined
} {
  if (item.costs_pct.delivery_to_warehouse == null) {
    return { ariaLabel: 'Нет данных по доставке', dcuLabel: undefined, fcuLabel: undefined }
  }
  const pctPart = `Доставка ${formatPercentage(item.costs_pct.delivery_to_warehouse)}`
  const dcuLabel =
    item.latestDcu != null ? `DCU (доставка) ${formatCurrency(item.latestDcu)}/ед.` : undefined
  const fcuLabel =
    item.latestFcu != null ? `FCU (всего) ${formatCurrency(item.latestFcu)}/ед.` : undefined
  const ariaLabel = [pctPart, dcuLabel, fcuLabel].filter(Boolean).join('; ')
  return { ariaLabel, dcuLabel, fcuLabel }
}

/** Single row in the Unit Economics data table — extracted from UnitEconomicsTable (Story 77.5). */
export function UnitEconomicsTableRow({ item, isSelected, onSelect }: UnitEconomicsTableRowProps) {
  const totalLogistics = item.costs_pct.logistics_delivery + item.costs_pct.logistics_return
  // H2-1: compute disclosure strings once; both trigger aria-label and tooltip body consume them.
  const { ariaLabel, dcuLabel, fcuLabel } = formatDeliveryDisclosure(item)

  return (
    <TableRow
      className={cn(
        'cursor-pointer transition-colors',
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
      )}
      onClick={onSelect}
    >
      <TableCell className="font-mono text-sm text-gray-600">{item.sku_id}</TableCell>
      <TableCell>
        <div className="max-w-[200px] truncate" title={item.product_name}>
          {item.product_name}
        </div>
        <div className="text-xs text-gray-400">{item.brand}</div>
      </TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>
      <CostCell value={item.costs_pct.cogs} highThreshold={50} medThreshold={40} />
      <CostCell value={item.costs_pct.commission} highThreshold={20} />
      <CostCell value={totalLogistics} highThreshold={15} />
      <CostCell value={item.costs_pct.storage} highThreshold={5} />
      <TableCell className="text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            {item.costs_pct.delivery_to_warehouse != null ? (
              // H2-1 + M2-1 + L2-1: aria-label from shared helper (no role="button", no tabIndex —
              // Radix TooltipTrigger asChild handles role wiring; virtual-cursor screen readers
              // still read aria-label on non-focusable spans).
              <span
                className="text-cyan-600 cursor-help underline decoration-dotted decoration-cyan-300 underline-offset-4"
                aria-label={ariaLabel}
                data-testid="delivery-tooltip-trigger"
              >
                {formatPercentage(item.costs_pct.delivery_to_warehouse)}
              </span>
            ) : (
              // H2-1 + M2-1 + L2-1: null-state trigger — aria-label from shared helper.
              <span
                className="text-gray-400 cursor-help"
                aria-label={ariaLabel}
                data-testid="delivery-tooltip-trigger"
              >
                —
              </span>
            )}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {/* M-3: trailing period + "Стоимость" per codebase convention (e.g. MarginSkuTableHeader, roi-profit-utils.ts) */}
            <p className="font-semibold text-xs mb-1">Стоимость доставки/ед.</p>
            {dcuLabel == null && fcuLabel == null ? (
              // M-1: 3-branch — both null but delivery_to_warehouse % may still be set from
              // aggregated data path (e.g., backend computed it without FCU entry in the map).
              item.costs_pct.delivery_to_warehouse != null ? (
                <p className="text-xs">
                  Доставка/ед недоступна; % рассчитан по агрегированным данным.
                </p>
              ) : (
                <p className="text-xs">Нет данных по доставке для этого SKU.</p>
              )
            ) : (
              // H2-1: tooltip body uses same label strings as aria-label — consistent disclosure.
              <div className="text-xs space-y-0.5">
                <p>{dcuLabel ?? `DCU (доставка) —`}</p>
                <p>{fcuLabel ?? `FCU (всего) —`}</p>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <MarginIndicator value={item.net_margin_pct} />
          <span
            className={cn(
              'font-medium',
              // null (unknown margin) → neutral, never green/red (rule 2 / anti-pattern #8).
              item.net_margin_pct != null && item.net_margin_pct >= 20 && 'text-green-600',
              (item.net_margin_pct == null ||
                (item.net_margin_pct >= 10 && item.net_margin_pct < 20)) &&
                'text-gray-700',
              item.net_margin_pct != null && item.net_margin_pct < 10 && 'text-red-600'
            )}
          >
            {formatPercentage(item.net_margin_pct)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="secondary"
          className={cn('text-xs', getProfitabilityBgClass(item.profitability_status))}
          style={{ color: getProfitabilityColor(item.profitability_status) }}
        >
          {getProfitabilityLabel(item.profitability_status)}
        </Badge>
      </TableCell>
    </TableRow>
  )
}
