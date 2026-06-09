'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'
import type { SortField, SortOrder } from './useSupplyTableFilters'

/**
 * Supply Table Header Component
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 *
 * Renders thead with all sortable column headers.
 */

interface SupplyTableHeaderProps {
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
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

export function SupplyTableHeader({ sortField, sortOrder, onSort }: SupplyTableHeaderProps) {
  return (
    <thead className="bg-muted sticky top-0 z-10">
      <tr>
        {/* Expand chevron column — purely visual spacer; row-expand affordance is on the row itself */}
        <th className="w-10 px-2 py-3" aria-hidden="true"></th>

        {/* Status */}
        <th
          className="w-[60px] px-4 py-3 text-center cursor-pointer hover:bg-muted transition-colors"
          onClick={() => onSort('stockout_risk')}
        >
          <div className="flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Статус
            <SortIndicator field="stockout_risk" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* SKU */}
        <th
          className="w-[100px] px-4 py-3 text-left cursor-pointer hover:bg-muted transition-colors"
          onClick={() => onSort('sku_id')}
        >
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Артикул
            <SortIndicator field="sku_id" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Product Name */}
        <th
          className="w-[200px] px-4 py-3 text-left cursor-pointer hover:bg-muted transition-colors"
          onClick={() => onSort('product_name')}
        >
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Название
            <SortIndicator field="product_name" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Current Stock */}
        <th
          className="w-[80px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors"
          onClick={() => onSort('current_stock')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Остаток
            <SortIndicator field="current_stock" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* In Transit */}
        <th
          className="w-[80px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors hidden lg:table-cell"
          onClick={() => onSort('in_transit')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            В пути
            <SortIndicator field="in_transit" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Velocity */}
        <th
          className="w-[100px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors hidden lg:table-cell"
          onClick={() => onSort('avg_daily_sales')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Скорость
            <SortIndicator field="avg_daily_sales" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Days Until Stockout */}
        <th
          className="w-[120px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors"
          onClick={() => onSort('days_until_stockout')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Дней
            <SortIndicator
              field="days_until_stockout"
              sortField={sortField}
              sortOrder={sortOrder}
            />
          </div>
        </th>

        {/* Reorder Qty */}
        <th
          className="w-[100px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors hidden xl:table-cell"
          onClick={() => onSort('reorder_quantity')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Заказать
            <SortIndicator field="reorder_quantity" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Reorder Value */}
        <th
          className="w-[120px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors hidden xl:table-cell"
          onClick={() => onSort('reorder_value')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Сумма
            <SortIndicator field="reorder_value" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Selling Price — Request #203 */}
        <th
          className="w-[120px] px-4 py-3 text-right cursor-pointer hover:bg-muted transition-colors hidden xl:table-cell"
          onClick={() => onSort('selling_price')}
        >
          <div className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Цена
            <SortIndicator field="selling_price" sortField={sortField} sortOrder={sortOrder} />
          </div>
        </th>

        {/* Action */}
        <th className="w-[140px] px-4 py-3 text-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Действие
          </span>
        </th>
      </tr>
    </thead>
  )
}
