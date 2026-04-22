/**
 * Acquiring Cost Reports — TypeScript types — Epic 90-FE Story 90.1-FE
 *
 * Corresponds to backend endpoints:
 *   GET /v1/analytics/acquiring/reports           → AcquiringListResponse
 *   GET /v1/analytics/acquiring/reports/:id/detail → AcquiringDetailResponse
 *   GET /v1/analytics/acquiring/detail             → AcquiringDetailResponse
 *
 * Backend delivers snake_case; the Boundary Normalizer (acquiring-normalizer.ts)
 * bridges to camelCase at the API boundary. NEVER use raw backend shapes in
 * components or hooks. See CLAUDE.md § Boundary Normalizer Pattern.
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 *   Money fields (acquiringFeeSum, acquiringFeeVatSum, retailAmount,
 *   acquiringFee, acquiringFeeVat) are `number | null`.
 *   null = "unknown / not yet calculated" — rendering `0 ₽` would mislead.
 *   IDs and counts are `number` (0 is a legitimate, if unusual, value).
 *   All date strings and names are `string` (backend guarantees presence per
 *   Request #166 doc-2 — empty string fallback in normalizer for safety).
 *
 * @see docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md
 */

// ---------------------------------------------------------------------------
// Response item shapes (one row from the backend data array)
// ---------------------------------------------------------------------------

/** One acquiring report (list-level summary). */
export interface AcquiringReportListItem {
  reportId: number
  sellerFinanceName: string
  dateFrom: string // ISO date — report period start
  dateTo: string // ISO date — report period end
  createDate: string // ISO date — report generation date
  currency: string // e.g. "RUB"
  acquiringFeeSum: number | null // money — null = unknown
  acquiringFeeVatSum: number | null // money — null = unknown
}

/** One acquiring transaction (detail-level row). */
export interface AcquiringReportDetailItem {
  rrdId: number
  reportId: number
  acqDate: string // ISO date — when fee was charged
  acquiringBank: string
  saleDate: string // ISO date — original sale date
  srid: string // WB internal sale ID
  docTypeName: string // e.g. "Продажа", "Возврат"
  nmId: number // product SKU
  retailAmount: number | null // money — null = unknown
  acquiringFee: number | null // money — null = unknown
  acquiringFeeVat: number | null // money — null = unknown
  currency: string
}

// ---------------------------------------------------------------------------
// Envelope response shapes (full normalized API response)
// ---------------------------------------------------------------------------

/** Normalized response for the list endpoint. */
export interface AcquiringListResponse {
  data: AcquiringReportListItem[]
  cachedAt: string // ISO datetime — empty string if backend omits
}

/** Normalized response for both detail endpoints (by-ID and by-period). */
export interface AcquiringDetailResponse {
  data: AcquiringReportDetailItem[]
  cachedAt: string // ISO datetime — empty string if backend omits
}

// ---------------------------------------------------------------------------
// Param shapes (passed to API client functions and query keys)
// ---------------------------------------------------------------------------

export interface AcquiringReportsParams {
  from: string
  to: string
}

export interface AcquiringReportDetailParams {
  reportId: number
}

export interface AcquiringPeriodDetailParams {
  from: string
  to: string
}
