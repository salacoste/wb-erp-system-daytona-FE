/** Funnel table header + row components — extracted from FunnelTable.tsx for 200-line limit */

'use client'

import Link from 'next/link'
import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FunnelProductItem, TopSearchQuery } from '@/types/analytics-funnel'
import { type FunnelSortField, ariaSort, SortBtn } from './funnel-table-cells'
import { isFunnelConversionAnomalous } from './funnel-anomaly'
import { FunnelAnomalyIndicator } from './FunnelAnomalyIndicator'
import { ROUTES } from '@/lib/routes'
import { truncateQuery } from '@/lib/string-utils'
import { DeltaCell } from './funnel-table-delta'

export type PrevItemsMap = Map<number, FunnelProductItem>

/** Filter raw topSearchQueries to entries with non-empty string `query`. */
export function filterValidQueries(raw: TopSearchQuery[] | null | undefined): TopSearchQuery[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (entry): entry is TopSearchQuery =>
      entry != null &&
      typeof entry === 'object' &&
      typeof entry.query === 'string' &&
      entry.query.length > 0
  )
}

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

/** Story 119.2-FE: Top 3 search queries cell. */
function TopSearchQueriesCell({ raw }: { raw: TopSearchQuery[] | null | undefined }) {
  const valid = filterValidQueries(raw).slice(0, 3)
  if (valid.length === 0) {
    return <TableCell className="text-muted-foreground max-w-72">—</TableCell>
  }
  return (
    <TableCell className="text-sm max-w-72">
      <div className="flex flex-wrap gap-1">
        {valid.map((q, idx) => (
          <Link
            key={`${idx}-${q.query}`}
            href={`${ROUTES.ANALYTICS.SEARCH}?query=${encodeURIComponent(q.query)}`}
            title={q.query}
            className="text-primary hover:underline"
          >
            {truncateQuery(q.query)}
          </Link>
        ))}
      </div>
    </TableCell>
  )
}

interface FunnelTableRowProps {
  item: FunnelProductItem
  compare?: boolean
  prevItem?: FunnelProductItem
  prevLoading?: boolean
}

export function FunnelTableRow({ item, compare, prevItem, prevLoading }: FunnelTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{item.nmId}</TableCell>
      <TableCell className="text-sm">{item.vendorCode || '—'}</TableCell>
      <TableCell className="text-sm max-w-40 truncate" title={item.brandName || undefined}>
        {item.brandName || '—'}
      </TableCell>
      <TableCell>{item.openCardCount.toLocaleString('ru-RU')}</TableCell>
      {compare && (
        <DeltaCell
          current={item.openCardCount}
          previous={prevItem?.openCardCount}
          field="openCardCount"
          loading={!!prevLoading}
        />
      )}
      <TableCell>{item.addToCartCount.toLocaleString('ru-RU')}</TableCell>
      {compare && (
        <DeltaCell
          current={item.addToCartCount}
          previous={prevItem?.addToCartCount}
          field="addToCartCount"
          loading={!!prevLoading}
        />
      )}
      <TableCell>{item.ordersCount.toLocaleString('ru-RU')}</TableCell>
      {compare && (
        <DeltaCell
          current={item.ordersCount}
          previous={prevItem?.ordersCount}
          field="ordersCount"
          loading={!!prevLoading}
        />
      )}
      <TableCell>{item.buyoutCount.toLocaleString('ru-RU')}</TableCell>
      {compare && (
        <DeltaCell
          current={item.buyoutCount}
          previous={prevItem?.buyoutCount}
          field="buyoutCount"
          loading={!!prevLoading}
        />
      )}
      <TableCell className="font-medium">
        <span className="inline-flex items-center gap-1.5">
          {item.totalConversion.toLocaleString('ru-RU', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          %{isFunnelConversionAnomalous(item) && <FunnelAnomalyIndicator />}
        </span>
      </TableCell>
      {compare && (
        <DeltaCell
          current={item.totalConversion}
          previous={prevItem?.totalConversion}
          field="totalConversion"
          loading={!!prevLoading}
        />
      )}
      <TableCell className="text-red-600">
        {item.cancelRate.toLocaleString('ru-RU', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        %
      </TableCell>
      {compare && (
        <DeltaCell
          current={item.cancelRate}
          previous={prevItem?.cancelRate}
          field="cancelRate"
          loading={!!prevLoading}
        />
      )}
      <TopSearchQueriesCell raw={item.topSearchQueries} />
    </TableRow>
  )
}
