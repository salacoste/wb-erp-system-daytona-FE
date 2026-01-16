'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { LiquidityItem, LiquidityCategory } from '@/types/liquidity'
import {
  getLiquidityCategoryConfig,
  getLiquidityActionLabel,
  getLiquidityActionVariant,
  formatCurrency,
  formatTurnoverDays,
  formatVelocity,
} from '@/lib/liquidity-utils'
import { cn } from '@/lib/utils'
import { LiquidationPlannerModal } from './LiquidationPlannerModal'

interface LiquidityTableProps {
  data: LiquidityItem[]
  activeFilter: LiquidityCategory | null
  sortBy: 'turnover_days' | 'stock_value' | 'velocity_per_day'
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: 'turnover_days' | 'stock_value' | 'velocity_per_day', order: 'asc' | 'desc') => void
  onClearFilter: () => void
}

/**
 * Liquidity data table with sortable columns and expandable rows
 * Story 7.3: Liquidity Table & Liquidation Planner
 */
export function LiquidityTable({
  data,
  activeFilter,
  sortBy,
  sortOrder,
  onSortChange,
  onClearFilter,
}: LiquidityTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [plannerItem, setPlannerItem] = useState<LiquidityItem | null>(null)

  // Handle column sort click
  const handleSort = (field: 'turnover_days' | 'stock_value' | 'velocity_per_day') => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(field, 'desc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  // Toggle row expansion
  const toggleRow = (skuId: string) => {
    setExpandedRow(prev => prev === skuId ? null : skuId)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Детализация по артикулам
              {activeFilter && (
                <Badge variant="outline" className="ml-2">
                  {getLiquidityCategoryConfig(activeFilter).label}
                  <button
                    onClick={onClearFilter}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {data.length} товаров
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="min-w-[200px]">Товар</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('turnover_days')}
                  >
                    <span className="flex items-center justify-end">
                      Оборот
                      {getSortIcon('turnover_days')}
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('velocity_per_day')}
                  >
                    <span className="flex items-center justify-end">
                      Скорость
                      {getSortIcon('velocity_per_day')}
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('stock_value')}
                  >
                    <span className="flex items-center justify-end">
                      Стоимость
                      {getSortIcon('stock_value')}
                    </span>
                  </TableHead>
                  <TableHead className="text-center">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Нет товаров для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => {
                    const config = getLiquidityCategoryConfig(item.liquidity_category)
                    const isExpanded = expandedRow === item.sku_id
                    const hasLiquidation = item.liquidation_scenarios && item.liquidation_scenarios.length > 0

                    return (
                      <>
                        <TableRow
                          key={item.sku_id}
                          className={cn(
                            'cursor-pointer hover:bg-muted/50',
                            isExpanded && 'bg-muted/30'
                          )}
                          onClick={() => toggleRow(item.sku_id)}
                        >
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
                              style={{
                                backgroundColor: config.bgColor,
                                color: config.color,
                              }}
                            >
                              {config.icon} {config.labelShort}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatTurnoverDays(item.turnover_days)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatVelocity(item.velocity_per_day)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.current_stock_qty} шт.
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.stock_value)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={getLiquidityActionVariant(item.action_type)}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (hasLiquidation) {
                                  setPlannerItem(item)
                                }
                              }}
                              disabled={!hasLiquidation && item.action_type === 'LIQUIDATE'}
                            >
                              {getLiquidityActionLabel(item.action_type)}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${item.sku_id}-detail`}>
                            <TableCell colSpan={8} className="bg-muted/20 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Рекомендация</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {item.recommendation}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Ценообразование</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>Цена: {formatCurrency(item.current_price)}</p>
                                    <p>Себестоимость: {formatCurrency(item.cogs_per_unit)}</p>
                                    <p className="text-muted-foreground">
                                      Маржа: {formatCurrency(item.current_price - item.cogs_per_unit)}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Продажи (30 дней)</h4>
                                  <div className="space-y-1 text-sm">
                                    <p>Продано: {item.units_sold_30d} шт.</p>
                                    <p>Ср. остаток: {Math.round(item.avg_stock_qty_30d)} шт.</p>
                                    <p className="text-muted-foreground">
                                      SKU: {item.sku_id}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Liquidation Planner Modal */}
      {plannerItem && (
        <LiquidationPlannerModal
          item={plannerItem}
          open={!!plannerItem}
          onClose={() => setPlannerItem(null)}
        />
      )}
    </>
  )
}
