'use client'

import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  retryAfterSeconds: number
  onRefetch: () => void
}

/**
 * Acquiring rate-limit banner — Story 96.9-FE, request-backend/169 § 1.1
 *
 * Amber (status-warning token) banner shown when a 503 response surfaces from any of the 3 acquiring
 * endpoints. Used by AcquiringPageContent, AcquiringReportDetailPage, and
 * AcquiringPeriodDetailPage.
 *
 * A11y: role="status" (implicit polite live region) is used instead of
 * role="alert" (assertive). A rate-limit notification is non-blocking
 * informational — it should NOT interrupt the screen reader mid-sentence.
 * Explicit aria-live is omitted: role="status" already implies polite.
 * (3rd-pass review fix L3-2, 2026-05-08.)
 *
 * Copy uses "~{N} сек" (approximate) rather than "Повтор через {N} сек" —
 * the value is a static label of the initial Retry-After, NOT a live
 * countdown (no setInterval). The "~" signals the wait is approximate so
 * the user isn't misled into expecting the number to decrement on screen
 * (review fix M2-3, 2nd-pass UX/honesty).
 *
 * Russian copy uses feminine subject ("недоступна") consistent with every
 * analogous string in the codebase (3rd-pass review fix M3-1, 2026-05-08).
 */
export function AcquiringRateLimitBanner({ retryAfterSeconds, onRefetch }: Props) {
  return (
    <div
      role="status"
      className="rounded-md border border-status-warning/30 bg-status-warning/15 px-4 py-3 text-sm text-status-warning flex items-center justify-between"
      data-testid="acquiring-rate-limit-banner"
    >
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <span>WB временно недоступна. Повтор через ~{retryAfterSeconds} сек</span>
      </div>
      <Button variant="ghost" size="sm" className="ml-4 shrink-0" onClick={onRefetch}>
        Повторить
      </Button>
    </div>
  )
}
