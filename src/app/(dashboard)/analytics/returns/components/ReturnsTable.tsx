/**
 * Returns Per-SKU Table
 * Epic 71: Table with anomaly highlighting, cursor pagination
 */

'use client'

import { useState } from 'react'
import { useReturnsBySku } from '@/hooks/use-return-analytics'
import { useProducts } from '@/hooks/useProducts'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useProductsMap } from './ReturnsTableHelpers'
import { ReturnsTableRow } from './ReturnsTableRow'

interface ReturnsTableProps {
  from?: string
  to?: string
  anomalyOnly: boolean
}

export function ReturnsTable({ from, to, anomalyOnly }: ReturnsTableProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const { data, isLoading, isError } = useReturnsBySku(from, to, {
    anomalyOnly: anomalyOnly || undefined,
    cursor,
    limit: 100,
  })

  // Product enrichment for name/brand/vendor_code
  const { data: productsData } = useProducts({ limit: 200 })
  const productsMap = useProductsMap(productsData)

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Не удалось загрузить данные возвратов по SKU</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) return <Skeleton className="h-96 w-full" />

  const items = data?.data ?? []
  const pagination = data?.pagination
  const summary = data?.summary

  if (items.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {anomalyOnly
            ? 'Нет проблемных товаров за выбранный период'
            : 'Нет данных за выбранный период'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary line */}
      {summary && (
        <div className="text-sm text-muted-foreground">
          Всего SKU: {summary.totalSkus}
          {summary.anomalyCount > 0 && (
            <span className="text-status-error ml-2">
              ({summary.anomalyCount} с аномальным возвратом)
            </span>
          )}
        </div>
      )}

      {/* Story 169.11: keyboard-scrollable region (tabIndex + aria-label) + static caption.
          No aria-sort — the table has NO sortable headers (cursor pagination); N/A recorded. */}
      <div
        className="rounded-md border overflow-x-auto"
        tabIndex={0}
        aria-label="Таблица возвратов по SKU, прокручиваемая область"
      >
        <Table>
          <TableCaption>Возвраты по SKU</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-20">nmId</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Бренд</TableHead>
              <TableHead>Возвраты</TableHead>
              <TableHead>% возврата</TableHead>
              <TableHead>До отправки</TableHead>
              <TableHead>Отказ ПВЗ</TableHead>
              <TableHead>После получения</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const product = productsMap.get(item.nmId)
              return <ReturnsTableRow key={item.nmId} item={item} product={product} />
            })}
          </TableBody>
        </Table>
      </div>

      {/* Cursor pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{items.length} SKU на странице</span>
          <div className="flex gap-2">
            {cursor && (
              <Button variant="outline" size="sm" onClick={() => setCursor(undefined)}>
                В начало
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() => setCursor(pagination.nextCursor)}
            >
              Далее
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
