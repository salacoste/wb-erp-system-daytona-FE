/**
 * Returns Per-SKU Table
 * Epic 71: Table with anomaly highlighting, cursor pagination
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useReturnsBySku } from '@/hooks/use-return-analytics'
import { useProducts } from '@/hooks/useProducts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { buildProductAnalyticsRoute } from '@/lib/route-helpers'
import { cn } from '@/lib/utils'
import { ReturnRateCell, useProductsMap } from './ReturnsTableHelpers'

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
            <span className="text-red-500 ml-2">
              ({summary.anomalyCount} с аномальным возвратом)
            </span>
          )}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
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
              return (
                <TableRow
                  key={item.nmId}
                  className={cn(item.anomalyFlag && 'bg-red-50 hover:bg-red-100')}
                >
                  <TableCell>
                    {item.anomalyFlag && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={buildProductAnalyticsRoute(String(item.nmId))}
                      className="text-primary hover:underline"
                    >
                      {item.nmId}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm max-w-48 truncate" title={product?.saName}>
                    {product?.saName || item.productName || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{product?.brand || item.brand || '—'}</TableCell>
                  <TableCell>{item.totalReturns}</TableCell>
                  <TableCell>
                    <ReturnRateCell rate={item.returnRate} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.cancelBeforeShipment}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.refusalAtPvz}</TableCell>
                  <TableCell className="text-muted-foreground">{item.returnAfterReceipt}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`${ROUTES.ANALYTICS.BUYOUT}?nmId=${String(item.nmId)}`}
                            className="inline-flex items-center text-muted-foreground hover:text-foreground"
                            aria-label="Перейти к аналитике выкупов"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>Перейти к аналитике выкупов</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              )
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
