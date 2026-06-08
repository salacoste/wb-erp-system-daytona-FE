'use client'

/**
 * Search By Query Table - Sortable table for product rankings
 * Story 71.7-FE: By-Query Product Ranking Tab
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SearchProductItem } from '@/types/search-analytics'
import { SortButton } from './SortButton'
import { formatDecimal } from '@/lib/utils'
import { formatPercentage } from '@/lib/formatters'
import { buildProductAnalyticsRoute } from '@/lib/route-helpers'

interface SearchByQueryTableProps {
  products: SearchProductItem[]
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

const BADGE_BASE = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium'

function getPositionBadgeClass(position: number): string {
  if (position <= 10) return `${BADGE_BASE} bg-green-100 text-green-800`
  if (position <= 30) return `${BADGE_BASE} bg-yellow-100 text-yellow-800`
  return `${BADGE_BASE} bg-red-100 text-red-800`
}

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
function getCartConversionRate(item: SearchProductItem): number | null {
  if (!item.totalImpressions || item.searchCartAdds == null) return null
  return (item.searchCartAdds / item.totalImpressions) * 100
}

export function SearchByQueryTable({ products }: SearchByQueryTableProps) {
  const [sort, setSort] = useState<SortField>('avgPosition')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setOrder(field === 'avgPosition' ? 'asc' : 'desc')
    }
  }

  const getSortValue = (item: SearchProductItem, field: SortField): number => {
    if (field === 'cartConversionRate') return getCartConversionRate(item) ?? 0
    return Number(item[field] ?? 0)
  }

  const sorted = [...products].sort((a, b) => {
    const aVal = getSortValue(a, sort)
    const bVal = getSortValue(b, sort)
    return order === 'desc' ? bVal - aVal : aVal - bVal
  })

  const formatCell = (field: SortField, value: number | null): string => {
    switch (field) {
      case 'avgPosition':
        return formatDecimal(value ?? 0)
      case 'avgCtr':
        return formatPercent(value)
      case 'cartConversionRate':
        return value == null ? '—' : formatPercentage(value)
      default:
        return formatNumber(value ?? 0)
    }
  }

  const getCellValue = (item: SearchProductItem, field: SortField): number | null => {
    if (field === 'cartConversionRate') return getCartConversionRate(item)
    return item[field] ?? null
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Артикул</TableHead>
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
            <TableRow key={`${item.nmId}-${i}`}>
              <TableCell className="font-medium">
                <Link
                  href={buildProductAnalyticsRoute(String(item.nmId))}
                  className="text-primary hover:underline"
                >
                  {item.nmId}
                </Link>
                {item.vendorCode && (
                  <div className="text-xs text-muted-foreground">{item.vendorCode}</div>
                )}
              </TableCell>
              {COLUMNS.map(col => {
                const value = getCellValue(item, col.field)
                return (
                  <TableCell key={col.field}>
                    {col.field === 'avgPosition' ? (
                      <span className={getPositionBadgeClass(item.avgPosition)}>
                        {formatCell(col.field, value)}
                      </span>
                    ) : (
                      formatCell(col.field, value)
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
