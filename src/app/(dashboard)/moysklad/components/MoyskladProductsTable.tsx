'use client'

/**
 * МС live products table (GET /v1/moysklad/products) — M2 «МС товары» tab.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * LIVE read-through to МойСклад (v1-boundary #2) — the call may fail at runtime;
 * the hook surfaces the error inline (graceful banner, no crash).
 *
 * Pager: page size 20, limit/offset. «Показано N–M из total» + Назад/Вперёд.
 *
 * AP#8: buyPriceRub/salePriceRub null → «—» (never 0); article/code/updated null → «—».
 */

import { useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMoyskladProducts } from '@/hooks/useMoyskladQueries'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { MoyskladProduct } from '@/types/moysklad'

const PAGE_SIZE = 20

export function MoyskladProductsTable() {
  const [offset, setOffset] = useState(0)
  const products = useMoyskladProducts({ limit: PAGE_SIZE, offset })

  const rows = products.data?.rows ?? []
  const total = products.data?.total ?? 0
  const hasPrevious = offset > 0
  const hasNext = offset + rows.length < total
  // 1-based range for the «Показано N–M из total» hint (only when rows exist).
  const shownFrom = rows.length > 0 ? offset + 1 : 0
  const shownTo = offset + rows.length

  return (
    <div className="space-y-4">
      {products.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Не удалось загрузить товары из МойСклад — проверьте подключение.</span>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>Код</TableHead>
              <TableHead>Закуп. цена</TableHead>
              <TableHead>Цена продажи</TableHead>
              <TableHead>Обновлён</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.isLoading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            )}
            {!products.isLoading && !products.isError && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Нет товаров в МойСклад
                </TableCell>
              </TableRow>
            )}
            {rows.map(p => (
              <ProductRow key={p.id} product={p} />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {rows.length > 0 ? (
            <>
              Показано {shownFrom}–{shownTo} из {total}
            </>
          ) : (
            <>Показано 0 из {total}</>
          )}
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={!hasNext}
          >
            Вперёд
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ProductRowProps {
  product: MoyskladProduct
}

function ProductRow({ product }: ProductRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium truncate max-w-[20rem]">{product.name ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{product.article ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{product.code ?? '—'}</TableCell>
      <TableCell>
        {product.buyPriceRub == null ? '—' : formatCurrency(product.buyPriceRub)}
      </TableCell>
      <TableCell>
        {product.salePriceRub == null ? '—' : formatCurrency(product.salePriceRub)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {product.updated ? formatDate(product.updated) : '—'}
      </TableCell>
    </TableRow>
  )
}
