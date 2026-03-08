'use client'

/**
 * Cross-Reference Table — Story 73.7-FE
 * Sortable table with channel badges showing organic/ad/both
 */

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SortButton } from '@/app/(dashboard)/analytics/search/components/SortButton'
import type { CrossReferenceItem, Channel } from '../utils/cross-reference-utils'
import { fmtCurrency, fmtNumber } from '../utils/cross-reference-utils'

interface CrossReferenceTableProps {
  items: CrossReferenceItem[]
}

type SortField = 'nmId' | 'totalOrders' | 'uniqueQueries' | 'adSpend' | 'adClicks' | 'adRevenue'

const CHANNEL_LABELS: Record<
  Channel,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  organic: { label: 'Органика', variant: 'secondary' },
  ad: { label: 'Реклама', variant: 'default' },
  both: { label: 'Оба', variant: 'outline' },
}

const CHANNEL_COLORS: Record<Channel, string> = {
  organic: 'bg-green-100 text-green-800 border-green-300',
  ad: 'bg-blue-100 text-blue-800 border-blue-300',
  both: 'bg-purple-100 text-purple-800 border-purple-300',
}

export function CrossReferenceTable({ items }: CrossReferenceTableProps) {
  const [sortField, setSortField] = useState<SortField>('adSpend')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return 0
    })
    return copy
  }, [items, sortField, sortAsc])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  return (
    <div className="rounded-md border overflow-auto">
      <Table aria-label="Таблица кросс-анализа">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <SortButton active={sortField === 'nmId'} onClick={() => toggleSort('nmId')}>
                Артикул
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton
                active={sortField === 'totalOrders'}
                onClick={() => toggleSort('totalOrders')}
              >
                Заказы (поиск)
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton
                active={sortField === 'uniqueQueries'}
                onClick={() => toggleSort('uniqueQueries')}
              >
                Запросы
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton active={sortField === 'adSpend'} onClick={() => toggleSort('adSpend')}>
                Расход ₽
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton active={sortField === 'adClicks'} onClick={() => toggleSort('adClicks')}>
                Рекл. клики
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton
                active={sortField === 'adRevenue'}
                onClick={() => toggleSort('adRevenue')}
              >
                Рекл. выручка
              </SortButton>
            </TableHead>
            <TableHead className="w-[100px]">Канал</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(item => (
            <TableRow key={item.nmId}>
              <TableCell className="font-mono text-sm">{item.vendorCode || item.nmId}</TableCell>
              <TableCell>{fmtNumber(item.totalOrders)}</TableCell>
              <TableCell>
                {item.uniqueQueries !== null ? fmtNumber(item.uniqueQueries) : '—'}
              </TableCell>
              <TableCell>{fmtCurrency(item.adSpend)}</TableCell>
              <TableCell>{fmtNumber(item.adClicks)}</TableCell>
              <TableCell>{fmtCurrency(item.adRevenue)}</TableCell>
              <TableCell>
                <Badge
                  variant={CHANNEL_LABELS[item.channel].variant}
                  className={CHANNEL_COLORS[item.channel]}
                >
                  {CHANNEL_LABELS[item.channel].label}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
