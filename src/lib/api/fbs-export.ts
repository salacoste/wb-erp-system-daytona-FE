/**
 * FBS CSV Export — API Client — Epic 96-FE Story 96.12-FE
 *
 * Wraps the 3 FBS export endpoints with typed async functions and a
 * TanStack Query key factory.
 *
 * Query key factory includes cabinetId as first segment (Story 96.11 H2-1 lesson):
 *   prevents cross-cabinet cache collisions after cabinet switches.
 *
 * Endpoints (per request-backend/169 § 1.2 — Epic 105 backend):
 *   POST /v1/analytics/fbs/stock/export
 *     → 202 Accepted { exportId, status: 'queued' }
 *     → 429 Too Many Requests { retryAfter: 60 }
 *   GET /v1/analytics/fbs/stock/export/:exportId
 *     → 200 OK { exportId, status, url?, expiresAt? }
 *   GET /v1/analytics/fbs/stock/export/:exportId/download
 *     → 302 redirect to signed S3 URL
 *
 * @see src/lib/api/fbs-export-normalizer.ts
 * @see src/types/fbs-export.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import { apiClient } from '../api-client'
import type {
  FbsExportTriggerResponse,
  FbsExportStatusResponse,
  FbsExportStatusParams,
} from '@/types/fbs-export'
import {
  normalizeFbsExportTriggerResponse,
  normalizeFbsExportStatusResponse,
} from './fbs-export-normalizer'

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

/**
 * cabinetId is required as first segment to prevent cross-cabinet cache collisions
 * (CLAUDE.md 2nd-pass review H2-1 — multi-tenant data leak fix from Story 96.11).
 * Export jobs are per-cabinet; staleTime > 0 would otherwise serve cabinet-A job
 * status to cabinet-B after a cabinet switch.
 */
export const fbsExportQueryKeys = {
  all: (cabinetId: string | null) => ['fbs-export', cabinetId] as const,
  status: (cabinetId: string | null, params: FbsExportStatusParams) =>
    ['fbs-export', cabinetId, 'status', params] as const,
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * POST /v1/analytics/fbs/stock/export
 * Triggers async CSV export. Returns 202 with exportId to poll.
 * Throws ApiError(429) with retryAfter when rate-limited (1/min/cabinet).
 */
export async function triggerFbsExport(): Promise<FbsExportTriggerResponse> {
  // POST with no body — backend uses cabinet from X-Cabinet-Id header (auto-injected).
  const raw = await apiClient.post<unknown>('/v1/analytics/fbs/stock/export')
  return normalizeFbsExportTriggerResponse(raw)
}

/**
 * GET /v1/analytics/fbs/stock/export/:exportId
 * Polls export status. Returns { status, url?, expiresAt? }.
 * url is populated only when status === 'ready'.
 */
export async function getFbsExportStatus(
  params: FbsExportStatusParams
): Promise<FbsExportStatusResponse> {
  if (!params.exportId) {
    throw new Error('getFbsExportStatus: exportId is required')
  }
  // skipDataUnwrap: status endpoint returns the object directly, not wrapped in { data: ... }.
  const raw = await apiClient.get<unknown>(`/v1/analytics/fbs/stock/export/${params.exportId}`, {
    skipDataUnwrap: true,
  })
  return normalizeFbsExportStatusResponse(raw)
}

// getFbsExportDownloadUrl removed (2nd-pass review L2-2 — Story 96.12-FE).
// Zero callers in src/ or e2e/. The function constructed a RELATIVE path resolving
// against the frontend origin (not backend) and could not inject auth headers.
// FbsExportButton uses statusData.url (signed S3 URL from polling response) instead.
