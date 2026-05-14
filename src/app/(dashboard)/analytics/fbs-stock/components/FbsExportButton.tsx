'use client'

/**
 * FBS Export Trigger Button — Epic 96-FE Story 96.12-FE
 *
 * Renders "Скачать CSV" button on the FBS Stock page header (Option A — header row).
 * On click: POST /v1/analytics/fbs/stock/export → poll status → auto-download on ready.
 *
 * Polling state surface: Option α — sonner toast notifications (toast lib confirmed in
 * package.json and used codebase-wide, e.g. src/stores/tariffRateLimitStore.ts).
 *
 * 429 rate-limit handling: live countdown via setInterval (cleanup on unmount).
 * Countdown copy: "Доступно через {N} сек" — distinct from AcquiringRateLimitBanner
 * static-label pattern (Story 96.9-FE), which is for 503 after-the-fact display.
 *
 * Defensive Frontend Principle: 429 error preserved (retryAfter extracted from
 * ApiError.retryAfter, defaulting to 60s if absent) — never silently swallowed.
 *
 * H-1+H-2 fix (1st-pass review 2026-05-08): download uses statusData.url (signed S3 URL
 * from polling response) — NOT getFbsExportDownloadUrl which constructed a relative path
 * resolving against the frontend origin (not backend) and had no auth headers.
 * The signed S3 URL is absolute and pre-authorized — no auth headers needed.
 *
 * M2-2 fix (2nd-pass review 2026-05-08): cabinet switch resets all local export state to
 * prevent cross-cabinet polling leak (exportId from cabinet-A would orphan-poll in cabinet-B).
 *
 * @see src/hooks/use-fbs-export-polling.ts
 * @see src/lib/api/fbs-export.ts
 * @see src/components/custom/PeriodContextLabel.tsx:62 (setInterval cleanup pattern)
 * @see CLAUDE.md § Defensive Frontend Principle
 */

