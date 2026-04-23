/**
 * Acquiring Reports Table
 * Epic 90-FE Story 90.2: Acquiring Reports List Page
 *
 * Sortable table with 6 columns. Null money values render as '—' (anti-pattern #8).
 * Anomaly indicator when acquiringFeeVatSum > acquiringFeeSum (Defensive Frontend Principle).
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AnomalyVatIndicator } from './shared/AnomalyVatIndicator'
import type { AcquiringReportListItem } from '@/types/acquiring-analytics'

type SortField = 'reportId' | 'dateFrom' | 'createDate' | 'acquiringFeeSum' | 'acquiringFeeVatSum'

interface AcquiringReportsTableProps {
  items: AcquiringReportListItem[]
}

/** Sort icon for column header */
function SortIcon({
  field,
  sort,
  order,
}: {
  field: SortField
  sort: SortField
  order: 'asc' | 'desc'
}) {
  if (field !== sort)
    return <ChevronsUpDown className="h-3 w-3 ml-1 inline text-muted-foreground" />
  return order === 'asc' ? (
    <ChevronUp className="h-3 w-3 ml-1 inline" />
  ) : (
    <ChevronDown className="h-3 w-3 ml-1 inline" />
  )
}

/**
 * Sort items by field. Nulls always sort last regardless of order.
 * Pure function — safe to test independently.
 */
export function sortItems(
  items: AcquiringReportListItem[],
  field: SortField,
  order: 'asc' | 'desc'
): AcquiringReportListItem[] {
  return [...items].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    // Nulls sort last regardless of direction
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function AcquiringReportsTable({ items }: AcquiringReportsTableProps) {
  const [sort, setSort] = useState<SortField>('createDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setSortOrder('asc')
    }
  }

  const sorted = sortItems(items, sort, sortOrder)

  const th = (field: SortField, label: string) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {label}
      <SortIcon field={field} sort={sort} order={sortOrder} />
    </TableHead>
  )

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {th('reportId', 'ID отчёта')}
            {th('dateFrom', 'Период')}
            {th('createDate', 'Создан')}
            {th('acquiringFeeSum', 'Комиссия')}
            {th('acquiringFeeVatSum', 'НДС')}
            <TableHead>Подробнее</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(item => {
            return (
              <TableRow key={item.reportId}>
                <TableCell className="font-mono text-sm">{item.reportId}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(item.dateFrom)} — {formatDate(item.dateTo)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(item.createDate)}
                </TableCell>
                <TableCell className="text-sm">
                  {item.acquiringFeeSum == null ? '—' : formatCurrency(item.acquiringFeeSum)}
                </TableCell>
                <TableCell className="text-sm">
                  {item.acquiringFeeVatSum == null ? '—' : formatCurrency(item.acquiringFeeVatSum)}
                  <AnomalyVatIndicator fee={item.acquiringFeeSum} vat={item.acquiringFeeVatSum} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/analytics/acquiring/reports/${item.reportId}`}>Детали</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
