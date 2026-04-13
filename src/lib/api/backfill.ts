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
  BackfillCabinetStatus,
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
  const raw = await apiClient.get<Record<string, unknown>[]>(`${BASE_URL}/status`, {
    skipDataUnwrap: true,
  })

  // Backend returns camelCase (cabinetId, reportsStatus, analyticsStatus, overallProgress)
  // but frontend type uses snake_case (cabinet_id, status, progress). Normalize here.
  return (raw ?? []).map(item => ({
    cabinet_id: (item.cabinetId ?? item.cabinet_id ?? '') as string,
    cabinet_name: (item.cabinetName ?? item.cabinet_name ?? '') as string,
    status: (item.reportsStatus ??
      item.status ??
      'not_started') as string as BackfillCabinetStatus['status'],
    data_source: (item.dataSource ??
      item.data_source ??
      'none') as string as BackfillCabinetStatus['data_source'],
    oldest_available_date: (item.oldestAvailableDate ?? item.oldest_available_date ?? null) as
      | string
      | null,
    newest_available_date: (item.newestAvailableDate ?? item.newest_available_date ?? null) as
      | string
      | null,
    progress:
      (item.progress as BackfillCabinetStatus['progress']) ??
      (item.overallProgress != null
        ? {
            percentage: Number(item.overallProgress),
            estimated_remaining_seconds: null,
            total_days: 0,
            completed_days: 0,
            current_date: null,
          }
        : null),
    last_error: (item.lastError ?? item.last_error ?? null) as string | null,
    started_at: (item.startedAt ?? item.started_at ?? null) as string | null,
    completed_at: (item.completedAt ?? item.completed_at ?? null) as string | null,
    updated_at: (item.updatedAt ?? item.updated_at ?? new Date().toISOString()) as string,
  }))
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
