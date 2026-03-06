'use client'

/**
 * Search Orders Table - Sortable table for search-attributed orders
 * Story 71.5-FE: Search Orders Tab
 */

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown } from 'lucide-react'
import type { SearchOrderItem } from '@/types/search-analytics'

interface SearchOrdersTableProps {
  items: SearchOrderItem[]
}

type SortField = 'totalOrders' | 'totalRevenue' | 'uniqueProducts'

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function formatCurrency(n: number): string {
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`
}

export function SearchOrdersTable({ items }: SearchOrdersTableProps) {
  const [sort, setSort] = useState<SortField>('totalOrders')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setOrder('desc')
    }
  }

  const sorted = [...items].sort((a, b) => {
    const aVal = Number(a[sort] ?? 0)
    const bVal = Number(b[sort] ?? 0)
    return order === 'desc' ? bVal - aVal : aVal - bVal
  })

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Запрос</TableHead>
            <TableHead aria-sort={sort === 'totalOrders' ? (`${order}ending` as const) : 'none'}>
              <SortButton active={sort === 'totalOrders'} onClick={() => handleSort('totalOrders')}>
                Заказы
              </SortButton>
            </TableHead>
            <TableHead aria-sort={sort === 'totalRevenue' ? (`${order}ending` as const) : 'none'}>
              <SortButton
                active={sort === 'totalRevenue'}
                onClick={() => handleSort('totalRevenue')}
              >
                Выручка ₽
              </SortButton>
            </TableHead>
            <TableHead aria-sort={sort === 'uniqueProducts' ? (`${order}ending` as const) : 'none'}>
              <SortButton
                active={sort === 'uniqueProducts'}
                onClick={() => handleSort('uniqueProducts')}
              >
                Товаров
              </SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item, i) => (
            <TableRow key={`${String(item.key)}-${i}`}>
              <TableCell className="font-medium">{String(item.key)}</TableCell>
              <TableCell>{formatNumber(item.totalOrders)}</TableCell>
              <TableCell>{formatCurrency(item.totalRevenue)}</TableCell>
              <TableCell>{formatNumber(item.uniqueProducts ?? 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
