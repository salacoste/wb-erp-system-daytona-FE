/**
 * Funnel Per-SKU Table
 * Epic 68: Sortable table with pagination for per-SKU funnel data
 */

'use client'

import { useState } from 'react'
import { useFunnelData } from '@/hooks/use-funnel-analytics'
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
import { ArrowUpDown, AlertCircle } from 'lucide-react'
import type { FunnelProductItem, FunnelParams } from '@/types/analytics-epics-68-71'

interface FunnelTableProps {
  from: string
  to: string
}

type SortField = NonNullable<FunnelParams['sort']>

function ariaSort(field: SortField, currentSort: SortField, currentOrder: 'asc' | 'desc') {
  return field === currentSort ? (`${currentOrder}ending` as const) : ('none' as const)
}

export function FunnelTable({ from, to }: FunnelTableProps) {
  const [sort, setSort] = useState<SortField>('openCardCount')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const { data, isLoading, isError } = useFunnelData(from, to, {
    sort,
    order,
    limit,
    offset,
  })

  const handleSort = (field: SortField) => {
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
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">nmId</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead aria-sort={ariaSort('openCardCount', sort, order)}>
                <SortButton
                  active={sort === 'openCardCount'}
                  onClick={() => handleSort('openCardCount')}
                >
                  Просмотры
                </SortButton>
              </TableHead>
              <TableHead>Корзина</TableHead>
              <TableHead aria-sort={ariaSort('ordersCount', sort, order)}>
                <SortButton
                  active={sort === 'ordersCount'}
                  onClick={() => handleSort('ordersCount')}
                >
                  Заказы
                </SortButton>
              </TableHead>
              <TableHead aria-sort={ariaSort('buyoutCount', sort, order)}>
                <SortButton
                  active={sort === 'buyoutCount'}
                  onClick={() => handleSort('buyoutCount')}
                >
                  Выкупы
                </SortButton>
              </TableHead>
              <TableHead aria-sort={ariaSort('totalConversion', sort, order)}>
                <SortButton
                  active={sort === 'totalConversion'}
                  onClick={() => handleSort('totalConversion')}
                >
                  Конверсия
                </SortButton>
              </TableHead>
              <TableHead aria-sort={ariaSort('cancelRate', sort, order)}>
                <SortButton active={sort === 'cancelRate'} onClick={() => handleSort('cancelRate')}>
                  Отмены
                </SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.nmId}>
                <TableCell className="font-mono text-xs">{item.nmId}</TableCell>
                <TableCell className="text-sm">{item.vendorCode ?? '—'}</TableCell>
                <TableCell>{item.openCardCount.toLocaleString('ru-RU')}</TableCell>
                <TableCell>{item.addToCartCount.toLocaleString('ru-RU')}</TableCell>
                <TableCell>{item.ordersCount.toLocaleString('ru-RU')}</TableCell>
                <TableCell>{item.buyoutCount.toLocaleString('ru-RU')}</TableCell>
                <TableCell className="font-medium">{item.totalConversion.toFixed(1)}%</TableCell>
                <TableCell className="text-red-600">{item.cancelRate.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
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

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`}
      />
    </button>
  )
}
