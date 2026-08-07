/**
 * Backfill Per-Source Retry Controls
 * Story 165.5: Per-Status Backfill Retry
 *
 * Renders an independent retry button for EACH backfill pipeline (reports / analytics).
 * AC3/AC4: a control is shown ONLY when THAT source's status is `failed`; the other
 * source's status and controls stay untouched. AC5: each button has its own loading
 * state and is disabled only while ITS OWN request is in-flight (concurrent-action
 * guard) — retrying reports never blocks/disables the analytics control.
 *
 * Two separate endpoints, never a combined call (AC2).
 */

'use client'

import { RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BackfillCabinetStatus, BackfillRetrySource } from '@/types/backfill'

interface BackfillRetryControlsProps {
  cabinet: BackfillCabinetStatus
  /** Set of `"${cabinetId}:${dataSource}"` currently in-flight (concurrent guard). */
  retryingKeys: Set<string>
  onRetry: (cabinetId: string, dataSource: BackfillRetrySource) => void
}

/**
 * One retry button for a single source. Rendered ONLY when that source failed.
 * Disabled exclusively by its own in-flight flag — never by the sibling source.
 */
function RetryButton({
  label,
  cabinetName,
  inFlight,
  onRetry,
}: {
  label: string
  cabinetName: string
  inFlight: boolean
  onRetry: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRetry}
      disabled={inFlight}
      aria-label={`Повторить загрузку «${label}» для ${cabinetName}`}
      aria-busy={inFlight}
    >
      {inFlight ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="mr-1 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}

/**
 * Per-source retry controls. Each button is gated independently on its source status,
 * so a reports-only failure surfaces only the reports button and vice-versa.
 */
export function BackfillRetryControls({
  cabinet,
  retryingKeys,
  onRetry,
}: BackfillRetryControlsProps) {
  const reportsFailed = cabinet.status === 'failed'
  const analyticsFailed = cabinet.analytics_status === 'failed'

  if (!reportsFailed && !analyticsFailed) {
    return null
  }

  const reportsKey = `${cabinet.cabinet_id}:reports`
  const analyticsKey = `${cabinet.cabinet_id}:analytics`

  return (
    <div className="flex flex-col gap-1.5">
      {reportsFailed && (
        <RetryButton
          label="Повторить отчёты"
          cabinetName={cabinet.cabinet_name}
          inFlight={retryingKeys.has(reportsKey)}
          onRetry={() => onRetry(cabinet.cabinet_id, 'reports')}
        />
      )}
      {analyticsFailed && (
        <RetryButton
          label="Повторить аналитику"
          cabinetName={cabinet.cabinet_name}
          inFlight={retryingKeys.has(analyticsKey)}
          onRetry={() => onRetry(cabinet.cabinet_id, 'analytics')}
        />
      )}
    </div>
  )
}

export default BackfillRetryControls
