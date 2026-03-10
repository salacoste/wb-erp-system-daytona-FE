/**
 * FBS Backfill Admin API Client
 * Extracted from fbs-analytics.ts for file size compliance (Epic 74)
 *
 * Admin-only backfill operations for historical FBS data.
 */

import { apiClient } from '@/lib/api-client'
import type {
  BackfillStatusResponse,
  StartBackfillRequest,
  StartBackfillResponse,
  BackfillActionResponse,
} from '@/types/fbs-analytics'

// ============================================================================
// Backfill Admin API Functions (Owner Only)
// ============================================================================

/**
 * Получение статуса бэкфилла для всех или конкретного кабинета
 * GET /v1/admin/backfill/status
 */
export async function getBackfillStatus(cabinetId?: string): Promise<BackfillStatusResponse> {
  const queryParams = cabinetId ? `?cabinetId=${cabinetId}` : ''

  console.info('[FBS Analytics] Fetching backfill status:', { cabinetId: cabinetId ?? 'all' })

  const response = await apiClient.get<BackfillStatusResponse>(
    `/v1/admin/backfill/status${queryParams}`,
    { skipDataUnwrap: true }
  )

  console.info('[FBS Analytics] Backfill status:', { cabinetCount: response?.length ?? 0 })

  return response
}

/**
 * Запуск бэкфилла исторических данных
 * POST /v1/admin/backfill/start
 */
export async function startBackfill(request: StartBackfillRequest): Promise<StartBackfillResponse> {
  console.info('[FBS Analytics] Starting backfill:', {
    cabinetId: request.cabinetId ?? 'all',
    dataSource: request.dataSource,
  })

  const response = await apiClient.post<StartBackfillResponse>('/v1/admin/backfill/start', request)

  console.info('[FBS Analytics] Backfill started:', {
    jobCount: response.jobCount,
    success: response.success,
  })

  return response
}

/**
 * Приостановка бэкфилла для кабинета
 * POST /v1/admin/backfill/pause
 */
export async function pauseBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  console.info('[FBS Analytics] Pausing backfill:', { cabinetId })
  return apiClient.post<BackfillActionResponse>('/v1/admin/backfill/pause', { cabinetId })
}

/**
 * Возобновление приостановленного бэкфилла
 * POST /v1/admin/backfill/resume
 */
export async function resumeBackfill(cabinetId: string): Promise<BackfillActionResponse> {
  console.info('[FBS Analytics] Resuming backfill:', { cabinetId })
  return apiClient.post<BackfillActionResponse>('/v1/admin/backfill/resume', { cabinetId })
}

// ============================================================================
// Query Keys Factory (for React Query)
// ============================================================================

/** Фабрика ключей кэша для бэкфилла */
export const backfillQueryKeys = {
  all: ['backfill'] as const,
  status: (cabinetId?: string) => [...backfillQueryKeys.all, 'status', cabinetId ?? 'all'] as const,
}
