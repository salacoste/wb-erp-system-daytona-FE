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

import { toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

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
    sellerFinanceName: toStr(d.sellerFinanceName ?? d.seller_finance_name),
    dateFrom: toStr(d.dateFrom ?? d.date_from),
    dateTo: toStr(d.dateTo ?? d.date_to),
    createDate: toStr(d.createDate ?? d.create_date),
    currency: toStr(d.currency),
    acquiringFeeSum: toNullableNumber(d.acquiringFeeSum ?? d.acquiring_fee_sum),
    acquiringFeeVatSum: toNullableNumber(d.acquiringFeeVatSum ?? d.acquiring_fee_vat_sum),
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
    acqDate: toStr(d.acqDate ?? d.acq_date),
    acquiringBank: toStr(d.acquiringBank ?? d.acquiring_bank),
    saleDate: toStr(d.saleDate ?? d.sale_date),
    srid: toStr(d.srid),
    docTypeName: toStr(d.docTypeName ?? d.doc_type_name),
    nmId: toCount(d.nmId ?? d.nm_id),
    retailAmount: toNullableNumber(d.retailAmount ?? d.retail_amount),
    acquiringFee: toNullableNumber(d.acquiringFee ?? d.acquiring_fee),
    acquiringFeeVat: toNullableNumber(d.acquiringFeeVat ?? d.acquiring_fee_vat),
    currency: toStr(d.currency),
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
    cachedAt: toStr(r.cachedAt ?? r.cached_at),
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
    cachedAt: toStr(r.cachedAt ?? r.cached_at),
  }
}
