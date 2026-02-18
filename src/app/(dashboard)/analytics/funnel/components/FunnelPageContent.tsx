/**
 * Funnel Page orchestrator
 * Epic 68: Marketing Funnel Analytics
 */

'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import type { DateRange } from '@/types/date-range'
import { useFunnelSyncStatus } from '@/hooks/use-funnel-analytics'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, AlertCircle } from 'lucide-react'
import { FunnelSummaryCards } from './FunnelSummaryCards'
import { FunnelTable } from './FunnelTable'
import { FunnelChart } from './FunnelChart'

function getDefaultRange(): DateRange {
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  const from = subDays(to, 29)
  from.setHours(0, 0, 0, 0)
  return { from, to }
}

function formatApi(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function FunnelPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [showChart, setShowChart] = useState(false)

  const apiFrom = dateRange ? formatApi(dateRange.from) : ''
  const apiTo = dateRange ? formatApi(dateRange.to) : ''

  const { data: syncStatus } = useFunnelSyncStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Воронка продаж</h1>
        <p className="text-muted-foreground mt-1">Просмотры → корзина → заказы → выкупы → отмены</p>
      </div>

      {/* Sync status indicator */}
      <SyncStatusBanner syncStatus={syncStatus} />

      {/* Date picker + chart toggle */}
      <div className="flex items-center justify-between gap-4">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="funnel-date-range"
        />
        <button
          onClick={() => setShowChart(v => !v)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showChart ? 'Скрыть график' : 'Показать график'}
        </button>
      </div>

      {/* Summary cards */}
      <FunnelSummaryCards from={apiFrom} to={apiTo} />

      {/* Time series chart (lazy) */}
      {showChart && <FunnelChart from={apiFrom} to={apiTo} />}

      {/* Per-SKU table */}
      <FunnelTable from={apiFrom} to={apiTo} />
    </div>
  )
}

function SyncStatusBanner({
  syncStatus,
}: {
  syncStatus?: { lastSyncAt: string | null; productsCount: number } | null
}) {
  if (!syncStatus) return null

  if (!syncStatus.lastSyncAt) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Данные ещё не загружены. Синхронизация происходит ежедневно в 05:00 МСК.
        </AlertDescription>
      </Alert>
    )
  }

  const syncDate = new Date(syncStatus.lastSyncAt)
  const formatted = format(syncDate, 'dd.MM.yyyy HH:mm')

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>Данные актуальны на {formatted}</span>
      <span className="text-xs">({syncStatus.productsCount} товаров)</span>
    </div>
  )
}
