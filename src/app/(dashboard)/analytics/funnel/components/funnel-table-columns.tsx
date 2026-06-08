/** Funnel table header — extracted from FunnelTable.tsx for 200-line limit */

'use client'

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type FunnelSortField, ariaSort, SortBtn } from './funnel-table-cells'

// Re-export row component moved to funnel-table-rows.tsx
export { FunnelTableRow, filterValidQueries } from './funnel-table-rows'
export type { PrevItemsMap } from './funnel-table-rows'

interface FunnelTableHeaderProps {
  sort: FunnelSortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: FunnelSortField) => void
  compare?: boolean
}

export function FunnelTableHeader({ sort, sortOrder, onSort, compare }: FunnelTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-20">nmId</TableHead>
        <TableHead>Артикул</TableHead>
        <TableHead>Бренд</TableHead>
        <TableHead aria-sort={ariaSort('openCardCount', sort, sortOrder)}>
          <SortBtn active={sort === 'openCardCount'} onClick={() => onSort('openCardCount')}>
            Просмотры
          </SortBtn>
        </TableHead>
        {compare && <TableHead className="w-20">Δ</TableHead>}
        <TableHead>Корзина</TableHead>
        {compare && <TableHead className="w-20">Δ</TableHead>}
        <TableHead aria-sort={ariaSort('ordersCount', sort, sortOrder)}>
          <SortBtn active={sort === 'ordersCount'} onClick={() => onSort('ordersCount')}>
            Заказы
          </SortBtn>
        </TableHead>
        {compare && <TableHead className="w-20">Δ</TableHead>}
        <TableHead aria-sort={ariaSort('buyoutCount', sort, sortOrder)}>
          <SortBtn active={sort === 'buyoutCount'} onClick={() => onSort('buyoutCount')}>
            Выкупы
          </SortBtn>
        </TableHead>
        {compare && <TableHead className="w-20">Δ</TableHead>}
        <TableHead aria-sort={ariaSort('totalConversion', sort, sortOrder)}>
          <SortBtn active={sort === 'totalConversion'} onClick={() => onSort('totalConversion')}>
            Конверсия
          </SortBtn>
        </TableHead>
        {compare && <TableHead className="w-20">Δ</TableHead>}
        <TableHead aria-sort={ariaSort('cancelRate', sort, sortOrder)}>
          <SortBtn active={sort === 'cancelRate'} onClick={() => onSort('cancelRate')}>
            Отмены
          </SortBtn>
        </TableHead>
        {compare && <TableHead className="w-20">Δ</TableHead>}
        <TableHead>Топ поисковых запросов</TableHead>
      </TableRow>
    </TableHeader>
  )
}
