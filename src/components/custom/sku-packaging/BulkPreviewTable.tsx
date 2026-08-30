'use client'

/** Preview table for bulk SKU Packaging import — Epic 75-FE, Story 75.3 (AC: #7) */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/product/metrics'

export interface BulkRow {
  nmId: number
  boxTypeId: string
  unitsPerBox: number
  boxTypeName?: string
  parseError?: string
}

export interface BulkResultRow extends BulkRow {
  status: 'success' | 'error'
  message?: string
}

interface BulkPreviewTableProps {
  rows: BulkRow[] | BulkResultRow[]
  showStatus?: boolean
  accessibleName: string
}

function isResultRow(row: BulkRow | BulkResultRow): row is BulkResultRow {
  return 'status' in row
}

export function BulkPreviewTable({ rows, showStatus, accessibleName }: BulkPreviewTableProps) {
  return (
    <div className="max-h-64 rounded-md border">
      <Table
        aria-label={accessibleName}
        scrollContainerTabIndex={0}
        scrollContainerAriaLabel={`${accessibleName}: горизонтальная прокрутка`}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Код WB</TableHead>
            <TableHead>Тип короба</TableHead>
            <TableHead className="text-right">Штук</TableHead>
            {showStatus && <TableHead>Статус</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={`${row.nmId}-${i}`}
              className={
                row.parseError
                  ? 'bg-destructive/10'
                  : isResultRow(row) && row.status === 'error'
                    ? 'bg-destructive/10'
                    : isResultRow(row) && row.status === 'success'
                      ? 'bg-primary/5'
                      : ''
              }
            >
              <TableCell>{row.nmId || '—'}</TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[200px]">
                {row.boxTypeName || row.boxTypeId || '—'}
              </TableCell>
              <TableCell className="text-right">
                {row.unitsPerBox ? `${row.unitsPerBox} шт.` : '—'}
              </TableCell>
              {showStatus && (
                <TableCell>
                  {row.parseError ? (
                    <span className="text-destructive text-sm flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {row.parseError}
                    </span>
                  ) : isResultRow(row) ? (
                    row.status === 'success' ? (
                      <StatusBadge status="success" label="Сохранено" />
                    ) : (
                      <span className="text-destructive text-sm flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> {row.message}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">Ожидание</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
