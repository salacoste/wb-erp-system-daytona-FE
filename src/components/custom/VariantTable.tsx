'use client'

/**
 * FR-7 (#221): per-variant (color/size) weekly analytics table.
 * Consumes VariantAnalyticsItem[] from useMarginAnalyticsByVariant.
 *
 * Sortable on Выручка / Прибыль / Маржа. Allocated (approximate) cells and their
 * column headers carry the ⚠️ AllocatedMarker — Defensive Frontend Principle.
 * Empty/​loading states + footnotes included.
 */
import { useState, useMemo } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { VariantAnalyticsItem } from '@/types/variant-analytics'
import { VariantTableRow } from './VariantTableRow'
import { AllocatedHeaderMarker } from './AllocatedMarker'

export type VariantSortField = 'revenue_net' | 'profit_allocated_rub' | 'margin_allocated_pct'
type SortOrder = 'asc' | 'desc'

export interface VariantTableProps {
  data: VariantAnalyticsItem[]
  isLoading?: boolean
}

function comparator(
  a: VariantAnalyticsItem,
  b: VariantAnalyticsItem,
  field: VariantSortField,
  order: SortOrder
) {
  const av = a[field]
  const bv = b[field]
  // Nulls always last, regardless of order — otherwise asc floats a wall of "—" rows
  // above real data (the `?? -Infinity` approach only works for desc).
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  return order === 'asc' ? av - bv : bv - av
}

export function VariantTable({ data, isLoading }: VariantTableProps) {
  const [sortField, setSortField] = useState<VariantSortField>('revenue_net')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: VariantSortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedData = useMemo(
    () => [...data].sort((a, b) => comparator(a, b, sortField, sortOrder)),
    [data, sortField, sortOrder]
  )

  if (isLoading) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground/70" aria-busy="true">
        Загрузка вариантов…
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-12 text-center">
        <p className="text-muted-foreground">Нет вариантов FBS за эту неделю</p>
      </div>
    )
  }

  const SortIcon = (field: VariantSortField) => {
    if (sortField !== field) return <span className="ml-1 text-muted-foreground/70">↕</span>
    return <span className="ml-1 text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Вариант</TableHead>
              <TableHead className="text-right">Артикул (nm)</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('revenue_net')}
                  className="flex items-center font-medium hover:text-primary"
                >
                  Выручка{SortIcon('revenue_net')}
                </button>
              </TableHead>
              <TableHead className="text-right">Шт.</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('profit_allocated_rub')}
                  className="flex items-center font-medium hover:text-primary"
                >
                  Прибыль{SortIcon('profit_allocated_rub')}
                </button>
                <span className="inline-flex items-center">
                  <AllocatedHeaderMarker />
                </span>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('margin_allocated_pct')}
                  className="flex items-center font-medium hover:text-primary"
                >
                  Маржа{SortIcon('margin_allocated_pct')}
                </button>
                <span className="inline-flex items-center">
                  <AllocatedHeaderMarker />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(item => (
              <VariantTableRow key={`${item.nm_id}-${item.chrt_id}`} item={item} />
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Выручка по вариантам — из FBS (FBO-only товары не участвуют). Прибыль и маржа —
        приблизительные, распределены по доле выручки варианта (см. ⚠️).
      </p>
    </div>
  )
}
