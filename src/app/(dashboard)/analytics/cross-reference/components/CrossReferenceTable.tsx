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
// Story 170.6-FE: route-owned copy — the search-tree SortButton import is forbidden (read-only tree).
import { SortButton } from './SortButton'
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency, fmtNumber } from '../utils/cross-reference-utils'
// Story 170.6-FE: channel chips migrate to the route single-source channel map.
import { CHANNEL_STYLES } from './channel-styling'

interface CrossReferenceTableProps {
  items: CrossReferenceItem[]
}

type SortField = 'nmId' | 'totalOrders' | 'uniqueQueries' | 'adSpend' | 'adClicks' | 'adRevenue'

export function CrossReferenceTable({ items }: CrossReferenceTableProps) {
  const [sortField, setSortField] = useState<SortField>('adSpend')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      // nulls last regardless of direction (uniqueQueries + adRevenue are nullable "—" rows):
      // an unknown value must not pin itself arbitrarily among real numbers when its column sorts.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
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
                <Badge variant="outline" className={CHANNEL_STYLES[item.channel].badgeClassName}>
                  {CHANNEL_STYLES[item.channel].label}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
