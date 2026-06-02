/** Funnel table header + row components — extracted from FunnelTable.tsx for 200-line limit */

'use client'

import Link from 'next/link'
import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { FunnelProductItem, TopSearchQuery } from '@/types/analytics-funnel'
import { type FunnelSortField, ariaSort, SortBtn } from './funnel-table-cells'
import { isFunnelConversionAnomalous } from './funnel-anomaly'
import { FunnelAnomalyIndicator } from './FunnelAnomalyIndicator'
import { ROUTES } from '@/lib/routes'

/**
 * Story 119.2-FE: truncate Cyrillic-aware query strings using Array.from for code-point counting.
 * Returns the original string if it fits, otherwise truncated + ellipsis.
 */
export function truncateQuery(q: string, maxChars = 24): string {
  const chars = Array.from(q)
  if (chars.length <= maxChars) return q
  return chars.slice(0, maxChars).join('') + '…'
}

// EPIC-120 RETIRE: when src/lib/api/funnel-analytics-normalizer.ts is shipped
// (Epic 120-FE), retire filterValidQueries + the em-dash fallback at TopSearchQueriesCell.
// This component-level Boundary Normalizer is defense-in-depth absorbing a missing
// API-layer normalizer. Per Story 119.1 retro defense-in-depth retirement criterion
// + Story 119.2 Pass-1 F-6.
/**
 * Story 119.2-FE: filter raw topSearchQueries to entries with non-empty string `query`.
 * Defensive against backend shape drift (null entries, missing query field, non-string
 * query, empty-string query — F-9 closes the empty-string gap that would otherwise
 * render an empty <Link>).
 */
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
        <TableHead>Топ поисковых запросов</TableHead>
      </TableRow>
    </TableHeader>
  )
}

/** Story 119.2-FE: Top 3 search queries cell. Renders top 3 valid queries as Links, or em-dash. */
function TopSearchQueriesCell({ raw }: { raw: TopSearchQuery[] | null | undefined }) {
  const valid = filterValidQueries(raw).slice(0, 3)
  if (valid.length === 0) {
    // F-4: keep max-width even on the em-dash branch so the column reserves a
    // consistent footprint regardless of state.
    return <TableCell className="text-muted-foreground max-w-72">—</TableCell>
  }
  return (
    // Story 119.2-FE Pass-1 F-4: `max-w-72` (288px) bounds the cell so 3 long-ish
    // queries can't push sibling columns; inner flex-wrap keeps responsive layout.
    // Mirrors the brand cell's `max-w-40 truncate` constraint pattern in this file.
    <TableCell className="text-sm max-w-72">
      <div className="flex flex-wrap gap-1">
        {valid.map((q, idx) => (
          <Link
            // Story 119.2-FE Pass-1 F-5: prefix with `idx` so duplicate query
            // strings (real-data possibility) do NOT collide on the React key.
            // Precedent: Story 117.4-FE L-2.
            key={`${idx}-${q.query}`}
            href={`${ROUTES.ANALYTICS.SEARCH}?query=${encodeURIComponent(q.query)}`}
            title={q.query}
            // Story 119.2-FE Pass-1 F-7: design-system link treatment.
            // `text-primary` → #E53935 per CLAUDE.md § Design System Primary Red
            // (tailwind.config.ts:colors.primary.DEFAULT). Replaces hardcoded
            // `text-blue-600` which bypassed the design system.
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
        {/* Defensive Frontend Principle (#191): preserve the raw conversion value;
            flag it with a warning when it's impossible (>100% or buyout>orders). */}
        <span className="inline-flex items-center gap-1.5">
          {item.totalConversion.toLocaleString('ru-RU', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          %{isFunnelConversionAnomalous(item) && <FunnelAnomalyIndicator />}
        </span>
      </TableCell>
      <TableCell className="text-red-600">
        {item.cancelRate.toLocaleString('ru-RU', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        %
      </TableCell>
      <TopSearchQueriesCell raw={item.topSearchQueries} />
    </TableRow>
  )
}
