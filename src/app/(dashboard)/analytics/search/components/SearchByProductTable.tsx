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

type SortField = 'avgPosition' | 'totalImpressions' | 'totalClicks' | 'avgCtr' | 'totalOrders'

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

function formatDecimal(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// iter-59: Russian locale (was "11.9%" dot/no-space). `n` is percent units (0-100, e.g. avgCtr),
// matching formatDecimal's ru-RU idiom above. Intl style:'percent' over n/100 → "11,9 %".
function formatPercent(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n / 100)
}

// Story 91.1-FE: formatCurrency removed — was only used by the deleted 'Выручка ₽' column

const COLUMNS: { label: string; field: SortField }[] = [
  { label: 'Ср. позиция', field: 'avgPosition' },
  { label: 'Показы', field: 'totalImpressions' },
  { label: 'Клики', field: 'totalClicks' },
  { label: 'CTR %', field: 'avgCtr' },
  { label: 'Заказы', field: 'totalOrders' },
  // Story 91.1-FE: 'Выручка ₽' column removed — backend dropped totalRevenue
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
                <SortButton
                  active={sort === col.field}
                  direction={sort === col.field ? order : undefined}
                  onClick={() => handleSort(col.field)}
                >
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
