/**
 * Funnel Per-SKU Table
 * Epic 68: Sortable table with pagination for per-SKU funnel data
 * Refactored in Story 73.1-FE: columns extracted to funnel-table-columns.tsx
 * Story 73.4-FE: Added nmIds product filter prop
 * WoW delta columns when compare=true
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { Table, TableBody } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { FunnelProductItem } from '@/types/analytics-funnel'
import type { FunnelSortField } from './funnel-table-cells'
import { FunnelTableHeader, FunnelTableRow } from './funnel-table-columns'

interface FunnelTableProps {
  from: string
  to: string
  nmIds?: number[]
  compareEnabled?: boolean
  compareFrom?: string
  compareTo?: string
}

export function FunnelTable({
  from,
  to,
  nmIds,
  compareEnabled,
  compareFrom,
  compareTo,
}: FunnelTableProps) {
  const [sort, setSort] = useState<FunnelSortField>('openCardCount')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const nmIdsKey = nmIds?.join(',') ?? ''
  useEffect(() => {
    setOffset(0)
  }, [nmIdsKey])

  const filterParam = nmIds?.length ? nmIds : undefined
  const { data, isLoading, isError } = useFunnelData(from, to, {
    sort,
    order,
    limit,
    offset,
    nmIds: filterParam,
  })

  const hasCompare = compareEnabled && !!compareFrom && !!compareTo
  const { data: prevData, isLoading: prevLoading } = useFunnelData(
    compareFrom ?? '',
    compareTo ?? '',
    { sort, order, limit, offset, nmIds: filterParam }
  )

  const prevItemsMap = useMemo(() => {
    if (!prevData?.items) return new Map<number, FunnelProductItem>()
    const map = new Map<number, FunnelProductItem>()
    for (const item of prevData.items as FunnelProductItem[]) {
      map.set(item.nmId, item)
    }
    return map
  }, [prevData])

  const handleSort = (field: FunnelSortField) => {
    if (sort === field) {
      setOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setOrder('desc')
    }
    setOffset(0)
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить данные воронки</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  const items = (data?.items ?? []) as FunnelProductItem[]
  const pagination = data?.pagination

  if (items.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Нет данных за выбранный период</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <FunnelTableHeader
            sort={sort}
            sortOrder={order}
            onSort={handleSort}
            compare={hasCompare}
          />
          <TableBody>
            {items.map(item => (
              <FunnelTableRow
                key={item.nmId}
                item={item}
                compare={hasCompare}
                prevItem={prevItemsMap.get(item.nmId)}
                prevLoading={prevLoading}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {offset + 1}–{Math.min(offset + limit, pagination.total)} из {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() => setOffset(offset + limit)}
            >
              Далее
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
