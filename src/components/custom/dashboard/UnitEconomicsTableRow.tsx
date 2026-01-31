/**
 * Unit Economics Table Row Component
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Table row displaying product unit economics with profitability badge.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { getProfitabilityStatus } from '@/lib/profitability-utils'
import { ProfitabilityBadge } from './ProfitabilityBadge'
import type { UnitEconomicsItem } from '@/types/unit-economics'

export interface UnitEconomicsTableRowProps {
  /** Unit economics data for the product */
  item: UnitEconomicsItem
}

/**
 * Unit Economics Table Row
 *
 * Displays product data with:
 * - Product name and SKU
 * - Profitability status badge
 * - Revenue, COGS%, Margin%, Profit values
 * - Dashes for missing COGS data
 */
export function UnitEconomicsTableRowComponent({ item }: UnitEconomicsTableRowProps) {
  const status = getProfitabilityStatus(item.net_margin_pct, item.has_cogs)

  return (
    <TableRow>
      {/* Product name and SKU */}
      <TableCell>
        <div>
          <p className="font-medium">{item.product_name}</p>
          <p className="text-sm text-muted-foreground">SKU: {item.sku_id}</p>
        </div>
      </TableCell>

      {/* Profitability status */}
      <TableCell className="text-center">
        <ProfitabilityBadge status={status} />
      </TableCell>

      {/* Revenue */}
      <TableCell className="text-right font-medium">{formatCurrency(item.revenue)}</TableCell>

      {/* COGS % */}
      <TableCell className="text-right">
        {item.has_cogs ? formatPercentage(item.costs_pct.cogs) : '—'}
      </TableCell>

      {/* Margin % */}
      <TableCell className="text-right">
        {item.has_cogs ? formatPercentage(item.net_margin_pct) : '—'}
      </TableCell>

      {/* Net Profit */}
      <TableCell className="text-right font-medium">
        {item.has_cogs ? formatCurrency(item.net_profit) : '—'}
      </TableCell>
    </TableRow>
  )
}
