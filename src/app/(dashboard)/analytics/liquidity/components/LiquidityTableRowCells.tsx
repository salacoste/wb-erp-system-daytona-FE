'use client'

/**
 * Table cells for a single liquidity row
 * Extracted from LiquidityTable.tsx for file size compliance (Epic 74)
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import { TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { LiquidityItem } from '@/types/liquidity'
import {
  getLiquidityCategoryConfig,
  getLiquidityActionLabel,
  getLiquidityActionVariant,
  formatCurrency,
  formatTurnoverDays,
  formatVelocity,
} from '@/lib/liquidity-utils'
import { LIQUIDITY_CATEGORY_TOKENS } from './liquidity-category-tokens'

interface LiquidityTableRowCellsProps {
  item: LiquidityItem
  isExpanded: boolean
  onToggle: () => void
  onPlannerOpen: (item: LiquidityItem) => void
}

export function LiquidityTableRowCells({
  item,
  isExpanded,
  onToggle,
  onPlannerOpen,
}: LiquidityTableRowCellsProps) {
  const config = getLiquidityCategoryConfig(item.liquidity_category)
  const hasLiquidation = item.liquidation_scenarios && item.liquidation_scenarios.length > 0

  return (
    <>
      <TableCell className="w-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label={`${isExpanded ? 'Скрыть' : 'Показать'} детали SKU ${item.sku_id}`}
          aria-expanded={isExpanded}
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </Button>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium line-clamp-1">{item.product_name}</p>
          <p className="text-xs text-muted-foreground">
            {item.brand} · {item.category}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {/* 169.10: chip pattern — token-tinted bg/border + text-foreground.
            Text = var(--color-foreground): chart-N as text on a 15% tint
            measures 3.71–4.19:1 (AA fail in light). lib config.color/bgColor
            (legacy hex) intentionally NOT used — tokens come from the route map. */}
        <Badge
          variant="secondary"
          className="font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${LIQUIDITY_CATEGORY_TOKENS[item.liquidity_category]} 15%, transparent)`,
            borderColor: `color-mix(in srgb, ${LIQUIDITY_CATEGORY_TOKENS[item.liquidity_category]} 30%, transparent)`,
            color: 'var(--color-foreground)',
          }}
        >
          {config.icon} {config.labelShort}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatTurnoverDays(item.turnover_days)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatVelocity(item.velocity_per_day)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{item.current_stock_qty} шт.</TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(item.stock_value)}
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant={getLiquidityActionVariant(item.action_type)}
          size="sm"
          className="min-h-11"
          onClick={e => {
            e.stopPropagation()
            if (hasLiquidation) {
              onPlannerOpen(item)
            }
          }}
          disabled={!hasLiquidation && item.action_type === 'LIQUIDATE'}
        >
          {getLiquidityActionLabel(item.action_type)}
        </Button>
      </TableCell>
    </>
  )
}