import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/types/api'
import { triggerFbsExport } from '@/lib/api/fbs-export'
import { useFbsExportPolling } from '@/hooks/use-fbs-export-polling'
import { useAuthStore } from '@/stores/authStore'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default rate-limit countdown when backend 429 body lacks retryAfter. */
const DEFAULT_RATE_LIMIT_SECONDS = 60

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FbsExportButton() {
  const [exportId, setExportId] = useState<string | null>(null)
  const [pollingStartedAt, setPollingStartedAt] = useState<number | null>(null)
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Track toast ID so we can update/dismiss it across status transitions.
  const toastIdRef = useRef<string | number | null>(null)
  // M-4 fix: ref-based "already shown for this exportId" tracker prevents swallowed
  // retry errors when pollError transitions truthy → falsy → truthy on a new export.
  const errorShownRef = useRef<string | null>(null)

  // M2-2 fix: subscribe to cabinetId to detect cabinet switches.
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  const { data: statusData, error: pollError } = useFbsExportPolling(exportId, pollingStartedAt)

  // ---------------------------------------------------------------------------
  // M2-2: cabinet switch → reset all local export state
  // Prevents cross-cabinet polling leak: if user switches cabinet while exportId-A
  // is being polled, the local state would orphan-poll cabinet-B with cabinet-A's
  // exportId. Reset prevents the leak and re-enables the button immediately.
  // (2nd-pass review M2-2 — Story 96.12-FE)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setExportId(null)
    setPollingStartedAt(null)
    setRateLimitSeconds(0)
    errorShownRef.current = null
    if (toastIdRef.current != null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [cabinetId])

  // ---------------------------------------------------------------------------
  // 429 countdown via setInterval (cleanup on unmount — CLAUDE.md anti-pattern #7)
  // M-1 fix: dependency is a derived 0/1 integer (not rateLimitSeconds directly) so the
  // effect re-runs only on transitions to/from countdown active — NOT on every decrement.
  // This prevents a new setInterval being created on each tick.
  // ---------------------------------------------------------------------------
  const countdownActive = rateLimitSeconds > 0 ? 1 : 0
  useEffect(() => {
    if (rateLimitSeconds <= 0) return

    intervalRef.current = setInterval(() => {
      setRateLimitSeconds(s => {
        if (s <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return 0
        }
        return s - 1
      })
    }, 1_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // countdownActive (0 or 1) is the intentional dep — re-run on start/stop transitions only.
  }, [countdownActive])

  // ---------------------------------------------------------------------------
  // React to polling status changes
  // H-1+H-2 fix: use statusData.url (signed S3 URL from polling response).
  //   Old code used getFbsExportDownloadUrl(exportId) which returned a relative API
  //   path (/v1/...) — resolves against frontend origin (localhost:3100), not backend
  //   (localhost:3000), and an anchor element cannot inject auth headers.
  //   The signed S3 URL is absolute and pre-authorized; no auth headers needed.
  // Defensive Frontend: "ready but url null" surfaces an honest error (not silent fail).
  // H2-1 fix: errorShownRef.current reset to null on all terminal branches so that
  //   a retry cycle after error shows a fresh error toast (not suppressed by stale ref).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!statusData) return

    if (statusData.status === 'ready') {
      // Dismiss the "preparing" toast and show success.
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current)
      }

      if (!statusData.url) {
        // Defensive Frontend Principle: backend says ready but url is null — surface honestly.
        // Backend resolved in Epic 106 (request #169); guard kept for defense-in-depth — status=ready with null url should not occur.
        toast.error('Файл готов, но ссылка для скачивания отсутствует. Сообщите в поддержку.', {
          duration: 8_000,
        })
        setExportId(null)
        setPollingStartedAt(null)
        toastIdRef.current = null
        errorShownRef.current = null // H2-1: clear so next cycle can show errors
        return
      }

      toast.success('Экспорт готов — скачивание...', { duration: 3_000 })

      // Trigger browser download via hidden anchor with signed S3 URL (absolute, pre-authorized).
      // rel="noopener noreferrer": "noreferrer" prevents signed S3 URL query-string credentials
      // (X-Amz-Signature, X-Amz-Credential) from leaking via the Referer header to third-party
      // sites the user may navigate to after download. (2nd-pass review M2-1 — Story 96.12-FE)
      const filename = `fbs-stock-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
      const link = document.createElement('a')
      link.href = statusData.url
      link.download = filename
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Reset state so next click re-triggers a fresh export.
      setExportId(null)
      setPollingStartedAt(null)
      toastIdRef.current = null
      errorShownRef.current = null // H2-1: clear so next cycle can show errors
    } else if (statusData.status === 'failed' || statusData.status === 'expired') {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current)
      }
      toast.error('Не удалось подготовить экспорт. Попробуйте ещё раз.', { duration: 5_000 })
      setExportId(null)
      setPollingStartedAt(null)
      toastIdRef.current = null
      errorShownRef.current = null // H2-1: clear so next cycle can show errors
    }
  }, [statusData?.status, statusData?.url])

  // Show poll-error toast (network error during status polling).
  // M-4 fix: use ref-based "already shown for this exportId" tracking instead of
  // exportId-null guard — the null guard swallows errors when a retry starts a new
  // export (new exportId) while the previous pollError is still truthy.
  useEffect(() => {
    if (!pollError || !exportId) return
    if (errorShownRef.current === exportId) return // already toasted for this export
    errorShownRef.current = exportId
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
    }
    toast.error('Ошибка опроса статуса экспорта. Повторите попытку.', { duration: 5_000 })
    setExportId(null)
    setPollingStartedAt(null)
    toastIdRef.current = null
  }, [pollError, exportId])

  // ---------------------------------------------------------------------------
  // Click handler
  // M-3 fix: early-return guard prevents concurrent triggers on rapid double-clicks
  // before the disabled state re-renders. Toast dismissal before new trigger prevents
  // orphaned "preparing" toasts from a previous flow.
  // H2-1 fix: reset errorShownRef so a re-click after error shows fresh toasts.
  // ---------------------------------------------------------------------------
  async function handleClick() {
    // Guard: prevent concurrent triggers (M-3 fix). isPolling already disables button
    // visually, but rapid double-clicks before re-render can race. This is the safety net.
    if (exportId != null || rateLimitSeconds > 0) return

    // Dismiss any prior in-flight toast before starting a new export.
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }

    // H2-1: reset error ref so this new export cycle can show errors if they occur.
    errorShownRef.current = null

    try {
      const response = await triggerFbsExport()
      setExportId(response.exportId)
      setPollingStartedAt(Date.now())
      // Show persistent "preparing" toast (dismissed when ready/failed/expired).
      toastIdRef.current = toast.loading('Подготовка экспорта...', { duration: Infinity })
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        // Defensive Frontend Principle: preserve raw error, surface countdown.
        const seconds = e.retryAfter ?? DEFAULT_RATE_LIMIT_SECONDS
        setRateLimitSeconds(seconds)
        toast.warning(`Экспорт недоступен. Повторите через ${seconds} сек.`, { duration: 4_000 })
      } else {
        const message = e instanceof Error ? e.message : 'Не удалось запустить экспорт.'
        toast.error(message, { duration: 5_000 })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const isPolling = exportId != null
  const isRateLimited = rateLimitSeconds > 0
  const disabled = isPolling || isRateLimited

  let label = 'Скачать CSV'
  if (isPolling) label = 'Подготовка...'
  else if (isRateLimited) label = `Доступно через ${rateLimitSeconds} сек`

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      data-testid="fbs-export-button"
    >
      <Download className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
