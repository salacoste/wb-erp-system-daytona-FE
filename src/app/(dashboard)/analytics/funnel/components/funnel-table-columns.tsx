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

function DeltaHead({ label }: { label: string }) {
  return (
    <TableHead className="w-20 text-right" aria-label={label}>
      Δ
    </TableHead>
  )
}

export function FunnelTableHeader({ sort, sortOrder, onSort, compare }: FunnelTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-20">nmId</TableHead>
        <TableHead>Артикул</TableHead>
        <TableHead>Бренд</TableHead>
        <TableHead className="text-right" aria-sort={ariaSort('openCardCount', sort, sortOrder)}>
          <SortBtn active={sort === 'openCardCount'} onClick={() => onSort('openCardCount')}>
            Просмотры
          </SortBtn>
        </TableHead>
        {compare && <DeltaHead label="Изменение просмотров" />}
        <TableHead className="text-right">Корзина</TableHead>
        {compare && <DeltaHead label="Изменение корзины" />}
        <TableHead className="text-right" aria-sort={ariaSort('ordersCount', sort, sortOrder)}>
          <SortBtn active={sort === 'ordersCount'} onClick={() => onSort('ordersCount')}>
            Заказы
          </SortBtn>
        </TableHead>
        {compare && <DeltaHead label="Изменение заказов" />}
        <TableHead className="text-right" aria-sort={ariaSort('buyoutCount', sort, sortOrder)}>
          <SortBtn active={sort === 'buyoutCount'} onClick={() => onSort('buyoutCount')}>
            Выкупы
          </SortBtn>
        </TableHead>
        {compare && <DeltaHead label="Изменение выкупов" />}
        <TableHead className="text-right" aria-sort={ariaSort('totalConversion', sort, sortOrder)}>
          <SortBtn active={sort === 'totalConversion'} onClick={() => onSort('totalConversion')}>
            Конверсия
          </SortBtn>
        </TableHead>
        {compare && <DeltaHead label="Изменение конверсии" />}
        <TableHead className="text-right" aria-sort={ariaSort('cancelRate', sort, sortOrder)}>
          <SortBtn active={sort === 'cancelRate'} onClick={() => onSort('cancelRate')}>
            Отмены
          </SortBtn>
        </TableHead>
        {compare && <DeltaHead label="Изменение отмен" />}
        <TableHead>Топ поисковых запросов</TableHead>
      </TableRow>
    </TableHeader>
  )
}
