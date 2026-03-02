/**
 * Liquidity Analysis API Client
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Endpoints:
 *   - GET /v1/analytics/liquidity
 *   - GET /v1/analytics/liquidity/trends
 *
 * Uses skipDataUnwrap: true because backend returns {meta, summary, data: [...items]}
 * and apiClient auto-unwrap would strip meta/summary, leaving only the items array.
 * A mapper transforms backend field names to frontend types.
 */

import { apiClient } from '../api-client'
import type {
  LiquidityQueryParams,
  LiquidityResponse,
  LiquidityItem,
  LiquiditySummary,
  LiquidityMeta,
  LiquidityDistribution,
  LiquidityDistributionItem,
  LiquidityBenchmarks,
  LiquidityCategory,
  LiquidationScenario,
  ActionType,
  LiquidityTrendsQueryParams,
  LiquidityTrendsResponse,
} from '@/types/liquidity'

// ============================================================================
// Backend → Frontend Field Mapping
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Derive recommendation text from liquidity status */
function deriveRecommendation(status: string): string {
  switch (status) {
    case 'highly_liquid':
      return 'Высоколиквидный товар. Масштабируйте — инвестируйте больше.'
    case 'medium':
      return 'Средняя ликвидность. Поддерживайте текущий уровень запасов.'
    case 'low':
      return 'Низкая ликвидность. Рассмотрите сокращение закупок.'
    case 'illiquid':
      return 'Неликвид. Рекомендуется ликвидация со скидкой.'
    default:
      return 'Нет рекомендации'
  }
}

/** Derive action type from liquidity status */
function deriveActionType(status: string): ActionType {
  switch (status) {
    case 'highly_liquid':
      return 'MAXIMIZE'
    case 'medium':
      return 'MAINTAIN'
    case 'low':
      return 'REDUCE'
    case 'illiquid':
      return 'LIQUIDATE'
    default:
      return 'MAINTAIN'
  }
}

/** Transform backend liquidation scenarios to frontend array format */
function mapLiquidationScenarios(scenarios: any): LiquidationScenario[] | null {
  if (!scenarios) return null

  // Backend returns {full_price, discount_20pct, discount_50pct} objects
  // Frontend expects LiquidationScenario[] array
  if (Array.isArray(scenarios)) return scenarios

  const result: LiquidationScenario[] = []
  const entries: [string, any][] = Object.entries(scenarios)

  for (const [key, scenario] of entries) {
    if (!scenario || typeof scenario !== 'object') continue

    const s = scenario as Record<string, any>
    const discountPct =
      key === 'full_price' ? 0 : key === 'discount_20pct' ? 20 : key === 'discount_50pct' ? 50 : 0

    result.push({
      target_days: s.target_days ?? s.target_turnover_days ?? 30,
      required_velocity: s.required_velocity ?? s.required_daily_sales ?? 0,
      velocity_multiplier: s.velocity_multiplier ?? 1,
      suggested_discount_pct: s.suggested_discount_pct ?? discountPct,
      new_price: s.new_price ?? s.price_after_discount ?? 0,
      expected_revenue: s.expected_revenue ?? 0,
      expected_profit: s.expected_profit ?? 0,
      is_profitable: s.is_profitable ?? false,
    })
  }

  return result.length > 0 ? result : null
}

/** Map a single backend item to LiquidityItem */
function mapItem(raw: Record<string, any>): LiquidityItem {
  const status = raw.liquidity_status ?? raw.liquidity_category ?? 'medium'
  const currentStock = raw.current_stock ?? raw.current_stock_qty ?? 0
  const avgDailySales = raw.avg_daily_sales ?? raw.velocity_per_day ?? 0
  const unitCost = raw.unit_cost ?? raw.cogs_per_unit ?? 0

  return {
    sku_id: String(raw.sku_id ?? raw.nm_id ?? ''),
    product_name: raw.product_name ?? raw.name ?? '',
    category: raw.category ?? '',
    brand: raw.brand ?? '',
    current_stock_qty: currentStock,
    avg_stock_qty_30d: raw.avg_stock_qty_30d ?? currentStock,
    stock_value: raw.frozen_capital ?? raw.stock_value ?? currentStock * unitCost,
    units_sold_30d: raw.units_sold_30d ?? Math.round(avgDailySales * 30),
    velocity_per_day: avgDailySales,
    turnover_days: raw.turnover_days ?? 0,
    liquidity_category: status as LiquidityCategory,
    current_price: raw.current_price ?? 0,
    cogs_per_unit: unitCost,
    recommendation: raw.recommendation ?? deriveRecommendation(status),
    action_type: raw.action_type ?? deriveActionType(status),
    liquidation_scenarios: mapLiquidationScenarios(raw.liquidation_scenarios),
  }
}

