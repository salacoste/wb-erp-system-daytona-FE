/** Buyout table header + row components — extracted from BuyoutTable.tsx for 200-line limit */

'use client'

import Link from 'next/link'
import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { buildProductAnalyticsRoute } from '@/lib/route-helpers'
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
        {/* Epic 169.4: return-reason status triplet (information/warning/error), consistent
            with REASON_COLORS in BuyoutSummarySubComponents and ReasonCell props below. */}
        <TableHead className="text-status-information" title="По статусам FBS-заказов">
          До отправки
        </TableHead>
        <TableHead className="text-status-warning" title="По статусам FBS-заказов">
          Отказ ПВЗ
        </TableHead>
        <TableHead className="text-status-error" title="По статусам FBS-заказов">
          После получ.
        </TableHead>
        <TableHead aria-sort={ariaSort('trend', sort, sortOrder)}>
          <SortBtn active={sort === 'trend'} onClick={() => onSort('trend')}>
            Тренд
          </SortBtn>
        </TableHead>
        <TableHead>Уверенность</TableHead>
        <TableHead title="Лучшая позиция в поиске WB за период">Поиск</TableHead>
        <TableHead className="w-10" />
      </TableRow>
    </TableHeader>
  )
}

interface BuyoutTableRowProps {
  item: BySkuBuyoutItem
  product: ProductInfo | undefined
  searchPosition?: number | null
}

export function BuyoutTableRow({ item, product, searchPosition }: BuyoutTableRowProps) {
  const rb = item.returnBreakdown
  const isEstimated = rb?.estimated === true

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        <Link
          href={buildProductAnalyticsRoute(String(item.nmId))}
          className="text-primary hover:underline"
        >
          {item.nmId}
        </Link>
      </TableCell>
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
      <TableCell className="tabular-nums">{item.salesCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell className="tabular-nums">{item.returnsCount.toLocaleString('ru-RU')}</TableCell>
      <TableCell className="font-medium tabular-nums">
        {item.buyoutRatePct != null ? formatPercentage(item.buyoutRatePct) : '—'}
      </TableCell>
      <ReasonCell
        count={rb?.cancelBeforeShipment}
        color="text-status-information"
        estimated={isEstimated}
      />
      <ReasonCell count={rb?.refusalAtPvz} color="text-status-warning" estimated={isEstimated} />
      <ReasonCell
        count={rb?.returnAfterReceipt}
        color="text-status-error"
        estimated={isEstimated}
      />
      <TableCell>
        <TrendIndicator trend={item.trend} delta={item.trendDelta} />
      </TableCell>
      <TableCell>
        <ConfidenceBadge confidence={item.confidence} />
      </TableCell>
      <TableCell
        className="text-sm tabular-nums"
        title={searchPosition != null ? `Позиция ${searchPosition} в поиске` : undefined}
      >
        {searchPosition != null ? (
          <span
            className={
              searchPosition <= 10
                ? 'text-status-success font-medium'
                : searchPosition <= 30
                  ? 'text-status-warning'
                  : 'text-muted-foreground'
            }
          >
            {searchPosition}
          </span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`${ROUTES.ANALYTICS.RETURNS}?nmId=${String(item.nmId)}`}
                className="inline-flex items-center text-muted-foreground hover:text-foreground"
                aria-label="Перейти к аналитике возвратов"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Перейти к аналитике возвратов</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  )
}
