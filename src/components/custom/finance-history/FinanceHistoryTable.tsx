'use client'

/**
 * Finance History Table — metric×week P&L grid (competitor-parity feature).
 * Rows = financial metrics grouped by section; columns = weeks (oldest→newest).
 * First column (metric label) + header are sticky so the dense grid stays readable
 * when scrolling horizontally/vertically. Mirrors the FE-6 sticky-first-column
 * pattern used across our wide tables.
 */

import { Fragment } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatWeekWithDateRange } from '@/hooks/financial'
import {
  FINANCE_HISTORY_SECTIONS,
  rowsForSection,
  type FinanceHistoryRow,
} from './finance-history-rows'
import { FinanceHistoryCell } from './FinanceHistoryCell'
import type { WeeklyFinancialPoint } from '@/hooks/financial/useWeeklyFinancialSeries'

interface FinanceHistoryTableProps {
  /** Weeks oldest → newest, each with its (possibly null) finance summary. */
  points: WeeklyFinancialPoint[]
}

const FIRST_CELL = 'sticky left-0 z-10 bg-card'
const FIRST_HEAD = 'sticky left-0 z-20 bg-muted'

function parseIsoWeek(week: string): { num: string; year: string } | null {
  const m = week.match(/^(\d{4})-W(\d{2})$/)
  return m ? { year: m[1], num: String(parseInt(m[2], 10)) } : null
}

function weekTitle(week: string): string {
  return formatWeekWithDateRange(week)
}

function hasAnyData(points: WeeklyFinancialPoint[]): boolean {
  return points.some(p => p.summary != null)
}

export function FinanceHistoryTable({ points }: FinanceHistoryTableProps): React.ReactElement {
  if (!hasAnyData(points)) {
    return (
      <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
        Нет финансовых данных за выбранный период.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-[640px]">
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="hover:bg-muted">
            <TableHead
              scope="col"
              className={cn(FIRST_HEAD, 'w-56 min-w-[14rem] text-left font-semibold')}
            >
              Показатель
            </TableHead>
            {points.map(p => {
              const parsed = parseIsoWeek(p.week)
              return (
                <TableHead
                  key={p.week}
                  scope="col"
                  title={weekTitle(p.week)}
                  className="px-3 text-center align-bottom"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-sm font-semibold">Нед. {parsed?.num ?? p.week}</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {parsed?.year ?? ''}
                    </span>
                  </div>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FINANCE_HISTORY_SECTIONS.map(section => (
            <Fragment key={section.id}>
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={points.length + 1}
                  className={cn(
                    FIRST_CELL,
                    'bg-muted/60 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
                  )}
                >
                  {section.label}
                </TableCell>
              </TableRow>
              {rowsForSection(section.id).map(row => (
                <MetricRow key={row.id} row={row} points={points} />
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function MetricRow({
  row,
  points,
}: {
  row: FinanceHistoryRow
  points: WeeklyFinancialPoint[]
}): React.ReactElement {
  return (
    <TableRow>
      <TableCell className={cn(FIRST_CELL, 'w-56 min-w-[14rem] text-left text-sm')}>
        <span className={cn(row.emphasis && 'font-semibold')}>{row.label}</span>
      </TableCell>
      {points.map((p, i) => {
        const prevPoint = points[i - 1]
        const current = p.summary ? row.extract(p.summary) : null
        const previous = prevPoint?.summary ? row.extract(prevPoint.summary) : null
        return <FinanceHistoryCell key={p.week} row={row} current={current} previous={previous} />
      })}
    </TableRow>
  )
}
