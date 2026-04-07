/**
 * OrdersTable Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Data table with sortable columns for orders list.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC4-AC5
 */

'use client'

import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrdersTableRow } from './OrdersTableRow'
import { OrdersEmptyState } from './OrdersEmptyState'
import type { OrderFbsItem } from '@/types/orders'

/** Sortable fields matching API */
export type SortField = 'created_at' | 'status_updated_at' | 'price' | 'sale_price'
export type SortOrder = 'asc' | 'desc'

interface OrdersTableProps {
  orders: OrderFbsItem[]
  sortBy: SortField
  sortOrder: SortOrder
  onSortChange: (field: SortField) => void
  onRowClick: (order: OrderFbsItem) => void
  hasFilters?: boolean
  onClearFilters?: () => void
}

/** Column definitions */
const COLUMNS = [
  { key: 'orderId', label: 'ID заказа', sortable: false, width: 'w-24' },
  { key: 'product', label: 'Товар', sortable: false, width: 'min-w-[200px]' },
  { key: 'price', label: 'Цена', sortable: true, sortField: 'price' as SortField, width: 'w-24' },
  {
    key: 'salePrice',
    label: 'Цена продажи',
    sortable: true,
    sortField: 'sale_price' as SortField,
    width: 'w-28',
  },
  { key: 'supplierStatus', label: 'Статус', sortable: false, width: 'w-28' },
  { key: 'wbStatus', label: 'Статус WB', sortable: false, width: 'w-32' },
  {
    key: 'createdAt',
    label: 'Создан',
    sortable: true,
    sortField: 'created_at' as SortField,
    width: 'w-36',
  },
  {
    key: 'updatedAt',
    label: 'Обновлён',
    sortable: true,
    sortField: 'status_updated_at' as SortField,
    width: 'w-36',
  },
] as const

/**
 * Sort indicator component
 */
function SortIndicator({
  field,
  currentSort,
  currentOrder,
}: {
  field: SortField
  currentSort: SortField
  currentOrder: SortOrder
}) {
  if (field !== currentSort) {
    return <ChevronsUpDown className="h-4 w-4 ml-1 text-muted-foreground/50" />
  }

  return currentOrder === 'asc' ? (
    <ChevronUp className="h-4 w-4 ml-1" />
  ) : (
    <ChevronDown className="h-4 w-4 ml-1" />
  )
}

/**
 * OrdersTable - Data table for orders list
 */
export function OrdersTable({
  orders,
  sortBy,
  sortOrder,
  onSortChange,
  onRowClick,
  hasFilters,
  onClearFilters,
}: OrdersTableProps) {
  // Empty state
  if (orders.length === 0) {
    return <OrdersEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map(col => (
              <TableHead
                key={col.key}
                className={cn(col.width, col.sortable && 'cursor-pointer select-none')}
                scope="col"
                aria-sort={
                  col.sortable && col.sortField === sortBy
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                onClick={col.sortable ? () => onSortChange(col.sortField!) : undefined}
              >
                <div className="flex items-center">
                  {col.label}
                  {col.sortable && (
                    <SortIndicator
                      field={col.sortField!}
                      currentSort={sortBy}
                      currentOrder={sortOrder}
                    />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <OrdersTableRow key={order.orderId} order={order} onClick={onRowClick} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
