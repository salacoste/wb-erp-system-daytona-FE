/**
 * FBS Enhanced Analytics — TypeScript types — Epic 129-FE Story 129.1
 *
 * Reconciled against the REAL backend response shape per Request #202.
 * The previous version (Epic 96-FE) was built against fictional contract
 * placeholders from request-backend/169 §1.2. Only calculatedMetrics matched.
 *
 * Verified against backend source: src/analytics/controllers/fbs-analytics.controller.ts:699-731
 * Endpoint: GET /v1/analytics/fbs/enhanced?from=&to=
 *
 * Null-vs-zero discipline (CLAUDE.md anti-pattern #8):
 *   Ratio/money fields → `number | null`. null = "unknown / not yet computed".
 *   Count fields → `number` (0 is a legitimate value).
 *
 * @see src/lib/api/fbs-enhanced-normalizer.ts
 * @see docs/request-backend/202-FBS-ENHANCED-CONTRACT-MISMATCH.md
 */

// ---------------------------------------------------------------------------
// Section 1: Order Stats
// ---------------------------------------------------------------------------

/** Order statistics for the selected period */
export interface FbsOrderStats {
  /** Total number of FBS orders */
  ordersCount: number
  /** Total revenue from FBS orders (RUB). null = unknown. */
  ordersSumRub: number | null
  /** Number of cancelled orders */
  cancelCount: number
  /** Cancel rate as percent points (0-100). null = unknown. */
  cancelRate: number | null
  /** Number of buyouts (successful deliveries) */
  buyoutCount: number
  /** Buyout rate as percent points (0-100). null = unknown. */
  buyoutRate: number | null
  /** Average order value (RUB). null = unknown. */
  avgOrderValue: number | null
  /** Add-to-cart conversion rate as percent points (0-100). null = unknown. */
  addToCartPercent: number | null
  /** Orders conversion rate as percent points (0-100). null = unknown. */
  ordersPercent: number | null
}

// ---------------------------------------------------------------------------
// Section 2: Stock Analytics
// ---------------------------------------------------------------------------

/** Stock health analytics snapshot */
export interface FbsStockAnalytics {
  /** Total stock units across all warehouses */
  totalStock: number
  /** Available (not reserved) stock units */
  availableStock: number
  /** Reserved stock units */
  reservedStock: number
  /** Units currently in transit */
  inTransit: number
  /** Number of distinct products (SKUs) */
  productCount: number
}

// ---------------------------------------------------------------------------
// Section 3: Regional Data
// ---------------------------------------------------------------------------

/** One region row — quantity and percentage per region */
export interface FbsRegionalDataItem {
  /** Region name (e.g. "Москва", "Санкт-Петербург") */
  region: string
  /** Quantity of orders/stock in this region */
  quantity: number
  /** Percentage share as percent points (0-100). null = unknown. */
  percentage: number | null
}

// ---------------------------------------------------------------------------
// Section 4: Calculated Metrics (UNCHANGED — matches backend)
// ---------------------------------------------------------------------------

/** Derived business metrics computed by the backend */
export interface FbsCalculatedMetrics {
  /** Turnover rate as percent points (0-100). null = unknown (zero stock). */
  turnoverRate: number | null
  /** Count of days of stock coverage. null = unknown (zero outgoing). */
  stockCoverageDays: number | null
  /** Ratio (orders per product unit). null = unknown (zero products). */
  ordersPerProduct: number | null
}

// ---------------------------------------------------------------------------
// Section 5: Funnel Data
// ---------------------------------------------------------------------------

/**
 * Funnel conversion metrics.
 * The backend sends addToCartPercent and ordersPercent in orderStats;
 * this interface captures them for a dedicated funnel visualization.
 * Both fields may be null if not computed.
 */
export interface FbsFunnelData {
  /** Add-to-cart conversion rate (percent points 0-100). null = unknown. */
  addToCartPercent: number | null
  /** Orders conversion rate (percent points 0-100). null = unknown. */
  ordersPercent: number | null
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
