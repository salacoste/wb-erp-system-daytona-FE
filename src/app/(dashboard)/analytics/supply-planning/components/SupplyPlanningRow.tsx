'use client'

import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupplyPlanningItem } from '@/types/supply-planning'
import { formatStockQty, formatReorderValue } from '@/lib/supply-planning-utils'
import { SupplyPlanningDetail } from './SupplyPlanningDetail'
import { ROW_BG_COLORS, ROW_BORDER_COLORS } from './supply-planning-row-constants'
import {
  StatusCell,
  ProductNameCell,
  StockCell,
  VelocityCell,
  DaysUntilStockoutCell,
  SellingPriceCell,
  ActionCell,
} from './SupplyPlanningRowCells'

/**
 * Supply Planning Table Row Component
 * Story 6.3: Stockout Table & Detail Panel
 * UX Specs by Sally (2025-12-12)
 *
 * Single row with expandable detail panel.
 * Click on chevron to expand (not entire row - UX spec).
 */

interface SupplyPlanningRowProps {
  item: SupplyPlanningItem
  isExpanded: boolean
  onToggleExpand: () => void
}

export function SupplyPlanningRow({ item, isExpanded, onToggleExpand }: SupplyPlanningRowProps) {
  return (
    <>
      {/* Main Row */}
      <tr
        className={cn(
          'border-b border-border transition-colors',
          ROW_BG_COLORS[item.stockout_risk],
          ROW_BORDER_COLORS[item.stockout_risk],
          'hover:bg-muted/50'
        )}
      >
        {/* Expand chevron — aria-expanded exposes the current state (169.13 AX) */}
        <td className="px-2 py-3">
          <button
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Свернуть детали' : 'Показать детали'}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>

        <StatusCell item={item} />

        {/* SKU ID — opaque identifier: font-mono, never formatNumber (anti-pattern #10) */}
        <td className="px-4 py-3 text-sm font-medium font-mono text-foreground">{item.sku_id}</td>

        <ProductNameCell item={item} />
        <StockCell item={item} />

        {/* In Transit (hidden on tablet) — informational when > 0 (169.13) */}
        <td className="px-4 py-3 text-right hidden lg:table-cell">
          <span
            className={cn(
              'text-sm tabular-nums',
              item.in_transit > 0 ? 'text-status-information' : 'text-muted-foreground'
            )}
          >
            {item.in_transit > 0 ? formatStockQty(item.in_transit) : '—'}
          </span>
        </td>

        <VelocityCell item={item} />
        <DaysUntilStockoutCell item={item} />

        {/* Reorder Qty (hidden on smaller screens) */}
        <td className="px-4 py-3 text-right hidden xl:table-cell">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {item.reorder_quantity > 0 ? `${formatStockQty(item.reorder_quantity)} шт` : '—'}
          </span>
        </td>

        {/* Reorder Value (hidden on smaller screens) */}
        <td className="px-4 py-3 text-right hidden xl:table-cell">
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatReorderValue(item.reorder_value)}
          </span>
        </td>

        <SellingPriceCell item={item} />

        <ActionCell item={item} />
      </tr>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={12} className="p-0">
            <SupplyPlanningDetail item={item} />
          </td>
        </tr>
      )}
    </>
  )
}
