'use client'

/**
 * Horizon breakdown table — accuracy metrics per forecast horizon.
 * Epic 123-FE Story 123.4 (migrated Story 171.5-FE)
 */

import { formatPercentage } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { HorizonAccuracy } from '@/types/ai/forecast-accuracy'

interface HorizonBreakdownTableProps {
  rows: HorizonAccuracy[]
}

export function HorizonBreakdownTable({ rows }: HorizonBreakdownTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных по горизонтам</p>
  }

  return (
    <Table>
      {/* Story 171.5: static caption (169.7 canon) */}
      <TableCaption>Точность прогнозов по горизонтам</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Горизонт (дни)</TableHead>
          <TableHead className="text-right">MAPE</TableHead>
          <TableHead className="text-right">MAE</TableHead>
          <TableHead className="text-right">Кол-во</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.horizonDays}>
            <TableCell className="font-medium tabular-nums">{row.horizonDays}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.mape != null ? formatPercentage(row.mape) : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.mae != null ? row.mae.toLocaleString('ru-RU') : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