/** Map backend distribution (liquidity_breakdown) to frontend LiquidityDistribution */
function mapDistribution(
  breakdown: Record<string, any> | undefined,
  items: LiquidityItem[]
): LiquidityDistribution {
  const makeDefault = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const catItems = items.filter(i => i.liquidity_category === cat)
    const totalValue = items.reduce((sum, i) => sum + i.stock_value, 0)
    const catValue = catItems.reduce((sum, i) => sum + i.stock_value, 0)
    return {
      count: catItems.length,
      value: catValue,
      pct: totalValue > 0 ? (catValue / totalValue) * 100 : 0,
      avg_turnover_days:
        catItems.length > 0
          ? Math.round(catItems.reduce((s, i) => s + i.turnover_days, 0) / catItems.length)
          : 0,
    }
  }

  if (!breakdown) {
    return {
      highly_liquid: makeDefault('highly_liquid'),
      medium: makeDefault('medium'),
      low: makeDefault('low'),
      illiquid: makeDefault('illiquid'),
    }
  }

  const mapCat = (cat: LiquidityCategory): LiquidityDistributionItem => {
    const entry = breakdown[cat]
    if (entry && typeof entry === 'object') {
      return {
        count: entry.count ?? entry.sku_count ?? 0,
        value: entry.capital ?? entry.value ?? 0,
        pct: entry.pct ?? entry.percentage ?? 0,
        avg_turnover_days: entry.avg_turnover_days ?? entry.avg_turnover ?? 0,
      }
    }
    return makeDefault(cat)
  }

  return {
    highly_liquid: mapCat('highly_liquid'),
    medium: mapCat('medium'),
    low: mapCat('low'),
    illiquid: mapCat('illiquid'),
  }
}

/** Map backend summary to LiquiditySummary */
function mapSummary(
  raw: Record<string, any> | undefined,
  items: LiquidityItem[]
): LiquiditySummary {
  if (!raw) {
    // Compute from items if summary is missing entirely
    const totalValue = items.reduce((sum, i) => sum + i.stock_value, 0)
    const frozenCapital = items
      .filter(i => i.liquidity_category === 'illiquid')
      .reduce((sum, i) => sum + i.stock_value, 0)
    const distribution = mapDistribution(undefined, items)
    return {
      total_inventory_value: totalValue,
      total_sku_count: items.length,
      frozen_capital: frozenCapital,
      frozen_capital_pct: totalValue > 0 ? (frozenCapital / totalValue) * 100 : 0,
      avg_turnover_days:
        items.length > 0
          ? Math.round(items.reduce((s, i) => s + i.turnover_days, 0) / items.length)
          : 0,
      distribution,
      benchmarks: computeBenchmarks(distribution, items),
    }
  }

  const distribution = mapDistribution(raw.liquidity_breakdown ?? raw.distribution, items)
  const totalSkus = raw.total_skus ?? raw.total_sku_count ?? items.length
  const totalFrozen = raw.total_frozen_capital ?? raw.frozen_capital ?? 0
  const totalInventory =
    raw.total_inventory_value ?? items.reduce((sum, i) => sum + i.stock_value, 0)
  const avgTurnover =
    raw.avg_turnover_days ??
    (items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.turnover_days, 0) / items.length)
      : 0)

  return {
    total_inventory_value: totalInventory,
    total_sku_count: totalSkus,
    frozen_capital: totalFrozen,
    frozen_capital_pct:
      totalInventory > 0 ? (totalFrozen / totalInventory) * 100 : (raw.frozen_capital_pct ?? 0),
    avg_turnover_days: avgTurnover,
    distribution,
    benchmarks: raw.benchmarks ?? computeBenchmarks(distribution, items),
  }
}

