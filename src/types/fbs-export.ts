/**
 * FBS CSV Export — TypeScript Types — Epic 96-FE Story 96.12-FE
 *
 * Types for the async CSV export flow:
 *   POST /v1/analytics/fbs/stock/export  → FbsExportTriggerResponse (202)
 *   GET  /v1/analytics/fbs/stock/export/:id → FbsExportStatusResponse (200)
 *   GET  /v1/analytics/fbs/stock/export/:id/download → 302 redirect to signed S3 URL
 *
 * Per CLAUDE.md anti-pattern #8: url + expiresAt are nullable (null = "not yet ready",
 * not "no URL exists"). Coercing null → '' would hide the "not ready" semantic.
 *
 * @see src/lib/api/fbs-export.ts
 * @see src/lib/api/fbs-export-normalizer.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

/** Job-status-machine states for the async CSV export. */
export type FbsExportStatus = 'queued' | 'running' | 'ready' | 'failed' | 'expired'

/**
 * Response from POST /v1/analytics/fbs/stock/export (202 Accepted).
 * Contains the exportId to poll with.
 */
export interface FbsExportTriggerResponse {
  exportId: string
  status: FbsExportStatus
}

/**
 * Response from GET /v1/analytics/fbs/stock/export/:exportId (200 OK).
 * url is populated only when status === 'ready' (anti-pattern #8 — null ≠ '').
 * expiresAt is populated only when status === 'ready'.
 */
export interface FbsExportStatusResponse {
  exportId: string
  status: FbsExportStatus
  /** Signed download URL — non-null only when status === 'ready'. */
  url: string | null
  /** ISO datetime when the signed URL expires — non-null only when status === 'ready'. */
  expiresAt: string | null
}

/**
 * Parsed 429 rate-limit info from backend body.
 * Backend sends { retryAfter: 60 } (seconds) in the response body.
 */
export interface FbsExportRateLimitInfo {
  /** Seconds to wait before retry (parsed from 429 response body). */
  retryAfterSeconds: number
  message: string | null
}

/** Params for getFbsExportStatus. */
export interface FbsExportStatusParams {
  exportId: string
}
