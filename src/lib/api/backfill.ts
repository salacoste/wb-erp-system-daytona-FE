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
  BackfillRetrySource,
  RetryBackfillResponse,
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

/**
 * Story 165.5: Per-status backfill retry endpoint path per pipeline.
 * TWO separate endpoints — never a combined/cabinet-wide call (AC2).
 * `reports` targets the FBS orders 90-day pipeline; `analytics` the 365-day pipeline.
 */
const RETRY_PATH: Record<BackfillRetrySource, string> = {
  reports: `${BASE_URL}/report/retry`,
  analytics: `${BASE_URL}/analytics/retry`,
}

/**
 * Story 165.5: Boundary Normalizer for the retry response.
 * Backend returns `{ success: true, message: "... (attempt N)" }` at the top level
 * (no `data` wrapper, so apiClient's auto-unwrap returns it verbatim). Coerce with
 * runtime guards — never trust a bare truthy read on backend data. `success` defaults
 * to false when absent/invalid so a malformed body cannot masquerade as success.
 */
export function normalizeRetryBackfillResponse(raw: unknown): RetryBackfillResponse {
  // Narrow `raw` to an object before key access. The `as Record<string, unknown>`
  // below is post-guard narrowing (TS can't express "object record of unknown"),
  // NOT a backend-shape cast — safe per the Boundary Normalizer convention.
  if (typeof raw !== 'object' || raw === null) {
    return { success: false, message: '' }
  }
  const obj = raw as Record<string, unknown>
  return {
    success: obj.success === true,
    message: typeof obj.message === 'string' ? obj.message : '',
  }
}

/**
 * Story 165.5: Retry ONLY the failed source's backfill pipeline.
 * POST /v1/admin/backfill/{report|analytics}/retry with body `{ cabinetId }`.
 * 403 (role/cabinet), 404 `BACKFILL_NOT_FAILED`, 409 `BACKFILL_IN_PROGRESS` propagate as ApiError.
 *
 * @param cabinetId - Cabinet to retry (opaque UUID; String()-coerced by callers)
 * @param dataSource - Which pipeline to retry (`'reports'` | `'analytics'`)
 * @returns Normalized `{ success, message }`
 */
export async function retryBackfill(
  cabinetId: string,
  dataSource: BackfillRetrySource
): Promise<RetryBackfillResponse> {
  const raw = await apiClient.post<unknown>(RETRY_PATH[dataSource], {
    cabinetId: String(cabinetId),
  })
  return normalizeRetryBackfillResponse(raw)
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
