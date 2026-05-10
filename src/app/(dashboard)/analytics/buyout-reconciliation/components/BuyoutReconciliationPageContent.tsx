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
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { DateRangePickerExtended } from '@/components/custom/DateRangePickerExtended'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useBuyoutReconciliation } from '@/hooks/use-buyout-reconciliation'
import { ReconciliationTable } from './ReconciliationTable'
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
  // Previously showNmIdError only flipped on regex failure, not when value was 0.
  const trimmed = nmIdInput.trim()
  const parsedNmId = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : null
  const isValidNmId = parsedNmId !== null && parsedNmId > 0
  const nmId = isValidNmId ? parsedNmId : undefined
  const showNmIdError = trimmed !== '' && !isValidNmId

  // Memoize derived API params per Pattern 1 precedent (MonitorPageContent.tsx)
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
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

      {/* Controls (AC-6) */}
      <div className="flex items-center gap-4 flex-wrap">
        <DateRangePickerExtended
          value={dateRange}
          onChange={setDateRange}
          maxDays={365}
          placeholder="Выберите период"
          id="buyout-reconciliation-date-range"
        />
        <div className="flex flex-col gap-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Артикул WB (опционально)"
            value={nmIdInput}
            onChange={e => setNmIdInput(e.target.value)}
            className="w-56"
            aria-label="Фильтр по артикулу WB"
          />
          {showNmIdError && (
            <p className="text-xs text-amber-700">Должно быть положительное целое число</p>
          )}
        </div>
      </div>

      {/* L2-2 fix: stale-data banner hoisted above the state-machine ternary so ALL hasData
          branches (showNoAnomalies + showTable) get parity disclosure when isError && hasData.
          Previously only showTable rendered the banner; showNoAnomalies silently showed stale
          "all clear" without any warning that the refetch failed. */}
      {isError && hasData && (
        <div
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center justify-between"
          data-testid="stale-data-banner"
        >
          <span>Не удалось обновить. Показаны кэшированные данные.</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Повторить
          </Button>
        </div>
      )}

      {/* State machine — 5 branches */}
      {showSkeleton ? (
        <div className="space-y-2" role="status" aria-busy="true" aria-label="Загрузка данных">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : showFullError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные сверки. Попробуйте ещё раз.</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4 shrink-0"
              onClick={() => void refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      ) : showNoData ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Данных по выкупам за выбранный период нет.</AlertDescription>
        </Alert>
      ) : showNoAnomalies ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Аномалий не найдено за выбранный период.
          </AlertDescription>
        </Alert>
      ) : showTable ? (
        <ReconciliationTable items={items} />
      ) : null}
    </div>
  )
}
