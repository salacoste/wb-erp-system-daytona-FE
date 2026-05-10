'use client'

/**
 * FBS Export Polling Hook — Epic 96-FE Story 96.12-FE
 *
 * Polls GET /v1/analytics/fbs/stock/export/:exportId until the job reaches a
 * terminal state (ready | failed | expired) or the 10-minute safety timeout fires.
 *
 * Pattern: adapts the `useMarginPollingWithQuery` shape (TanStack Query +
 * adaptive refetchInterval) but parameterizes on the FBS export status enum
 * rather than COGS calc-completion. Semantics differ:
 *   - COGS polling: "calc-completion" (pending → completed)
 *   - FBS export: "job-state-machine" (queued → running → ready | failed | expired)
 * We mirror the shape, not the implementation.
 *
 * Polling intervals (exponential backoff, capped at POLLING_MAX_MS):
 *   2s → 3s → 4.5s → 6.75s → 10s (cap) → ...
 *
 * Safety timeout: 10 minutes. After that, refetchInterval returns false regardless
 * of status — prevents orphaned polling if backend never responds.
 *
 * @see src/hooks/useMarginPollingWithQuery.ts (shape reference)
 * @see src/lib/api/fbs-export.ts
 * @see src/types/fbs-export.ts
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { getFbsExportStatus, fbsExportQueryKeys } from '@/lib/api/fbs-export'
import type { FbsExportStatusResponse, FbsExportStatus } from '@/types/fbs-export'

// ---------------------------------------------------------------------------
// Polling strategy constants
// ---------------------------------------------------------------------------

/** Initial polling interval in ms (2 seconds). */
const POLLING_START_MS = 2_000

/** Maximum polling interval in ms (10 seconds). */
const POLLING_MAX_MS = 10_000

/** Exponential backoff factor applied each step. */
const POLLING_BACKOFF_FACTOR = 1.5

/** Safety timeout: stop polling after 10 minutes regardless of status. */
const POLLING_MAX_DURATION_MS = 10 * 60 * 1_000

/** Terminal states — polling stops when any of these is observed. */
const TERMINAL_STATUSES = new Set<FbsExportStatus>(['ready', 'failed', 'expired'])

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Computes the next refetch interval given elapsed time since polling started.
 * Starts at POLLING_START_MS, multiplies by POLLING_BACKOFF_FACTOR each step,
 * capped at POLLING_MAX_MS.
 *
 * Implementation: reconstructs the step sequence by simulating elapsed intervals,
 * returning the interval that would be used for the NEXT fetch.
 *
 * L-1 fix: early-exit at safety-timeout boundary avoids O(elapsed/start) wasted
 * iterations (at 10 min the loop would otherwise iterate ~57 extra steps at the
 * cap, all producing the same 10s result). Break when cap is reached for same reason.
 */
function computeNextInterval(elapsedMs: number): number {
  // Early-exit: beyond safety-timeout all intervals are at cap anyway.
  if (elapsedMs >= POLLING_MAX_DURATION_MS) return POLLING_MAX_MS

  let interval = POLLING_START_MS
  let cumulative = 0
  while (cumulative < elapsedMs) {
    cumulative += interval
    interval = Math.min(Math.round(interval * POLLING_BACKOFF_FACTOR), POLLING_MAX_MS)
    // Once cap is reached, all subsequent steps are identical — no point iterating further.
    if (interval >= POLLING_MAX_MS) break
  }
  return interval
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Polls export status for the given exportId.
 *
 * @param exportId  - The job ID from triggerFbsExport(). Pass null to disable.
 * @param startedAt - epoch ms when polling started (Date.now() at trigger time).
 *                    Used for safety-timeout check and backoff calculation.
 *                    Pass null to disable.
 */
export function useFbsExportPolling(exportId: string | null, startedAt: number | null) {
  const cabinetId = useAuthStore(authState => authState.cabinetId)

  return useQuery<FbsExportStatusResponse>({
    queryKey: fbsExportQueryKeys.status(cabinetId, { exportId: exportId ?? '' }),
    queryFn: async () => {
      // Unreachable in normal flow (enabled guard below), but defensive per CLAUDE.md anti-pattern #2.
      if (!exportId) throw new Error('useFbsExportPolling: exportId is required')
      return getFbsExportStatus({ exportId })
    },
    enabled: exportId != null && exportId.length > 0 && cabinetId != null && startedAt != null,
    refetchInterval: query => {
      const data = query.state.data

      // Safety timeout: stop polling after POLLING_MAX_DURATION_MS.
      if (startedAt != null && Date.now() - startedAt > POLLING_MAX_DURATION_MS) {
        return false
      }

      // No data yet — use start interval.
      if (!data) return POLLING_START_MS

      // Terminal state — stop polling.
      if (TERMINAL_STATUSES.has(data.status)) return false

      // Compute adaptive backoff based on elapsed time.
      const elapsed = startedAt != null ? Date.now() - startedAt : 0
      return computeNextInterval(elapsed)
    },
    staleTime: 0, // Always re-fetch (export status changes frequently).
    retry: 1, // One retry on transient network error.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
