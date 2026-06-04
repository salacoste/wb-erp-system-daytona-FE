/**
 * FBS CSV Export — Boundary Normalizer — Epic 96-FE Story 96.12-FE
 *
 * Normalizes raw backend responses from the FBS export endpoints into the
 * frontend-canonical shapes defined in src/types/fbs-export.ts.
 *
 * Responsibilities:
 *   - Dual-lookup snake_case/camelCase (e.g., exportId ?? export_id) per Story 88.4.
 *   - Status enum validation with safe fallback to 'queued'.
 *   - Null preservation for url + expiresAt (anti-pattern #8 — null ≠ '').
 *
 * @see src/types/fbs-export.ts
 * @see src/lib/api/fbs-export.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 * @see CLAUDE.md anti-pattern #8 (null-vs-zero)
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import type {
  FbsExportTriggerResponse,
  FbsExportStatusResponse,
  FbsExportStatus,
} from '@/types/fbs-export'
import { toStringOrNull, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Private scalar helpers
// ---------------------------------------------------------------------------

const VALID_EXPORT_STATUSES = new Set<FbsExportStatus>([
  'queued',
  'running',
  'ready',
  'failed',
  'expired',
])

/**
 * Coerces raw value to a valid FbsExportStatus.
 * Unknown values fall back to 'queued' (safest initial state — keeps polling alive).
 */
function toExportStatus(raw: unknown): FbsExportStatus {
  const s = typeof raw === 'string' ? raw : ''
  return VALID_EXPORT_STATUSES.has(s as FbsExportStatus) ? (s as FbsExportStatus) : 'queued'
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes POST /v1/analytics/fbs/stock/export → 202 response.
 * Dual-lookup: exportId ?? export_id.
 */
export function normalizeFbsExportTriggerResponse(raw: unknown): FbsExportTriggerResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    exportId: toStr(r.exportId ?? r.export_id),
    status: toExportStatus(r.status),
  }
}

/**
 * Normalizes GET /v1/analytics/fbs/stock/export/:exportId → 200 response.
 * Dual-lookup on exportId + expiresAt.
 * url + expiresAt are null when status !== 'ready' (anti-pattern #8).
 */
export function normalizeFbsExportStatusResponse(raw: unknown): FbsExportStatusResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    exportId: toStr(r.exportId ?? r.export_id),
    status: toExportStatus(r.status),
    url: toStringOrNull(r.url),
    expiresAt: toStringOrNull(r.expiresAt ?? r.expires_at),
  }
}
