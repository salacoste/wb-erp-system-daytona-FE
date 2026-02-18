/**
 * DataCompletenessTable — Data source completeness overview
 * Epic 68-FE (Story 68.4)
 * Shows overall health + per-source completeness with expandable detail rows
 * Detail data loaded on-demand from GET /v1/monitoring/data-completeness
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { getDataCompleteness } from '@/lib/api/monitoring/api'
import { monitoringQueryKeys } from '@/lib/api/monitoring/query-keys'
import type {
  DashboardDataCompleteness,
  DataCompletenessTable as DataCompletenessRow,
  DataCompletenessDetail,
  TableCompletenessDetail,
} from '../types/monitoring'

// --- Constants ---

const COMPLETENESS_BADGE: Record<string, { label: string; variant: 'outline'; className: string }> =
  {
    complete: { label: 'Полные', variant: 'outline', className: 'border-green-500 text-green-700' },
    incomplete: {
      label: 'Неполные',
      variant: 'outline',
      className: 'border-yellow-500 text-yellow-700',
    },
    critical: { label: 'Критично', variant: 'outline', className: 'border-red-500 text-red-700' },
  }

const HEALTH_CONFIG: Record<string, { label: string; className: string; barClass: string }> = {
  healthy: {
    label: 'Все данные загружены',
    className: 'text-green-700',
    barClass: '[&>div]:bg-green-500',
  },
  degraded: {
    label: 'Незначительные пропуски',
    className: 'text-yellow-700',
    barClass: '[&>div]:bg-yellow-500',
  },
  critical: {
    label: 'Требуется внимание',
    className: 'text-red-700',
    barClass: '[&>div]:bg-red-500',
  },
}

// --- Helpers ---

function getOverallPercent(tables: DataCompletenessRow[]): number {
  if (tables.length === 0) return 0
  const sum = tables.reduce((acc, t) => acc + t.completenessRatio, 0)
  return Math.round((sum / tables.length) * 100)
}

function sortByCompleteness(tables: DataCompletenessRow[]): DataCompletenessRow[] {
  return [...tables].sort((a, b) => a.completenessRatio - b.completenessRatio)
}

// --- Props ---

interface DataCompletenessTableProps {
  data: DashboardDataCompleteness | undefined
  isLoading: boolean
}

// --- Component ---

export function DataCompletenessTable({ data, isLoading }: DataCompletenessTableProps) {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const [expandedTable, setExpandedTable] = useState<string | null>(null)

  // Lazy-load detail when any row is expanded
  const { data: detail } = useQuery<DataCompletenessDetail>({
    queryKey: monitoringQueryKeys.dataCompleteness(cabinetId ?? ''),
    queryFn: () => getDataCompleteness(cabinetId!),
    enabled: !!cabinetId && expandedTable !== null,
    staleTime: 120_000,
    gcTime: 300_000,
  })

  if (isLoading) return <DataCompletenessSkeleton />
  if (!data) return null

  const percent = getOverallPercent(data.tables)
  const health = HEALTH_CONFIG[data.overallHealth] ?? HEALTH_CONFIG.critical
  const sorted = sortByCompleteness(data.tables)

  const toggleRow = (table: string) => {
    setExpandedTable(prev => (prev === table ? null : table))
  }

  return (
    <div className="space-y-4">
      {/* Overall health indicator */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Полнота данных</span>
          <span className={health.className}>
            {percent}% — {health.label}
          </span>
        </div>
        <Progress
          value={percent}
          className={`h-2.5 ${health.barClass}`}
          aria-label={`Полнота данных: ${percent}%`}
        />
      </div>

      {/* Per-source table */}
      <Table>
        <TableCaption>Состояние источников данных</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Источник</TableHead>
            <TableHead className="w-48">Полнота</TableHead>
            <TableHead className="w-24 text-right">Статус</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(row => {
            const tableDetail = detail?.completeness.find(c => c.table === row.table)
            return (
              <CompletenessRow
                key={row.table}
                row={row}
                detail={tableDetail}
                isExpanded={expandedTable === row.table}
                onToggle={() => toggleRow(row.table)}
                isLoadingDetail={expandedTable === row.table && !detail}
              />
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// --- Expandable row ---

function CompletenessRow({
  row,
  detail,
  isExpanded,
  onToggle,
  isLoadingDetail,
}: {
  row: DataCompletenessRow
  detail: TableCompletenessDetail | undefined
  isExpanded: boolean
  onToggle: () => void
  isLoadingDetail: boolean
}) {
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

// --- Skeletons ---

function DetailSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

function DataCompletenessSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-2.5 w-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
