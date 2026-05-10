/**
 * Shared empty-fixture factories for FBS Export tests.
 * Story 96.12-FE — Pattern 3 hygiene (CLAUDE.md § Multi-Source Orchestration).
 *
 * Separate from `fbs-stock-empty.ts` (Story 96.11-FE) because export endpoints
 * have orthogonal semantics: status-machine (queued/running/ready/failed/expired)
 * vs stock row data (groups/sizes/regions). Cleaner separation avoids one module
 * growing to mix two unrelated domain shapes.
 *
 * Convention:
 *   - status: 'queued' is the most-default initial state (keeps polling alive).
 *   - url + expiresAt: null per CLAUDE.md anti-pattern #8 (null = "not yet ready").
 *   - exportId: 'test-export-id' (stable across test cases for snapshot stability).
 *
 * @see src/types/fbs-export.ts
 * @see src/lib/api/fbs-export-normalizer.ts
 * @see src/test/fixtures/fbs-stock-empty.ts (adjacent FBS Pattern 3 module — Story 96.11-FE)
 * @see src/test/fixtures/monitor-empty.ts (Pattern 3 canonical — Story 92.6-FE)
 */

import type { FbsExportTriggerResponse, FbsExportStatusResponse } from '@/types/fbs-export'

// ---------------------------------------------------------------------------
// Trigger response factories
// ---------------------------------------------------------------------------

/**
 * Trigger response indicating a newly-queued export job.
 * Returned by POST /v1/analytics/fbs/stock/export (202 Accepted).
 */
export function pendingFbsExportTriggerResponse(): FbsExportTriggerResponse {
  return { exportId: 'test-export-id', status: 'queued' }
}

// ---------------------------------------------------------------------------
// Status response factories (one per terminal/non-terminal state)
// ---------------------------------------------------------------------------

/**
 * Status response: job queued (initial state after trigger).
 * url + expiresAt are null — signed URL not yet available.
 */
export function pendingFbsExportStatus(): FbsExportStatusResponse {
  return { exportId: 'test-export-id', status: 'queued', url: null, expiresAt: null }
}

/**
 * Status response: job running (backend processing CSV).
 * url + expiresAt are null — still in progress.
 */
export function runningFbsExportStatus(): FbsExportStatusResponse {
  return { exportId: 'test-export-id', status: 'running', url: null, expiresAt: null }
}

/**
 * Status response: job ready (CSV available for download).
 * url + expiresAt are non-null — signed S3 URL populated.
 */
export function readyFbsExportStatus(): FbsExportStatusResponse {
  return {
    exportId: 'test-export-id',
    status: 'ready',
    url: 'https://example.com/signed-url/fbs-export.csv',
    expiresAt: '2026-05-08T20:00:00Z',
  }
}

/**
 * Status response: job failed (backend error during CSV generation).
 * url + expiresAt are null — no download available.
 */
export function failedFbsExportStatus(): FbsExportStatusResponse {
  return { exportId: 'test-export-id', status: 'failed', url: null, expiresAt: null }
}

/**
 * Status response: job expired (signed URL TTL elapsed).
 * url + expiresAt are null — URL no longer valid.
 */
export function expiredFbsExportStatus(): FbsExportStatusResponse {
  return { exportId: 'test-export-id', status: 'expired', url: null, expiresAt: null }
}
