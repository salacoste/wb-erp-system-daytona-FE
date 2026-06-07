/**
 * FBS Enhanced Analytics — Boundary Normalizer — Epic 129-FE Story 129.1
 *
 * Normalizes raw backend response from GET /v1/analytics/fbs/enhanced into the
 * frontend-canonical shape defined in src/types/fbs-enhanced.ts.
 *
 * Reconciled against the REAL backend response shape per Request #202.
 * Previous version used fictional field names that produced zeros/dashes
 * for 4 of 5 sections against live data.
 *
 * Responsibilities:
 *   - snake_case → camelCase via dual-lookup on every field.
 *   - Null-vs-zero: money/ratio fields preserved as null; count fields coerced to 0.
 *   - NaN guard on all numeric conversions via Number.isFinite.
 *   - String coercion to '' on missing values (prevents runtime crashes).
 *
 * @see src/types/fbs-enhanced.ts
 * @see CLAUDE.md § Boundary Normalizer Pattern
 * @see CLAUDE.md anti-pattern #8 (null-vs-zero)
 * @see docs/request-backend/202-FBS-ENHANCED-CONTRACT-MISMATCH.md
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
    ordersCount: toCount(d.ordersCount ?? d.orders_count),
    ordersSumRub: toNullableNumber(d.ordersSumRub ?? d.orders_sum_rub),
    cancelCount: toCount(d.cancelCount ?? d.cancel_count),
    cancelRate: toNullableNumber(d.cancelRate ?? d.cancel_rate),
    buyoutCount: toCount(d.buyoutCount ?? d.buyout_count),
    buyoutRate: toNullableNumber(d.buyoutRate ?? d.buyout_rate),
    avgOrderValue: toNullableNumber(d.avgOrderValue ?? d.avg_order_value),
    addToCartPercent: toNullableNumber(d.addToCartPercent ?? d.add_to_cart_percent),
    ordersPercent: toNullableNumber(d.ordersPercent ?? d.orders_percent),
  }
}

function normalizeStockAnalytics(raw: unknown): FbsStockAnalytics {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    totalStock: toCount(d.totalStock ?? d.total_stock),
    availableStock: toCount(d.availableStock ?? d.available_stock),
    reservedStock: toCount(d.reservedStock ?? d.reserved_stock),
    inTransit: toCount(d.inTransit ?? d.in_transit),
    productCount: toCount(d.productCount ?? d.product_count),
  }
}

function normalizeRegionalDataItem(raw: unknown): FbsRegionalDataItem {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    region: toStr(d.region ?? d.region_name),
    quantity: toCount(d.quantity),
    percentage: toNullableNumber(d.percentage),
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

/**
 * Normalizes funnel data.
 * The backend sends addToCartPercent and ordersPercent in the orderStats object.
 * This normalizer also accepts a separate funnelData object if the backend provides one.
 * Falls back to deriving funnel data from orderStats if no separate funnelData exists.
 */
function normalizeFunnelData(raw: unknown): FbsFunnelData {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    addToCartPercent: toNullableNumber(d.addToCartPercent ?? d.add_to_cart_percent),
    ordersPercent: toNullableNumber(d.ordersPercent ?? d.orders_percent),
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
 * Handles both direct top-level and { data: { ... } } wrapped shapes.
 * Derives funnelData from orderStats if not present as a separate section.
 */
export function normalizeFbsEnhancedResponse(raw: unknown): FbsEnhancedResponse {
  // Handle both { orderStats, ... } and { data: { orderStats, ... } } shapes
  const r = (raw ?? {}) as Record<string, unknown>
  // If wrapped under data key, unwrap; otherwise use top-level
  const d = (r.data != null ? (r.data as Record<string, unknown>) : r) as Record<string, unknown>

  const regionalRaw = Array.isArray(d.regionalData ?? d.regional_data)
    ? (d.regionalData ?? d.regional_data)
    : []

  // Order stats normalization — funnel fields are extracted from here
  const orderStats = normalizeOrderStats(d.orderStats ?? d.order_stats)

  // Funnel data: use separate funnelData if present, otherwise derive from orderStats
  const funnelRaw = d.funnelData ?? d.funnel_data
  const funnelData =
    funnelRaw != null
      ? normalizeFunnelData(funnelRaw)
      : {
          addToCartPercent: orderStats.addToCartPercent,
          ordersPercent: orderStats.ordersPercent,
        }

  return {
    orderStats,
    stockAnalytics: normalizeStockAnalytics(d.stockAnalytics ?? d.stock_analytics),
    regionalData: (regionalRaw as unknown[]).map(normalizeRegionalDataItem),
    calculatedMetrics: normalizeCalculatedMetrics(d.calculatedMetrics ?? d.calculated_metrics),
    funnelData,
    period: normalizePeriod(d.period ?? r.period),
    generatedAt: toStr(d.generatedAt ?? d.generated_at ?? r.generatedAt ?? r.generated_at),
  }
}
