/** Funnel table header + row components — extracted from FunnelTable.tsx for 200-line limit */

'use client'

import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FunnelProductItem } from '@/types/analytics-funnel'
import { type FunnelSortField, ariaSort, SortBtn } from './funnel-table-cells'

interface FunnelTableHeaderProps {
  sort: FunnelSortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: FunnelSortField) => void
}

export function FunnelTableHeader({ sort, sortOrder, onSort }: FunnelTableHeaderProps) {
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
        <TableHead>Корзина</TableHead>
        <TableHead aria-sort={ariaSort('ordersCount', sort, sortOrder)}>
          <SortBtn active={sort === 'ordersCount'} onClick={() => onSort('ordersCount')}>
            Заказы
          </SortBtn>
        </TableHead>
        <TableHead aria-sort={ariaSort('buyoutCount', sort, sortOrder)}>
          <SortBtn active={sort === 'buyoutCount'} onClick={() => onSort('buyoutCount')}>
            Выкупы
          </SortBtn>
        </TableHead>
        <TableHead aria-sort={ariaSort('totalConversion', sort, sortOrder)}>
          <SortBtn active={sort === 'totalConversion'} onClick={() => onSort('totalConversion')}>
            Конверсия
          </SortBtn>
        </TableHead>
        <TableHead aria-sort={ariaSort('cancelRate', sort, sortOrder)}>
          <SortBtn active={sort === 'cancelRate'} onClick={() => onSort('cancelRate')}>
            Отмены
          </SortBtn>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

interface FunnelTableRowProps {
  item: FunnelProductItem
}

export function FunnelTableRow({ item }: FunnelTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{item.nmId}</TableCell>
      <TableCell className="text-sm">{item.vendorCode || '—'}</TableCell>
      <TableCell className="text-sm max-w-40 truncate" title={item.brandName || undefined}>
        {item.brandName || '—'}
      </TableCell>
      <TableCell>{item.openCardCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell>{item.addToCartCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell>{item.ordersCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell>{item.buyoutCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell className="font-medium">
        {item.totalConversion.toLocaleString('ru-RU', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        %
      </TableCell>
      <TableCell className="text-red-600">
        {item.cancelRate.toLocaleString('ru-RU', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        %
      </TableCell>
    </TableRow>
  )
}
