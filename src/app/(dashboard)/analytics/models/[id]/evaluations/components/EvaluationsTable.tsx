'use client'

/**
 * EvaluationsTable — sortable table of evaluation entries with forecast columns.
 * Extracted from EvaluationsList.tsx for file-size discipline (Story 110.2-FE).
 * Story 110.1 jsx-a11y ratchet: all interactive controls have aria-label at write-time.
 * Story 110.4-FE: added Оценка column with FeedbackButtons per-row.
 *
 * 2nd-pass F-6: aria-sort on <TableHead> per WAI-ARIA; button aria-label simplified to action-only.
 * 2nd-pass F-1: "Дата" cell renders formatDate(evaluationDate) per-row; forecastId in tooltip (full id).
 * 2nd-pass F-3: TooltipTrigger child stops click propagation to prevent nested-interactive violation.
 * Forecast columns: forecastDate, horizonDays, predictedRevenue, actualRevenue — surfaced from EvaluationEntry.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatCurrency } from '@/lib/utils'
import { formatNumber } from '@/lib/fbs-analytics-formatters'
import { sortEvaluationsByMape, formatMapeDisplay } from './evaluations-list-helpers'
import type { SortColumn, SortDirection } from './evaluations-list-helpers'
import type { EvaluationEntry } from '@/types/ai/evaluations'
import { FeedbackButtons } from '@/components/custom/ai/FeedbackButtons'

interface EvaluationsTableProps {
  entries: EvaluationEntry[]
  sortCol: SortColumn
  sortDir: SortDirection
  onSortClick: (col: SortColumn) => void
  onRowClick: (nmId: number | null) => void
  /** Optional — when provided, feedback submission invalidates model cache (Story 110.4-FE AC 2) */
  modelId?: string
}

export function EvaluationsTable({
  entries,
  sortCol,
  sortDir,
  onSortClick,
  onRowClick,
  modelId,
}: EvaluationsTableProps) {
  const sorted = sortEvaluationsByMape(entries, sortCol, sortDir)

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата оценки</TableHead>
            <TableHead>Дата прогноза</TableHead>
            <TableHead>Горизонт</TableHead>
            <TableHead>Артикул</TableHead>
            <TableHead>Прогноз (ед.)</TableHead>
            <TableHead>Факт (ед.)</TableHead>
            <TableHead>Прогноз (₽)</TableHead>
            <TableHead>Факт (₽)</TableHead>
            {/* F-6: aria-sort on <TableHead> per WAI-ARIA; button label simplified to action-only */}
            <TableHead
              aria-sort={
                sortCol === 'mapeUnits' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              }
            >
              <button
                type="button"
                onClick={() => onSortClick('mapeUnits')}
                aria-label="Сортировать по MAPE единиц"
                className="flex items-center gap-1 hover:text-foreground"
              >
                MAPE (ед.)
                {sortCol === 'mapeUnits' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </button>
            </TableHead>
            <TableHead
              aria-sort={
                sortCol === 'mapeRevenue'
                  ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                type="button"
                onClick={() => onSortClick('mapeRevenue')}
                aria-label="Сортировать по MAPE выручки"
                className="flex items-center gap-1 hover:text-foreground"
              >
                MAPE (₽)
                {sortCol === 'mapeRevenue' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </button>
            </TableHead>
            {/* Story 110.4-FE: Оценка column for thumbs feedback */}
            <TableHead>Оценка</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(entry => (
            <TableRow
              key={entry.forecastId}
              onClick={() => onRowClick(entry.nmId)}
              onKeyDown={
                entry.nmId !== null
                  ? e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(entry.nmId)
                      }
                    }
                  : undefined
              }
              tabIndex={entry.nmId !== null ? 0 : undefined}
              className={entry.nmId !== null ? 'cursor-pointer hover:bg-muted/50' : ''}
              role={entry.nmId !== null ? 'button' : undefined}
              aria-label={
                entry.nmId !== null ? `Перейти к детализации по артикулу ${entry.nmId}` : undefined
              }
            >
              {/* F-1: Дата cell shows per-row evaluationDate; forecastId moved to tooltip (full id) */}
              {/* F-3: stopPropagation on tooltip trigger prevents nested-interactive conflict */}
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="cursor-help underline decoration-dotted"
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                      }}
                    >
                      {formatDate(new Date(entry.evaluationDate))}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Прогноз ID: {entry.forecastId}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              {/* Forecast date — ISO date of forecast horizon start */}
              <TableCell>{formatDate(new Date(entry.forecastDate))}</TableCell>
              {/* Horizon days — count, always present */}
              <TableCell>{entry.horizonDays} дн.</TableCell>
              {/* F-8: nmId is an opaque identifier — String() preserves copy-paste semantics; formatNumber adds non-breaking spaces */}
              <TableCell>{entry.nmId !== null ? String(entry.nmId) : 'По кабинету'}</TableCell>
              <TableCell>{formatNumber(entry.predictedUnits)}</TableCell>
              <TableCell>{formatNumber(entry.actualUnits)}</TableCell>
              {/* predictedRevenue — null for unit-target models (AP#8: null → '—') */}
              <TableCell>
                {entry.predictedRevenue !== null ? formatCurrency(entry.predictedRevenue) : '—'}
              </TableCell>
              {/* actualRevenue — semantic-zero OK */}
              <TableCell>{formatCurrency(entry.actualRevenue)}</TableCell>
              <TableCell>{formatMapeDisplay(entry.mapeUnits)}</TableCell>
              <TableCell>{formatMapeDisplay(entry.mapeRevenue)}</TableCell>
              {/* Story 110.4-FE: FeedbackButtons — stopPropagation is inside FeedbackButtons onClick (F-3 discipline) */}
              <TableCell>
                <FeedbackButtons forecastId={entry.forecastId} modelId={modelId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}
