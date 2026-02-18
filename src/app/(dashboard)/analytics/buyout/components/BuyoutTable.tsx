/**
 * Buyout Per-SKU Table
 * Epic 69: Table with confidence badges, trend arrows, sorting
 */

'use client'

import { useState } from 'react'
import { useBuyoutBySku } from '@/hooks/use-buyout-analytics'
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
import { AlertCircle, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type {
  BuyoutSource,
  BuyoutBySkuParams,
  TrendDirection,
  BuyoutConfidence,
} from '@/types/analytics-epics-68-71'

interface BuyoutTableProps {
  from: string
  to: string
  source: BuyoutSource
}

type SortField = NonNullable<BuyoutBySkuParams['sort']>

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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">nmId</TableHead>
              <TableHead>Товар</TableHead>
              <TableHead>Бренд</TableHead>
              <TableHead>
                <SortBtn active={sort === 'salesCount'} onClick={() => handleSort('salesCount')}>
                  Продажи
                </SortBtn>
              </TableHead>
              <TableHead>Возвраты</TableHead>
              <TableHead>
                <SortBtn active={sort === 'buyoutRate'} onClick={() => handleSort('buyoutRate')}>
                  Выкуп %
                </SortBtn>
              </TableHead>
              <TableHead>
                <SortBtn active={sort === 'trend'} onClick={() => handleSort('trend')}>
                  Тренд
                </SortBtn>
              </TableHead>
              <TableHead>Уверенность</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.nmId}>
                <TableCell className="font-mono text-xs">{item.nmId}</TableCell>
                <TableCell className="text-sm max-w-40 truncate">
                  {item.productName ?? item.supplierArticle ?? '—'}
                </TableCell>
                <TableCell className="text-sm">{item.brand ?? '—'}</TableCell>
                <TableCell>{item.salesCount.toLocaleString('ru-RU')}</TableCell>
                <TableCell>{item.returnsCount.toLocaleString('ru-RU')}</TableCell>
                <TableCell className="font-medium">
                  {item.buyoutRatePct != null ? `${item.buyoutRatePct.toFixed(1)}%` : '—'}
                </TableCell>
                <TableCell>
                  <TrendIndicator trend={item.trend} delta={item.trendDelta} />
                </TableCell>
                <TableCell>
                  <ConfidenceBadge confidence={item.confidence} />
                </TableCell>
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

function TrendIndicator({ trend, delta }: { trend?: TrendDirection; delta?: number }) {
  if (!trend || trend === 'stable') {
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const isDown = trend === 'down'
  const Icon = isDown ? TrendingDown : TrendingUp
  const color = isDown ? 'text-red-500' : 'text-green-500'
  const sign = isDown ? '' : '+'

  return (
    <span className={`flex items-center gap-1 text-sm ${color}`}>
      <Icon className="h-4 w-4" />
      {delta != null && (
        <span>
          {sign}
          {delta.toFixed(1)}
        </span>
      )}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence?: BuyoutConfidence }) {
  if (!confidence || confidence === 'high') return null

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
        Мало данных
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700">
      Недостаточно данных
    </span>
  )
}

function SortBtn({
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
