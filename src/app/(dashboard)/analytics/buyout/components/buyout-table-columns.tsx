/** Buyout table header + row components — extracted from BuyoutTable.tsx for 200-line limit */

'use client'

import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPercentage } from '@/lib/utils'
import type { BySkuBuyoutItem } from '@/types/analytics-buyout'
import type { ProductInfo } from '@/hooks/use-all-products-map'
import {
  SortField,
  ariaSort,
  ReasonCell,
  TrendIndicator,
  ConfidenceBadge,
  SortBtn,
} from './buyout-table-cells'

export type { ProductInfo }

interface BuyoutTableHeaderProps {
  sort: SortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
}

export function BuyoutTableHeader({ sort, sortOrder, onSort }: BuyoutTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-20">nmId</TableHead>
        <TableHead>Артикул</TableHead>
        <TableHead>Товар</TableHead>
        <TableHead>Бренд</TableHead>
        <TableHead aria-sort={ariaSort('salesCount', sort, sortOrder)}>
          <SortBtn active={sort === 'salesCount'} onClick={() => onSort('salesCount')}>
            Продажи
          </SortBtn>
        </TableHead>
        <TableHead title="Финансовые возвраты по отчёту WB (FBO+FBS)">Возвраты</TableHead>
        <TableHead aria-sort={ariaSort('buyoutRate', sort, sortOrder)}>
          <SortBtn active={sort === 'buyoutRate'} onClick={() => onSort('buyoutRate')}>
            Выкуп %
          </SortBtn>
        </TableHead>
        <TableHead className="text-blue-600" title="По статусам FBS-заказов">
          До отправки
        </TableHead>
        <TableHead className="text-orange-600" title="По статусам FBS-заказов">
          Отказ ПВЗ
        </TableHead>
        <TableHead className="text-red-600" title="По статусам FBS-заказов">
          После получ.
        </TableHead>
        <TableHead aria-sort={ariaSort('trend', sort, sortOrder)}>
          <SortBtn active={sort === 'trend'} onClick={() => onSort('trend')}>
            Тренд
          </SortBtn>
        </TableHead>
        <TableHead>Уверенность</TableHead>
      </TableRow>
    </TableHeader>
  )
}

interface BuyoutTableRowProps {
  item: BySkuBuyoutItem
  product: ProductInfo | undefined
}

export function BuyoutTableRow({ item, product }: BuyoutTableRowProps) {
  const rb = item.returnBreakdown
  const isEstimated = rb?.estimated === true

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{item.nmId}</TableCell>
      <TableCell className="text-sm font-medium">
        {item.supplierArticle || product?.vendorCode || '—'}
      </TableCell>
      <TableCell
        className="text-sm max-w-48 truncate"
        title={product?.saName || item.productName || undefined}
      >
        {product?.saName || item.productName || '—'}
      </TableCell>
      <TableCell className="text-sm">{item.brand || product?.brand || '—'}</TableCell>
      <TableCell>{item.salesCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell>{item.returnsCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell className="font-medium">
        {item.buyoutRatePct != null ? formatPercentage(item.buyoutRatePct) : '—'}
      </TableCell>
      <ReasonCell count={rb?.cancelBeforeShipment} color="text-blue-600" estimated={isEstimated} />
      <ReasonCell count={rb?.refusalAtPvz} color="text-orange-600" estimated={isEstimated} />
      <ReasonCell count={rb?.returnAfterReceipt} color="text-red-600" estimated={isEstimated} />
      <TableCell>
        <TrendIndicator trend={item.trend} delta={item.trendDelta} />
      </TableCell>
      <TableCell>
        <ConfidenceBadge confidence={item.confidence} />
      </TableCell>
    </TableRow>
  )
}
