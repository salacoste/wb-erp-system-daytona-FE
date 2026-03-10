'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type LiquiditySortField = 'turnover_days' | 'stock_value' | 'velocity_per_day'

interface LiquidityTableHeaderProps {
  sortBy: LiquiditySortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: LiquiditySortField) => void
}

/**
 * Sortable table header for liquidity table
 * Story 7.3: Liquidity Table & Liquidation Planner
 */
export function LiquidityTableHeader({ sortBy, sortOrder, onSort }: LiquidityTableHeaderProps) {
  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    )
  }

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-8"></TableHead>
        <TableHead className="min-w-[200px]">Товар</TableHead>
        <TableHead className="text-center">Статус</TableHead>
        <TableHead
          className="text-right cursor-pointer hover:bg-muted/50"
          onClick={() => onSort('turnover_days')}
        >
          <span className="flex items-center justify-end">
            Оборот
            {getSortIcon('turnover_days')}
          </span>
        </TableHead>
        <TableHead
          className="text-right cursor-pointer hover:bg-muted/50"
          onClick={() => onSort('velocity_per_day')}
        >
          <span className="flex items-center justify-end">
            Скорость
            {getSortIcon('velocity_per_day')}
          </span>
        </TableHead>
        <TableHead className="text-right">Остаток</TableHead>
        <TableHead
          className="text-right cursor-pointer hover:bg-muted/50"
          onClick={() => onSort('stock_value')}
        >
          <span className="flex items-center justify-end">
            Стоимость
            {getSortIcon('stock_value')}
          </span>
        </TableHead>
        <TableHead className="text-center">Действие</TableHead>
      </TableRow>
    </TableHeader>
  )
}
