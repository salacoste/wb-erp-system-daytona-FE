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

interface LiquidityTableRowCellsProps {
  item: LiquidityItem
  isExpanded: boolean
  onPlannerOpen: (item: LiquidityItem) => void
}

export function LiquidityTableRowCells({
  item,
  isExpanded,
  onPlannerOpen,
}: LiquidityTableRowCellsProps) {
  const config = getLiquidityCategoryConfig(item.liquidity_category)
  const hasLiquidation = item.liquidation_scenarios && item.liquidation_scenarios.length > 0

  return (
    <>
      <TableCell className="w-8">
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
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
        <Badge
          variant="secondary"
          className="font-medium"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon} {config.labelShort}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatTurnoverDays(item.turnover_days)}
      </TableCell>
      <TableCell className="text-right">{formatVelocity(item.velocity_per_day)}</TableCell>
      <TableCell className="text-right">{item.current_stock_qty} шт.</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.stock_value)}</TableCell>
      <TableCell className="text-center">
        <Button
          variant={getLiquidityActionVariant(item.action_type)}
          size="sm"
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
