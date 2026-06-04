/**
 * FBS Enhanced Analytics — Boundary Normalizer — Epic 96-FE Story 96.13-FE
 *
 * Normalizes raw backend response from GET /v1/analytics/fbs/enhanced into the
 * frontend-canonical shape defined in src/types/fbs-enhanced.ts.
 *
 * Responsibilities:
 *   - snake_case → camelCase via dual-lookup on every field (per Story 88.4 pattern).
 *   - Null-vs-zero: money/ratio fields preserved as null; count fields coerced to 0.
 *   - NaN guard on all numeric conversions via Number.isFinite.
 *   - String coercion to '' on missing values (prevents runtime crashes).
 *
 * Helpers are private (not exported) — inline re-implementation acceptable per
 * fbs-stock-normalizer.ts precedent.
 *
 * @see src/types/fbs-enhanced.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 * @see CLAUDE.md anti-pattern #8 (null-vs-zero)
 * @see docs/request-backend/169-BACKEND-UPDATE-EPICS-101-106.md § 1.2
 */

import type {
  FbsOrderStats,
  FbsStockAnalytics,
  FbsRegionalDataItem,
  FbsCalculatedMetrics,
  FbsFunnelData,
  FbsEnhancedPeriod,
  FbsEnhancedResponse,
} from '@/types/fbs-enhanced'

import { toCount, toNullableNumber, toStr } from '@/lib/api/normalizer-helpers'

// ---------------------------------------------------------------------------
// Private section normalizers
// ---------------------------------------------------------------------------

function normalizeOrderStats(raw: unknown): FbsOrderStats {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    totalOrders: toCount(d.totalOrders ?? d.total_orders),
    deliveredOrders: toCount(d.deliveredOrders ?? d.delivered_orders),
    returnedOrders: toCount(d.returnedOrders ?? d.returned_orders),
    buyoutRate: toNullableNumber(d.buyoutRate ?? d.buyout_rate),
    returnRate: toNullableNumber(d.returnRate ?? d.return_rate),
    averageOrderValue: toNullableNumber(d.averageOrderValue ?? d.average_order_value),
  }
}

function normalizeStockAnalytics(raw: unknown): FbsStockAnalytics {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    totalSkus: toCount(d.totalSkus ?? d.total_skus),
    totalUnits: toCount(d.totalUnits ?? d.total_units),
    lowStockSkus: toCount(d.lowStockSkus ?? d.low_stock_skus),
    outOfStockSkus: toCount(d.outOfStockSkus ?? d.out_of_stock_skus),
    avgDaysOfCover: toNullableNumber(d.avgDaysOfCover ?? d.avg_days_of_cover),
  }
}

function normalizeRegionalDataItem(raw: unknown): FbsRegionalDataItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    regionName: toStr(d.regionName ?? d.region_name),
    orderShare: toNullableNumber(d.orderShare ?? d.order_share),
    stockShare: toNullableNumber(d.stockShare ?? d.stock_share),
  }
}

function normalizeCalculatedMetrics(raw: unknown): FbsCalculatedMetrics {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    turnoverRate: toNullableNumber(d.turnoverRate ?? d.turnover_rate),
    stockCoverageDays: toNullableNumber(d.stockCoverageDays ?? d.stock_coverage_days),
    ordersPerProduct: toNullableNumber(d.ordersPerProduct ?? d.orders_per_product),
  }
}

function normalizeFunnelData(raw: unknown): FbsFunnelData {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    productViews: toCount(d.productViews ?? d.product_views),
    cartAdds: toCount(d.cartAdds ?? d.cart_adds),
    orders: toCount(d.orders),
    deliveries: toCount(d.deliveries),
  }
}

function normalizePeriod(raw: unknown): FbsEnhancedPeriod {
  const p = (raw ?? {}) as Record<string, unknown>
  return {
    from: toStr(p.from),
    to: toStr(p.to),
  }
}

// ---------------------------------------------------------------------------
// Exported normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes the full enhanced-endpoint envelope.
 * Input: raw response from apiClient (skipDataUnwrap: true) or direct API response.
 *
 * The backend contract (request-backend/169 § 1.2) places all 5 sections at the
 * top level of the response (not nested under a `data` key). We handle both shapes:
 * direct top-level AND wrapped under `data` key (dual-lookup for resilience).
 */
export function normalizeFbsEnhancedResponse(raw: unknown): FbsEnhancedResponse {
  // Handle both { orderStats, ... } and { data: { orderStats, ... } } shapes
  const r = (raw ?? {}) as Record<string, unknown>
  // If wrapped under data key, unwrap; otherwise use top-level
  const d = (r.data != null ? (r.data as Record<string, unknown>) : r) as Record<string, unknown>

  const regionalRaw = Array.isArray(d.regionalData ?? d.regional_data)
    ? (d.regionalData ?? d.regional_data)
    : []

  return {
    orderStats: normalizeOrderStats(d.orderStats ?? d.order_stats),
    stockAnalytics: normalizeStockAnalytics(d.stockAnalytics ?? d.stock_analytics),
    regionalData: (regionalRaw as unknown[]).map(normalizeRegionalDataItem),
    calculatedMetrics: normalizeCalculatedMetrics(d.calculatedMetrics ?? d.calculated_metrics),
    funnelData: normalizeFunnelData(d.funnelData ?? d.funnel_data),
    period: normalizePeriod(d.period ?? r.period),
    generatedAt: toStr(d.generatedAt ?? d.generated_at ?? r.generatedAt ?? r.generated_at),
  }
}
