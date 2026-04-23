/**
 * Acquiring Transactions Table
 * Epic 90-FE Story 90.3: Per-transaction breakdown for a single acquiring report.
 *
 * 9 visible columns (rrdId hidden — WB internal ID, not user-facing).
 * Sortable by date + money columns. Default: acqDate descending.
 * Null money values render as '—' (CLAUDE.md anti-pattern #8).
 * Anomaly indicator: acquiringFeeVat > acquiringFee (Defensive Frontend Principle).
 * nmId links to WB product page (no internal /analytics/sku pattern exists — AC-6).
 */

'use client'

import { useState } from 'react'
import { ChevronsUpDown, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AnomalyVatIndicator } from '@/app/(dashboard)/analytics/acquiring/components/shared/AnomalyVatIndicator'
import type { AcquiringReportDetailItem } from '@/types/acquiring-analytics'

type SortField = 'acqDate' | 'saleDate' | 'retailAmount' | 'acquiringFee' | 'acquiringFeeVat'

interface AcquiringTransactionsTableProps {
  transactions: AcquiringReportDetailItem[]
}

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
 * Sort transactions by field. Nulls always sort last regardless of direction.
 * Pure function — safe to test independently.
 */
export function sortTransactions(
  items: AcquiringReportDetailItem[],
  field: SortField,
  order: 'asc' | 'desc'
): AcquiringReportDetailItem[] {
  return [...items].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function AcquiringTransactionsTable({ transactions }: AcquiringTransactionsTableProps) {
  const [sort, setSort] = useState<SortField>('acqDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSort(field)
      setSortOrder('asc')
    }
  }

  const sorted = sortTransactions(transactions, sort, sortOrder)

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
            {th('acqDate', 'Дата комиссии')}
            {th('saleDate', 'Дата продажи')}
            <TableHead>Банк</TableHead>
            <TableHead>SRID</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Артикул</TableHead>
            {th('retailAmount', 'Сумма')}
            {th('acquiringFee', 'Комиссия')}
            {th('acquiringFeeVat', 'НДС')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((item, idx) => {
            return (
              <TableRow key={item.srid || `${item.rrdId}-${idx}`}>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(item.acqDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(item.saleDate)}
                </TableCell>
                <TableCell className="text-sm">{item.acquiringBank}</TableCell>
                <TableCell className="font-mono text-xs">{item.srid}</TableCell>
                <TableCell className="text-sm">{item.docTypeName}</TableCell>
                <TableCell className="text-sm">
                  {/* AC-6: no internal /analytics/sku pattern — link to WB product page */}
                  <a
                    href={`https://www.wildberries.ru/catalog/${item.nmId}/detail.aspx`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono"
                  >
                    {item.nmId}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell className="text-sm">
                  {item.retailAmount == null ? '—' : formatCurrency(item.retailAmount)}
                </TableCell>
                <TableCell className="text-sm">
                  {item.acquiringFee == null ? '—' : formatCurrency(item.acquiringFee)}
                </TableCell>
                <TableCell className="text-sm">
                  {item.acquiringFeeVat == null ? '—' : formatCurrency(item.acquiringFeeVat)}
                  <AnomalyVatIndicator fee={item.acquiringFee} vat={item.acquiringFeeVat} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
