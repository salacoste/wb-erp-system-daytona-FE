/**
 * SuppliesTable Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Data table with sortable columns for supplies list.
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md#AC4-AC5
 */

'use client'

import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SuppliesEmptyState } from './SuppliesEmptyState'
import { SuppliesTableRow } from './SuppliesTableRow'
import type { SupplyListItem, SuppliesSortField, SortOrder } from '@/types/supplies'

export interface SuppliesTableProps {
  supplies: SupplyListItem[]
  sortBy: SuppliesSortField
  sortOrder: SortOrder
  onSortChange: (field: SuppliesSortField) => void
  onRowClick: (supply: SupplyListItem) => void
  isLoading?: boolean
  hasFilters?: boolean
  onClearFilters?: () => void
}

/** Column definitions */
const COLUMNS = [
  { key: 'wbSupplyId', label: 'WB ID', sortable: false, width: 'w-32', align: 'left' },
  { key: 'name', label: 'Название', sortable: false, width: 'min-w-[160px]', align: 'left' },
  { key: 'status', label: 'Статус', sortable: false, width: 'w-32', align: 'left' },
  {
    key: 'ordersCount',
    label: 'Заказы',
    sortable: true,
    sortField: 'orders_count',
    width: 'w-24',
    align: 'right',
  },
  { key: 'totalValue', label: 'Сумма', sortable: false, width: 'w-28', align: 'right' },
  {
    key: 'createdAt',
    label: 'Создана',
    sortable: true,
    sortField: 'created_at',
    width: 'w-36',
    align: 'left',
  },
  {
    key: 'closedAt',
    label: 'Закрыта',
    sortable: true,
    sortField: 'closed_at',
    width: 'w-36',
    align: 'left',
  },
] as const

/** Sort indicator */
function SortIndicator({
  field,
  sortBy,
  sortOrder,
}: {
  field: SuppliesSortField
  sortBy: SuppliesSortField
  sortOrder: SortOrder
}) {
  if (field !== sortBy) return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground/50" />
  return sortOrder === 'asc' ? (
    <ChevronUp className="h-4 w-4 ml-1" />
  ) : (
    <ChevronDown className="h-4 w-4 ml-1" />
  )
}

export function SuppliesTable({
  supplies,
  sortBy,
  sortOrder,
  onSortChange,
  onRowClick,
  hasFilters,
  onClearFilters,
}: SuppliesTableProps) {
  if (supplies.length === 0) {
    return <SuppliesEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map(col => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.width,
                    col.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                    col.align === 'right' && 'text-right'
                  )}
                  scope="col"
                  aria-sort={
                    col.sortable && col.sortField === sortBy
                      ? sortOrder === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  onClick={
                    col.sortable
                      ? () => onSortChange(col.sortField as SuppliesSortField)
                      : undefined
                  }
                >
                  <div className={cn('flex items-center', col.align === 'right' && 'justify-end')}>
                    {col.label}
                    {col.sortable && (
                      <SortIndicator
                        field={col.sortField as SuppliesSortField}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplies.map(supply => (
              <SuppliesTableRow key={supply.id} supply={supply} onClick={onRowClick} />
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}

export default SuppliesTable
