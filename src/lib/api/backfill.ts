/**
 * Backfill Admin API Client
 * Story 51.10-FE: Backfill Admin Types & Hooks
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * API functions for backfill management (Owner role only).
 * @see docs/stories/epic-51/story-51.10-fe-backfill-admin-types.md
 */

import { apiClient } from '@/lib/api-client'
import type {
  BackfillStatusResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
} from '@/types/backfill'

const BASE_URL = '/v1/admin/backfill'

// ============================================================================
// Query Functions
// ============================================================================

/**
 * GET /v1/admin/backfill/status
 * Fetch backfill status for all cabinets (Owner only)
 *
 * @returns Array of cabinet backfill statuses
 */
export async function getBackfillStatus(): Promise<BackfillStatusResponse> {
  console.info('[Backfill] Fetching status for all cabinets')

  const response = await apiClient.get<BackfillStatusResponse>(`${BASE_URL}/status`, {
    skipDataUnwrap: true,
  })

  console.info('[Backfill] Status fetched:', { cabinetCount: response?.length ?? 0 })

  return response
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * POST /v1/admin/backfill/start
 * Start backfill for a specific cabinet (Owner only)
 *
 * @param request - Cabinet ID and optional date range
 * @returns Start response with estimated duration
 */
export async function startBackfill(request: StartBackfillRequest): Promise<StartBackfillResponse> {
  console.info('[Backfill] Starting backfill:', {
    cabinetId: request.cabinet_id,
    fromDate: request.from_date ?? 'default',
    toDate: request.to_date ?? 'today',
  })

  const response = await apiClient.post<StartBackfillResponse>(`${BASE_URL}/start`, request)

  console.info('[Backfill] Started:', {
    cabinetId: response.cabinet_id,
    status: response.status,
    estimatedMinutes: response.estimated_duration_minutes,
  })

  return response
}

/**
 * POST /v1/admin/backfill/pause
 * Pause running backfill for a cabinet (Owner only)
 *
 * @param cabinetId - Cabinet ID to pause
 * @returns Action response with new status
 */
export async function pauseBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  console.info('[Backfill] Pausing:', { cabinetId })

  const response = await apiClient.post<BackfillActionResponse>(`${BASE_URL}/pause`, {
    cabinet_id: cabinetId,
  })

  console.info('[Backfill] Paused:', { cabinetId, status: response.status })

  return response
}

/**
 * POST /v1/admin/backfill/resume
 * Resume paused backfill for a cabinet (Owner only)
 *
 * @param cabinetId - Cabinet ID to resume
 * @returns Action response with new status
 */
export async function resumeBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  console.info('[Backfill] Resuming:', { cabinetId })

  const response = await apiClient.post<BackfillActionResponse>(`${BASE_URL}/resume`, {
    cabinet_id: cabinetId,
  })

  console.info('[Backfill] Resumed:', { cabinetId, status: response.status })

  return response
}

// ============================================================================
// Query Keys Factory (AC4)
// ============================================================================

/** Query keys for backfill cache management */
export const backfillQueryKeys = {
  all: ['backfill'] as const,
  status: () => [...backfillQueryKeys.all, 'status'] as const,
  cabinet: (id: string) => [...backfillQueryKeys.all, 'cabinet', id] as const,
}
