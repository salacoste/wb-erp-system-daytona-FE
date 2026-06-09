/**
 * EmptyStateFBS Component
 * Issue #2: FBS Orders Empty State
 *
 * Displays informative message when FBS orders = 0 for a period,
 * with option to load historical data (up to 90 days).
 *
 * @see docs/request-backend/ISSUE-2-FBS-ORDERS-EMPTY-STATE-REPORT.md
 */

import { Package, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Format ISO date to Russian locale datetime */
function formatSyncTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Check if date is within 90 days from today */
function isWithin90Days(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= 90
}

export interface EmptyStateFBSProps {
  /** Period start date (ISO format) */
  periodFrom: string
  /** Period end date (ISO format) */
  periodTo: string
  /** Last sync timestamp */
  lastSyncAt?: string | null
  /** Callback to trigger backfill */
  onBackfill?: () => void
  /** Whether backfill is in progress */
  isBackfillLoading?: boolean
}

/**
 * EmptyStateFBS - Informative empty state for FBS orders
 * Shows explanation and backfill option when no orders exist
 */
export function EmptyStateFBS({
  periodFrom,
  periodTo: _periodTo,
  lastSyncAt,
  onBackfill,
  isBackfillLoading,
}: EmptyStateFBSProps) {
  const canBackfill = isWithin90Days(periodFrom)

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
      <div className="rounded-full bg-gray-100 p-3">
        <Package className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-700">Нет данных FBS за период</p>
        <p className="max-w-xs text-xs text-gray-500">
          Синхронизация FBS была подключена позже. Данные появятся автоматически.
        </p>
      </div>

      {canBackfill && onBackfill && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBackfill}
          disabled={isBackfillLoading}
          className="text-xs"
        >
          {isBackfillLoading ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              Загрузить историю
            </>
          )}
        </Button>
      )}

      {!canBackfill && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          Период старше 90 дней — загрузка недоступна
        </p>
      )}

      {lastSyncAt && (
        <p className="text-xs text-gray-400">Синхронизация: {formatSyncTime(lastSyncAt)}</p>
      )}
    </div>
  )
}
