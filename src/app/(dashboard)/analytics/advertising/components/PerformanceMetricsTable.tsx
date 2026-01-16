'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, ChevronsUpDown, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdvertisingItem, ViewByMode } from '@/types/advertising-analytics'
import { EfficiencyBadge } from './EfficiencyBadge'
import { MergedProductBadge } from '@/components/analytics/MergedProductBadge'

// ============================================================================
// Types
// ============================================================================

// Match backend API sort_by field (Request #80)
export type SortField = 'spend' | 'revenue' | 'orders' | 'views' | 'clicks' | 'roas' | 'roi' | 'ctr' | 'cpc'
export type SortOrder = 'asc' | 'desc'

interface PerformanceMetricsTableProps {
  /** Data items to display */
  data: AdvertisingItem[]
  /** Current view mode */
  viewBy: ViewByMode
  /** Loading state */
  isLoading: boolean
  /** Current sort configuration */
  sortBy: SortField
  sortOrder: SortOrder
  /** Sort change handler */
  onSortChange: (field: SortField) => void
  /** Pagination info */
  page: number
  pageSize: number
  totalCount: number
  /** Pagination handlers */
  onPageChange: (page: number) => void
}

// ============================================================================
// Formatters
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMultiplier(value: number): string {
  return `${value.toFixed(1)}x`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function formatPercentRaw(value: number): string {
  return `${value.toFixed(2)}%`
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// ============================================================================
// Sortable Header Component
// ============================================================================

interface SortableHeaderProps {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: SortOrder
  onSort: (field: SortField) => void
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: SortableHeaderProps) {
  const isSorted = currentSort === field

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      aria-label={`Сортировать по ${label}`}
    >
      {label}
      {isSorted ? (
        currentOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" aria-label="по возрастанию" />
        ) : (
          <ArrowDown className="h-4 w-4" aria-label="по убыванию" />
        )
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  )
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ============================================================================
// Main Component
// ============================================================================

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
}: PerformanceMetricsTableProps) {
  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

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
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {item.sku_id}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      )
    }
    if (viewBy === 'campaign') return item.campaign_id
    if (viewBy === 'brand') return item.brand || '—'
    if (viewBy === 'category') return item.category || '—'
    return '—'
  }

  // Render name cell with truncation
  const renderName = (item: AdvertisingItem) => {
    const name = viewBy === 'sku' ? item.product_name : undefined
    if (!name) return null

    if (name.length > 45) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">{truncateText(name, 45)}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>{name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return name
  }

  // Render value with unknown handling (AC7)
  const renderValue = (
    item: AdvertisingItem,
    field: keyof AdvertisingItem,
    formatter: (v: number) => string
  ) => {
    // For unknown status, show dash for profit-related fields
    if (item.efficiency_status === 'unknown') {
      if (field === 'profit' || field === 'roas' || field === 'roi' || field === 'profit_after_ads') {
        return <span className="text-muted-foreground">—</span>
      }
    }

    const value = item[field]
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">—</span>
    }

    const numValue = Number(value)
    const isNegative = numValue < 0

    return (
      <span className={cn(isNegative && 'text-red-600 font-medium')}>
        {formatter(numValue)}
      </span>
    )
  }

  // Epic 35: Handle negative organic sales (WB API over-attribution)
  // See: docs/request-backend/77-total-sales-organic-ad-split.md (lines 208-227, 273-284)
  const renderOrganicSales = (item: AdvertisingItem) => {
    if (item.organic_sales === undefined || item.organic_sales === null) {
      return <span className="text-muted-foreground">—</span>
    }

    // Edge case: WB over-attribution (revenue > total_sales)
    if (item.organic_sales < 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-end gap-1.5 cursor-help">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-muted-foreground">—</span>
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                  Переатрибуция
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-sm">
              <div className="space-y-2">
                <p className="font-medium">WB API переатрибутировал продажи</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Выручка из рекламы ({formatCurrency(item.revenue)}) больше общей выручки товара ({formatCurrency(item.total_sales)}).</p>
                  <p className="mt-2">Причина: WB засчитывает продажи к рекламе, даже если покупка была через органический поиск после клика на объявление.</p>
                  <p className="mt-2 font-medium">Органика = {formatCurrency(item.total_sales)} - {formatCurrency(item.revenue)} = {formatCurrency(item.organic_sales)}</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // Normal case: positive organic sales
    return <span>{formatCurrency(item.organic_sales)}</span>
  }

  // Helper: Total Sales with explanation tooltip
  const renderTotalSales = (item: AdvertisingItem) => {
    if (item.total_sales === undefined || item.total_sales === null) {
      return <span className="text-muted-foreground">—</span>
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help underline decoration-dotted underline-offset-4">
              {formatCurrency(item.total_sales)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Общая выручка товара</p>
              <p className="text-muted-foreground">
                Формула: Органика + Реклама
              </p>
              <p className="mt-1">
                {formatCurrency(item.organic_sales || 0)} + {formatCurrency(item.revenue || 0)} = {formatCurrency(item.total_sales)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Helper: ROAS with formula tooltip
  const renderROAS = (item: AdvertisingItem) => {
    // Handle unknown status
    if (item.efficiency_status === 'unknown') {
      return <span className="text-muted-foreground">—</span>
    }

    if (item.roas === undefined || item.roas === null) {
      return <span className="text-muted-foreground">—</span>
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help underline decoration-dotted underline-offset-4">
              {formatMultiplier(item.roas)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Return on Ad Spend (ROAS)</p>
              <p className="text-muted-foreground">
                Формула: Выручка из рекламы / Расход на рекламу
              </p>
              <p className="mt-1">
                {formatCurrency(item.revenue || 0)} / {formatCurrency(item.spend || 0)} = {formatMultiplier(item.roas)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Helper: ROI with formula tooltip
  const renderROI = (item: AdvertisingItem) => {
    // Handle unknown status
    if (item.efficiency_status === 'unknown') {
      return <span className="text-muted-foreground">—</span>
    }

    if (item.roi === undefined || item.roi === null) {
      return <span className="text-muted-foreground">—</span>
    }

    const isNegative = item.roi < 0

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "cursor-help underline decoration-dotted underline-offset-4",
              isNegative && "text-red-600 font-medium"
            )}>
              {formatPercent(item.roi)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Return on Investment (ROI)</p>
              <p className="text-muted-foreground">
                Формула: (Прибыль - Расход на рекламу) / Расход на рекламу
              </p>
              <p className="mt-1">
                ({formatCurrency(item.profit || 0)} - {formatCurrency(item.spend || 0)}) / {formatCurrency(item.spend || 0)} = {formatPercent(item.roi)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Helper: Organic Contribution % with formula tooltip
  const renderOrganicContribution = (item: AdvertisingItem) => {
    if (item.organic_contribution === undefined || item.organic_contribution === null) {
      return <span className="text-muted-foreground">—</span>
    }

    // Negative or zero - edge case
    if (item.organic_contribution < 0) {
      return <span className="text-muted-foreground">—</span>
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help underline decoration-dotted underline-offset-4">
              {formatPercentRaw(item.organic_contribution)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Вклад органики</p>
              <p className="text-muted-foreground">
                Формула: Органика / Общая выручка × 100%
              </p>
              <p className="mt-1">
                {formatCurrency(item.organic_sales || 0)} / {formatCurrency(item.total_sales || 0)} = {formatPercentRaw(item.organic_contribution)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="min-w-[100px]">
                {identifierColumn.label}
              </TableHead>
              {nameColumn && (
                <TableHead scope="col" className="min-w-[200px]">
                  {nameColumn.label}
                </TableHead>
              )}
              <TableHead scope="col" className="min-w-[100px] text-right">
                <SortableHeader
                  label="Затраты"
                  field="spend"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </TableHead>
              <TableHead scope="col" className="min-w-[120px] text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Всего продаж</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Общая выручка товара (органика + реклама)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead scope="col" className="min-w-[120px] text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Из рекламы</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Выручка только из рекламных кампаний</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead scope="col" className="min-w-[100px] text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Органика</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Продажи не связанные с рекламой (Всего - Реклама)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead scope="col" className="min-w-[70px] text-right">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">%</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Доля органики от общих продаж</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead scope="col" className="min-w-[100px] text-right">
                Прибыль
              </TableHead>
              <TableHead scope="col" className="min-w-[80px] text-right">
                <SortableHeader
                  label="ROAS"
                  field="roas"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </TableHead>
              <TableHead scope="col" className="min-w-[80px] text-right">
                <SortableHeader
                  label="ROI"
                  field="roi"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </TableHead>
              <TableHead scope="col" className="min-w-[70px] text-right">
                CTR
              </TableHead>
              <TableHead scope="col" className="min-w-[100px]">
                Статус
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={10} />
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
              data.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-medium">
                    {renderIdentifier(item)}
                  </TableCell>
                  {nameColumn && (
                    <TableCell>
                      {/* Epic 36: Show merged group badge or product name */}
                      {item.type === 'merged_group' && item.mergedProducts ? (
                        <div className="flex items-center">
                          <span className="font-medium">Группа #{item.imtId}</span>
                          <MergedProductBadge
                            imtId={item.imtId!}
                            mergedProducts={item.mergedProducts}
                          />
                        </div>
                      ) : (
                        renderName(item)
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {renderValue(item, 'spend', formatCurrency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderTotalSales(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderValue(item, 'revenue', formatCurrency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderOrganicSales(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderOrganicContribution(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderValue(item, 'profit', formatCurrency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderROAS(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderROI(item)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderValue(item, 'ctr', formatPercentRaw)}
                  </TableCell>
                  <TableCell>
                    <EfficiencyBadge
                      status={item.efficiency_status}
                      showRecommendation
                    />
                  </TableCell>
                </TableRow>
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