/** Compute benchmarks from distribution data (hardcoded targets per spec) */
function computeBenchmarks(
  dist: LiquidityDistribution,
  items: LiquidityItem[]
): LiquidityBenchmarks {
  const avgTurnover =
    items.length > 0 ? Math.round(items.reduce((s, i) => s + i.turnover_days, 0) / items.length) : 0
  const highlyLiquidPct = dist.highly_liquid.pct
  const illiquidPct = dist.illiquid.pct

  let status: LiquidityBenchmarks['overall_status']
  if (highlyLiquidPct >= 50 && illiquidPct <= 5) status = 'excellent'
  else if (highlyLiquidPct >= 40 && illiquidPct <= 10) status = 'good'
  else if (illiquidPct <= 15) status = 'warning'
  else status = 'critical'

  return {
    your_avg_turnover: avgTurnover,
    target_avg_turnover: 45,
    industry_avg_turnover: 52,
    highly_liquid_pct: highlyLiquidPct,
    target_highly_liquid_pct: 50,
    illiquid_pct: illiquidPct,
    target_illiquid_pct: 5,
    overall_status: status,
  }
}

/** Map backend meta to LiquidityMeta */
function mapMeta(raw: Record<string, any> | undefined): LiquidityMeta {
  if (!raw) {
    return {
      cabinet_id: '',
      analysis_period_days: 30,
      generated_at: new Date().toISOString(),
      stock_data_updated_at: new Date().toISOString(),
    }
  }
  return {
    cabinet_id: raw.cabinet_id ?? '',
    analysis_period_days:
      raw.analysis_period_days ?? (raw.turnover_weeks ? raw.turnover_weeks * 7 : 30),
    generated_at: raw.generated_at ?? new Date().toISOString(),
    stock_data_updated_at:
      raw.stock_data_updated_at ?? raw.stocks_updated_at ?? new Date().toISOString(),
  }
}

/**
 * Map raw backend response to LiquidityResponse.
 * Handles both already-conforming (mock) and backend-shaped data.
 */
function mapBackendResponse(raw: any): LiquidityResponse {
  // If already conforms to frontend types (e.g. mock data), pass through
  if (isAlreadyMapped(raw)) {
    return raw as LiquidityResponse
  }

  const rawItems: any[] = Array.isArray(raw.data) ? raw.data : []
  const items = rawItems.map(mapItem)

  return {
    meta: mapMeta(raw.meta),
    summary: mapSummary(raw.summary, items),
    data: items,
  }
}

/** Check if response already matches frontend types (mock/pass-through) */
function isAlreadyMapped(raw: any): boolean {
  if (!raw?.meta || !raw?.summary || !Array.isArray(raw?.data)) return false
  // Check for frontend-specific fields that backend doesn't have
  return (
    typeof raw.summary.total_sku_count === 'number' &&
    typeof raw.summary.distribution === 'object' &&
    raw.summary.distribution !== null &&
    typeof raw.summary.benchmarks === 'object'
  )
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch liquidity analysis data
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Liquidity response with summary and SKU data
 */
export async function getLiquidity(params: LiquidityQueryParams = {}): Promise<LiquidityResponse> {
  const searchParams = new URLSearchParams()

  if (params.category_filter && params.category_filter !== 'all') {
    searchParams.set('category_filter', params.category_filter)
  }
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.sort_order) searchParams.set('sort_order', params.sort_order)
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))

  const queryString = searchParams.toString()
  const endpoint = `/v1/analytics/liquidity${queryString ? `?${queryString}` : ''}`

  // skipDataUnwrap: true — backend returns {meta, summary, data: [...items]}
  // Without this, apiClient sees 'data' key and unwraps to just the items array
  const raw = await apiClient.get<Record<string, unknown>>(endpoint, { skipDataUnwrap: true })
  return mapBackendResponse(raw)
}

/**
 * Fetch liquidity trends data (historical)
 *
 * @param params - Query parameters (period in days)
 * @returns Trends response with historical data points and insights
 */
export async function getLiquidityTrends(
  params: LiquidityTrendsQueryParams = {}
): Promise<LiquidityTrendsResponse> {
  const searchParams = new URLSearchParams()

  if (params.period !== undefined) {
    searchParams.set('period', String(params.period))
  }

  const queryString = searchParams.toString()
  const endpoint = `/v1/analytics/liquidity/trends${queryString ? `?${queryString}` : ''}`

  // skipDataUnwrap: true — preserve full response structure
  return apiClient.get<LiquidityTrendsResponse>(endpoint, { skipDataUnwrap: true })
}
