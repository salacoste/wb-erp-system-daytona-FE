/**
 * FBS Enhanced Analytics — TypeScript types — Epic 96-FE Story 96.13-FE
 *
 * Corresponds to backend endpoint (Epic 105 / request-backend/169 § 1.2):
 *   GET /v1/analytics/fbs/enhanced?from=&to=  → FbsEnhancedResponse
 *
 * Backend may deliver snake_case; the Boundary Normalizer (fbs-enhanced-normalizer.ts)
 * bridges to camelCase at the API boundary. NEVER use raw backend shapes in
 * components or hooks. See CLAUDE.md § Boundary Normalizer Pattern.
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 *   Ratio/money fields (buyoutRate, returnRate, averageOrderValue, avgDaysOfCover,
 *   turnoverRate, stockCoverageDays, ordersPerProduct, orderShare, stockShare)
 *   are `number | null`. null = "unknown / not yet computed".
 *   Count fields (totalOrders, deliveredOrders, returnedOrders, totalSkus,
 *   totalUnits, lowStockSkus, outOfStockSkus, productViews, cartAdds,
 *   orders, deliveries) are `number` (0 is a legitimate value).
 *   String fields (regionName) are `string` (empty string fallback in normalizer).
 *
 * @see src/lib/api/fbs-enhanced-normalizer.ts
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

// ---------------------------------------------------------------------------
// Section 1: Order Stats
// ---------------------------------------------------------------------------

/** Order statistics for the selected period */
export interface FbsOrderStats {
  totalOrders: number
  deliveredOrders: number
  returnedOrders: number
  /**
   * Percent points (0-100), NOT 0-1 ratio. Per request-backend/169 § 1.2 contract;
   * verified empirically in normalizer test (Story 96.13 H-1 fix).
   * null = unknown (no deliveries in period).
   */
  buyoutRate: number | null
  /**
   * Percent points (0-100), NOT 0-1 ratio. Per request-backend/169 § 1.2 contract;
   * verified empirically in normalizer test (Story 96.13 H-1 fix).
   * null = unknown (no orders in period).
   */
  returnRate: number | null
  averageOrderValue: number | null // money (RUB) — null = unknown
}

// ---------------------------------------------------------------------------
// Section 2: Stock Analytics
// ---------------------------------------------------------------------------

/** Stock health analytics snapshot */
export interface FbsStockAnalytics {
  totalSkus: number
  totalUnits: number
  lowStockSkus: number
  outOfStockSkus: number
  avgDaysOfCover: number | null // count of days — null = unknown (zero outgoing)
}

// ---------------------------------------------------------------------------
// Section 3: Regional Data
// ---------------------------------------------------------------------------

/** One region row — order share and stock share per region */
export interface FbsRegionalDataItem {
  regionName: string
  /**
   * Percent points (0-100), NOT 0-1 ratio. Per request-backend/169 § 1.2 contract;
   * verified empirically in normalizer test (Story 96.13 H-1 fix).
   * null = unknown.
   */
  orderShare: number | null
  /**
   * Percent points (0-100), NOT 0-1 ratio. Per request-backend/169 § 1.2 contract;
   * verified empirically in normalizer test (Story 96.13 H-1 fix).
   * null = unknown.
   */
  stockShare: number | null
}

// ---------------------------------------------------------------------------
// Section 4: Calculated Metrics
// ---------------------------------------------------------------------------

/** Derived business metrics computed by the backend */
export interface FbsCalculatedMetrics {
  /**
   * Percent points (0-100), NOT 0-1 ratio. Per request-backend/169 § 1.2 contract;
   * verified empirically in normalizer test (Story 96.13 H-1 fix).
   * null = unknown (zero stock).
   */
  turnoverRate: number | null
  stockCoverageDays: number | null // count of days — null = unknown (zero outgoing)
  /**
   * Ratio (orders per product unit, NOT a percentage). Per request-backend/169 § 1.2 contract.
   * null = unknown (zero products).
   */
  ordersPerProduct: number | null
}

// ---------------------------------------------------------------------------
// Section 5: Funnel Data
// ---------------------------------------------------------------------------

/** 4-stage conversion funnel: views → cart → orders → deliveries */
export interface FbsFunnelData {
  productViews: number
  cartAdds: number
  orders: number
  deliveries: number
}

// ---------------------------------------------------------------------------
// Period + envelope
// ---------------------------------------------------------------------------

export interface FbsEnhancedPeriod {
  from: string // ISO date
  to: string // ISO date
}

/** Normalized response for GET /v1/analytics/fbs/enhanced */
export interface FbsEnhancedResponse {
  orderStats: FbsOrderStats
  stockAnalytics: FbsStockAnalytics
  regionalData: FbsRegionalDataItem[]
  calculatedMetrics: FbsCalculatedMetrics
  funnelData: FbsFunnelData
  period: FbsEnhancedPeriod
  generatedAt: string // ISO datetime — empty string if backend omits
}

// ---------------------------------------------------------------------------
// Param shape (passed to API client function and query keys)
// ---------------------------------------------------------------------------

export interface FbsEnhancedParams {
  from: string // ISO date
  to: string // ISO date
}
