/**
 * Acquiring Cost Reports — Boundary Normalizer — Epic 90-FE Story 90.1-FE
 *
 * Normalizes raw backend responses from the 3 acquiring endpoints into the
 * frontend-canonical shape defined in src/types/acquiring-analytics.ts.
 *
 * Responsibilities:
 *   - snake_case → camelCase via dual-lookup on every field (per Story 89.1 pattern).
 *   - Null-vs-zero: money fields preserved as null; ID/count fields coerced to 0.
 *   - NaN guard on all numeric conversions via Number.isFinite.
 *   - String coercion to '' on missing values (backend guarantees strings per Request #166
 *     doc-2, but defensive fallback prevents runtime crashes).
 *
 * Helpers are private (not exported) — inline re-implementation acceptable per
 * Story 90.1 Dev Notes ("3-helper set this small, skip cross-file extraction").
 *
 * @see src/types/acquiring-analytics.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern (Story 88.4)
 * @see CLAUDE.md anti-pattern #8 (null-vs-zero)
 * @see docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md
 */

import type {
  AcquiringReportListItem,
  AcquiringReportDetailItem,
  AcquiringListResponse,
  AcquiringDetailResponse,
} from '@/types/acquiring-analytics'

// ---------------------------------------------------------------------------
// Private scalar helpers
// ---------------------------------------------------------------------------

/** Converts to number | null. Rejects null, undefined, and NaN via Number.isFinite. */
function toNumberOrNull(raw: unknown): number | null {
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Converts to number (count / ID). Returns 0 on missing or non-finite input. */
function toCount(raw: unknown): number {
  const n = Number(raw ?? 0)
  return Number.isFinite(n) ? n : 0
}

// Returns '' for null/undefined (strings are always present per backend contract).
// Named `toStringOrEmpty` (not `toStringOrEmpty`) to avoid naming collision with
// Story 92.1's monitor-summary-normalizer helper which DOES return string | null.
function toStringOrEmpty(raw: unknown): string {
  return raw == null ? '' : String(raw)
}

// ---------------------------------------------------------------------------
// Private item normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes one AcquiringReportListItem row.
 * Dual-lookup on every field absorbs camelCase/snake_case backend drift.
 * Note: reportId = 0 indicates a missing/malformed backend response.
 * useAcquiringReportDetail rejects 0 as a non-valid ID (see hook's enabled guard).
 */
function normalizeReportListItem(raw: unknown): AcquiringReportListItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    reportId: toCount(d.reportId ?? d.report_id),
    sellerFinanceName: toStringOrEmpty(d.sellerFinanceName ?? d.seller_finance_name),
    dateFrom: toStringOrEmpty(d.dateFrom ?? d.date_from),
    dateTo: toStringOrEmpty(d.dateTo ?? d.date_to),
    createDate: toStringOrEmpty(d.createDate ?? d.create_date),
    currency: toStringOrEmpty(d.currency),
    acquiringFeeSum: toNumberOrNull(d.acquiringFeeSum ?? d.acquiring_fee_sum),
    acquiringFeeVatSum: toNumberOrNull(d.acquiringFeeVatSum ?? d.acquiring_fee_vat_sum),
  }
}

/**
 * Normalizes one AcquiringReportDetailItem row.
 * Dual-lookup on every field absorbs camelCase/snake_case backend drift.
 */
function normalizeReportDetailItem(raw: unknown): AcquiringReportDetailItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    rrdId: toCount(d.rrdId ?? d.rrd_id),
    reportId: toCount(d.reportId ?? d.report_id),
    acqDate: toStringOrEmpty(d.acqDate ?? d.acq_date),
    acquiringBank: toStringOrEmpty(d.acquiringBank ?? d.acquiring_bank),
    saleDate: toStringOrEmpty(d.saleDate ?? d.sale_date),
    srid: toStringOrEmpty(d.srid),
    docTypeName: toStringOrEmpty(d.docTypeName ?? d.doc_type_name),
    nmId: toCount(d.nmId ?? d.nm_id),
    retailAmount: toNumberOrNull(d.retailAmount ?? d.retail_amount),
    acquiringFee: toNumberOrNull(d.acquiringFee ?? d.acquiring_fee),
    acquiringFeeVat: toNumberOrNull(d.acquiringFeeVat ?? d.acquiring_fee_vat),
    currency: toStringOrEmpty(d.currency),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizers
// ---------------------------------------------------------------------------

/**
 * Normalizes the full list-endpoint envelope.
 * Input: raw `{ data: [...], cached_at: "..." }` from apiClient (skipDataUnwrap: true).
 */
export function normalizeAcquiringListResponse(raw: unknown): AcquiringListResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const items = Array.isArray(r.data) ? r.data : []
  return {
    data: items.map(normalizeReportListItem),
    cachedAt: toStringOrEmpty(r.cachedAt ?? r.cached_at),
  }
}

/**
 * Normalizes the full detail-endpoint envelope (used by both report-detail and period-detail).
 * Input: raw `{ data: [...], cached_at: "..." }` from apiClient (skipDataUnwrap: true).
 */
export function normalizeAcquiringDetailResponse(raw: unknown): AcquiringDetailResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const items = Array.isArray(r.data) ? r.data : []
  return {
    data: items.map(normalizeReportDetailItem),
    cachedAt: toStringOrEmpty(r.cachedAt ?? r.cached_at),
  }
}
