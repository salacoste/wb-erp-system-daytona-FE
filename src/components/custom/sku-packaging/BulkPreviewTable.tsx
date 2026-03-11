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
import { CheckCircle2, XCircle } from 'lucide-react'

export interface BulkRow {
  nmId: number
  boxTypeId: string
  unitsPerBox: number
  parseError?: string
}

export interface BulkResultRow extends BulkRow {
  status: 'success' | 'error'
  message?: string
}

interface BulkPreviewTableProps {
  rows: BulkRow[] | BulkResultRow[]
  showStatus?: boolean
}

function isResultRow(row: BulkRow | BulkResultRow): row is BulkResultRow {
  return 'status' in row
}

export function BulkPreviewTable({ rows, showStatus }: BulkPreviewTableProps) {
  return (
    <div className="max-h-64 overflow-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>nmId</TableHead>
            <TableHead>boxTypeId</TableHead>
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
                      ? 'bg-green-50 dark:bg-green-950/20'
                      : ''
              }
            >
              <TableCell>{row.nmId || '—'}</TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[200px]">
                {row.boxTypeId || '—'}
              </TableCell>
              <TableCell className="text-right">{row.unitsPerBox || '—'}</TableCell>
              {showStatus && (
                <TableCell>
                  {row.parseError ? (
                    <span className="text-destructive text-sm flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {row.parseError}
                    </span>
                  ) : isResultRow(row) ? (
                    row.status === 'success' ? (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> OK
                      </span>
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
