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
import { formatDecimal } from '@/lib/utils'

interface SearchByProductTableProps {
  queries: SearchQueryItem[]
}

type SortField =
  | 'avgPosition'
  | 'totalImpressions'
  | 'totalClicks'
  | 'avgCtr'
  | 'searchCartAdds'
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
    // avgCtr is number | null; `?? 0` keeps the sort arithmetic NaN-free. Null CTRs sort as 0
    // (accepted AP#8 sort exception) though they DISPLAY as "—" — do not "fix" with -Infinity.
    const aVal = Number(a[sort] ?? 0)
    const bVal = Number(b[sort] ?? 0)
    return order === 'desc' ? bVal - aVal : aVal - bVal
  })

  const formatCell = (field: SortField, value: number | null): string => {
    switch (field) {
      case 'avgPosition':
        return formatDecimal(value ?? 0) // toCount-sourced (never null); ?? 0 = type-safety only
      case 'avgCtr':
        return formatPercent(value) // rate: null → "—"
      default:
        return formatNumber(value ?? 0)
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
                <TableCell key={col.field}>
                  {formatCell(col.field, item[col.field] ?? null)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
