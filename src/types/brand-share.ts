/**
 * Brand-Share Competitive Analytics types — PR4b.
 * Verified against backend contract docs/request-backend/225-brand-share-backend-contract.md:
 * 3-method read-only chain under GET /v1/analytics/brand-share*.
 *
 * NULLABILITY (AP#8): brandRating / pricePercent / qtyPercent are `number | null`.
 * WB returns `0`/`null` for low-volume days — preserve null, render «—», never `?? 0`.
 */

/** Optional YYYY-MM-DD date window. Omit both → backend defaults to trailing 7 days. */
export interface BrandShareDateRange {
  /** Inclusive, `YYYY-MM-DD`. */
  dateFrom?: string
  /** Inclusive, `YYYY-MM-DD`. */
  dateTo?: string
}

/**
 * A WB "parent subject" (category grouping) the brand competes in.
 * `parentId` is a numeric WB category id (NOT an opaque id — AP#10 does not apply).
 */
export interface BrandParentSubject {
  parentId: number
  parentName: string
}

/**
 * One daily data point of the brand-share time series.
 * All three metric fields are nullable: WB emits `0`/`null` on low-volume days.
 */
export interface BrandShareReportPoint {
  /** WB apply date (MSK ISO `YYYY-MM-DD...`). One row per day in the window. */
  applyDate: string
  /** Brand rating/position for the day (WB score). Lower = better (noted in UI). */
  brandRating: number | null
  /** Brand's share of the category by PRICE (%). Already in 0–100 units. */
  pricePercent: number | null
  /** Brand's share of the category by QUANTITY sold (%). Already in 0–100 units. */
  qtyPercent: number | null
}

/** Response envelope from GET /v1/analytics/brand-share. */
export interface BrandShareReport {
  report: BrandShareReportPoint[]
}
