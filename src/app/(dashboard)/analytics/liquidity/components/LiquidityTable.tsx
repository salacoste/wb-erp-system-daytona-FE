'use client'

import { useState, Fragment } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableCaption, TableRow } from '@/components/ui/table'
import type { LiquidityItem, LiquidityCategory } from '@/types/liquidity'
import { getLiquidityCategoryConfig } from '@/lib/liquidity-utils'
import { cn } from '@/lib/utils'
import { LiquidationPlannerModal } from './LiquidationPlannerModal'
import { LiquidityTableHeader } from './LiquidityTableHeader'
import { LiquidityExpandedRow } from './LiquidityExpandedRow'
import { LiquidityTableRowCells } from './LiquidityTableRowCells'
import type { LiquiditySortField } from './LiquidityTableHeader'

interface LiquidityTableProps {
  data: LiquidityItem[]
  activeFilter: LiquidityCategory | null
  sortBy: LiquiditySortField
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: LiquiditySortField, order: 'asc' | 'desc') => void
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

  const handleSort = (field: LiquiditySortField) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(field, 'desc')
    }
  }

  const toggleRow = (skuId: string) => {
    setExpandedRow(prev => (prev === skuId ? null : skuId))
  }

  return (
    <>
      <Card className="min-w-0">
        <CardHeader className="pb-2">
          <h2 className="sr-only">Детализация по ликвидности</h2>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Детализация по артикулам
              {activeFilter && (
                <Badge variant="outline" className="ml-2">
                  {getLiquidityCategoryConfig(activeFilter).label}
                  <button onClick={onClearFilter} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{data.length} товаров</span>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 p-0">
          <div className="max-w-full overflow-x-auto">
            {/* Static caption: the period is visible in the trends preset controls
                (30/60/90 дн.) — 169.7 picker precedent; no duplicated period text. */}
            <Table
              scrollContainerTabIndex={0}
              scrollContainerAriaLabel="Таблица ликвидности товаров по SKU"
            >
              <TableCaption>Ликвидность товаров по SKU</TableCaption>
              <LiquidityTableHeader sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Нет товаров для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map(item => (
                    <Fragment key={item.sku_id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer hover:bg-muted/50',
                          expandedRow === item.sku_id && 'bg-muted/30'
                        )}
                        onClick={() => toggleRow(item.sku_id)}
                      >
                        <LiquidityTableRowCells
                          item={item}
                          isExpanded={expandedRow === item.sku_id}
                          onPlannerOpen={setPlannerItem}
                        />
                      </TableRow>
                      {expandedRow === item.sku_id && <LiquidityExpandedRow item={item} />}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
