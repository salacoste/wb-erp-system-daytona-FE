/**
 * DataCompletenessTable — Data source completeness overview
 * Epic 68-FE (Story 68.4)
 * Shows overall health + per-source completeness with expandable detail rows
 * Detail data loaded on-demand from GET /v1/monitoring/data-completeness
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { getDataCompleteness } from '@/lib/api/monitoring/api'
import { monitoringQueryKeys } from '@/lib/api/monitoring/query-keys'
import type { DashboardDataCompleteness, DataCompletenessDetail } from '../types/monitoring'
import { formatPercentageInt } from '@/lib/utils'
import { HEALTH_CONFIG, getOverallPercent, sortByCompleteness } from './data-completeness-constants'
import { CompletenessRow } from './CompletenessRow'

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

  // getOverallPercent([]) returns 0 as an empty-array guard — NOT a measured 0%. When the
  // backend sends no per-source rows (live: dashboard.dataCompleteness = {overallHealth:'healthy',
  // tables:[]}), rendering "0% — Все данные загружены" + a 0% bar is self-contradictory. Show the
  // truthful health label alone and drop the misleading bar/empty table when there are no rows.
  const hasTables = data.tables.length > 0
  const percent = getOverallPercent(data.tables)
  const percentStr = formatPercentageInt(percent)
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
            {hasTables ? `${percentStr} — ${health.label}` : health.label}
          </span>
        </div>
        {hasTables ? (
          <Progress
            value={percent}
            className={`h-2.5 ${health.barClass}`}
            aria-label={`Полнота данных: ${percentStr}`}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Детализация по источникам недоступна за период
          </p>
        )}
      </div>

      {/* Per-source table — omitted when the backend sends no rows (avoids an empty table) */}
      {hasTables && (
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
      )}
    </div>
  )
}

// --- Skeleton ---

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
