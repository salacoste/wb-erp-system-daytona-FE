/**
 * FBO Sales Table — displays paginated list of FBO sales.
 * Russian locale. Uses formatCurrency for price columns.
 */

'use client'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { SaleFboItem } from '@/types/orders-fbo'

interface FboSalesTableProps {
  sales: SaleFboItem[]
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  /** Optional — table caption naming the source (RTC contract, Story 172.15-FE) */
  captionText?: string
}

export function FboSalesTable({
  sales,
  isLoading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  captionText,
}: FboSalesTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка продаж...</span>
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground" data-testid="fbo-sales-empty">
        Нет продаж за выбранный период
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Всего: {totalCount.toLocaleString('ru-RU')}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          {/* Story 172.15: caption names the source (RTC); spec-order above header,
              visually bottom via ui Table caption-bottom (171.9 canon). */}
          {captionText ? <TableCaption>{captionText}</TableCaption> : null}
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>Бренд</TableHead>
              <TableHead>Предмет</TableHead>
              <TableHead>Склад</TableHead>
              <TableHead className="text-right">Цена продажи</TableHead>
              <TableHead className="text-right">К выплате</TableHead>
              <TableHead>Тип</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map(sale => (
              <TableRow key={sale.id} data-testid={`fbo-sale-${sale.id}`}>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatDate(sale.saleDate)}
                </TableCell>
                <TableCell>{sale.nmId}</TableCell>
                <TableCell className="max-w-[120px] truncate">{sale.brand}</TableCell>
                <TableCell className="max-w-[200px] truncate">{sale.subject}</TableCell>
                <TableCell className="max-w-[120px] truncate">{sale.warehouseName}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCurrency(sale.finishedPrice)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatCurrency(sale.forPay)}
                </TableCell>
                <TableCell>
                  {sale.isStorno ? (
                    <Badge variant="destructive">Возврат</Badge>
                  ) : (
                    <Badge variant="default">Продажа</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Стр. {page} из {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Следующая страница"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
