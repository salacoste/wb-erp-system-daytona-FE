'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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

/** Single row in the Unit Economics data table — extracted from UnitEconomicsTable (Story 77.5). */
export function UnitEconomicsTableRow({ item, isSelected, onSelect }: UnitEconomicsTableRowProps) {
  const totalLogistics = item.costs_pct.logistics_delivery + item.costs_pct.logistics_return

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
        {item.costs_pct.delivery_to_warehouse != null ? (
          <span className="text-cyan-600">
            {formatPercentage(item.costs_pct.delivery_to_warehouse)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <MarginIndicator value={item.net_margin_pct} />
          <span
            className={cn(
              'font-medium',
              item.net_margin_pct >= 20 && 'text-green-600',
              item.net_margin_pct >= 10 && item.net_margin_pct < 20 && 'text-gray-700',
              item.net_margin_pct < 10 && 'text-red-600'
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
