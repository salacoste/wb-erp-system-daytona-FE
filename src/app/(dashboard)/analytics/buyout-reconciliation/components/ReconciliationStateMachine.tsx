'use client'

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ReconciliationTable } from './ReconciliationTable'
import type { ReconciliationItem } from '@/types/buyout-reconciliation'

interface ReconciliationStateMachineProps {
  showSkeleton: boolean
  showFullError: boolean
  showNoData: boolean
  showNoAnomalies: boolean
  showTable: boolean
  items: ReconciliationItem[]
  isError: boolean
  hasData: boolean
  onRetry: () => void
}

/** 5-branch state machine for buyout reconciliation display (AC-4) */
export function ReconciliationStateMachine({
  showSkeleton,
  showFullError,
  showNoData,
  showNoAnomalies,
  showTable,
  items,
  isError,
  hasData,
  onRetry,
}: ReconciliationStateMachineProps) {
  return (
    <>
      {/* L2-2 fix: stale-data banner hoisted above the state-machine so ALL hasData
          branches (showNoAnomalies + showTable) get parity disclosure when isError && hasData. */}
      {isError && hasData && (
        <div
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 flex items-center justify-between"
          data-testid="stale-data-banner"
        >
          <span>Не удалось обновить. Показаны кэшированные данные.</span>
          <Button variant="ghost" size="sm" onClick={() => void onRetry()}>
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
              onClick={() => void onRetry()}
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
    </>
  )
}
