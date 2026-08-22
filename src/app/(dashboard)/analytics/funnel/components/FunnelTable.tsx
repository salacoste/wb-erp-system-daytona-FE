'use client'

import { useState, useEffect, useMemo } from 'react'
import { useFunnelData } from '@/hooks/use-funnel-analytics'
import { Table, TableBody, TableCaption } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { FunnelProductItem } from '@/types/analytics-funnel'
import type { FunnelSortField } from './funnel-table-cells'
import { FunnelTableHeader, FunnelTableRow } from './funnel-table-columns'
import { useDelayedLoadingState } from '@/hooks/useDelayedLoadingState'
import {
  FunnelTableComparisonAlert,
  FunnelTableError,
  FunnelTableRefreshAlert,
  FunnelTableSlowLoading,
} from './funnel-table-feedback'

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
  const { data, isLoading, isError, refetch } = useFunnelData(from, to, {
    sort,
    order,
    limit,
    offset,
    nmIds: filterParam,
  })
  const showSlowLoading = useDelayedLoadingState(isLoading && !data)

  const hasCompare = compareEnabled && !!compareFrom && !!compareTo
  const {
    data: prevData,
    isLoading: prevLoading,
    isError: prevError,
    refetch: refetchPrevious,
  } = useFunnelData(compareFrom ?? '', compareTo ?? '', {
    sort,
    order,
    limit,
    offset,
    nmIds: filterParam,
  })

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

  if (isError && !data) {
    return <FunnelTableError onRetry={() => void refetch()} />
  }

  if (isLoading && !showSlowLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  if (isLoading && showSlowLoading) {
    return <FunnelTableSlowLoading onRetry={() => void refetch()} />
  }

  const items = (data?.items ?? []) as FunnelProductItem[]
  const pagination = data?.pagination

  const feedback = (
    <>
      {isError ? <FunnelTableRefreshAlert onRetry={() => void refetch()} /> : null}
      {hasCompare && prevError ? (
        <FunnelTableComparisonAlert onRetry={() => void refetchPrevious()} />
      ) : null}
    </>
  )

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {feedback}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {filterParam
              ? 'Нет данных по выбранным товарам за выбранный период'
              : 'Нет данных за выбранный период'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback}
      <div className="rounded-md border">
        <Table
          scrollContainerTabIndex={0}
          scrollContainerAriaLabel="Таблица воронки продаж по товарам"
        >
          <TableCaption>
            Воронка продаж по товарам за период{' '}
            {new Date(`${from}T00:00:00`).toLocaleDateString('ru-RU')} —{' '}
            {new Date(`${to}T00:00:00`).toLocaleDateString('ru-RU')}
          </TableCaption>
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
                prevError={hasCompare && prevError}
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
              className="min-h-11"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
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
