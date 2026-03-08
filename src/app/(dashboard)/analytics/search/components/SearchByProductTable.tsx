'use client'

/**
 * Search By Product Table - Sortable 7-column table for search query items
 * Story 71.6-FE: By-Product Keyword Explorer Tab
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
import type { SearchQueryItem } from '@/types/search-analytics'
import { SortButton } from './SortButton'

interface SearchByProductTableProps {
  queries: SearchQueryItem[]
}

type SortField =
  | 'avgPosition'
  | 'totalImpressions'
  | 'totalClicks'
  | 'avgCtr'
  | 'totalOrders'
  | 'totalRevenue'

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function formatDecimal(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatCurrency(n: number): string {
  return `${n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₽`
}

const COLUMNS: { label: string; field: SortField }[] = [
  { label: 'Ср. позиция', field: 'avgPosition' },
  { label: 'Показы', field: 'totalImpressions' },
  { label: 'Клики', field: 'totalClicks' },
  { label: 'CTR %', field: 'avgCtr' },
  { label: 'Заказы', field: 'totalOrders' },
  { label: 'Выручка ₽', field: 'totalRevenue' },
]

export function SearchByProductTable({ queries }: SearchByProductTableProps) {
  const [sort, setSort] = useState<SortField>('totalImpressions')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setOrder('desc')
    }
  }

  const sorted = [...queries].sort((a, b) => {
    const aVal = Number(a[sort] ?? 0)
    const bVal = Number(b[sort] ?? 0)
    return order === 'desc' ? bVal - aVal : aVal - bVal
  })

  const formatCell = (field: SortField, value: number): string => {
    switch (field) {
      case 'avgPosition':
        return formatDecimal(value)
      case 'avgCtr':
        return formatPercent(value)
      case 'totalRevenue':
        return formatCurrency(value)
      default:
        return formatNumber(value)
    }
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Запрос</TableHead>
            {COLUMNS.map(col => (
              <TableHead
                key={col.field}
                aria-sort={sort === col.field ? (`${order}ending` as const) : 'none'}
              >
                <SortButton active={sort === col.field} onClick={() => handleSort(col.field)}>
                  {col.label}
                </SortButton>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item, i) => (
            <TableRow key={`${item.searchQuery}-${i}`}>
              <TableCell className="font-medium">{item.searchQuery}</TableCell>
              {COLUMNS.map(col => (
                <TableCell key={col.field}>{formatCell(col.field, item[col.field])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
