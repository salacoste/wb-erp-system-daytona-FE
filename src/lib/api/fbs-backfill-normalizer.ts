/**
 * Boundary normalizer for FBS Backfill Status
 * GET /v1/admin/backfill/status
 *
 * Returns BackfillCabinetStatus[] with per-cabinet progress info.
 */

import { asRecord, toStr, toCount, toStringOrNull } from '@/lib/api/normalizer-helpers'
import type { BackfillCabinetStatus, BackfillStatus } from '@/types/fbs-analytics'

function normalizeBackfillCabinetStatus(raw: unknown): BackfillCabinetStatus {
  const d = asRecord(raw)
  return {
    cabinetId: toStr(d.cabinetId ?? d.cabinet_id),
    cabinetName: toStr(d.cabinetName ?? d.cabinet_name),
    reportsStatus: toStr(d.reportsStatus ?? d.reports_status) as BackfillStatus,
    analyticsStatus: toStr(d.analyticsStatus ?? d.analytics_status) as BackfillStatus,
    overallProgress: toCount(d.overallProgress ?? d.overall_progress),
    estimatedEta: toStringOrNull(d.estimatedEta ?? d.estimated_eta),
    errors: Array.isArray(d.errors) ? d.errors.map((e: unknown) => String(e)) : [],
  }
}

/** Normalize backfill status response (array of per-cabinet status) */
export function normalizeBackfillStatusResponse(raw: unknown): BackfillCabinetStatus[] {
  return Array.isArray(raw) ? raw.map(normalizeBackfillCabinetStatus) : []
}
