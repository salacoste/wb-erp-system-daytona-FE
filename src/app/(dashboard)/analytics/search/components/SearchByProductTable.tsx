'use client'

/**
 * Search By Product Table - Sortable table for search query items
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
import { formatDecimal } from '@/lib/utils'
import { formatPercentage } from '@/lib/formatters'

interface SearchByProductTableProps {
  queries: SearchQueryItem[]
}

type SortField =
  | 'avgPosition'
  | 'totalImpressions'
  | 'totalClicks'
  | 'avgCtr'
  | 'searchCartAdds'
  | 'cartConversionRate'
  | 'totalOrders'

function formatNumber(n: number): string {
  return n.toLocaleString('ru-RU')
}

// iter-59: Russian locale (was "11.9%" dot/no-space). `n` is percent units (0-100, e.g. avgCtr),
// matching the canonical formatDecimal ru-RU idiom (@/lib/utils). Intl style:'percent' over n/100 → "11,9 %".
function formatPercent(n: number | null): string {
  if (n == null) return '—' // rate unknown (no data) — NOT "0 %" (anti-pattern #8)
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
  { label: 'В корзину', field: 'searchCartAdds' },
  { label: 'Конверсия в корзину', field: 'cartConversionRate' },
  { label: 'Заказы', field: 'totalOrders' },
]

/** Cart conversion rate: searchCartAdds / totalImpressions * 100. null when denominator is 0 or data missing (anti-pattern #8). */
function getCartConversionRate(item: SearchQueryItem): number | null {
  if (!item.totalImpressions || item.searchCartAdds == null) return null
  return (item.searchCartAdds / item.totalImpressions) * 100
}

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

  const getSortValue = (item: SearchQueryItem, field: SortField): number | null => {
    if (field === 'cartConversionRate') return getCartConversionRate(item)
    return item[field] ?? null
  }

  // 170.7 (169.13 pattern): nulls sort LAST in BOTH directions.
  const sorted = [...queries].sort((a, b) => {
    const aVal = getSortValue(a, sort)
    const bVal = getSortValue(b, sort)
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    return order === 'desc' ? bVal - aVal : aVal - bVal
  })

  const formatCell = (field: SortField, value: number | null): string => {
    switch (field) {
      case 'avgPosition':
        return value == null ? '—' : formatDecimal(value) // 170.7: null position is unknown, not 0
      case 'avgCtr':
        return formatPercent(value)
      case 'cartConversionRate':
        return value == null ? '—' : formatPercentage(value)
      default:
        return formatNumber(value ?? 0)
    }
  }

  const getCellValue = (item: SearchQueryItem, field: SortField): number | null => {
    if (field === 'cartConversionRate') return getCartConversionRate(item)
    return item[field] ?? null
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table aria-label="Поисковые запросы товара">
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
                <TableCell key={col.field}>
                  {formatCell(col.field, getCellValue(item, col.field))}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
