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
  BackfillStatus,
  BackfillStatusResponse,
  BackfillCabinetStatus,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
  DataSource,
} from '@/types/backfill'

const BASE_URL = '/v1/admin/backfill'

const VALID_STATUSES = new Set<BackfillStatus>([
  'idle',
  'not_started',
  'pending',
  'in_progress',
  'completed',
  'failed',
  'paused',
])

function toBackfillStatus(raw: unknown): BackfillStatus {
  const s = String(raw ?? '')
  return VALID_STATUSES.has(s as BackfillStatus) ? (s as BackfillStatus) : 'not_started'
}

const VALID_SOURCES = new Set<DataSource>(['api', 'report', 'none'])

function toDataSource(raw: unknown): DataSource {
  const s = String(raw ?? '')
  return VALID_SOURCES.has(s as DataSource) ? (s as DataSource) : 'none'
}

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
    status: toBackfillStatus(item.reportsStatus ?? item.status),
    // F-29: surface the separately-tracked analytics backfill status (was dropped).
    analytics_status: toBackfillStatus(item.analyticsStatus ?? item.analytics_status),
    data_source: toDataSource(item.dataSource ?? item.data_source),
    oldest_available_date: (item.oldestAvailableDate ?? item.oldest_available_date ?? null) as
      string | null,
    newest_available_date: (item.newestAvailableDate ?? item.newest_available_date ?? null) as
      string | null,
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
    updated_at: (item.updatedAt ?? item.updated_at ?? '') as string,
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
  return apiClient.post<StartBackfillResponse>(`${BASE_URL}/start`, request)
}

/**
 * POST /v1/admin/backfill/pause
 * Pause running backfill for a cabinet (Owner only)
 *
 * @param cabinetId - Cabinet ID to pause
 * @returns Action response with new status
 */
export async function pauseBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  return apiClient.post<BackfillActionResponse>(`${BASE_URL}/pause`, {
    cabinet_id: cabinetId,
  })
}

/**
 * POST /v1/admin/backfill/resume
 * Resume paused backfill for a cabinet (Owner only)
 *
 * @param cabinetId - Cabinet ID to resume
 * @returns Action response with new status
 */
export async function resumeBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  return apiClient.post<BackfillActionResponse>(`${BASE_URL}/resume`, {
    cabinet_id: cabinetId,
  })
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
