/**
 * Performance Metrics Table Component
 * Story 33.3-FE: Performance Metrics Table
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Dynamic columns by view mode (AC2)
 * - Sortable columns (AC3)
 * - Pagination (AC5)
 * - Unknown status handling (AC7)
 * - Accessible (AC8)
 */

'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCaption, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { AdvertisingItem, MultiCampaignSkuWarning } from '@/types/advertising-analytics'
import type { PerformanceMetricsTableProps } from './performance-table.types'
import { buildCampaignDetailRoute } from '@/lib/routes'
import { PerformanceTableSkeleton } from './PerformanceTableSkeleton'
import { PerformanceTableHeader } from './PerformanceTableHeader'
import { PerformanceTableRow } from './PerformanceTableRow'

export function PerformanceMetricsTable({
  data,
  viewBy,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  page,
  pageSize,
  totalCount,
  onPageChange,
  multiCampaignSkuWarnings,
}: PerformanceMetricsTableProps) {
  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  // Story 72.4: Build lookup map for multi-campaign SKU warnings
  const warningMap = useMemo(() => {
    const map = new Map<number, MultiCampaignSkuWarning>()
    multiCampaignSkuWarnings?.forEach(w => map.set(w.nmId, w))
    return map
  }, [multiCampaignSkuWarnings])

  // Get identifier column based on view mode (AC2)
  const identifierColumn = useMemo(() => {
    switch (viewBy) {
      case 'sku':
        return { key: 'sku_id', label: 'Артикул' }
      case 'campaign':
        return { key: 'campaign_id', label: 'ID кампании' }
      case 'brand':
        return { key: 'brand', label: 'Бренд' }
      case 'category':
        return { key: 'category', label: 'Категория' }
    }
  }, [viewBy])

  // Get name column based on view mode
  const nameColumn = useMemo(() => {
    if (viewBy === 'sku') return { key: 'product_name', label: 'Название' }
    if (viewBy === 'campaign') return { key: 'name', label: 'Название' }
    return null // Brand/category don't have a separate name
  }, [viewBy])

  // Render identifier cell with optional link
  const renderIdentifier = (item: AdvertisingItem) => {
    if (viewBy === 'sku' && item.sku_id) {
      return (
        <Link
          href={`/products/${item.sku_id}`}
          className="text-primary hover:underline flex items-center gap-1"
        >
          {item.sku_id}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      )
    }
    if (viewBy === 'campaign') {
      // Story 86.1 Task 5: navigate to campaign detail page (bid recommendations)
      if (item.campaign_id) {
        return (
          <Link
            href={buildCampaignDetailRoute(item.campaign_id)}
            className="text-primary hover:underline flex items-center gap-1"
          >
            {item.campaign_id}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        )
      }
      return item.campaign_id ?? '—'
    }
    if (viewBy === 'brand') return item.brand || '—'
    if (viewBy === 'category') return item.category || '—'
    return '—'
  }

  return (
    <div className="space-y-4">
      {/* Story 170.1: scroll-region + visible TableCaption (169.7 picker-semantic
          canon — period comes from the URL-synced filter above) + tabular-nums */}
      <div className="rounded-md border">
        <Table
          aria-label="Таблица рекламных метрик"
          className="sticky-first-column tabular-nums"
          scrollContainerTabIndex={0}
          scrollContainerAriaLabel="Таблица рекламных метрик — горизонтальная прокрутка"
        >
          <TableCaption>Рекламные метрики за выбранный период</TableCaption>
          <PerformanceTableHeader
            identifierLabel={identifierColumn.label}
            nameColumn={nameColumn}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
          <TableBody>
            {isLoading ? (
              <PerformanceTableSkeleton rows={10} />
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={nameColumn ? 12 : 11}
                  className="h-24 text-center text-muted-foreground"
                >
                  Нет данных за выбранный период
                </TableCell>
              </TableRow>
            ) : (
              data.map(item => (
                <PerformanceTableRow
                  key={item.key}
                  item={item}
                  viewBy={viewBy}
                  nameColumn={nameColumn}
                  warningMap={warningMap}
                  renderIdentifier={renderIdentifier}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (AC5) */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Всего: {totalCount.toLocaleString('ru-RU')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPrevPage}
              aria-label="Предыдущая страница"
            >
              Назад
            </Button>
            <span className="text-sm text-muted-foreground">
              Стр. {page} из {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              aria-label="Следующая страница"
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
