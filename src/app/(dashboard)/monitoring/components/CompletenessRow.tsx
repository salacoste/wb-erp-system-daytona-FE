/**
 * CompletenessRow — Expandable table row for a single data source
 * Epic 68-FE (Story 68.4) — extracted from DataCompletenessTable
 * Includes DetailContent and DetailSkeleton sub-components
 */

'use client'

import { ChevronDown } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  DataCompletenessTable as DataCompletenessRowType,
  TableCompletenessDetail,
} from '../types/monitoring'
import { COMPLETENESS_BADGE } from './data-completeness-constants'

// --- Props ---

export interface CompletenessRowProps {
  row: DataCompletenessRowType
  detail: TableCompletenessDetail | undefined
  isExpanded: boolean
  onToggle: () => void
  isLoadingDetail: boolean
}

// --- Main row component ---

export function CompletenessRow({
  row,
  detail,
  isExpanded,
  onToggle,
  isLoadingDetail,
}: CompletenessRowProps) {
  const pct = Math.round(row.completenessRatio * 100)
  const badge = COMPLETENESS_BADGE[row.status] ?? COMPLETENESS_BADGE.critical

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
      >
        <TableCell className="w-8 px-2">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </TableCell>
        <TableCell className="font-medium">{row.displayName}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Progress
              value={pct}
              className="h-2 flex-1"
              aria-label={`${row.displayName}: ${pct}%`}
            />
            <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <Badge variant={badge.variant} className={badge.className}>
            {badge.label}
          </Badge>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={4} className="px-6 py-3">
            {isLoadingDetail ? (
              <DetailSkeleton />
            ) : detail ? (
              <DetailContent detail={detail} />
            ) : (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

// --- Detail content ---

function DetailContent({ detail }: { detail: TableCompletenessDetail }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex gap-6">
        <span className="text-muted-foreground">
          Ожидалось дат: <strong className="text-foreground">{detail.expectedDates}</strong>
        </span>
        <span className="text-muted-foreground">
          Получено: <strong className="text-foreground">{detail.actualDates}</strong>
        </span>
        <span className="text-muted-foreground">
          Восстановление:{' '}
          <strong className={detail.recoverable ? 'text-green-600' : 'text-red-600'}>
            {detail.recoverable ? 'возможно' : 'невозможно'}
          </strong>
        </span>
      </div>

      {detail.missingDates.length > 0 && (
        <div>
          <span className="text-muted-foreground">
            Пропущенные даты ({detail.missingDates.length}):
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {detail.missingDates.map(date => (
              <Badge key={date} variant="outline" className="text-xs font-mono">
                {date}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {detail.missingDates.length === 0 && (
        <p className="text-green-600">Все даты за период присутствуют</p>
      )}
    </div>
  )
}

// --- Skeleton for loading detail ---

function DetailSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}
