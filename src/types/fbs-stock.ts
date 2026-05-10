/**
 * FBS Stock Breakdowns — TypeScript types — Epic 96-FE Story 96.11-FE
 *
 * Corresponds to backend endpoints (Epic 105 / request-backend/169 § 1.2):
 *   GET /v1/analytics/fbs/stock/groups?from=&to=     → FbsStockGroupsResponse
 *   GET /v1/analytics/fbs/stock/sizes?from=&to=&nm_id= → FbsStockSizesResponse
 *   GET /v1/analytics/fbs/stock/regions               → FbsStockRegionsResponse
 *
 * Backend may deliver snake_case; the Boundary Normalizer (fbs-stock-normalizer.ts)
 * bridges to camelCase at the API boundary. NEVER use raw backend shapes in
 * components or hooks. See CLAUDE.md § Boundary Normalizer Pattern.
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 *   Money fields (stockValue) and ratio fields (daysOfCover, shareOfTotalPct)
 *   are `number | null`. null = "unknown / not yet calculated".
 *   Count fields (skuCount, stockUnits, warehouseCount) are `number`
 *   (0 is a legitimate value — zero stock is meaningful).
 *   All string fields (groupName, size, regionName) are `string`
 *   (empty string fallback in normalizer for safety).
 *
 * @see src/lib/api/fbs-stock-normalizer.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

// ---------------------------------------------------------------------------
// Per-row item shapes
// ---------------------------------------------------------------------------

/** One product group row from GET /v1/analytics/fbs/stock/groups */
export interface FbsStockGroupItem {
  groupName: string
  skuCount: number
  stockUnits: number
  stockValue: number | null // money — null = unknown
  averageDailyOutgoing: number
  daysOfCover: number | null // ratio — null = unknown (e.g. zero outgoing)
}

/** One size row from GET /v1/analytics/fbs/stock/sizes */
export interface FbsStockSizeItem {
  size: string
  nmId: number
  skuCount: number
  stockUnits: number
  averageDailyOutgoing: number
  daysOfCover: number | null // ratio — null = unknown
}

/** One region row from GET /v1/analytics/fbs/stock/regions */
export interface FbsStockRegionItem {
  regionName: string
  warehouseCount: number
  stockUnits: number
  stockValue: number | null // money — null = unknown
  shareOfTotalPct: number | null // ratio — null = unknown (denominator unknown / not yet computed); per CLAUDE.md anti-pattern #8
}

// ---------------------------------------------------------------------------
// Period shape (shared by groups + sizes responses)
// ---------------------------------------------------------------------------

export interface FbsStockPeriod {
  from: string // ISO date
  to: string // ISO date
}

// ---------------------------------------------------------------------------
// Envelope response shapes (full normalized API response)
// ---------------------------------------------------------------------------

/** Normalized response for GET /v1/analytics/fbs/stock/groups */
export interface FbsStockGroupsResponse {
  data: { groups: FbsStockGroupItem[] }
  period: FbsStockPeriod
  generatedAt: string // ISO datetime — empty string if backend omits
}

/** Normalized response for GET /v1/analytics/fbs/stock/sizes */
export interface FbsStockSizesResponse {
  data: { sizes: FbsStockSizeItem[] }
  period: FbsStockPeriod
  generatedAt: string // ISO datetime — empty string if backend omits
}

/** Normalized response for GET /v1/analytics/fbs/stock/regions (no period — latest snapshot) */
export interface FbsStockRegionsResponse {
  data: { regions: FbsStockRegionItem[] }
  generatedAt: string // ISO datetime — displayed as freshness indicator in UI
}

// ---------------------------------------------------------------------------
// Param shapes (passed to API client functions and query keys)
// ---------------------------------------------------------------------------

export interface FbsStockGroupsParams {
  from: string // ISO date
  to: string // ISO date
}

export interface FbsStockSizesParams {
  from: string // ISO date
  to: string // ISO date
  nmId?: number // optional WB article filter
}
