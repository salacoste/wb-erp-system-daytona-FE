/** Buyout Per-SKU Table — Epic 69/71: sorting, confidence badges, return reasons */
'use client'

import { useState } from 'react'
import { useBuyoutBySku } from '@/hooks/use-buyout-analytics'
import { useAllProductsMap } from '@/hooks/use-all-products-map'
import { useSearchPositionsMap } from '@/hooks/use-search-positions-map'
import { Table, TableBody } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { BuyoutSource } from '@/types/analytics-buyout'
import type { SortField } from './buyout-table-cells'
import { BuyoutTableHeader, BuyoutTableRow } from './buyout-table-columns'

interface BuyoutTableProps {
  from: string
  to: string
  source: BuyoutSource
}

export function BuyoutTable({ from, to, source }: BuyoutTableProps) {
  const [sort, setSort] = useState<SortField>('buyoutRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const { data, isLoading, isError } = useBuyoutBySku(from, to, {
    source,
    sort,
    sortOrder,
    limit,
    offset,
  })

  const productsMap = useAllProductsMap(!isLoading && !isError)

  // Search position enrichment: fetch best avgPosition for each SKU in parallel
  const nmIds = data?.data?.map(item => item.nmId) ?? []
  const searchPositionsMap = useSearchPositionsMap(
    nmIds,
    from,
    to,
    !isLoading && !isError && nmIds.length > 0
  )

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setSortOrder('asc')
    }
    setOffset(0)
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить данные выкупов</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />

  const items = data?.data ?? []
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <BuyoutTableHeader sort={sort} sortOrder={sortOrder} onSort={handleSort} />
          <TableBody>
            {items.map(item => (
              <BuyoutTableRow
                key={item.nmId}
                item={item}
                product={productsMap.get(item.nmId)}
                searchPosition={searchPositionsMap.get(item.nmId)?.bestAvgPosition}
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
