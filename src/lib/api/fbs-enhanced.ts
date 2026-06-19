/**
 * FBS Enhanced Analytics — API Client — Epic 96-FE Story 96.13-FE
 *
 * Wraps GET /v1/analytics/fbs/enhanced?from=&to= with a typed async function
 * and a TanStack Query key factory.
 *
 * Why skipDataUnwrap: true
 *   The default apiClient auto-unwraps `{ data: ... }` envelopes. The enhanced
 *   endpoint may return sections at the top level OR nested under `data`. We pass
 *   the raw envelope to the normalizer which handles both shapes.
 *   Pattern from src/lib/api/fbs-stock.ts.
 *
 * cabinetId in query key (Story 96.11 H2-1 lesson):
 *   Required as first segment to prevent cross-cabinet cache collisions.
 *   FBS analytics is per-cabinet data; stale cache would serve cabinet-A data
 *   to cabinet-B after a cabinet switch.
 *
 * @see src/lib/api/fbs-enhanced-normalizer.ts
 * @see src/types/fbs-enhanced.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import { apiClient } from '../api-client'
import { qs } from './query-string'
import type { FbsEnhancedResponse, FbsEnhancedParams } from '@/types/fbs-enhanced'
import { normalizeFbsEnhancedResponse } from './fbs-enhanced-normalizer'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

/**
 * cabinetId is required as first segment to prevent cross-cabinet cache collisions
 * (CLAUDE.md 2nd-pass review H2-1 — multi-tenant data leak fix from Story 96.11).
 * FBS enhanced is a per-cabinet analytics snapshot; staleTime=30min would otherwise
 * serve cabinet-A data to cabinet-B after a cabinet switch.
 */
export const fbsEnhancedQueryKeys = {
  all: (cabinetId: string | null) => ['fbs-enhanced', cabinetId] as const,
  view: (cabinetId: string | null, params: FbsEnhancedParams) =>
    ['fbs-enhanced', cabinetId, 'view', params] as const,
}

// ---------------------------------------------------------------------------
// API function
// ---------------------------------------------------------------------------

const DEFAULT_FBS_ENHANCED_TIMEOUT_MS = 8_000
const FBS_ENHANCED_TIMEOUT_ERROR = 'FBS enhanced request timed out'

async function withTimeout<T>(
  startRequest: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  parentSignal: AbortSignal | undefined
): Promise<T> {
  const controller = new AbortController()
  const abortFromParent = () => controller.abort(parentSignal?.reason)

  if (parentSignal?.aborted) {
    abortFromParent()
  } else {
    parentSignal?.addEventListener('abort', abortFromParent, { once: true })
  }

  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      const error = new Error(FBS_ENHANCED_TIMEOUT_ERROR)
      controller.abort(error)
      reject(error)
    }, timeoutMs)
  })

  const request = startRequest(controller.signal)
  // The timeout aborts the underlying fetch; attach a catch eagerly so a fetch
  // rejection that races with the timeout rejection is still observed by JS runtimes.
  void request.catch(() => undefined)

  try {
    return await Promise.race([request, timeout])
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId)
    parentSignal?.removeEventListener('abort', abortFromParent)
  }
}

/**
 * GET /v1/analytics/fbs/enhanced?from=&to=
 * Returns aggregated FBS analytics: orderStats, stockAnalytics, regionalData,
 * calculatedMetrics, funnelData for the given date range.
 */
export async function getFbsEnhanced(
  params: FbsEnhancedParams,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<FbsEnhancedResponse> {
  // Fail-fast: backend returns 400 for missing from/to.
  if (!params.from || !params.to) {
    throw new Error('getFbsEnhanced: from and to are required')
  }
  const raw = await withTimeout(
    signal =>
      apiClient.get<unknown>(
        `/v1/analytics/fbs/enhanced${qs({ from: params.from, to: params.to })}`,
        {
          skipDataUnwrap: true,
          signal,
          suppressNetworkErrorLog: true,
        }
      ),
    options?.timeoutMs ?? DEFAULT_FBS_ENHANCED_TIMEOUT_MS,
    options?.signal
  )
  return normalizeFbsEnhancedResponse(raw)
}
