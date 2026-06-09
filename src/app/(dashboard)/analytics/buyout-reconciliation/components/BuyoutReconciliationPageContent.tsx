'use client'

/**
 * Buyout Reconciliation Page Orchestrator
 * Epic 96-FE Story 96.14: per-SKU anomaly audit table — 5-branch state machine.
 *
 * Pattern 1 (CLAUDE.md § Multi-Source Orchestration): single fetch, page-level state machine.
 * Date-range default: last 30 days inclusive (matches Story 96.11/96.12/96.13 + acquiring precedent).
 *
 * 5 distinct state branches (AC-4):
 *   1. Loading skeleton (isLoading && !hasData)
 *   2. Full error (isError && !hasData)
 *   3. No data (empty data array — no buyouts in period)
 *   4. No anomalies (data present but all 3 anomaly counts = 0 on all rows — success state)
 *   5. Populated table (data present with at least 1 anomaly count > 0)
 */

import { useState, useMemo, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useBuyoutReconciliation } from '@/hooks/use-buyout-reconciliation'
import { ReconciliationControls } from './ReconciliationControls'
import { ReconciliationStateMachine } from './ReconciliationStateMachine'
import type { DateRange } from '@/types/date-range'

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

export function BuyoutReconciliationPageContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDefaultRange)
  const [nmIdInput, setNmIdInput] = useState('')

  // H-1: subscribe to cabinetId and reset local UI state on cabinet switch
  // Story 96.12 M2-2 lesson: query-key cabinetId scoping prevents cache collisions,
  // but local component state (dateRange, nmIdInput) leaks across cabinet switches.
  // Mirror src/app/(dashboard)/analytics/fbs-stock/components/FbsExportButton.tsx:66-86
  const cabinetId = useAuthStore(s => s.cabinetId)
  useEffect(() => {
    setDateRange(getDefaultRange())
    setNmIdInput('')
  }, [cabinetId])

  // M-1 fix: treat 0 as invalid input — parsedNmId=0 is not a valid positive article.
  const trimmed = nmIdInput.trim()
  const parsedNmId = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null
  const isValidNmId = parsedNmId !== null && parsedNmId > 0
  const nmId = isValidNmId ? parsedNmId : undefined
  const showNmIdError = trimmed !== '' && !isValidNmId

  const { apiFrom, apiTo } = useMemo(
    () => ({
      apiFrom: dateRange ? formatApi(dateRange.from) : '',
      apiTo: dateRange ? formatApi(dateRange.to) : '',
    }),
    [dateRange]
  )

  const { data, isLoading, isError, refetch } = useBuyoutReconciliation(apiFrom, apiTo, nmId)

  const items = data?.data ?? []
  const hasData = items.length > 0
  const totalAnomalies = items.reduce(
    (s, i) => s + i.returnWithoutBuyout + i.orphanBuyout + i.returnQuantityMismatch,
    0
  )

  // 5-branch state machine (AC-4)
  const showSkeleton = isLoading && !hasData
  const showFullError = isError && !isLoading && !hasData
  const showNoData = !isLoading && !isError && !hasData
  const showNoAnomalies = hasData && totalAnomalies === 0
  const showTable = hasData && totalAnomalies > 0

  return (
    <div className="space-y-6" data-testid="buyout-reconciliation-page">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Сверка выкупов и возвратов
        </h1>
        <p className="text-muted-foreground mt-1">
          Сверка данных выкупов и возвратов по источникам с индикаторами аномалий
        </p>
      </div>

      {/* Refresh schedule disclosure (AC-5) */}
      <p className="text-xs text-muted-foreground">
        Данные обновляются ежедневно в 06:30 МСК через returns_sync pipeline.
      </p>

      <ReconciliationControls
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        nmIdInput={nmIdInput}
        onNmIdInputChange={setNmIdInput}
        showNmIdError={showNmIdError}
      />

      <ReconciliationStateMachine
        showSkeleton={showSkeleton}
        showFullError={showFullError}
        showNoData={showNoData}
        showNoAnomalies={showNoAnomalies}
        showTable={showTable}
        items={items}
        isError={isError}
        hasData={hasData}
        onRetry={() => void refetch()}
      />
    </div>
  )
}
