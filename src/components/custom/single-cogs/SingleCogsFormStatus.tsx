'use client'

// ============================================================================
// Single COGS Form Status Alerts
// Epic 74-FE: Extracted from SingleCogsForm.tsx for file size compliance
// Contains: validation errors, API error, success, polling status, timeout
// ============================================================================

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { MarginCalculationStatus } from '../MarginCalculationStatus'
import { getPollingStrategy } from '@/lib/margin-helpers'

export interface SingleCogsFormStatusProps {
  validationErrors: string[]
  error: Error | null
  isSuccess: boolean
  isPolling: boolean
  pollingAttempts: number
  pollingTimeout: boolean
  validFrom: string
}

/**
 * Status alerts for single COGS form
 * Displays validation errors, API errors, success messages,
 * margin calculation polling status, and timeout warnings
 */
export function SingleCogsFormStatus({
  validationErrors,
  error,
  isSuccess,
  isPolling,
  pollingAttempts,
  pollingTimeout,
  validFrom,
}: SingleCogsFormStatusProps) {
  return (
    <>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* API Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Ошибка при сохранении'}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {isSuccess && !isPolling && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Себестоимость успешно назначена!
          </AlertDescription>
        </Alert>
      )}

      {/* Margin Calculation Status */}
      {isPolling && <PollingStatus validFrom={validFrom} pollingAttempts={pollingAttempts} />}

      {/* Timeout Warning */}
      {pollingTimeout && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Расчёт маржи занимает больше времени. Обновите страницу через минуту.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

interface PollingStatusProps {
  validFrom: string
  pollingAttempts: number
}

/**
 * Margin calculation polling status indicator
 */
function PollingStatus({ validFrom, pollingAttempts }: PollingStatusProps) {
  const strategy = getPollingStrategy(validFrom, false)
  return (
    <MarginCalculationStatus
      isPolling={true}
      attempts={pollingAttempts}
      maxAttempts={strategy.maxAttempts}
      estimatedTime={strategy.estimatedTime}
    />
  )
}
