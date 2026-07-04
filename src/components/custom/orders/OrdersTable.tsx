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
import type { OrderFbsItem, OrderOperationalStatus } from '@/types/orders'
import type { ClientInfoMap } from '@/types/orders-client-info'

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
  /** Story 86.2: client PII map (Owner only) */
  clientInfoMap?: ClientInfoMap
  /** Story 86.2: render the "Клиент" column (true only for Owner) */
  showClientColumn?: boolean
  /** Story O1: change-operational-status handler (omit to hide the control) */
  onOperationalStatusChange?: (orderUuid: string, status: OrderOperationalStatus) => void
  /** Story O1: per-order pending map (orderUuid → in-flight) */
  operationalStatusPendingUuid?: string | null
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
  { key: 'operationalStatus', label: 'Опер. статус', sortable: false, width: 'w-40' },
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

/** Story 86.2: Client column appended for Owner only */
const CLIENT_COLUMN = {
  key: 'client',
  label: 'Клиент',
  sortable: false,
  width: 'w-44',
} as const

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
  clientInfoMap,
  showClientColumn = false,
  onOperationalStatusChange,
  operationalStatusPendingUuid,
}: OrdersTableProps) {
  // Empty state
  if (orders.length === 0) {
    return <OrdersEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  // Story 86.2: append "Клиент" column for Owner only
  const columns = showClientColumn ? [...COLUMNS, CLIENT_COLUMN] : COLUMNS

  return (
    <div className="rounded-md border overflow-x-auto">
      <h2 className="sr-only">Детализация по заказам</h2>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
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
            <OrdersTableRow
              key={order.orderId}
              order={order}
              onClick={onRowClick}
              clientInfo={showClientColumn ? clientInfoMap?.[order.orderId] : undefined}
              showClientColumn={showClientColumn}
              onOperationalStatusChange={onOperationalStatusChange}
              operationalStatusPending={operationalStatusPendingUuid === order.id}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
