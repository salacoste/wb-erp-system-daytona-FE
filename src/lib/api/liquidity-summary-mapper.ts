/**
 * Liquidity Summary-Level Mappers — Epic 7 (Ликвидность товаров)
 * Extracted from liquidity.ts (Epic 74, Story 74.5, Task 8)
 * Maps backend summary/meta to frontend types.
 * Distribution helpers extracted to ./liquidity-distribution-mapper.ts (200-line cap, batch 2).
 */

import type {
  LiquidityResponse,
  LiquidityItem,
  LiquiditySummary,
  LiquidityMeta,
  LiquidityBenchmarks,
} from '@/types/liquidity'
import { mapItem } from './liquidity-item-mapper'
import {
  sumStockValue,
  mapDistribution,
  avgTurnoverDays,
  computeBenchmarks,
} from './liquidity-distribution-mapper'
import type {
  RawLiquiditySummary,
  RawLiquidityMeta,
  RawLiquidityResponse,
} from './liquidity-raw-types'

/** Map backend summary to LiquiditySummary */
function mapSummary(
  raw: RawLiquiditySummary | undefined,
  items: LiquidityItem[]
): LiquiditySummary {
  if (!raw) {
    const totalValue = sumStockValue(items)
    const frozen = sumStockValue(items.filter(i => i.liquidity_category === 'illiquid'))
    const distribution = mapDistribution(undefined, items)
    return {
      total_inventory_value: totalValue,
      total_sku_count: items.length,
      frozen_capital: frozen,
      frozen_capital_pct: totalValue > 0 ? (frozen / totalValue) * 100 : 0,
      avg_turnover_days: avgTurnoverDays(items),
      distribution,
      benchmarks: computeBenchmarks(distribution, items),
    }
  }

  const distribution = mapDistribution(raw.liquidity_breakdown ?? raw.distribution, items)
  const totalSkus = raw.total_skus ?? raw.total_sku_count ?? items.length
  const totalFrozen = raw.total_frozen_capital ?? raw.frozen_capital ?? 0
  const totalInv = raw.total_inventory_value ?? sumStockValue(items)

  return {
    total_inventory_value: totalInv,
    total_sku_count: totalSkus,
    frozen_capital: totalFrozen,
    frozen_capital_pct:
      // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: frozen_capital_pct 0 = inventory=0 (can't freeze nothing)
      totalInv > 0 ? (totalFrozen / totalInv) * 100 : (raw.frozen_capital_pct ?? 0),
    // Backend sends avg_turnover_days: 0 for no-sales cabinets; 0 renders "< 1 дня"
    // (false instant-turnover), so treat a non-positive value as missing and prefer the
    // item-derived avg (all-999 items → 999 → formatTurnoverDays → "Нет продаж", correct).
    avg_turnover_days:
      typeof raw.avg_turnover_days === 'number' && raw.avg_turnover_days > 0
        ? raw.avg_turnover_days
        : avgTurnoverDays(items),
    distribution,
    benchmarks:
      (raw.benchmarks as LiquidityBenchmarks | undefined) ?? computeBenchmarks(distribution, items),
  }
}

/** Map backend meta to LiquidityMeta */
function mapMeta(raw: RawLiquidityMeta | undefined): LiquidityMeta {
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

/** Check if response already matches frontend types (mock/pass-through) */
function isAlreadyMapped(raw: RawLiquidityResponse): boolean {
  if (!raw.meta || !raw.summary || !Array.isArray(raw.data)) return false
  // Check for frontend-specific fields that backend doesn't have
  return (
    typeof raw.summary.total_sku_count === 'number' &&
    typeof raw.summary.distribution === 'object' &&
    raw.summary.distribution !== null &&
    typeof raw.summary.benchmarks === 'object'
  )
}

/**
 * Map raw backend response to LiquidityResponse.
 * Handles both already-conforming (mock) and backend-shaped data.
 */
export function mapBackendResponse(raw: unknown): LiquidityResponse {
  const response = raw as RawLiquidityResponse

  // If already conforms to frontend types (e.g. mock data), pass through
  if (isAlreadyMapped(response)) {
    return response as unknown as LiquidityResponse
  }

  const rawItems = Array.isArray(response.data) ? response.data : []
  const items = rawItems.map(mapItem)

  return {
    meta: mapMeta(response.meta),
    summary: mapSummary(response.summary, items),
    data: items,
  }
}
