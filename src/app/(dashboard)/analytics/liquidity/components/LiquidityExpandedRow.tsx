'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import type { LiquidityItem } from '@/types/liquidity'
import { formatCurrency } from '@/lib/liquidity-utils'

interface LiquidityExpandedRowProps {
  item: LiquidityItem
}

/**
 * Expanded detail row for a liquidity table item
 * Shows recommendation, pricing, and 30-day sales data
 * Story 7.3: Liquidity Table & Liquidation Planner
 */
export function LiquidityExpandedRow({ item }: LiquidityExpandedRowProps) {
  return (
    <TableRow key={`${item.sku_id}-detail`}>
      <TableCell colSpan={8} className="bg-muted/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Рекомендация</h4>
            <p className="text-sm text-muted-foreground">{item.recommendation}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Ценообразование</h4>
            <div className="space-y-1 text-sm">
              <p>
                Цена:{' '}
                {item.current_price > 0 ? (
                  formatCurrency(item.current_price)
                ) : (
                  <span className="text-muted-foreground">Нет данных</span>
                )}
              </p>
              <p>Себестоимость: {formatCurrency(item.cogs_per_unit)}</p>
              {item.current_price > 0 && (
                <p className="text-muted-foreground">
                  Маржа: {formatCurrency(item.current_price - item.cogs_per_unit)}
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Продажи (30 дней)</h4>
            <div className="space-y-1 text-sm">
              <p>Продано: {item.units_sold_30d} шт.</p>
              <p>Ср. остаток: {Math.round(item.avg_stock_qty_30d)} шт.</p>
              <p className="text-muted-foreground">SKU: {item.sku_id}</p>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}
