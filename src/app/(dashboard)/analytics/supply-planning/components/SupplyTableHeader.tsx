'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import type { SortField, SortOrder } from './useSupplyTableFilters'

/**
 * Supply Table Header Component
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 *
 * Story 169.13: aria-sort 3-state canon (none/ascending/descending, 169.12) on
 * every sortable head + explicit "none" on the non-sortable action head (×11);
 * sticky header moved to muted/border tokens (z-index preserved); sort control
 * is a real button (keyboard access, 169.10 canon).
 */

interface SupplyTableHeaderProps {
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}

type AriaSort = 'none' | 'ascending' | 'descending'

/** aria-sort value per WAI-ARIA (169.12 3-state canon). */
function ariaSort(
  field: SortField | null,
  currentSort: SortField,
  currentOrder: SortOrder
): AriaSort {
  return field === currentSort ? (`${currentOrder}ending` as AriaSort) : 'none'
}

function SortIndicator({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField
  sortField: SortField
  sortOrder: SortOrder
}) {
  if (sortField !== field) {
    return <ChevronUp className="h-3 w-3 opacity-30" />
  }
  return sortOrder === 'asc' ? (
    <ChevronUp className="h-3 w-3" />
  ) : (
    <ChevronDown className="h-3 w-3" />
  )
}

/** Shared head classes — sticky muted surface, hover, uppercase label (169.13 tokens). */
const HEAD_BASE = 'px-4 py-3 cursor-pointer hover:bg-muted/70 transition-colors'
const LABEL_BASE =
  'flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide'

interface SortHeadProps {
  field: SortField
  label: string
  align: 'left' | 'right' | 'center'
  className?: string
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}

function SortHead({
  field,
  label,
  align,
  className = '',
  sortField,
  sortOrder,
  onSort,
}: SortHeadProps) {
  return (
    <th
      scope="col"
      aria-sort={ariaSort(field, sortField, sortOrder)}
      className={cnHead(align, className)}
      onClick={() => onSort(field)}
    >
      <button
        type="button"
        aria-label={`Сортировать по «${label}»`}
        className="w-full text-inherit hover:text-foreground"
      >
        <div className={cnLabel(align)}>
          {label}
          <SortIndicator field={field} sortField={sortField} sortOrder={sortOrder} />
        </div>
      </button>
    </th>
  )
}

function cnHead(align: 'left' | 'right' | 'center', extra: string): string {
  const dir = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return `${HEAD_BASE} ${dir}${extra ? ' ' + extra : ''}`
}

function cnLabel(align: 'left' | 'right' | 'center'): string {
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  return `${LABEL_BASE} ${justify}`
}

const COLUMNS: Array<{
  field: SortField
  label: string
  align: 'left' | 'right' | 'center'
  width: string
  hide?: string
}> = [
  { field: 'stockout_risk', label: 'Статус', align: 'center', width: 'w-[60px]' },
  { field: 'sku_id', label: 'Артикул', align: 'left', width: 'w-[100px]' },
  { field: 'product_name', label: 'Название', align: 'left', width: 'w-[200px]' },
  { field: 'current_stock', label: 'Остаток', align: 'right', width: 'w-[80px]' },
  {
    field: 'in_transit',
    label: 'В пути',
    align: 'right',
    width: 'w-[80px]',
    hide: 'hidden lg:table-cell',
  },
  {
    field: 'avg_daily_sales',
    label: 'Скорость',
    align: 'right',
    width: 'w-[100px]',
    hide: 'hidden lg:table-cell',
  },
  { field: 'days_until_stockout', label: 'Дней', align: 'right', width: 'w-[120px]' },
  {
    field: 'reorder_quantity',
    label: 'Заказать',
    align: 'right',
    width: 'w-[100px]',
    hide: 'hidden xl:table-cell',
  },
  {
    field: 'reorder_value',
    label: 'Сумма',
    align: 'right',
    width: 'w-[120px]',
    hide: 'hidden xl:table-cell',
  },
  {
    field: 'selling_price',
    label: 'Цена',
    align: 'right',
    width: 'w-[120px]',
    hide: 'hidden xl:table-cell',
  },
]

export function SupplyTableHeader({ sortField, sortOrder, onSort }: SupplyTableHeaderProps) {
  return (
    // Sticky muted header — z-10 keeps it above scrolling rows in both themes (169.13).
    <thead className="bg-muted sticky top-0 z-10">
      <tr>
        {/* Expand chevron column — purely visual spacer; row-expand affordance is on the row itself */}
        <th className="w-10 px-2 py-3" aria-hidden="true"></th>
        {COLUMNS.map(col => (
          <SortHead
            key={col.field}
            field={col.field}
            label={col.label}
            align={col.align}
            className={col.hide}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={onSort}
          />
        ))}
        {/* Action — non-sortable; explicit aria-sort="none" completes the 3-state contract */}
        <th scope="col" aria-sort="none" className="w-[140px] px-4 py-3 text-center">
          <span className={LABEL_BASE + ' justify-center'}>Действие</span>
        </th>
      </tr>
    </thead>
  )
}
