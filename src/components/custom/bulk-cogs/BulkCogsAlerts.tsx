'use client'

/**
 * Alert and status sub-components for BulkCogsResultsDialog
 * Story 4.2 + Request #118/119 (margin recalculation status)
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { MarginCalculationStatus } from '../MarginCalculationStatus'

interface MarginRecalculation {
  triggered: boolean
  affectedWeeks: string[]
  taskUuid: string
}

interface ResultData {
  succeeded: number
  failed: number
  marginRecalculation?: MarginRecalculation
}

interface BulkCogsAlertsProps {
  resultData: ResultData
  isPolling: boolean
  pollingAttempts: number
  pollingTimeout: boolean
  pollingMaxAttempts: number
  pollingEstimatedTime: number
}

export function BulkCogsAlerts({
  resultData,
  isPolling,
  pollingAttempts,
  pollingTimeout,
  pollingMaxAttempts,
  pollingEstimatedTime,
}: BulkCogsAlertsProps) {
  return (
    <>
      {/* Margin Recalculation Status (Request #118/119) */}
      {resultData.marginRecalculation && (
        <Alert variant="default" className="border-status-information/40 bg-status-information/10">
          <AlertCircle className="h-4 w-4 text-status-information" />
          <AlertDescription className="text-status-information">
            <div className="mb-1 font-medium">Пересчёт маржи запущен автоматически</div>
            <div className="space-y-1 text-sm">
              <div>
                Статус:{' '}
                <span className="font-medium">
                  {resultData.marginRecalculation.triggered ? 'Запущен' : 'Не запущен'}
                </span>
              </div>
              {resultData.marginRecalculation.affectedWeeks.length > 0 && (
                <div>Недели: {resultData.marginRecalculation.affectedWeeks.join(', ')}</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* No Margin Recalculation Warning */}
      {resultData.succeeded > 0 && !resultData.marginRecalculation && (
        <Alert variant="default" className="border-status-warning/40 bg-status-warning/10">
          <AlertCircle className="h-4 w-4 text-status-warning" />
          <AlertDescription className="text-status-warning">
            <div className="mb-1 font-medium">Пересчёт маржи не требуется</div>
            <div className="text-sm">
              Для загруженных недель нет данных о продажах. Маржа будет рассчитана автоматически
              после импорта финансовых отчетов.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Margin Calculation Status */}
      {isPolling && resultData.succeeded > 0 && (
        <MarginCalculationStatus
          isPolling={isPolling}
          attempts={pollingAttempts}
          maxAttempts={pollingMaxAttempts}
          estimatedTime={pollingEstimatedTime}
          isBulk={true}
          bulkCount={resultData.succeeded}
        />
      )}

      {/* Timeout Warning */}
      {pollingTimeout && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Расчёт маржи занимает больше времени. Обновите страницу через минуту.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-status-success/40 bg-status-success/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-status-success" />
            <div className="text-sm font-medium text-status-success">Успешно</div>
          </div>
          <div className="mt-2 text-2xl font-bold text-status-success">{resultData.succeeded}</div>
        </div>

        <div className="rounded-lg border border-status-error/40 bg-status-error/10 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-status-error" />
            <div className="text-sm font-medium text-status-error">Ошибок</div>
          </div>
          <div className="mt-2 text-2xl font-bold text-status-error">{resultData.failed}</div>
        </div>
      </div>
    </>
  )
}
